/**
 * Raw Synthetic Settlements Table
 * Source: Razorpay settlement report (T+2 batch)
 *
 * Exceptions embedded:
 * - ORD-88135: No payment was captured → no settlement row for it.
 * - ORD-88176: Only the partial ₹1,375 capture is settled, not the full ₹2,750.
 * - ORD-88157: Fee deduction is WRONG — extra ₹182 deducted vs rate card.
 *
 * Settlement batches group multiple payments.
 * Each batch settles on T+2 business days after capture.
 */

import { payments } from "./payments.js";

// Batch size: group payments into settlement batches of ~10 each
const BATCH_SIZE = 10;

// Fee overcharge exception: ORD-88157's payment will have an extra ₹182 deducted
const FEE_OVERCHARGE_ORDERS = new Set(["ORD-88157"]);
const EXTRA_FEE = 182;

// Orders to EXCLUDE from settlements (missing settlement exceptions)
// ORD-88135 has no payment so it's already absent; 
// we also exclude the next 11 generated orders from settlements
const MISSING_SETTLEMENT_ORDERS = new Set([
  "ORD-88135",
  "ORD-88184", "ORD-88186", "ORD-88188", "ORD-88189",
  "ORD-88191", "ORD-88193", "ORD-88194", "ORD-88196",
  "ORD-88198", "ORD-88199",
]);

function addDays(isoDate, days) {
  return new Date(
    new Date(isoDate).getTime() + days * 24 * 60 * 60 * 1000
  ).toISOString();
}

function genSettlements() {
  const settlements = [];

  // Filter to payments that should be settled
  const settleablePayments = payments.filter(
    (p) => !MISSING_SETTLEMENT_ORDERS.has(p.orderId)
  );

  // Group into batches
  for (let i = 0; i < settleablePayments.length; i += BATCH_SIZE) {
    const batch = settleablePayments.slice(i, i + BATCH_SIZE);
    const batchIndex = Math.floor(i / BATCH_SIZE);

    let grossAmount = 0;
    let totalFee = 0;
    let totalTax = 0;

    const paymentIds = [];

    for (const p of batch) {
      let fee = p.fee;
      let tax = p.tax;

      // Inject fee overcharge for ORD-88157
      if (FEE_OVERCHARGE_ORDERS.has(p.orderId)) {
        fee += EXTRA_FEE;
      }

      grossAmount += p.capturedAmount;
      totalFee += fee;
      totalTax += tax;
      paymentIds.push(p.paymentId);
    }

    const netAmount = grossAmount - totalFee - totalTax;

    // Settlement date is T+2 from the first capture in the batch
    const settlementDate = addDays(batch[0].capturedAt, 2);

    settlements.push({
      settlementId: `setl_${String(batchIndex + 1).padStart(3, "0")}`,
      paymentIds,
      grossAmount,
      fee: totalFee,
      tax: totalTax,
      netAmount,
      currency: "INR",
      settlementDate,
    });
  }

  return settlements;
}

export const settlements = genSettlements();
export default settlements;
