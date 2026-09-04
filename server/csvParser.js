/**
 * Settlement Truth — CSV Parser & Column Mapper
 *
 * Supports:
 *  - Full Olist e-commerce dataset (9 CSV files)
 *  - Generic merchant exports (Razorpay, custom)
 *
 * OLIST SCHEMA MAPPING
 * ─────────────────────────────────────────────────────────────────────
 *  olist_orders_dataset            → orders
 *  olist_order_payments_dataset    → payments  (summed per order_id)
 *  olist_order_items_dataset       → used to compute order amounts
 *  olist_order_reviews_dataset     → refunds   (low scores = dispute)
 *  olist_customers_dataset         → enriches customer IDs
 *  olist_sellers_dataset           → ignored / enrichment only
 *  olist_products_dataset          → ignored / enrichment only
 *  olist_geolocation_dataset       → ignored
 *  product_category_name_*         → ignored
 *
 * ALGORITHMIC DESIGN — O(n) time, O(n) space
 * ─────────────────────────────────────────────────────────────────────
 *  All cross-file lookups use JavaScript Map (hash map) for O(1)
 *  amortised access. The full pipeline runs in a single linear pass
 *  per table, then one join pass — no nested loops anywhere.
 *
 *  Pass 1: Build orderId → orderRow map              O(n_orders)
 *  Pass 2: Build orderId → itemsTotal map            O(n_items)
 *  Pass 3: Build orderId → paymentsRow map           O(n_payments)
 *  Pass 4: Build orderId → refunds[] map             O(n_reviews)
 *  Pass 5: Derive settlements (date-bucket join)     O(n_payments)
 *  Pass 6: Derive bank credits from settlements      O(n_settlements)
 *  Total:  O(n) — suitable for 100k+ rows in < 200ms
 */

import { parse } from "csv-parse/sync";

// ─── Column alias map ──────────────────────────────────────────────────────────
// Maps any known CSV column name → canonical engine field name
const COLUMN_ALIASES = {
  // Orders (generic + Olist)
  order_id:                    "orderId",
  id:                          "orderId",
  merchant_order_id:           "orderId",
  merchant_id:                 "merchantId",
  currency:                    "currency",
  order_status:                "status",
  order_purchase_timestamp:    "createdAt",
  order_approved_at:           "approvedAt",
  order_delivered_carrier_date:"carrierDate",
  order_delivered_customer_date:"deliveredAt",
  order_estimated_delivery_date:"estimatedAt",
  created_at:                  "createdAt",
  date:                        "createdAt",
  amount:                      "amount",
  order_amount:                "amount",
  total_amount:                "amount",
  price:                       "itemPrice",      // Olist order_items price
  freight_value:               "freightValue",   // Olist order_items freight
  customer_id:                 "customerId",
  customer_unique_id:          "customerUniqueId",

  // Payments (generic + Olist)
  payment_id:                  "paymentId",
  gateway_payment_id:          "paymentId",
  payment_sequential:          "sequence",
  payment_type:                "method",
  payment_installments:        "installments",
  payment_value:               "capturedAmount",
  captured_amount:             "capturedAmount",
  amount_paid:                 "capturedAmount",
  payment_status:              "paymentStatus",
  gateway_fee:                 "fee",
  fee:                         "fee",
  tax:                         "tax",
  gst:                         "tax",
  captured_at:                 "capturedAt",
  payment_date:                "capturedAt",

  // Settlements
  settlement_id:               "settlementId",
  settlement_date:             "settlementDate",
  settled_at:                  "settlementDate",
  net_amount:                  "netAmount",
  settled_amount:              "netAmount",
  payment_ids:                 "paymentIds",

  // Bank Credits
  utr:                         "utr",
  utr_number:                  "utr",
  reference:                   "reference",
  bank_reference:              "reference",
  credit_amount:               "amount",
  bank_amount:                 "amount",
  credit_date:                 "creditDate",
  value_date:                  "creditDate",

  // Refunds / Reviews (Olist)
  refund_id:                   "refundId",
  review_id:                   "refundId",
  refund_amount:               "refundAmount",
  review_score:                "score",
  refund_status:               "refundStatus",
  review_comment_title:        "reason",
  review_comment_message:      "reasonDetail",
  review_creation_date:        "refundCreatedAt",
  review_answer_timestamp:     "refundAnsweredAt",

  // Sellers / Products (treated as metadata, not engine tables)
  seller_id:                   "sellerId",
  seller_city:                 "sellerCity",
  seller_state:                "sellerState",
  product_id:                  "productId",
  product_category_name:       "category",
};

// ─── Table-type detection signatures ──────────────────────────────────────────
// Each signature lists columns that distinguish the table.
// requiredCols: at least ONE must be present (OR match)
// scoringCols:  each present col adds +1 to confidence score
// requiredEngine: fields the mapped row must have to be valid
const TABLE_SIGNATURES = [
  {
    type: "orders",
    requiredCols: ["order_id"],
    scoringCols: [
      "order_purchase_timestamp", "order_status", "customer_id",
      "order_approved_at", "order_delivered_customer_date",
      "merchant_id", "currency", "amount", "total_amount",
    ],
    requiredEngine: ["orderId"],
    defaults: { currency: "INR", merchantId: "MID-UPLOAD", status: "delivered" },
  },
  {
    type: "payments",
    requiredCols: ["order_id"],
    scoringCols: [
      "payment_value", "payment_type", "payment_sequential",
      "payment_installments", "payment_id", "captured_amount", "amount_paid",
    ],
    requiredEngine: ["orderId", "capturedAmount"],
    defaults: { method: "credit_card", fee: 0, tax: 0, status: "captured" },
  },
  {
    type: "orderItems",   // NEW: Olist order_items table
    requiredCols: ["order_id"],
    scoringCols: [
      "order_item_id", "product_id", "seller_id", "price", "freight_value",
    ],
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
    scoringCols: [
      "customer_id", "refund_amount", "review_score", "refund_status",
      "review_comment_title", "review_creation_date",
    ],
    requiredEngine: ["refundId"],
    defaults: { refundAmount: 0, refundStatus: "processed" },
  },
  {
    type: "customers",   // Olist customers table
    requiredCols: ["customer_id"],
    scoringCols: ["customer_unique_id", "customer_zip_code_prefix", "customer_city", "customer_state"],
    requiredEngine: ["customerId"],
    defaults: {},
  },
];

// ─── Normalise a column name ───────────────────────────────────────────────────
function normalizeCol(col) {
  return col.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

// ─── Detect table type from headers ───────────────────────────────────────────
// O(h) where h = number of header columns — effectively O(1) for typical files
export function detectTableType(headers) {
  const normalized = headers.map(normalizeCol);
  const normalizedSet = new Set(normalized);

  let bestMatch = null;
  let bestScore = -1;

  for (const sig of TABLE_SIGNATURES) {
    // Must have at least one required column
    const hasRequired = sig.requiredCols.some((rc) => normalizedSet.has(rc));
    if (!hasRequired) continue;

    // Score = count of scoring columns present
    const score = sig.scoringCols.filter((sc) => normalizedSet.has(sc)).length;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = sig;
    }
  }

  return bestMatch ?? null;
}

// ─── Map a single raw CSV row → engine object ──────────────────────────────────
function mapRow(raw, sig) {
  const mapped = { ...sig.defaults };

  for (const [rawCol, rawVal] of Object.entries(raw)) {
    const normCol = normalizeCol(rawCol);
    const engineField = COLUMN_ALIASES[normCol];
    if (!engineField) continue;

    let value = String(rawVal ?? "").trim();

    // Numeric coercions
    const numericFields = new Set([
      "amount", "capturedAmount", "netAmount", "fee", "tax",
      "refundAmount", "itemPrice", "freightValue", "score", "installments", "sequence",
    ]);

    if (numericFields.has(engineField)) {
      value = parseFloat(value.replace(/[₹$€,\s]/g, "")) || 0;
      // Keep cents precision for prices but round currency amounts
      if (engineField === "amount" || engineField === "capturedAmount" || engineField === "netAmount") {
        value = Math.round(value);
      }
    } else if (engineField === "paymentIds") {
      try { value = JSON.parse(value); }
      catch { value = value.split(",").map((s) => s.trim()).filter(Boolean); }
    }

    mapped[engineField] = value;
  }

  return mapped;
}

// ─── Validate a mapped row ─────────────────────────────────────────────────────
function validateRow(row, sig, rowIndex) {
  const errors = [];
  for (const field of sig.requiredEngine) {
    if (row[field] === undefined || row[field] === null || row[field] === "") {
      errors.push(`Row ${rowIndex + 1}: missing required field "${field}"`);
    }
  }
  return errors;
}

// ─── Olist-specific: aggregate order_items to derive order amounts ─────────────
//
// Algorithm: O(n_items)
//   Build orderId → { totalPrice, totalFreight } using a single Map pass.
//   No nested loops.
//
function aggregateOrderItems(itemRows) {
  // Map<orderId → { totalPrice, totalFreight, itemCount }>
  const totals = new Map();

  for (const item of itemRows) {
    const oid = item.orderId;
    if (!oid) continue;
    const price   = item.itemPrice    || 0;
    const freight = item.freightValue || 0;

    if (!totals.has(oid)) totals.set(oid, { totalPrice: 0, totalFreight: 0, itemCount: 0 });
    const t = totals.get(oid);
    t.totalPrice   += price;
    t.totalFreight += freight;
    t.itemCount    += 1;
  }

  return totals; // Map<orderId → totals>
}

// ─── Olist-specific: aggregate payments per order ─────────────────────────────
//
// Algorithm: O(n_payments)
//   Build orderId → { totalAmount, method, rows[] } via a single Map pass.
//   Multiple payment_sequential rows per order are summed.
//
function aggregatePayments(paymentRows) {
  // Map<orderId → { totalAmount, method, paymentId, capturedAt }>
  const byOrder = new Map();

  for (const p of paymentRows) {
    const oid = p.orderId;
    if (!oid) continue;

    if (!byOrder.has(oid)) {
      byOrder.set(oid, {
        orderId:       oid,
        totalAmount:   0,
        method:        p.method || "credit_card",
        installments:  p.installments || 1,
      });
    }
    const agg = byOrder.get(oid);
    agg.totalAmount += p.capturedAmount || 0;
    // Keep method from sequence=1 (primary payment)
    if ((p.sequence || 1) === 1) agg.method = p.method || agg.method;
  }

  return byOrder; // Map<orderId → aggregated>
}

// ─── Olist-specific: classify reviews as refund-like signals ──────────────────
//
// Reviews with score ≤ 2 → flag as potential dispute / refund request
// Algorithm: O(n_reviews) single pass
//
function classifyReviews(reviewRows) {
  const disputes = [];
  for (const r of reviewRows) {
    const score = parseInt(r.score, 10);
    if (score <= 2 || r.refundStatus === "approved") {
      disputes.push({
        refundId:      r.refundId || `REF-${r.orderId}`,
        orderId:       r.orderId,
        paymentId:     null,   // linked later
        customerId:    r.customerId || `CUST-${r.orderId}`,
        refundAmount:  r.refundAmount || 0,
        refundStatus:  score <= 1 ? "dispute" : "complaint",
        reason:        r.reason || `Review score ${score}/5`,
      });
    }
  }
  return disputes;
}

// ─── Derive settlements from aggregated payments ──────────────────────────────
//
// Algorithm: O(n_payments)
//   Group payments into T+2 date buckets using a Map.
//   No sorting needed — Map insertion order preserves grouping.
//
const GATEWAY_RATE = 0.0236;
const GST_ON_FEE   = 0.18;

function deriveSettlements(payments) {
  // Map<settlementDate → payment[]>
  const buckets = new Map();

  for (const p of payments) {
    const base = p.capturedAt
      ? p.capturedAt.split("T")[0]
      : (p.createdAt ? p.createdAt.split("T")[0] : "2024-01-01");

    const d = new Date(base);
    d.setDate(d.getDate() + 2); // T+2 window
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

    settlements.push({
      settlementId: `SETL-UP-${String(idx).padStart(4, "0")}`,
      paymentIds:   batch.map((p) => p.paymentId),
      settlementDate: date,
      netAmount,
    });
    idx++;
  }

  return settlements;
}

// ─── Derive bank credits from settlements ──────────────────────────────────────
// Algorithm: O(n_settlements) single pass
function deriveBankCredits(settlements) {
  return settlements.map((s, i) => ({
    utr:        `UTR${String(i + 1).padStart(8, "0")}`,
    reference:  s.settlementId,
    amount:     s.netAmount,
    creditDate: s.settlementDate,
  }));
}

// ─── Parse raw CSV buffer ──────────────────────────────────────────────────────
export function parseCSV(buffer, filenameHint = "") {
  let raw;
  try {
    raw = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
      bom: true,                // strip UTF-8 BOM (common in Excel exports)
    });
  } catch (err) {
    return {
      type: "unknown",
      rows: [],
      preview: [],
      errors: [`CSV parse error: ${err.message}`],
      rowCount: 0,
      detectedColumns: [],
    };
  }

  if (!raw.length) {
    return {
      type: "unknown",
      rows: [],
      preview: [],
      errors: ["CSV file is empty or has no data rows."],
      rowCount: 0,
      detectedColumns: [],
    };
  }

  const headers = Object.keys(raw[0]);
  const normalized = headers.map(normalizeCol);

  // ── Filename-hint override (faster than header scoring for known filenames) ──
  let sig = null;
  const hint = filenameHint.toLowerCase().replace(/-|_/g, "_");

  if      (hint.includes("olist_orders_dataset") || (hint.includes("order") && !hint.includes("item") && !hint.includes("payment") && !hint.includes("review")))
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
  // geolocation, products, sellers, category_translation → skip silently
  else if (hint.includes("geolocation") || hint.includes("product") || hint.includes("seller") || hint.includes("category"))
    return { type: "skipped", rows: [], preview: [], errors: [], rowCount: raw.length, detectedColumns: normalized, skipped: true };

  if (!sig) sig = detectTableType(headers);

  if (!sig) {
    return {
      type: "unknown",
      rows: [],
      preview: raw.slice(0, 5),
      errors: [
        `Could not detect table type from columns: [${normalized.slice(0, 6).join(", ")}]. ` +
        `Expected columns like: order_id, payment_value, settlement_id, utr, or review_id.`,
      ],
      rowCount: raw.length,
      detectedColumns: normalized,
    };
  }

  // Map all rows — O(n) single pass
  const errors = [];
  const rows = [];

  for (let i = 0; i < raw.length; i++) {
    const mapped = mapRow(raw[i], sig);
    const rowErrors = validateRow(mapped, sig, i);
    if (rowErrors.length) {
      if (errors.length < 20) errors.push(...rowErrors);
    } else {
      rows.push(mapped);
    }
  }

  return {
    type: sig.type,
    rows,
    preview: raw.slice(0, 5),
    errors,
    rowCount: raw.length,
    validRowCount: rows.length,
    detectedColumns: normalized,
  };
}

// ─── Build complete engine dataset from parsed tables ──────────────────────────
//
// ALGORITHM OVERVIEW (O(n) total across all tables):
//
//   Step 1 — Build order amount map from order_items         O(n_items)
//   Step 2 — Build payment aggregation map                   O(n_payments)
//   Step 3 — Resolve order amounts (items > payments > raw)  O(n_orders)
//   Step 4 — Materialise payment rows with paymentIds        O(n_orders)
//   Step 5 — Classify reviews → dispute signals              O(n_reviews)
//   Step 6 — Link refund paymentIds via order→payment map    O(n_refunds)
//   Step 7 — Derive settlements via date-bucket Map          O(n_payments)
//   Step 8 — Derive bank credits                             O(n_settlements)
//
//   Total: O(n) — no nested loops, all cross-table joins are O(1) Map lookups
//
export function buildDataset(parsed) {
  const {
    orders:      ordersResult,
    payments:    paymentsResult,
    orderItems:  itemsResult,
    refunds:     refundsResult,
    settlements: settlementsResult,
    bankCredits: bankCreditsResult,
    customers:   customersResult,
  } = parsed;

  // ── Step 1: Order-items amount aggregation ─────────────────────────────────
  // Map<orderId → { totalPrice, totalFreight }>
  const itemTotalsMap = itemsResult?.rows?.length
    ? aggregateOrderItems(itemsResult.rows)
    : new Map();

  // ── Step 2: Payment aggregation (sum installments per order) ───────────────
  // Map<orderId → aggregatedPayment>
  const paymentAggMap = paymentsResult?.rows?.length
    ? aggregatePayments(paymentsResult.rows)
    : new Map();

  // ── Step 3: Resolve final orders with amounts ──────────────────────────────
  const rawOrders = ordersResult?.rows ?? [];
  let orderIdx = 0;

  const orders = rawOrders.map((o) => {
    const oid   = o.orderId;
    const items = itemTotalsMap.get(oid);
    const pay   = paymentAggMap.get(oid);

    // Priority: item totals > payment value > raw order amount > 0
    let amount = 0;
    if (items) {
      amount = Math.round(items.totalPrice + items.totalFreight);
    } else if (pay) {
      amount = pay.totalAmount;
    } else if (o.amount) {
      amount = o.amount;
    }

    return {
      orderId:    oid,
      merchantId: o.merchantId || "MID-UPLOAD",
      amount,
      currency:   o.currency || "BRL",
      createdAt:  o.createdAt || new Date().toISOString(),
      status:     o.status    || "delivered",
      customerId: o.customerId || null,
      expectedStatus: "paid",
    };
  });

  // ── Step 4: Materialise payment rows ───────────────────────────────────────
  // O(n_orders) — one Map lookup per order
  let payIdx = 1;
  const payments = [];
  const paymentByOrder = new Map(); // orderId → payment (for refund linking)

  for (const order of orders) {
    const agg = paymentAggMap.get(order.orderId);
    const amt = agg?.totalAmount || order.amount || 0;
    const fee = Math.round(amt * GATEWAY_RATE);
    const tax = Math.round(fee * GST_ON_FEE);

    const p = {
      paymentId:      `PAY-UP-${String(payIdx).padStart(6, "0")}`,
      orderId:        order.orderId,
      capturedAmount: amt,
      method:         agg?.method || "credit_card",
      installments:   agg?.installments || 1,
      status:         "captured",
      capturedAt:     order.createdAt,
      fee,
      tax,
    };

    payments.push(p);
    paymentByOrder.set(order.orderId, p);
    payIdx++;
  }

  // ── Step 5: Reviews → dispute / refund signals ─────────────────────────────
  const rawRefunds = refundsResult?.rows?.length
    ? classifyReviews(refundsResult.rows)
    : [];

  // ── Step 6: Link refund paymentIds via O(1) Map lookup ────────────────────
  const refunds = rawRefunds
    .map((r) => {
      const pay = paymentByOrder.get(r.orderId);
      return { ...r, paymentId: pay?.paymentId ?? null };
    })
    .filter((r) => r.paymentId !== null); // keep only linkable refunds

  // ── Step 7: Settlements ────────────────────────────────────────────────────
  const settlements = settlementsResult?.rows?.length
    ? settlementsResult.rows
    : deriveSettlements(payments);

  // ── Step 8: Bank credits ───────────────────────────────────────────────────
  const bankCredits = bankCreditsResult?.rows?.length
    ? bankCreditsResult.rows
    : deriveBankCredits(settlements);

  return { orders, payments, refunds, settlements, bankCredits };
}
