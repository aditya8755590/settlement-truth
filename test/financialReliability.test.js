import assert from "node:assert/strict";
import test from "node:test";
import { buildDataset } from "../server/csvParser.js";
import { runReconciliation } from "../server/engine.js";

const reconcile = (dataset) => runReconciliation(dataset, true, { gatewayRate: 0.02 });

test("does not fabricate payment, settlement, or bank evidence when uploads omit those sources", async () => {
  const dataset = buildDataset({
    orders: { rows: [{ orderId: "ORD-1", amount: 100, currency: "INR", createdAt: "2026-09-01T00:00:00.000Z" }] },
  });

  assert.deepEqual(dataset.payments, []);
  assert.deepEqual(dataset.settlements, []);
  assert.deepEqual(dataset.bankCredits, []);

  const result = await reconcile(dataset);
  assert.equal(result.records[0].status, "Anomaly");
  assert.match(result.records[0].title, /source unavailable/i);
});

test("never clears a payment when its linked settlement amount is not fully evidenced", async () => {
  const result = await reconcile({
    sourceAvailability: { orders: true, payments: true, refunds: true, settlements: true, bankCredits: true },
    orders: [{ orderId: "ORD-1", amount: 100, currency: "INR", createdAt: "2026-09-01T00:00:00.000Z" }],
    payments: [{ paymentId: "PAY-1", orderId: "ORD-1", capturedAmount: 100, status: "captured", capturedAt: "2026-09-01T00:01:00.000Z" }],
    refunds: [],
    settlements: [{ settlementId: "SET-1", paymentIds: ["PAY-1"], grossAmount: 1, feeAmount: 0, taxAmount: 0, netAmount: 1, payoutRef: "PAYOUT-1", settlementDate: "2026-09-03T00:00:00.000Z" }],
    bankCredits: [{ payoutRef: "PAYOUT-1", amount: 1, creditDate: "2026-09-03T01:00:00.000Z" }],
  });

  assert.equal(result.records.find((record) => record.id === "ORD-1").status, "Anomaly");
  assert.match(result.records.find((record) => record.id === "ORD-1").title, /settlement amount mismatch/i);
});

test("does not accept an unrelated same-value reversal as proof of a refund", async () => {
  const result = await reconcile({
    sourceAvailability: { orders: true, payments: true, refunds: true, settlements: true, bankCredits: true },
    orders: [{ orderId: "ORD-1", amount: 100, currency: "INR", createdAt: "2026-09-01T00:00:00.000Z" }],
    payments: [{ paymentId: "PAY-1", orderId: "ORD-1", capturedAmount: 100, status: "captured", capturedAt: "2026-09-01T00:01:00.000Z" }],
    refunds: [{ refundId: "REF-1", paymentId: "PAY-1", refundAmount: 10, refundStatus: "processed" }],
    settlements: [
      { settlementId: "SET-1", paymentIds: ["PAY-1"], grossAmount: 100, feeAmount: 2, taxAmount: 0, netAmount: 98, payoutRef: "PAYOUT-1", settlementDate: "2026-09-03T00:00:00.000Z" },
      { settlementId: "SET-OTHER", paymentIds: [], grossAmount: -10, feeAmount: 0, taxAmount: 0, netAmount: -10, payoutRef: "PAYOUT-2", settlementDate: "2026-09-03T00:00:00.000Z" },
    ],
    bankCredits: [{ payoutRef: "PAYOUT-1", amount: 98, creditDate: "2026-09-03T01:00:00.000Z" }, { payoutRef: "PAYOUT-2", amount: -10, creditDate: "2026-09-03T01:00:00.000Z" }],
  });

  assert.equal(result.records.find((record) => record.id === "ORD-1").status, "Anomaly");
  assert.match(result.records.find((record) => record.id === "ORD-1").title, /refund evidence incomplete/i);
});

test("requires explicit allocation before clearing an order with multiple captures", async () => {
  const result = await reconcile({
    sourceAvailability: { orders: true, payments: true, refunds: true, settlements: true, bankCredits: true },
    orders: [{ orderId: "ORD-1", amount: 100, currency: "INR", createdAt: "2026-09-01T00:00:00.000Z" }],
    payments: [
      { paymentId: "PAY-1", orderId: "ORD-1", capturedAmount: 50, status: "captured", capturedAt: "2026-09-01T00:01:00.000Z" },
      { paymentId: "PAY-2", orderId: "ORD-1", capturedAmount: 50, status: "captured", capturedAt: "2026-09-01T00:02:00.000Z" },
    ],
    refunds: [],
    settlements: [{ settlementId: "SET-1", paymentIds: ["PAY-1", "PAY-2"], grossAmount: 100, feeAmount: 2, taxAmount: 0, netAmount: 98, payoutRef: "PAYOUT-1", settlementDate: "2026-09-03T00:00:00.000Z" }],
    bankCredits: [{ payoutRef: "PAYOUT-1", amount: 98, creditDate: "2026-09-03T01:00:00.000Z" }],
  });

  assert.equal(result.records.find((record) => record.id === "ORD-1").status, "Anomaly");
  assert.match(result.records.find((record) => record.id === "ORD-1").title, /multiple payment captures/i);
});

test("counts an aggregated bank-payout discrepancy once", async () => {
  const result = await reconcile({
    sourceAvailability: { orders: true, payments: true, refunds: true, settlements: true, bankCredits: true },
    orders: [
      { orderId: "ORD-1", amount: 100, currency: "INR", createdAt: "2026-09-01T00:00:00.000Z" },
      { orderId: "ORD-2", amount: 200, currency: "INR", createdAt: "2026-09-01T00:00:00.000Z" },
    ],
    payments: [
      { paymentId: "PAY-1", orderId: "ORD-1", capturedAmount: 100, status: "captured", capturedAt: "2026-09-01T00:01:00.000Z" },
      { paymentId: "PAY-2", orderId: "ORD-2", capturedAmount: 200, status: "captured", capturedAt: "2026-09-01T00:01:00.000Z" },
    ],
    refunds: [],
    settlements: [
      { settlementId: "SET-1", paymentIds: ["PAY-1"], grossAmount: 100, feeAmount: 2, taxAmount: 0, netAmount: 98, payoutRef: "PAYOUT-1", settlementDate: "2026-09-03T00:00:00.000Z" },
      { settlementId: "SET-2", paymentIds: ["PAY-2"], grossAmount: 200, feeAmount: 4, taxAmount: 0, netAmount: 196, payoutRef: "PAYOUT-1", settlementDate: "2026-09-03T00:00:00.000Z" },
    ],
    bankCredits: [{ payoutRef: "PAYOUT-1", amount: 250, creditDate: "2026-09-03T01:00:00.000Z" }],
  });

  assert.equal(result.metrics.cashAtRisk, 44);
  assert.equal(result.records.filter((record) => record.title === "Bank payout amount mismatch").length, 1);
});
