/**
 * Raw Synthetic Payments Table
 * Source: Razorpay gateway payment events
 *
 * Rules:
 * - ORD-88135: NO captured payment exists (triggers "Missing settlement" exception later)
 * - ORD-88176: Partial capture — only ₹1,375 captured vs order of ₹2,750
 * - All other orders: full capture at exact order amount
 */

import { orders } from "./orders.js";

const GATEWAY_RATE = 0.0236;      // 2% + 0.36% gateway fee
const GST_ON_FEE   = 0.18;

// Orders that have NO payment (missing capture — engine will flag as exception)
const MISSING_CAPTURE = new Set(["ORD-88135"]);

// Orders with partial capture
const PARTIAL_CAPTURE = { "ORD-88176": 1375 };

function genPayments() {
  const payments = [];
  let seq = 1;

  for (const order of orders) {
    if (MISSING_CAPTURE.has(order.orderId)) {
      // Deliberately no payment row — engine will detect the gap
      continue;
    }

    const capturedAmount =
      PARTIAL_CAPTURE[order.orderId] ?? order.amount;

    const fee   = Math.round(capturedAmount * GATEWAY_RATE);
    const tax   = Math.round(fee * GST_ON_FEE);

    const capturedAt = new Date(
      new Date(order.createdAt).getTime() + 5 * 60 * 1000 // 5 min after order
    ).toISOString();

    payments.push({
      paymentId: `pay_${String(seq).padStart(4, "0")}`,
      orderId: order.orderId,
      capturedAmount,
      fee,
      tax,
      netAmount: capturedAmount - fee - tax,
      currency: "INR",
      capturedAt,
      method: seq % 4 === 0 ? "netbanking" : seq % 3 === 0 ? "upi" : "card",
      status: "captured",
    });

    seq++;
  }

  return payments;
}

export const payments = genPayments();
export default payments;
