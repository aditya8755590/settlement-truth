/**
 * Raw Synthetic Payments Table
 * Source: Razorpay gateway payment events
 *
 * Rules:
 * - ORD-88135: Payment IS captured (₹4,260) but deliberately EXCLUDED from any
 *   settlement batch (see settlements.js) → "captured but never settled" case.
 * - ORD-88176: Partial capture — only ₹1,375 captured vs order of ₹2,750
 * - ORD-88104: Fee creep — gateway charges 4% instead of 2.36%
 * - ORD-88157: Fee overcharge — extra ₹182 deducted beyond the rate card
 * - All other orders: full capture at exact order amount, standard fee
 */

import { orders } from "./orders.js";

const GATEWAY_RATE = 0.0236;      // 2% + 0.36% gateway fee
const GST_ON_FEE   = 0.18;

// Orders that have NO payment (missing capture — engine will flag as exception)
// NOTE: intentionally empty in the demo build; ORD-88135 uses "captured but never settled".
const MISSING_CAPTURE = new Set([]);

// Orders with partial capture
const PARTIAL_CAPTURE = { "ORD-88176": 1375 };

// Edge cases for demo
const DUPLICATED_PAYMENT = new Set(["ORD-88109"]); // User clicked pay twice
const FEE_CREEP_ORDER = "ORD-88104"; // Gateway charged 4% instead of 2.36%
const FEE_CREEP_RATE = 0.04;
const FEE_OVERCHARGE_ORDERS = new Set(["ORD-88157"]); // Extra ₹182 deducted
const EXTRA_FEE = 182;

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

    let fee = Math.round(capturedAmount * GATEWAY_RATE);
    if (order.orderId === FEE_CREEP_ORDER) {
      // Fee creep: charge 4% instead of the contracted 2.36% — clear violation
      fee = Math.round(capturedAmount * FEE_CREEP_RATE);
    }
    if (FEE_OVERCHARGE_ORDERS.has(order.orderId)) {
      // Fee overcharge: flat extra ₹182 deducted beyond the rate card
      fee += EXTRA_FEE;
    }

    const tax = Math.round(fee * GST_ON_FEE);

    const capturedAt = new Date(
      new Date(order.createdAt).getTime() + 5 * 60 * 1000 // 5 min after order
    ).toISOString();

    const paymentRow = {
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
    };

    payments.push(paymentRow);

    if (DUPLICATED_PAYMENT.has(order.orderId)) {
      // User clicked pay twice, creating a duplicate payment capture!
      payments.push({
        ...paymentRow,
        paymentId: `pay_${String(seq).padStart(4, "0")}_dup`,
        capturedAt: new Date(new Date(capturedAt).getTime() + 10 * 1000).toISOString(),
      });
    }

    seq++;
  }

  return payments;
}

export const payments = genPayments();
export default payments;
