/**
 * Settlement Truth — CSV Parser & Column Mapper
 *
 * Accepts uploaded CSV files, auto-detects their table type by reading
 * column headers, maps Olist/custom column names to the engine schema,
 * and validates required fields.
 *
 * Supported table types (auto-detected):
 *   orders        — olist_orders_dataset / custom orders CSV
 *   payments      — olist_order_payments_dataset / custom payments CSV
 *   refunds       — olist_order_reviews_dataset / custom refunds CSV
 *   settlements   — custom settlements CSV (auto-derived if missing)
 *   bankCredits   — custom bank credits CSV (auto-derived if missing)
 */

import { parse } from "csv-parse/sync";

// ─── Column alias maps ─────────────────────────────────────────────────────────

/** Maps known CSV column names → canonical engine field names */
const COLUMN_ALIASES = {
  // Orders
  order_id:                    "orderId",
  id:                          "orderId",
  merchant_order_id:           "orderId",
  merchant_id:                 "merchantId",
  currency:                    "currency",
  order_status:                "status",
  order_purchase_timestamp:    "createdAt",
  created_at:                  "createdAt",
  date:                        "createdAt",
  amount:                      "amount",
  order_amount:                "amount",
  total_amount:                "amount",
  price:                       "amount",

  // Payments
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

  // Refunds
  refund_id:                   "refundId",
  review_id:                   "refundId",
  customer_id:                 "customerId",
  customer_unique_id:          "customerId",
  refund_amount:               "refundAmount",
  review_score:                "score",
  refund_status:               "refundStatus",
  review_comment_title:        "reason",
};

// ─── Table-type detection signatures ──────────────────────────────────────────

const TABLE_SIGNATURES = [
  {
    type: "orders",
    requiredCols: ["order_id"],
    scoringCols: ["order_purchase_timestamp", "order_status", "merchant_id", "currency", "amount", "total_amount", "price", "order_amount"],
    requiredEngine: ["orderId", "amount"],
    defaults: { currency: "INR", merchantId: "MID-UPLOAD", status: "paid" },
  },
  {
    type: "payments",
    requiredCols: ["order_id"],
    scoringCols: ["payment_value", "payment_type", "payment_sequential", "payment_id", "captured_amount", "amount_paid", "gateway_fee"],
    requiredEngine: ["orderId", "capturedAmount"],
    defaults: { method: "card", fee: 0, tax: 0, status: "captured" },
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
    scoringCols: ["customer_id", "refund_amount", "review_score", "refund_status", "reason"],
    requiredEngine: ["refundId", "paymentId"],
    defaults: { refundAmount: 0, refundStatus: "processed" },
  },
];

// ─── Helper: normalise a column name ──────────────────────────────────────────

function normalizeCol(col) {
  return col.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

// ─── Detect table type from headers ───────────────────────────────────────────

export function detectTableType(headers) {
  const normalized = headers.map(normalizeCol);

  let bestMatch = null;
  let bestScore = -1;

  for (const sig of TABLE_SIGNATURES) {
    // Check if any of the required cols are present (OR match)
    const hasRequired = sig.requiredCols.some((rc) => normalized.includes(rc));
    if (!hasRequired) continue;

    // Score by how many scoring cols are present
    const score = sig.scoringCols.filter((sc) => normalized.includes(sc)).length;
    if (score > bestScore || (score === bestScore && bestMatch === null)) {
      bestScore = score;
      bestMatch = sig;
    }
  }

  return bestMatch ?? null;
}

// ─── Map a raw CSV row → engine object ────────────────────────────────────────

function mapRow(raw, sig) {
  const mapped = { ...sig.defaults };

  for (const [rawCol, rawVal] of Object.entries(raw)) {
    const normCol = normalizeCol(rawCol);
    const engineField = COLUMN_ALIASES[normCol];
    if (!engineField) continue;

    let value = rawVal?.trim() ?? "";

    // Type coercions
    if (engineField === "amount" || engineField === "capturedAmount" ||
        engineField === "netAmount" || engineField === "fee" ||
        engineField === "tax" || engineField === "refundAmount") {
      value = parseFloat(value.replace(/[₹,\s]/g, "")) || 0;
      // Round to whole number (INR paise → rupees already assumed)
      value = Math.round(value);
    } else if (engineField === "paymentIds") {
      // Comma-separated list or JSON array
      try {
        value = JSON.parse(value);
      } catch {
        value = value.split(",").map((s) => s.trim()).filter(Boolean);
      }
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

// ─── Auto-derive settlements from payments ────────────────────────────────────

function deriveSettlements(payments) {
  // Group payments by date bucket (T+2 batches)
  const buckets = new Map();
  for (const p of payments) {
    const capDate = p.capturedAt ? p.capturedAt.split("T")[0] : "2024-01-01";
    const d = new Date(capDate);
    d.setDate(d.getDate() + 2); // T+2 settlement
    const settleDate = d.toISOString().split("T")[0];

    if (!buckets.has(settleDate)) buckets.set(settleDate, []);
    buckets.get(settleDate).push(p);
  }

  const settlements = [];
  let idx = 1;
  for (const [date, batch] of buckets.entries()) {
    const RATE = 0.0236;
    const GST  = 0.18;
    const netAmount = Math.round(
      batch.reduce((s, p) => {
        const fee = Math.round(p.capturedAmount * RATE);
        const tax = Math.round(fee * GST);
        return s + p.capturedAmount - fee - tax;
      }, 0)
    );
    const settlementId = `SETL-UP-${String(idx).padStart(3, "0")}`;
    settlements.push({
      settlementId,
      paymentIds: batch.map((p) => p.paymentId),
      settlementDate: date,
      netAmount,
    });
    idx++;
  }
  return settlements;
}

// ─── Auto-derive bank credits from settlements ─────────────────────────────────

function deriveBankCredits(settlements) {
  return settlements.map((s, i) => ({
    utr: `UTR${String(i + 1).padStart(6, "0")}`,
    reference: s.settlementId,
    amount: s.netAmount,
    creditDate: s.settlementDate,
  }));
}

// ─── Ensure payments have paymentIds ──────────────────────────────────────────

function ensurePaymentIds(payments, orders) {
  // If paymentId is missing, derive from orderId
  const orderAmountMap = new Map(orders.map((o) => [o.orderId, o.amount]));

  return payments.map((p, i) => {
    const pid = p.paymentId || `PAY-UP-${String(i + 1).padStart(5, "0")}`;
    const capAmount = p.capturedAmount || orderAmountMap.get(p.orderId) || 0;
    const capturedAt = p.capturedAt || (orders.find((o) => o.orderId === p.orderId)?.createdAt ?? new Date().toISOString());
    const fee = p.fee || Math.round(capAmount * 0.0236);
    const tax = p.tax || Math.round(fee * 0.18);

    return {
      ...p,
      paymentId: pid,
      capturedAmount: capAmount,
      status: p.status || "captured",
      capturedAt,
      fee,
      tax,
    };
  });
}

// ─── Ensure orders have all required fields ────────────────────────────────────

function ensureOrders(orders) {
  return orders.map((o, i) => ({
    orderId: o.orderId || `ORD-UP-${String(i + 1).padStart(5, "0")}`,
    merchantId: o.merchantId || "MID-UPLOAD",
    amount: o.amount || 0,
    currency: o.currency || "INR",
    createdAt: o.createdAt || new Date().toISOString(),
    expectedStatus: "paid",
  }));
}

// ─── Main parse function ───────────────────────────────────────────────────────

/**
 * Parses a CSV buffer and returns:
 * {
 *   type: "orders" | "payments" | "settlements" | "bankCredits" | "refunds" | "unknown",
 *   rows: [...],           // mapped engine objects
 *   preview: [...],        // first 5 raw rows
 *   errors: [...],         // validation error strings
 *   rowCount: number,
 *   detectedColumns: [...] // normalised header names
 * }
 */
export function parseCSV(buffer, filenameHint = "") {
  let raw;
  try {
    raw = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
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

  // Override detection with filename hint
  let sig = null;
  const hint = filenameHint.toLowerCase();
  if (hint.includes("order") && !hint.includes("item") && !hint.includes("payment")) {
    sig = TABLE_SIGNATURES.find((s) => s.type === "orders");
  } else if (hint.includes("payment")) {
    sig = TABLE_SIGNATURES.find((s) => s.type === "payments");
  } else if (hint.includes("settlement")) {
    sig = TABLE_SIGNATURES.find((s) => s.type === "settlements");
  } else if (hint.includes("bank") || hint.includes("credit")) {
    sig = TABLE_SIGNATURES.find((s) => s.type === "bankCredits");
  } else if (hint.includes("refund") || hint.includes("review")) {
    sig = TABLE_SIGNATURES.find((s) => s.type === "refunds");
  }

  // Fall back to auto-detect
  if (!sig) sig = detectTableType(headers);

  if (!sig) {
    return {
      type: "unknown",
      rows: [],
      preview: raw.slice(0, 5),
      errors: [
        `Could not detect table type from columns: ${normalized.slice(0, 8).join(", ")}. ` +
        `Expected columns like: order_id, payment_value, settlement_id, utr, or refund_id.`,
      ],
      rowCount: raw.length,
      detectedColumns: normalized,
    };
  }

  // Map all rows
  const errors = [];
  const rows = raw.map((rawRow, i) => {
    const mapped = mapRow(rawRow, sig);
    const rowErrors = validateRow(mapped, sig, i);
    errors.push(...rowErrors);
    return mapped;
  });

  // Filter out rows with critical missing fields (but keep error messages)
  const validRows = rows.filter((r) => sig.requiredEngine.every((f) => r[f] !== undefined && r[f] !== ""));

  return {
    type: sig.type,
    rows: validRows,
    preview: raw.slice(0, 5),
    errors: errors.slice(0, 20), // cap errors shown
    rowCount: raw.length,
    validRowCount: validRows.length,
    detectedColumns: normalized,
  };
}

// ─── Build full dataset from parsed tables ─────────────────────────────────────

/**
 * Given the 5 parsed table results, fills in any missing derived tables
 * and returns a complete dataset ready for engine.loadDataset().
 */
export function buildDataset(parsed) {
  const { orders: ordersResult, payments: paymentsResult, refunds: refundsResult,
          settlements: settlementsResult, bankCredits: bankCreditsResult } = parsed;

  let orders      = ordersResult?.rows ?? [];
  let payments    = paymentsResult?.rows ?? [];
  let refunds     = refundsResult?.rows ?? [];
  let settlements = settlementsResult?.rows ?? [];
  let bankCredits = bankCreditsResult?.rows ?? [];

  // Normalise orders
  orders = ensureOrders(orders);

  // Normalise payments (fill paymentIds, fee, tax)
  payments = ensurePaymentIds(payments, orders);

  // Derive settlements if not uploaded
  if (!settlements.length && payments.length) {
    settlements = deriveSettlements(payments);
  }

  // Derive bank credits if not uploaded
  if (!bankCredits.length && settlements.length) {
    bankCredits = deriveBankCredits(settlements);
  }

  // Fill refund paymentIds if missing (match by orderId → paymentId)
  const paymentByOrder = new Map(payments.map((p) => [p.orderId, p]));
  refunds = refunds.map((r) => {
    if (!r.paymentId && r.orderId) {
      r.paymentId = paymentByOrder.get(r.orderId)?.paymentId ?? null;
    }
    if (!r.customerId) r.customerId = `CUST-${r.refundId}`;
    return r;
  }).filter((r) => r.paymentId); // only keep refunds with a paymentId link

  return { orders, payments, refunds, settlements, bankCredits };
}
