export function formatCurrency(value, currencyCode = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(value);
}

const SETTLEMENT_WINDOW_DAYS = 3;
const AMOUNT_TOLERANCE = 0.01;
const FEE_TOLERANCE = 0.01;

const finite = (value) => typeof value === "number" && Number.isFinite(value);
const positive = (value) => finite(value) && value > 0;
const near = (left, right, tolerance = AMOUNT_TOLERANCE) => Math.abs(left - right) <= tolerance;
const validDate = (value) => value && Number.isFinite(Date.parse(value));
const uniqueById = (items) => [...new Map(items.filter(Boolean).map((item) => [item.settlementId || item.paymentId || item.bankTxId || item.reference, item])).values()];

function review({ id, currency, title, amount = 0, reason, action, passes, paymentId = null, settlementId = null, bankUtr = null, timeline = [], metricRisk = amount, type = "Reconciliation exception" }) {
  return { id, orderId: id, currency, status: "Anomaly", type, title, amount: Math.max(0, amount), metricRisk: Math.max(0, metricRisk), reason, action, passes, evidence: 0, paymentId, settlementId, bankUtr, netAmount: null, timeline };
}

function sourceAvailable(dataset, source) {
  if (dataset.sourceAvailability) return dataset.sourceAvailability[source] === true;
  return Array.isArray(dataset[source]);
}

function buildIndexes(dataset) {
  const paymentsByOrder = new Map();
  const paymentById = new Map();
  for (const payment of dataset.payments || []) {
    if (!payment?.paymentId) continue;
    paymentById.set(payment.paymentId, payment);
    const entries = paymentsByOrder.get(payment.orderId) || [];
    entries.push(payment);
    paymentsByOrder.set(payment.orderId, entries);
  }

  const settlementsByPayment = new Map();
  const settlementsByGateway = new Map();
  const settlementById = new Map();
  const payouts = new Map();
  for (const settlement of dataset.settlements || []) {
    if (!settlement?.settlementId) continue;
    settlementById.set(settlement.settlementId, settlement);
    for (const paymentId of Array.isArray(settlement.paymentIds) ? settlement.paymentIds.filter(Boolean) : []) {
      const entries = settlementsByPayment.get(paymentId) || [];
      entries.push(settlement);
      settlementsByPayment.set(paymentId, entries);
    }
    if (settlement.gatewayRef) {
      const entries = settlementsByGateway.get(settlement.gatewayRef) || [];
      entries.push(settlement);
      settlementsByGateway.set(settlement.gatewayRef, entries);
    }
    if (settlement.payoutRef) {
      const group = payouts.get(settlement.payoutRef) || { settlements: [], credits: [] };
      group.settlements.push(settlement);
      payouts.set(settlement.payoutRef, group);
    }
  }

  const creditsByReference = new Map();
  for (const [index, credit] of (dataset.bankCredits || []).entries()) {
    if (credit?.payoutRef && payouts.has(credit.payoutRef)) payouts.get(credit.payoutRef).credits.push(credit);
    if (credit?.reference) {
      const entries = creditsByReference.get(credit.reference) || [];
      entries.push(credit);
      creditsByReference.set(credit.reference, entries);
    }
  }

  const refundsByPayment = new Map();
  for (const refund of dataset.refunds || []) {
    if (!refund?.paymentId) continue;
    const entries = refundsByPayment.get(refund.paymentId) || [];
    entries.push(refund);
    refundsByPayment.set(refund.paymentId, entries);
  }
  return { paymentsByOrder, paymentById, settlementsByPayment, settlementsByGateway, settlementById, payouts, creditsByReference, refundsByPayment };
}

function settlementEvidence(settlement, idx, gatewayRate) {
  const paymentIds = Array.isArray(settlement.paymentIds) ? settlement.paymentIds.filter(Boolean) : [];
  const payments = paymentIds.map((id) => idx.paymentById.get(id));
  if (!paymentIds.length || payments.some((payment) => !payment)) return { ok: false, title: "Settlement evidence incomplete", reason: "Settlement does not contain a complete set of known payment identifiers." };
  if (![settlement.grossAmount, settlement.feeAmount, settlement.taxAmount, settlement.netAmount].every(finite)) return { ok: false, title: "Settlement evidence incomplete", reason: "Settlement requires explicit gross, fee, tax, and net amounts before it can be cleared." };
  const capturedTotal = payments.reduce((sum, payment) => sum + payment.capturedAmount, 0);
  if (!near(settlement.grossAmount, capturedTotal)) return { ok: false, title: "Settlement amount mismatch", reason: `Settlement gross ${settlement.grossAmount} does not equal linked captured payments ${capturedTotal}.` };
  if (!near(settlement.netAmount, settlement.grossAmount - settlement.feeAmount - settlement.taxAmount)) return { ok: false, title: "Settlement arithmetic mismatch", reason: "Settlement net amount does not equal gross minus documented fee and tax." };
  const expectedFee = settlement.grossAmount * gatewayRate;
  if (!near(settlement.feeAmount, expectedFee, FEE_TOLERANCE)) return { ok: false, title: "Unexpected fee deduction (fee creep)", reason: `Documented fee ${settlement.feeAmount} differs from policy fee ${expectedFee}.`, risk: Math.max(0, settlement.feeAmount - expectedFee) };
  if (!validDate(settlement.settlementDate)) return { ok: false, title: "Settlement evidence incomplete", reason: "Settlement date is missing or invalid." };
  const latestCapture = Math.max(...payments.map((payment) => Date.parse(payment.capturedAt)));
  const settledAt = Date.parse(settlement.settlementDate);
  if (!Number.isFinite(latestCapture) || settledAt < latestCapture || settledAt - latestCapture > SETTLEMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000) return { ok: false, title: "Settlement timing unresolved", reason: "Settlement date is outside the documented capture-to-settlement window." };
  return { ok: true };
}

function payoutEvidence(group) {
  if (!group.credits.length) return { ok: false, title: "Bank payout missing for settlement", risk: Math.max(0, group.settlements.reduce((sum, settlement) => sum + (settlement.netAmount || 0), 0)), reason: "No bank credit has the payout reference." };
  if (!group.credits.every((credit) => positive(credit.amount) || finite(credit.amount))) return { ok: false, title: "Bank payout evidence incomplete", risk: 0, reason: "Bank payout has an invalid amount." };
  const settlementNet = group.settlements.reduce((sum, settlement) => sum + settlement.netAmount, 0);
  const creditTotal = group.credits.reduce((sum, credit) => sum + credit.amount, 0);
  if (!near(settlementNet, creditTotal)) return { ok: false, title: "Bank payout amount mismatch", risk: Math.abs(settlementNet - creditTotal), reason: `Bank payout ${creditTotal} differs from combined settlement net ${settlementNet}.` };
  const latestSettlement = Math.max(...group.settlements.map((settlement) => Date.parse(settlement.settlementDate)));
  if (!group.credits.every((credit) => validDate(credit.creditDate) && Date.parse(credit.creditDate) >= latestSettlement)) return { ok: false, title: "Bank payout timing unresolved", risk: 0, reason: "Bank credit date is missing, invalid, or precedes its settlement." };
  return { ok: true };
}

function refundEvidence(refund, idx) {
  if (!refund.refundId || !refund.paymentId || !positive(refund.refundAmount)) return { ok: false, reason: "Refund lacks an immutable ID, payment link, or positive amount." };
  const candidates = (idx.settlementsByPayment.get(refund.paymentId) || []).filter((settlement) => settlement.refundId === refund.refundId && settlement.grossAmount < 0 && near(-settlement.grossAmount, refund.refundAmount));
  if (candidates.length !== 1) return { ok: false, reason: "No uniquely linked negative settlement proves this refund." };
  const settlement = candidates[0];
  if (!settlement.payoutRef || !idx.payouts.has(settlement.payoutRef)) return { ok: false, reason: "Refund settlement lacks a bank payout reference." };
  const bank = payoutEvidence(idx.payouts.get(settlement.payoutRef));
  return bank.ok ? { ok: true } : { ok: false, reason: bank.reason };
}

function payoutFindings(idx, currency) {
  const records = [];
  const state = new Map();
  for (const [payoutRef, group] of idx.payouts) {
    const evidence = payoutEvidence(group);
    state.set(payoutRef, evidence);
    if (!evidence.ok) records.push(review({
      id: `PAYOUT:${payoutRef}`, currency, type: "Payout exception", title: evidence.title, amount: evidence.risk, metricRisk: evidence.risk,
      reason: evidence.reason, action: "Verify the payout with the bank before recording cash as received.", passes: { p1: null, p2: true, p3: false, p4: null }, bankUtr: payoutRef,
      timeline: [`Payout ${payoutRef} contains ${group.settlements.length} settlement line(s).`, `❌ ${evidence.reason}`],
    }));
  }
  return { records, state };
}

function analyzeOrder(order, dataset, idx, payoutState, gatewayRate) {
  const currency = order.currency || "INR";
  const missingSources = ["payments", "settlements", "bankCredits", "refunds"].filter((source) => !sourceAvailable(dataset, source));
  if (missingSources.length) return review({
    id: order.orderId, currency, title: "Evidence source unavailable", amount: order.amount, reason: `Cannot establish a complete money trail because ${missingSources.join(", ")} source data was not supplied.`, action: "Upload the missing source export; do not mark this order as reconciled.", passes: { p1: false, p2: false, p3: false, p4: false }, timeline: [`Order ${order.orderId} loaded.`, `❌ Missing source evidence: ${missingSources.join(", ")}.`],
  });
  if (!positive(order.amount) || !validDate(order.createdAt)) return review({
    id: order.orderId, currency, title: "Order evidence incomplete", amount: 0, reason: "Order requires a positive amount and valid creation date.", action: "Correct the order export before reconciliation.", passes: { p1: false, p2: false, p3: false, p4: false }, timeline: [`❌ Order ${order.orderId} has incomplete financial evidence.`],
  });
  const payments = idx.paymentsByOrder.get(order.orderId) || [];
  if (!payments.length) return review({ id: order.orderId, currency, title: "Missing payment capture", amount: order.amount, reason: "No gateway payment references this order.", action: "Investigate payment capture; do not mark the order as paid.", passes: { p1: false, p2: false, p3: false, p4: false }, timeline: [`Order ${order.orderId} found.`, "❌ No payment references the order."] });
  if (payments.length !== 1) return review({ id: order.orderId, currency, title: "Multiple payment captures require allocation", amount: order.amount, reason: "More than one payment references this order and no explicit split-payment allocation model exists.", action: "Review captures and provide an explicit allocation before clearing.", passes: { p1: false, p2: false, p3: false, p4: false }, paymentId: payments[0].paymentId, timeline: [`❌ ${payments.length} payments reference order ${order.orderId}.`] });
  const payment = payments[0];
  if (String(payment.status || "").toLowerCase() !== "captured") return review({ id: order.orderId, currency, title: "Payment not captured", amount: 0, reason: `Gateway status is ${payment.status || "unknown"}, not captured.`, action: "Verify the gateway lifecycle before fulfillment.", passes: { p1: false, p2: false, p3: false, p4: false }, paymentId: payment.paymentId, timeline: [`❌ Payment ${payment.paymentId} is not captured.`] });
  if (!positive(payment.capturedAmount) || !validDate(payment.capturedAt) || !near(payment.capturedAmount, order.amount)) return review({ id: order.orderId, currency, title: "Partial capture — payment differs from order", amount: Math.abs((payment.capturedAmount || 0) - order.amount), reason: "Captured amount does not exactly equal the order amount.", action: "Review capture evidence before fulfillment or refund.", passes: { p1: false, p2: false, p3: false, p4: false }, paymentId: payment.paymentId, timeline: [`❌ Payment ${payment.paymentId} does not prove the order amount.`] });

  const settlements = uniqueById([...(idx.settlementsByPayment.get(payment.paymentId) || []), ...(payment.gatewayRef ? idx.settlementsByGateway.get(payment.gatewayRef) || [] : [])]);
  if (!settlements.length) return review({ id: order.orderId, currency, title: "Settlement missing for captured payment", amount: payment.capturedAmount, reason: "No settlement explicitly references the captured payment.", action: "Escalate to the gateway; do not record funds as received.", passes: { p1: true, p2: false, p3: false, p4: false }, paymentId: payment.paymentId, timeline: [`Payment ${payment.paymentId} captured.`, "❌ No settlement link found."] });
  if (settlements.length !== 1) return review({ id: order.orderId, currency, title: "Multiple settlements require allocation", amount: payment.capturedAmount, reason: "More than one settlement references the payment and no allocation evidence is available.", action: "Review settlement allocations before clearing.", passes: { p1: true, p2: false, p3: false, p4: false }, paymentId: payment.paymentId, timeline: [`❌ ${settlements.length} settlements reference payment ${payment.paymentId}.`] });
  const settlement = settlements[0];
  const settlementCheck = settlementEvidence(settlement, idx, gatewayRate);
  if (!settlementCheck.ok) return review({ id: order.orderId, currency, title: settlementCheck.title, amount: settlementCheck.risk || 0, reason: settlementCheck.reason, action: "Obtain complete settlement evidence before clearing.", passes: { p1: true, p2: false, p3: false, p4: false }, paymentId: payment.paymentId, settlementId: settlement.settlementId, timeline: [`❌ ${settlementCheck.reason}`] });

  if (settlement.payoutRef) {
    const bankCheck = payoutState.get(settlement.payoutRef);
    if (!bankCheck?.ok) return review({ id: order.orderId, currency, title: "Bank payout requires review", amount: 0, metricRisk: 0, reason: bankCheck?.reason || "Bank payout evidence is unavailable.", action: "Review the payout-level finding before recording cash.", passes: { p1: true, p2: true, p3: false, p4: false }, paymentId: payment.paymentId, settlementId: settlement.settlementId, bankUtr: settlement.payoutRef, timeline: [`❌ ${bankCheck?.reason || "Bank payout evidence unavailable."}`] });
  } else {
    const credits = idx.creditsByReference.get(settlement.settlementId) || [];
    if (credits.length !== 1 || !finite(credits[0].amount) || !near(credits[0].amount, settlement.netAmount) || !validDate(credits[0].creditDate) || Date.parse(credits[0].creditDate) < Date.parse(settlement.settlementDate)) return review({ id: order.orderId, currency, title: "Bank credit evidence incomplete", amount: settlement.netAmount, reason: "Settlement requires exactly one dated bank credit with the same amount.", action: "Obtain bank evidence before recording cash.", passes: { p1: true, p2: true, p3: false, p4: false }, paymentId: payment.paymentId, settlementId: settlement.settlementId, timeline: ["❌ Bank credit does not prove this settlement."] });
  }

  const refunds = idx.refundsByPayment.get(payment.paymentId) || [];
  if (refunds.length > 1) return review({ id: order.orderId, currency, title: "Multiple refunds require allocation", amount: refunds.reduce((sum, refund) => sum + (refund.refundAmount || 0), 0), reason: "Multiple refund events require explicit, independently evidenced reversals.", action: "Review refund intent and reversal references.", passes: { p1: true, p2: true, p3: true, p4: false }, paymentId: payment.paymentId, settlementId: settlement.settlementId, timeline: ["❌ Multiple refund events are linked to this payment."] });
  if (refunds.length === 1) {
    const refundCheck = refundEvidence(refunds[0], idx);
    if (!refundCheck.ok) return review({ id: order.orderId, currency, title: "Refund evidence incomplete", amount: refunds[0].refundAmount, reason: refundCheck.reason, action: "Obtain an explicit refund-to-reversal link before treating the refund as complete.", passes: { p1: true, p2: true, p3: true, p4: false }, paymentId: payment.paymentId, settlementId: settlement.settlementId, timeline: [`❌ ${refundCheck.reason}`] });
  }
  return { id: order.orderId, orderId: order.orderId, currency, status: "Cleared", type: "Order reconciliation", title: "Evidence-backed settlement match", amount: order.amount, metricRisk: 0, reason: "Order, capture, settlement allocation, bank credit, and refund state are explicitly evidenced.", action: "Auto-matched. No money action required.", passes: { p1: true, p2: true, p3: true, p4: true }, evidence: 4, paymentId: payment.paymentId, settlementId: settlement.settlementId, bankUtr: settlement.payoutRef || (idx.creditsByReference.get(settlement.settlementId) || [])[0]?.reference || null, netAmount: settlement.netAmount, timeline: ["Order confirmed.", "Payment captured at the order amount.", "Settlement arithmetic and policy fee confirmed.", "Bank credit confirmed.", refunds.length ? "Refund reversal explicitly confirmed." : "No refund event supplied."], };
}

function orphanFindings(dataset, idx, currency) {
  const findings = [];
  const validOrderIds = new Set((dataset.orders || []).map((order) => order.orderId));
  for (const settlement of dataset.settlements || []) {
    const ids = Array.isArray(settlement.paymentIds) ? settlement.paymentIds : [];
    const linked = ids.some((id) => validOrderIds.has(idx.paymentById.get(id)?.orderId));
    if (!linked) findings.push(review({ id: `SETTLEMENT:${settlement.settlementId}`, currency, type: "Settlement exception", title: "Orphan settlement", amount: Math.max(0, settlement.netAmount || 0), reason: "Settlement has no payment linked to a known order.", action: "Hold in suspense until a source-proven order relationship is supplied.", passes: { p1: false, p2: false, p3: null, p4: null }, settlementId: settlement.settlementId, timeline: [`❌ Settlement ${settlement.settlementId} has no known order trail.`] }));
  }
  for (const credit of dataset.bankCredits || []) {
    const linkedPayout = credit.payoutRef && idx.payouts.has(credit.payoutRef);
    const linkedSettlement = credit.reference && idx.settlementById.has(credit.reference);
    if (!linkedPayout && !linkedSettlement) findings.push(review({ id: `BANK:${credit.bankTxId || credit.utr || credit.reference || index}`, currency, type: "Bank exception", title: "Orphan bank credit", amount: Math.max(0, credit.amount || 0), reason: "Bank credit has no source-proven settlement or payout relationship.", action: "Keep funds in suspense and obtain bank reference evidence.", passes: { p1: false, p2: false, p3: false, p4: null }, bankUtr: credit.utr || credit.payoutRef || credit.reference || null, timeline: ["❌ Bank credit cannot be linked to a settlement."] }));
  }
  return findings;
}

export async function runReconciliation(dataset, _isCustom, options = {}) {
  const gatewayRate = options.gatewayRate ?? 0.02;
  const normalized = { orders: [], payments: [], refunds: [], settlements: [], bankCredits: [], ...dataset };
  const currency = normalized.orders[0]?.currency || "INR";
  const idx = buildIndexes(normalized);
  const payout = payoutFindings(idx, currency);
  const orders = normalized.orders.map((order) => analyzeOrder(order, normalized, idx, payout.state, gatewayRate));
  const orphans = orphanFindings(normalized, idx, currency);
  const records = [...orders, ...payout.records, ...orphans];
  const matched = orders.filter((record) => record.status === "Cleared");
  const review = records.filter((record) => record.status === "Anomaly");
  const cashAtRisk = review.reduce((sum, record) => sum + (record.metricRisk || 0), 0);
  const currencySet = new Set(normalized.orders.map((order) => order.currency).filter(Boolean));
  const metrics = {
    totalRecords: orders.length,
    autoMatched: matched.length,
    autoMatchedText: `${matched.length} / ${orders.length}`,
    orderReviewCount: orders.length - matched.length,
    payoutExceptionCount: payout.records.length,
    orphanExceptionCount: orphans.length,
    exceptionQueueCount: review.length,
    cashAtRisk,
    cashAtRiskFormatted: currencySet.size === 1 ? formatCurrency(cashAtRisk, currency) : null,
    reconciledAmount: matched.reduce((sum, record) => sum + record.amount, 0),
    reconciledAmountFormatted: currencySet.size === 1 ? formatCurrency(matched.reduce((sum, record) => sum + record.amount, 0), currency) : null,
    forcedMatchesCount: 0,
    evidencePrecision: null,
    currency: currencySet.size === 1 ? currency : null,
  };
  const auditTrail = [{ timestamp: new Date().toISOString(), title: "Deterministic reconciliation completed", description: `${matched.length} orders cleared; ${review.length} findings retained for review. No missing source was fabricated.` }];
  return { records, metrics, groundTruth: null, auditTrail };
}
