import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { buildDataset, parseCSVStream } from "../server/csvParser.js";
import { runReconciliation } from "../server/engine.js";
import { validateReconciliationOptions } from "../server/reconciliationPolicy.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => path.join(__dirname, "fixtures", name);

test("rejects CSV rows with invalid monetary values instead of converting them to zero", async () => {
  const result = await parseCSVStream(fixture("invalid-orders.csv"), "orders.csv");

  assert.equal(result.rows.length, 0);
  assert.match(result.errors.join("\n"), /invalid monetary value for "amount"/i);
});

test("preserves an imported failed payment status", async () => {
  const parsedPayment = await parseCSVStream(fixture("payment-status.csv"), "payments.csv");
  const dataset = buildDataset({ payments: parsedPayment });

  assert.equal(dataset.payments[0].status, "failed");
});

test("does not auto-match a settlement to a payment using only a date heuristic", async () => {
  const dataset = buildDataset({
    orders: { rows: [{ orderId: "ORD-1", amount: 100, currency: "INR", createdAt: "2026-09-01T00:00:00.000Z" }] },
    payments: { rows: [{ paymentId: "PAY-1", orderId: "ORD-1", capturedAmount: 100, status: "captured", capturedAt: "2026-09-01T00:00:00.000Z" }] },
    settlements: { rows: [{ settlementId: "SET-1", netAmount: 98, settlementDate: "2026-09-03T00:00:00.000Z" }] },
    bankCredits: { rows: [{ reference: "SET-1", amount: 98 }] },
  });

  const result = await runReconciliation(dataset, true, { gatewayRate: 0.02 });

  assert.equal(result.records.find((record) => record.id === "ORD-1").status, "Anomaly");
  assert.match(result.records.find((record) => record.id === "ORD-1").title, /settlement missing/i);
});

test("accepts only finite gateway rates within the documented policy range", () => {
  assert.deepEqual(validateReconciliationOptions({ gatewayRate: 0.0236 }), { gatewayRate: 0.0236 });
  assert.throws(() => validateReconciliationOptions({ gatewayRate: "0.02" }), /finite number/i);
  assert.throws(() => validateReconciliationOptions({ gatewayRate: 0.25 }), /between 0% and 20%/i);
});
