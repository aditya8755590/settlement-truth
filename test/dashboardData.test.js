import assert from "node:assert/strict";
import test from "node:test";
import { deriveAuditView } from "../client/src/lib/dashboardData.js";

test("derives dashboard totals only from supplied reconciliation evidence", () => {
  const view = deriveAuditView({ totalRecords: 2, autoMatched: 1, cashAtRisk: 128, exceptionQueueCount: 1 }, [
    { status: "Cleared", type: "Order + gateway + settlement", amount: 100 },
    { status: "Anomaly", type: "Fee exception", amount: 128 },
  ]);

  assert.equal(view.matchRate, 50);
  assert.equal(view.categories[0].name, "Fee exception");
  assert.equal(view.categories[0].count, 1);
});

test("renders an explicit empty state when no audit evidence exists", () => {
  assert.deepEqual(deriveAuditView(null, []).hasAudit, false);
});
