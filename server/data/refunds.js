/**
 * Raw Synthetic Refunds Table
 * Source: Merchant refund / dispute management system
 *
 * Three categories:
 * 1. Legitimate single refunds  — 19 orders had a single, valid customer return.
 * 2. Duplicate refund pair      — ORD-88142 has TWO refund events for the same
 *    payment, but only one customer support case (customerId: "CST-4421").
 *    The engine must detect this and escalate without guessing which is valid.
 * 3. Legitimate two-refund case — ORD-88162 has two partial refunds, BOTH
 *    with distinct customer cases (CST-6610, CST-6611). This tests that the
 *    engine can distinguish genuine multi-refunds from duplicates.
 */

import { payments } from "./payments.js";

// Map paymentId → orderId for convenience
const paymentByOrder = {};
for (const p of payments) {
  paymentByOrder[p.orderId] = p.paymentId;
}

// Orders that trigger a legitimate single refund
const SINGLE_REFUND_ORDERS = [
  "ORD-88109", "ORD-88121", "ORD-88180", "ORD-88181",
  "ORD-88183", "ORD-88185", "ORD-88188", "ORD-88190",
  "ORD-88192", "ORD-88195", "ORD-88197", "ORD-88200",
  "ORD-88202", "ORD-88205", "ORD-88207", "ORD-88210",
  "ORD-88212", "ORD-88215", "ORD-88217",
];

function genRefunds() {
  const refunds = [];
  let seq = 1;

  // 1. Legitimate single refunds
  for (const orderId of SINGLE_REFUND_ORDERS) {
    const paymentId = paymentByOrder[orderId];
    if (!paymentId) continue;

    const payment = payments.find((p) => p.paymentId === paymentId);
    if (!payment) continue;

    refunds.push({
      refundId: `rfnd_${String(seq).padStart(4, "0")}`,
      paymentId,
      orderId,
      amount: payment.capturedAmount,
      requestedAt: new Date(
        new Date(payment.capturedAt).getTime() + 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
      reason: "customer_request",
      customerId: `CST-${4000 + seq}`,
      isLegitimate: true,
    });
    seq++;
  }

  // 2. Duplicate refund pair — ORD-88142 (EXCEPTION CASE)
  //    Same paymentId, same amount, same customerId (only ONE support case)
  const dupPayId = paymentByOrder["ORD-88142"];
  if (dupPayId) {
    const dupPay = payments.find((p) => p.paymentId === dupPayId);
    if (dupPay) {
      for (let d = 0; d < 2; d++) {
        refunds.push({
          refundId: `rfnd_${String(seq).padStart(4, "0")}`,
          paymentId: dupPayId,
          orderId: "ORD-88142",
          amount: dupPay.capturedAmount,
          requestedAt: new Date(
            new Date(dupPay.capturedAt).getTime() + (d + 1) * 12 * 60 * 60 * 1000
          ).toISOString(),
          reason: "customer_request",
          customerId: "CST-4421",  // Same customer — only one real request
          isLegitimate: false,     // Second one is a duplicate
        });
        seq++;
      }
    }
  }

  // 3. Legitimate two-refund case — ORD-88162 (two distinct customers, partial refunds)
  const legitDupPayId = paymentByOrder["ORD-88162"];
  if (legitDupPayId) {
    const legitPay = payments.find((p) => p.paymentId === legitDupPayId);
    if (legitPay) {
      const halfAmount = Math.floor(legitPay.capturedAmount / 2);
      const customers = ["CST-6610", "CST-6611"];
      for (let d = 0; d < 2; d++) {
        refunds.push({
          refundId: `rfnd_${String(seq).padStart(4, "0")}`,
          paymentId: legitDupPayId,
          orderId: "ORD-88162",
          amount: halfAmount,
          requestedAt: new Date(
            new Date(legitPay.capturedAt).getTime() + (d + 1) * 24 * 60 * 60 * 1000
          ).toISOString(),
          reason: "partial_return",
          customerId: customers[d],  // Two distinct customer cases
          isLegitimate: true,
        });
        seq++;
      }
    }
  }

  return refunds;
}

export const refunds = genRefunds();
export default refunds;
