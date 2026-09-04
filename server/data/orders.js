/**
 * Raw Synthetic Orders Table
 * Source: Merchant order management system
 *
 * 100 orders. The engine will attempt to match each to a gateway payment.
 * Amounts are deterministic but realistic (₹500–₹9,999).
 */

const ORDER_STATUSES = ["paid", "pending"];

function genOrders() {
  const orders = [];

  // 8 hand-authored showcase orders (stable IDs referenced in checks)
  const showcase = [
    { orderId: "ORD-88104", amount: 2499, createdAt: "2024-08-26T10:15:00Z" },
    { orderId: "ORD-88109", amount: 1899, createdAt: "2024-08-26T11:02:00Z" },
    { orderId: "ORD-88121", amount: 749,  createdAt: "2024-08-26T13:44:00Z" },
    { orderId: "ORD-88135", amount: 4260, createdAt: "2024-08-27T09:08:00Z" },
    { orderId: "ORD-88142", amount: 1299, createdAt: "2024-08-27T10:55:00Z" },
    { orderId: "ORD-88157", amount: 8990, createdAt: "2024-08-27T14:30:00Z" },
    { orderId: "ORD-88162", amount: 3299, createdAt: "2024-08-27T16:00:00Z" },
    { orderId: "ORD-88176", amount: 2750, createdAt: "2024-08-28T08:20:00Z" },
  ];

  for (const o of showcase) {
    orders.push({
      orderId: o.orderId,
      merchantId: "MID-7741",
      amount: o.amount,
      currency: "INR",
      createdAt: o.createdAt,
      expectedStatus: "paid",
    });
  }

  // 92 generated orders (ORD-88180 … ORD-88271)
  for (let i = 0; i < 92; i++) {
    const orderId = `ORD-${88180 + i}`;
    const amount = 599 + ((i * 347) % 9400);
    // Hours spread across the 3-day window
    const hour = 8 + (i % 12);
    const day = 26 + Math.floor(i / 36);
    const createdAt = `2024-08-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:00Z`;

    orders.push({
      orderId,
      merchantId: "MID-7741",
      amount,
      currency: "INR",
      createdAt,
      expectedStatus: "paid",
    });
  }

  return orders;
}

export const orders = genOrders();
export default orders;
