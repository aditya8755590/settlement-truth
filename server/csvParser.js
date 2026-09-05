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
  status: "status",
  gateway_ref: "gatewayRef",
  payout_ref: "payoutRef",
  gross_amount: "grossAmount",
  fee_amount: "feeAmount",
  bank_tx_id: "bankTxId",
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
  credit_amount: "bankAmount",
  bank_amount: "bankAmount",
  credit_date: "creditDate",
  value_date: "creditDate",
  credited_at: "creditDate",
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
    scoringCols: ["payment_value", "payment_type", "payment_sequential", "payment_installments", "payment_id", "captured_amount", "amount_paid", "gateway_ref"],
    requiredEngine: ["orderId"],
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
    scoringCols: ["settlement_date", "net_amount", "payment_ids", "settled_at", "settled_amount", "gateway_ref", "payout_ref", "gross_amount"],
    requiredEngine: ["settlementId", "netAmount"],
    defaults: {},
  },
  {
    type: "bankCredits",
    requiredCols: ["utr", "reference", "payout_ref", "bank_tx_id"],
    scoringCols: ["reference", "bank_reference", "credit_amount", "bank_amount", "credit_date", "value_date", "payout_ref", "bank_tx_id"],
    requiredEngine: ["amount"],
    defaults: {},
  },
  {
    type: "refunds",
    requiredCols: ["refund_id", "review_id"],
    scoringCols: ["customer_id", "refund_amount", "review_score", "refund_status", "review_comment_title", "review_creation_date"],
    requiredEngine: ["refundId"],
    defaults: { refundStatus: "processed" },
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

// A "merged" file is a single transaction-level CSV that packs columns from
// multiple sources into every row (order + payment + settlement + bank credit).
// When all four families are present, we classify it as one table and then
// split it back into the per-source arrays during dataset construction.
const MERGED_SIG = {
  type: "merged",
  requiredCols: ["order_id", "payment_id", "settlement_id", "utr"],
  scoringCols: ["order_id", "amount", "payment_id", "captured_amount", "settlement_id", "net_amount", "utr", "reference"],
  requiredEngine: [],
  defaults: {},
};

export function detectTableType(headers) {
  const normalized = headers.map(normalizeCol);
  const normalizedSet = new Set(normalized);
  const has = (...cols) => cols.some((c) => normalizedSet.has(c));

  // Merged transaction file: order + payment + settlement + bank columns together.
  if (has("order_id", "merchant_order_id", "id") && has("payment_id", "gateway_payment_id") &&
      has("settlement_id") && has("utr", "utr_number")) {
    return MERGED_SIG;
  }

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
    const numericFields = new Set(["amount", "capturedAmount", "netAmount", "grossAmount", "feeAmount", "fee", "tax", "refundAmount", "itemPrice", "freightValue", "score", "installments", "sequence", "bankAmount"]);
    
    if (numericFields.has(engineField)) {
      value = parseFloat(value.replace(/[₹$€,\s]/g, "")) || 0;
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

function splitMergedDataset(rows) {
  const orders = [];
  const payments = [];
  const settlements = [];
  const bankCredits = [];
  const refunds = [];
  const orderByKey = new Map();

  for (const r of rows) {
    const oid = r.orderId;
    if (!oid) continue;

    const amount = Math.round(r.amount ?? r.capturedAmount ?? r.netAmount ?? 0);

    let order = orderByKey.get(oid);
    if (!order) {
      order = {
        orderId: oid,
        merchantId: r.merchantId || "MID-UPLOAD",
        amount,
        currency: r.currency || "INR",
        createdAt: r.createdAt || r.capturedAt || new Date().toISOString(),
        status: r.status || "delivered",
        customerId: r.customerId || null,
        expectedStatus: "paid",
      };
      orderByKey.set(oid, order);
      orders.push(order);
    }

    if (r.paymentId) {
      const capturedAmount = Math.round(r.capturedAmount ?? amount);
      const fallbackFee = Math.round(capturedAmount * GATEWAY_RATE);
      const fallbackTax = Math.round(fallbackFee * GST_ON_FEE);
      payments.push({
        paymentId: r.paymentId,
        orderId: oid,
        capturedAmount,
        method: r.method || "credit_card",
        installments: r.installments || 1,
        status: r.paymentStatus || "captured",
        capturedAt: r.capturedAt || r.createdAt || new Date().toISOString(),
        fee: r.fee !== undefined && r.fee !== null ? r.fee : fallbackFee,
        tax: r.tax !== undefined && r.tax !== null ? r.tax : fallbackTax,
      });
    }

    if (r.settlementId) {
      settlements.push({
        settlementId: r.settlementId,
        paymentIds: r.paymentId ? [r.paymentId] : (Array.isArray(r.paymentIds) ? r.paymentIds : []),
        settlementDate: r.settlementDate || r.settledAt || new Date().toISOString(),
        netAmount: Math.round(r.netAmount ?? amount),
      });
    }

    if (r.utr && r.reference) {
      bankCredits.push({
        utr: r.utr,
        reference: r.reference,
        amount: Math.round(r.bankAmount ?? r.netAmount ?? amount ?? 0),
        creditDate: r.creditDate || new Date().toISOString(),
      });
    }

    if (r.refundId) {
      refunds.push({
        refundId: r.refundId,
        orderId: oid,
        paymentId: r.paymentId || null,
        customerId: r.customerId || null,
        refundAmount: Math.round(r.refundAmount || 0),
        refundStatus: r.refundStatus || "processed",
      });
    }
  }

  return { orders, payments, refunds, settlements, bankCredits };
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
  // A single merged transaction CSV carries order+payment+settlement+bank
  // columns in every row. Split it back into per-source arrays so real
  // anomalies (missing payment, missing bank credit, duplicates) survive.
  if (parsed.merged?.rows?.length && !parsed.orders?.rows?.length) {
    return splitMergedDataset(parsed.merged.rows);
  }

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
    if (o.amount !== undefined && o.amount !== null && o.amount !== 0) amount = o.amount;
    else if (items) amount = Math.round(items.totalPrice + items.totalFreight);
    else if (pay) amount = pay.totalAmount;
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
      const amt = p.capturedAmount ?? p.amount ?? 0;
      const fallbackFee = Math.round(amt * GATEWAY_RATE);
      const fallbackTax = Math.round(fallbackFee * GST_ON_FEE);
      const entry = {
        paymentId: p.paymentId || `PAY-UP-${String(syntheticIdx++).padStart(6, "0")}`,
        orderId: p.orderId,
        gatewayRef: p.gatewayRef || null,
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

  const refundRows = refundsResult?.rows ?? [];
  const isDirectRefund = (r) => r.refundId && (r.paymentId || !(r.score !== undefined && r.score !== null));
  const directRefunds = refundRows.filter(isDirectRefund).map((r) => ({
    refundId: r.refundId,
    orderId: r.orderId || null,
    paymentId: r.paymentId || null,
    customerId: r.customerId || `CUST-${r.orderId}`,
    refundAmount: r.refundAmount ?? r.amount ?? 0,
    refundStatus: r.refundStatus || r.status || "processed",
    reason: r.reason || null,
  }));
  const reviewRefunds = classifyReviews(refundRows.filter((r) => !isDirectRefund(r)));
  const rawRefunds = [...directRefunds, ...reviewRefunds];
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
      // Preferred link: settlements reference the gateway capture reference
      // (gateway_ref). Match each settlement to the payment(s) that share it.
      // Settlements whose gateway_ref matches no payment stay unmatched (their
      // paymentIds stay empty) so the engine can flag them as orphans.
      const paymentsByGateway = new Map();
      for (const p of payments) {
        if (!p.gatewayRef) continue;
        if (!paymentsByGateway.has(p.gatewayRef)) paymentsByGateway.set(p.gatewayRef, []);
        paymentsByGateway.get(p.gatewayRef).push(p);
      }

      const hasGatewayCol = rawSettlements.some((s) => s.gatewayRef);
      const gatewayLinked = (s) => {
        if (!s.gatewayRef) return null;
        const matched = paymentsByGateway.get(s.gatewayRef);
        return matched ? matched.map((p) => p.paymentId) : [];
      };

      if (hasGatewayCol) {
        // Route every settlement that has a gateway_ref through gateway linking.
        // Remaining rows (no gateway_ref) get the date-window heuristic.
        const settlementsByDate = new Map();
        for (const s of rawSettlements) {
          const key = s.settlementDate ? String(s.settlementDate).split('T')[0] : null;
          if (!key) continue;
          if (!settlementsByDate.has(key)) settlementsByDate.set(key, []);
          settlementsByDate.get(key).push(s);
        }

        const paymentIdsBySettlementId = new Map();
        const roundRobinIdx = new Map();
        const heuristicIds = (targetSettlement) => {
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
            const target = matchedSettlements[idx];

            if (!paymentIdsBySettlementId.has(target.settlementId))
              paymentIdsBySettlementId.set(target.settlementId, []);
            paymentIdsBySettlementId.get(target.settlementId).push(p.paymentId);
          }
          return paymentIdsBySettlementId.get(targetSettlement.settlementId) || [];
        };

        settlements = rawSettlements.map((s) => {
          const gwIds = gatewayLinked(s);
          const ids = gwIds !== null ? gwIds : (Array.isArray(s.paymentIds) ? s.paymentIds.filter(Boolean) : heuristicIds(s));
          return { ...s, paymentIds: ids };
        });
      } else {
        // No gateway_ref anywhere: date-window heuristic only.
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
    }
  } else {
    settlements = deriveSettlements(payments);
  }

  const bankCredits = bankCreditsResult?.rows?.length
    ? bankCreditsResult.rows.map((c) => ({
        ...c,
        amount: c.amount ?? c.bankAmount ?? 0,
        payoutRef: c.payoutRef || null,
        reference: c.reference || null,
      }))
    : deriveBankCredits(settlements);

  return { orders, payments, refunds, settlements, bankCredits };
}
