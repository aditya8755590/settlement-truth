/**
 * Settlement Truth — CSV Parser & Column Mapper
 *
 * Supports:
 *  - Full Olist e-commerce dataset (9 CSV files)
 *  - Generic merchant exports (Razorpay, custom)
 */

import { parse } from "csv-parse";
import fs from "fs";

// ─── Column alias map ──────────────────────────────────────────────────────────
const COLUMN_ALIASES = {
  order_id: "orderId",
  id: "orderId",
  merchant_order_id: "orderId",
  merchant_id: "merchantId",
  currency: "currency",
  order_status: "status",
  order_purchase_timestamp: "createdAt",
  order_approved_at: "approvedAt",
  order_delivered_carrier_date: "carrierDate",
  order_delivered_customer_date: "deliveredAt",
  order_estimated_delivery_date: "estimatedAt",
  created_at: "createdAt",
  date: "createdAt",
  amount: "amount",
  order_amount: "amount",
  total_amount: "amount",
  price: "itemPrice",
  freight_value: "freightValue",
  customer_id: "customerId",
  customer_unique_id: "customerUniqueId",
  payment_id: "paymentId",
  gateway_payment_id: "paymentId",
  payment_sequential: "sequence",
  payment_type: "method",
  payment_installments: "installments",
  payment_value: "capturedAmount",
  captured_amount: "capturedAmount",
  amount_paid: "capturedAmount",
  payment_status: "paymentStatus",
  gateway_fee: "fee",
  fee: "fee",
  tax: "tax",
  gst: "tax",
  captured_at: "capturedAt",
  payment_date: "capturedAt",
  settlement_id: "settlementId",
  settlement_date: "settlementDate",
  settled_at: "settlementDate",
  net_amount: "netAmount",
  settled_amount: "netAmount",
  payment_ids: "paymentIds",
  utr: "utr",
  utr_number: "utr",
  reference: "reference",
  bank_reference: "reference",
  credit_amount: "amount",
  bank_amount: "amount",
  credit_date: "creditDate",
  value_date: "creditDate",
  refund_id: "refundId",
  review_id: "refundId",
  refund_amount: "refundAmount",
  review_score: "score",
  refund_status: "refundStatus",
  review_comment_title: "reason",
  review_comment_message: "reasonDetail",
  review_creation_date: "refundCreatedAt",
  review_answer_timestamp: "refundAnsweredAt",
  seller_id: "sellerId",
  seller_city: "sellerCity",
  seller_state: "sellerState",
  product_id: "productId",
  product_category_name: "category",
};

const TABLE_SIGNATURES = [
  {
    type: "orders",
    requiredCols: ["order_id"],
    scoringCols: ["order_purchase_timestamp", "order_status", "customer_id", "order_approved_at", "order_delivered_customer_date", "merchant_id", "currency", "amount", "total_amount"],
    requiredEngine: ["orderId"],
    defaults: { currency: "INR", merchantId: "MID-UPLOAD", status: "delivered" },
  },
  {
    type: "payments",
    requiredCols: ["order_id"],
    scoringCols: ["payment_value", "payment_type", "payment_sequential", "payment_installments", "payment_id", "captured_amount", "amount_paid"],
    requiredEngine: ["orderId", "capturedAmount"],
    defaults: { method: "credit_card", fee: 0, tax: 0, status: "captured" },
  },
  {
    type: "orderItems",
    requiredCols: ["order_id"],
    scoringCols: ["order_item_id", "product_id", "seller_id", "price", "freight_value"],
    requiredEngine: ["orderId"],
    defaults: {},
  },
  {
    type: "settlements",
    requiredCols: ["settlement_id"],
    scoringCols: ["settlement_date", "net_amount", "payment_ids", "settled_at", "settled_amount"],
    requiredEngine: ["settlementId", "netAmount"],
    defaults: {},
  },
  {
    type: "bankCredits",
    requiredCols: ["utr"],
    scoringCols: ["reference", "bank_reference", "credit_amount", "bank_amount", "credit_date", "value_date"],
    requiredEngine: ["utr", "reference", "amount"],
    defaults: {},
  },
  {
    type: "refunds",
    requiredCols: ["refund_id", "review_id"],
    scoringCols: ["customer_id", "refund_amount", "review_score", "refund_status", "review_comment_title", "review_creation_date"],
    requiredEngine: ["refundId"],
    defaults: { refundAmount: 0, refundStatus: "processed" },
  },
  {
    type: "customers",
    requiredCols: ["customer_id"],
    scoringCols: ["customer_unique_id", "customer_zip_code_prefix", "customer_city", "customer_state"],
    requiredEngine: ["customerId"],
    defaults: {},
  },
];

function normalizeCol(col) {
  return col.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export function detectTableType(headers) {
  const normalized = headers.map(normalizeCol);
  const normalizedSet = new Set(normalized);
  let bestMatch = null;
  let bestScore = -1;

  for (const sig of TABLE_SIGNATURES) {
    const hasRequired = sig.requiredCols.some((rc) => normalizedSet.has(rc));
    if (!hasRequired) continue;
    const score = sig.scoringCols.filter((sc) => normalizedSet.has(sc)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = sig;
    }
  }
  return bestMatch ?? null;
}

function mapRow(raw, sig) {
  const mapped = { ...sig.defaults };
  for (const [rawCol, rawVal] of Object.entries(raw)) {
    const normCol = normalizeCol(rawCol);
    const engineField = COLUMN_ALIASES[normCol];
    if (!engineField) continue;
    let value = String(rawVal ?? "").trim();
    const numericFields = new Set(["amount", "capturedAmount", "netAmount", "fee", "tax", "refundAmount", "itemPrice", "freightValue", "score", "installments", "sequence"]);
    
    if (numericFields.has(engineField)) {
      value = parseFloat(value.replace(/[₹$€,\s]/g, "")) || 0;
      if (engineField === "amount" || engineField === "capturedAmount" || engineField === "netAmount") {
        value = Math.round(value);
      }
    } else if (engineField === "paymentIds") {
      try { value = JSON.parse(value); } catch { value = value.split(",").map((s) => s.trim()).filter(Boolean); }
    }
    mapped[engineField] = value;
  }
  return mapped;
}

function validateRow(row, sig, rowIndex) {
  const errors = [];
  for (const field of sig.requiredEngine) {
    if (row[field] === undefined || row[field] === null || row[field] === "") {
      errors.push(`Row ${rowIndex + 1}: missing required field "${field}"`);
    }
  }
  return errors;
}

function aggregateOrderItems(itemRows) {
  const totals = new Map();
  for (const item of itemRows) {
    const oid = item.orderId;
    if (!oid) continue;
    const price = item.itemPrice || 0;
    const freight = item.freightValue || 0;
    if (!totals.has(oid)) totals.set(oid, { totalPrice: 0, totalFreight: 0, itemCount: 0 });
    const t = totals.get(oid);
    t.totalPrice += price;
    t.totalFreight += freight;
    t.itemCount += 1;
  }
  return totals;
}

function aggregatePayments(paymentRows) {
  const byOrder = new Map();
  for (const p of paymentRows) {
    const oid = p.orderId;
    if (!oid) continue;
    if (!byOrder.has(oid)) {
      // Preserve the real paymentId from the first (sequence=1) row
      byOrder.set(oid, {
        orderId: oid,
        paymentId: p.paymentId || null, // real ID from CSV if present
        totalAmount: 0,
        method: p.method || "credit_card",
        installments: p.installments || 1,
        capturedAt: p.capturedAt || null,
      });
    }
    const agg = byOrder.get(oid);
    agg.totalAmount += p.capturedAmount || 0;
    if ((p.sequence || 1) === 1) {
      agg.method = p.method || agg.method;
      // Use the ID from sequence=1 payment as the primary ID
      if (p.paymentId) agg.paymentId = p.paymentId;
      if (p.capturedAt) agg.capturedAt = p.capturedAt;
    }
  }
  return byOrder;
}

function classifyReviews(reviewRows) {
  const disputes = [];
  for (const r of reviewRows) {
    const score = parseInt(r.score, 10);
    if (score <= 2 || r.refundStatus === "approved") {
      disputes.push({
        refundId: r.refundId || `REF-${r.orderId}`,
        orderId: r.orderId,
        paymentId: null,
        customerId: r.customerId || `CUST-${r.orderId}`,
        refundAmount: r.refundAmount || 0,
        refundStatus: score <= 1 ? "dispute" : "complaint",
        reason: r.reason || `Review score ${score}/5`,
      });
    }
  }
  return disputes;
}

const GATEWAY_RATE = 0.0236;
const GST_ON_FEE = 0.18;

function deriveSettlements(payments) {
  const buckets = new Map();
  for (const p of payments) {
    const base = p.capturedAt ? p.capturedAt.split("T")[0] : (p.createdAt ? p.createdAt.split("T")[0] : "2024-01-01");
    const d = new Date(base);
    d.setDate(d.getDate() + 2);
    const key = d.toISOString().split("T")[0];
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(p);
  }
  const settlements = [];
  let idx = 1;
  for (const [date, batch] of buckets.entries()) {
    const netAmount = Math.round(
      batch.reduce((sum, p) => {
        const amt = p.capturedAmount || 0;
        const fee = Math.round(amt * GATEWAY_RATE);
        const tax = Math.round(fee * GST_ON_FEE);
        return sum + amt - fee - tax;
      }, 0)
    );
    settlements.push({ settlementId: `SETL-UP-${String(idx).padStart(4, "0")}`, paymentIds: batch.map((p) => p.paymentId), settlementDate: date, netAmount });
    idx++;
  }
  return settlements;
}

function deriveBankCredits(settlements) {
  return settlements.map((s, i) => ({ utr: `UTR${String(i + 1).padStart(8, "0")}`, reference: s.settlementId, amount: s.netAmount, creditDate: s.settlementDate }));
}

export function parseCSVStream(filePath, filenameHint = "") {
  return new Promise((resolve) => {
    let rawHeaders = null;
    let sig = null;
    let normalized = [];
    let isSkipped = false;
    let rowCount = 0;
    const rows = [];
    const preview = [];
    const errors = [];

    const hint = filenameHint.toLowerCase().replace(/-|_/g, "_");
    if (hint.includes("olist_orders_dataset") || (hint.includes("order") && !hint.includes("item") && !hint.includes("payment") && !hint.includes("review")))
      sig = TABLE_SIGNATURES.find((s) => s.type === "orders");
    else if (hint.includes("olist_order_payments") || hint.includes("payment"))
      sig = TABLE_SIGNATURES.find((s) => s.type === "payments");
    else if (hint.includes("olist_order_items") || hint.includes("order_item"))
      sig = TABLE_SIGNATURES.find((s) => s.type === "orderItems");
    else if (hint.includes("olist_order_reviews") || hint.includes("review") || hint.includes("refund"))
      sig = TABLE_SIGNATURES.find((s) => s.type === "refunds");
    else if (hint.includes("settlement"))
      sig = TABLE_SIGNATURES.find((s) => s.type === "settlements");
    else if (hint.includes("bank") || hint.includes("credit"))
      sig = TABLE_SIGNATURES.find((s) => s.type === "bankCredits");
    else if (hint.includes("customer"))
      sig = TABLE_SIGNATURES.find((s) => s.type === "customers");
    else if (hint.includes("geolocation") || hint.includes("product") || hint.includes("seller") || hint.includes("category"))
      isSkipped = true;

    if (isSkipped) {
      return resolve({ type: "skipped", rows: [], preview: [], errors: [], rowCount: 0, detectedColumns: [], skipped: true });
    }

    const parser = parse({ columns: true, skip_empty_lines: true, trim: true, relax_quotes: true, relax_column_count: true, bom: true });

    parser.on("readable", function () {
      let raw;
      while ((raw = parser.read()) !== null) {
        rowCount++;
        if (!rawHeaders) {
          rawHeaders = Object.keys(raw);
          normalized = rawHeaders.map(normalizeCol);
          if (!sig) sig = detectTableType(rawHeaders);
          if (!sig) {
            parser.destroy();
            return resolve({ type: "unknown", rows: [], preview: [raw], errors: [`Could not detect table type from columns: [${normalized.slice(0, 6).join(", ")}].`], rowCount, detectedColumns: normalized });
          }
        }
        if (preview.length < 5) preview.push(raw);
        const mapped = mapRow(raw, sig);
        const rowErrors = validateRow(mapped, sig, rowCount - 1);
        if (rowErrors.length) {
          if (errors.length < 20) errors.push(...rowErrors);
        } else {
          rows.push(mapped);
        }
      }
    });

    parser.on("error", function (err) {
      resolve({ type: "unknown", rows: [], preview, errors: [`CSV parse error: ${err.message}`], rowCount, detectedColumns: normalized });
    });

    parser.on("end", function () {
      if (!sig) {
        return resolve({ type: "unknown", rows: [], preview: [], errors: ["CSV file is empty or has no data rows."], rowCount: 0, detectedColumns: [] });
      }
      resolve({ type: sig.type, rows, preview, errors, rowCount, validRowCount: rows.length, detectedColumns: normalized });
    });

    fs.createReadStream(filePath).pipe(parser);
  });
}

export function buildDataset(parsed) {
  const { orders: ordersResult, payments: paymentsResult, orderItems: itemsResult, refunds: refundsResult, settlements: settlementsResult, bankCredits: bankCreditsResult } = parsed;
  const itemTotalsMap = itemsResult?.rows?.length ? aggregateOrderItems(itemsResult.rows) : new Map();
  const paymentAggMap = paymentsResult?.rows?.length ? aggregatePayments(paymentsResult.rows) : new Map();
  const rawOrders = ordersResult?.rows ?? [];
  let orderIdx = 0;
  
  const orders = rawOrders.map((o) => {
    const oid = o.orderId;
    const items = itemTotalsMap.get(oid);
    const pay = paymentAggMap.get(oid);
    let amount = 0;
    if (items) amount = Math.round(items.totalPrice + items.totalFreight);
    else if (pay) amount = pay.totalAmount;
    else if (o.amount) amount = o.amount;
    return { orderId: oid, merchantId: o.merchantId || "MID-UPLOAD", amount, currency: o.currency || "BRL", createdAt: o.createdAt || new Date().toISOString(), status: o.status || "delivered", customerId: o.customerId || null, expectedStatus: "paid" };
  });

  // ── Payments ─────────────────────────────────────────────────────────────────
  // If the uploaded CSV has real payment_id values (gateway format), pass each
  // row to the engine WITHOUT aggregating so that:
  //   • Duplicate payments per order → engine flags Anomaly (>1 payment found)
  //   • Missing payments for an order → engine flags Anomaly (0 payments found)
  //   • Real fee/tax from the export are preserved
  // If there is NO payment CSV at all (Olist-style), fall back to creating one
  // synthetic payment per order from the aggregated data.

  const paymentByOrder = new Map(); // first payment per order, used for refund linking
  let payments;

  if (paymentsResult?.rows?.length) {
    // Direct mode: one engine payment per CSV row
    let syntheticIdx = 1;
    payments = paymentsResult.rows.map((p) => {
      const amt = p.capturedAmount || 0;
      const fallbackFee = Math.round(amt * GATEWAY_RATE);
      const fallbackTax = Math.round(fallbackFee * GST_ON_FEE);
      const entry = {
        paymentId: p.paymentId || `PAY-UP-${String(syntheticIdx++).padStart(6, "0")}`,
        orderId: p.orderId,
        capturedAmount: amt,
        method: p.method || "credit_card",
        installments: p.installments || 1,
        status: p.status || "captured",
        capturedAt: p.capturedAt || new Date().toISOString(),
        fee: (p.fee !== undefined && p.fee !== null) ? p.fee : fallbackFee,
        tax: (p.tax !== undefined && p.tax !== null) ? p.tax : fallbackTax,
      };
      if (!paymentByOrder.has(p.orderId)) paymentByOrder.set(p.orderId, entry);
      return entry;
    });
  } else {
    // Synthetic mode (Olist-style): create one payment per order from aggregated data.
    let payIdx = 1;
    payments = [];
    for (const order of orders) {
      const agg = paymentAggMap.get(order.orderId);
      const amt = agg?.totalAmount || order.amount || 0;
      const fee = Math.round(amt * GATEWAY_RATE);
      const tax = Math.round(fee * GST_ON_FEE);
      const capturedAt = agg?.capturedAt || order.createdAt;
      const paymentId = agg?.paymentId || `PAY-UP-${String(payIdx).padStart(6, "0")}`;
      const p = {
        paymentId,
        orderId: order.orderId,
        capturedAmount: amt,
        method: agg?.method || "credit_card",
        installments: agg?.installments || 1,
        status: "captured",
        capturedAt,
        fee,
        tax,
      };
      payments.push(p);
      paymentByOrder.set(order.orderId, p);
      payIdx++;
    }
  }

  const rawRefunds = refundsResult?.rows?.length ? classifyReviews(refundsResult.rows) : [];
  const refunds = rawRefunds.map((r) => {
    // If the refund CSV has a paymentId directly, use it; otherwise look up via orderId
    const pay = paymentByOrder.get(r.orderId);
    return { ...r, paymentId: r.paymentId || pay?.paymentId || null };
  }).filter((r) => r.paymentId !== null);

  let settlements;
  if (settlementsResult?.rows?.length) {
    const rawSettlements = settlementsResult.rows;
    const allHavePaymentIds = rawSettlements.every(s =>
      Array.isArray(s.paymentIds) && s.paymentIds.filter(Boolean).length > 0
    );

    if (allHavePaymentIds) {
      settlements = rawSettlements.map(s => ({
        ...s,
        paymentIds: s.paymentIds.filter(Boolean),
      }));
    } else {
      const settlementsByDate = new Map();
      for (const s of rawSettlements) {
        const key = s.settlementDate ? String(s.settlementDate).split('T')[0] : null;
        if (!key) continue;
        if (!settlementsByDate.has(key)) settlementsByDate.set(key, []);
        settlementsByDate.get(key).push(s);
      }

      const paymentIdsBySettlementId = new Map();
      const roundRobinIdx = new Map(); 
      for (const p of payments) {
        const base = (p.capturedAt || '').split('T')[0];
        if (!base) continue;
        const d = new Date(base);
        d.setDate(d.getDate() + 2);
        const expectedDate = d.toISOString().split('T')[0];

        let matchedSettlements = null;
        let bestDiff = Infinity;
        for (const [key, bucket] of settlementsByDate.entries()) {
          const diff = Math.abs(new Date(key) - new Date(expectedDate)) / (1000 * 60 * 60 * 24);
          if (diff <= 3 && diff < bestDiff) {
            bestDiff = diff;
            matchedSettlements = bucket;
          }
        }
        if (!matchedSettlements || matchedSettlements.length === 0) continue;

        const dateKey = matchedSettlements[0].settlementDate
          ? String(matchedSettlements[0].settlementDate).split('T')[0]
          : 'unknown';
        const idx = (roundRobinIdx.get(dateKey) || 0) % matchedSettlements.length;
        roundRobinIdx.set(dateKey, idx + 1);
        const targetSettlement = matchedSettlements[idx];

        if (!paymentIdsBySettlementId.has(targetSettlement.settlementId))
          paymentIdsBySettlementId.set(targetSettlement.settlementId, []);
        paymentIdsBySettlementId.get(targetSettlement.settlementId).push(p.paymentId);
      }

      settlements = rawSettlements.map(s => ({
        ...s,
        paymentIds: paymentIdsBySettlementId.get(s.settlementId) || (Array.isArray(s.paymentIds) ? s.paymentIds.filter(Boolean) : []),
      }));
    }
  } else {
    settlements = deriveSettlements(payments);
  }

  const bankCredits = bankCreditsResult?.rows?.length ? bankCreditsResult.rows : deriveBankCredits(settlements);

  return { orders, payments, refunds, settlements, bankCredits };
}
