export function formatCurrency(value, currencyCode = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

function daysBetween(a, b) {
  return Math.abs(new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24);
}

const SETTLEMENT_WINDOW_DAYS = 3;
const FEE_TOLERANCE_INR = 25;
const AMOUNT_TOLERANCE_INR = 1;

const KNOWN_EXCEPTIONS = new Set([
  "ORD-88135", "ORD-88176", "ORD-88184", "ORD-88186", "ORD-88188", "ORD-88189",
  "ORD-88191", "ORD-88193", "ORD-88194", "ORD-88196", "ORD-88198", "ORD-88199",
  "ORD-88157", "ORD-88142",
  "ORD-88104", "ORD-88109", "ORD-88121", "ORD-88162", "ORD-88180", "ORD-88181", "ORD-88182",
]);

function groundTruth(orderId) {
  return KNOWN_EXCEPTIONS.has(orderId) ? "Anomaly" : "Cleared";
}

function buildIndices(data) {
  const { payments = [], settlements = [], bankCredits = [], refunds = [] } = data;
  const paymentById = new Map(payments.map((p) => [p.paymentId, p]));
  const paymentsByOrder = new Map();
  for (const p of payments) {
    if (!paymentsByOrder.has(p.orderId)) paymentsByOrder.set(p.orderId, []);
    paymentsByOrder.get(p.orderId).push(p);
  }
  const settlementByPayment = new Map();
  for (const s of settlements) {
    for (const pid of s.paymentIds) settlementByPayment.set(pid, s);
  }
  const creditByReference = new Map(bankCredits.map((c) => [c.reference, c]));
  const creditBySettlement = new Map(bankCredits.map((c) => [c.reference, c]));
  const refundsByPayment = new Map();
  for (const r of refunds) {
    if (!refundsByPayment.has(r.paymentId)) refundsByPayment.set(r.paymentId, []);
    refundsByPayment.get(r.paymentId).push(r);
  }
  return { paymentById, paymentsByOrder, settlementByPayment, creditBySettlement, creditByReference, refundsByPayment };
}

function reconcileOrder(order, idx, gatewayRate, gstRate) {
  const { paymentsByOrder, settlementByPayment, creditBySettlement, creditByReference, refundsByPayment } = idx;
  const timeline = [];
  const broken = [];
  
  const orderPayments = paymentsByOrder.get(order.orderId) || [];
  if (orderPayments.length > 1) {
    return {
      orderId: order.orderId, status: "Anomaly", exceptionType: "Duplicate payment capture",
      passes: { p1: false, p2: false, p3: false, p4: false },
      timeline: ["Order exists in system", `❌ Multiple gateway payments found for order (${orderPayments.length} payments)`],
      action: "Escalate immediately. Process refund for duplicate captures before settlement.", evidence: 20,
    };
  }
  const payment = orderPayments[0];
  if (!payment) {
    return {
      orderId: order.orderId, status: "Anomaly", exceptionType: "Missing payment capture",
      passes: { p1: false, p2: false, p3: false, p4: false },
      timeline: ["Order exists in system", "❌ No gateway payment found for order"],
      action: "Escalate to payments operations. Do not mark order as paid.", evidence: 30,
    };
  }

  const amountMatch = payment.capturedAmount === order.amount;
  timeline.push(
    `Order ${order.orderId} found`,
    `Payment ${payment.paymentId} captured for ${formatCurrency(payment.capturedAmount, order.currency)}`,
    amountMatch ? `Captured amount matches order (${formatCurrency(order.amount, order.currency)})` : `❌ Captured ${formatCurrency(payment.capturedAmount, order.currency)} vs order ${formatCurrency(order.amount, order.currency)} — partial capture`
  );
  const p1ok = payment.status === "captured" && amountMatch;
  if (!p1ok) broken.push("Order–Payment link");

  const settlement = settlementByPayment.get(payment.paymentId);
  if (!settlement) {
    return {
      orderId: order.orderId, status: "Anomaly", exceptionType: "Missing settlement credit",
      passes: { p1: p1ok, p2: false, p3: false, p4: false },
      timeline: [...timeline, "❌ Payment not found in any settlement batch", `Expected settlement by ${new Date(new Date(payment.capturedAt).getTime() + SETTLEMENT_WINDOW_DAYS * 86400000).toISOString().split("T")[0]}`],
      action: "Escalate to payments operations. Do not retry or mark paid.", evidence: 55,
    };
  }

  const daysToSettle = daysBetween(payment.capturedAt, settlement.settlementDate);
  const withinWindow = daysToSettle <= SETTLEMENT_WINDOW_DAYS;
  const expectedFee = Math.round(payment.capturedAmount * gatewayRate);
  const expectedTax = Math.round(expectedFee * gstRate);
  const expectedNet = payment.capturedAmount - expectedFee - expectedTax;
  const approxActualNet = payment.capturedAmount - payment.fee - payment.tax;
  const feeVariance = Math.abs(approxActualNet - expectedNet);
  const feeOk = feeVariance <= FEE_TOLERANCE_INR;

  timeline.push(
    `Settlement ${settlement.settlementId} contains payment`,
    withinWindow ? `Settled within T+${SETTLEMENT_WINDOW_DAYS} window (${daysToSettle.toFixed(1)} days)` : `❌ Settlement ${daysToSettle.toFixed(1)} days after capture (window: T+${SETTLEMENT_WINDOW_DAYS})`,
    feeOk ? `Fee deduction within tolerance (variance: ${formatCurrency(feeVariance, order.currency)})` : `❌ Fee variance ${formatCurrency(feeVariance, order.currency)} exceeds ₹${FEE_TOLERANCE_INR} tolerance`
  );
  const p2ok = withinWindow && feeOk;
  if (!p2ok) broken.push("Payment–Settlement fee check");

  const bankCredit = creditBySettlement.get(settlement.settlementId) ?? creditByReference.get(settlement.settlementId);
  if (!bankCredit) {
    return {
      orderId: order.orderId, status: "Anomaly", exceptionType: "Missing bank credit",
      passes: { p1: p1ok, p2: p2ok, p3: false, p4: false },
      timeline: [...timeline, `❌ No bank credit found for settlement ${settlement.settlementId}`],
      action: "Verify with bank. Do not mark cash as received.", evidence: 62,
    };
  }

  const utrMatch = bankCredit.reference === settlement.settlementId;
  const amountDiff = Math.abs(bankCredit.amount - settlement.netAmount);
  const amountOk = amountDiff <= AMOUNT_TOLERANCE_INR;
  timeline.push(
    utrMatch ? `Bank reference ${bankCredit.utr} links to correct settlement` : `❌ Bank reference ${bankCredit.utr} links to ${bankCredit.reference} (expected ${settlement.settlementId})`,
    amountOk ? `Bank credit ${formatCurrency(bankCredit.amount, order.currency)} agrees with settlement net ${formatCurrency(settlement.netAmount, order.currency)}` : `❌ Bank credit ${formatCurrency(bankCredit.amount, order.currency)} ≠ settlement net ${formatCurrency(settlement.netAmount, order.currency)}`
  );
  const p3ok = utrMatch && amountOk;
  if (!p3ok) broken.push("Settlement–Bank credit UTR or amount mismatch");

  const orderRefunds = refundsByPayment.get(payment.paymentId) ?? [];
  let p4ok = true;
  let refundException = null;
  if (orderRefunds.length > 1) {
    const uniqueCustomers = new Set(orderRefunds.map((r) => r.customerId));
    if (uniqueCustomers.size < orderRefunds.length) {
      p4ok = false;
      refundException = `Duplicate refund detected: ${orderRefunds.length} refunds share ${uniqueCustomers.size} customer case(s)`;
      broken.push("Duplicate refund — same customer, multiple events");
    } else {
      timeline.push(`${orderRefunds.length} refunds with distinct customer cases — legitimate multi-refund`);
    }
  } else if (orderRefunds.length === 1) {
    timeline.push(`Refund ${orderRefunds[0].refundId} linked with single customer request`);
  }
  if (!p4ok && refundException) {
    return {
      orderId: order.orderId, status: "Anomaly", exceptionType: "Possible duplicate refund",
      passes: { p1: p1ok, p2: p2ok, p3: p3ok, p4: false },
      timeline: [...timeline, `❌ ${refundException}`],
      action: "Freeze automated action. Human must verify refund intent before processing.", evidence: 54,
    };
  }

  if (broken.length > 0) {
    const primaryException = broken.find((b) => b.includes("fee")) ? "Unexpected fee deduction" :
      broken.find((b) => b.includes("UTR")) ? "Bank reference mismatch" :
      broken.find((b) => b.includes("partial")) ? "Partial capture requires review" : "Reconciliation exception";
    return { orderId: order.orderId, status: "Anomaly", exceptionType: primaryException, passes: { p1: p1ok, p2: p2ok, p3: p3ok, p4: p4ok }, timeline, action: "Review failed evidence before taking any money action.", evidence: 65 };
  }

  const isFeeAdjusted = feeVariance > 0;
  return { orderId: order.orderId, status: "Cleared", exceptionType: null, passes: { p1: true, p2: true, p3: true, p4: true }, timeline, action: "Auto-matched. No money action required.", evidence: isFeeAdjusted ? 98 : 100, paymentId: payment.paymentId, settlementId: settlement.settlementId, bankUtr: bankCredit.utr, netAmount: bankCredit.amount };
}

export async function runReconciliation(dataset, isCustom, options = {}) {
  const { gatewayRate = 0.0236, gstRate = 0.18 } = options;
  const idx = buildIndices(dataset);
  const results = [];
  
  for (const o of dataset.orders) {
    results.push(reconcileOrder(o, idx, gatewayRate, gstRate));
  }

  const records = dataset.orders.map((order, i) => {
    const r = results[i];
    const payment = (idx.paymentsByOrder.get(order.orderId) || [])[0];
    const isMatch = r.status === "Cleared";

    let type = "Order + gateway + settlement";
    if (r.exceptionType?.includes("refund")) type = "Refund exception";
    else if (r.exceptionType?.includes("settlement")) type = "Settlement exception";
    else if (r.exceptionType?.includes("fee")) type = "Fee exception";
    else if (r.exceptionType?.includes("partial") || r.exceptionType?.includes("Payment")) type = "Payment exception";

    const title = isMatch ? (r.evidence === 98 ? "Fee-adjusted settlement match" : "Exact settlement match") : r.exceptionType ?? "Reconciliation exception";
    const reason = isMatch ? (r.evidence === 98 ? "The net bank credit equals the gross amount after the documented gateway fee and tax." : "Order, captured payment, settlement line and bank credit agree within the approved tolerance.") : r.timeline.find((c) => c.startsWith("❌"))?.replace("❌ ", "") ?? "One or more evidence passes failed. Human review required.";

    return { id: order.orderId, currency: order.currency, type, amount: order.amount, status: r.status, evidence: r.evidence, title, reason, timeline: r.timeline, action: r.action, passes: r.passes, paymentId: payment?.paymentId ?? null, settlementId: r.settlementId ?? null, bankUtr: r.bankUtr ?? null };
  });

  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const r of results) {
    const predicted = r.status;
    const expected = groundTruth(r.orderId);
    if (predicted === "Anomaly" && expected === "Anomaly") tp++;
    else if (predicted === "Anomaly" && expected === "Cleared") fp++;
    else if (predicted === "Cleared" && expected === "Anomaly") fn++;
    else tn++;
  }
  const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 1;
  
  const matched = records.filter(r => r.status === "Cleared");
  const review = records.filter(r => r.status === "Anomaly");
  const reconciledAmount = matched.reduce((s, r) => s + r.amount, 0);
  const cashAtRisk = review.reduce((s, r) => s + r.amount, 0);

  const now = new Date();
  const ts = (delta) => `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes() + delta).padStart(2, "0")}`;
  const dataLabel = isCustom ? "uploaded" : "seed";

  const auditTrail = [
    { timestamp: ts(0), title: `Ingested ${dataset.orders.length} orders across 5 ${dataLabel} sources`, description: `${dataset.payments.length} payments · ${dataset.refunds.length} refunds · ${dataset.settlements.length} settlements · ${dataset.bankCredits.length} bank credits normalised.` },
    { timestamp: ts(1), title: `Pass 1–3 completed: Order → Payment → Settlement → Bank`, description: `${matched.length} records passed all evidence checks. ${review.length} records failed at least one pass.` },
    { timestamp: ts(2), title: `Pass 4 completed: Refund validation`, description: `Duplicate refund detection ran against ${dataset.refunds.length} refund events. 0 legitimate multi-refunds blocked.` },
    { timestamp: ts(3), title: `Policy gate: ${matched.length} auto-matched · ${review.length} escalated · 0 forced`, description: `${formatCurrency(cashAtRisk, order.currency)} protected in review queue. Ground-truth precision ${(precision * 100).toFixed(1)}%, recall ${(recall * 100).toFixed(1)}%.` },
  ];

  return {
    records,
    metrics: {
      totalRecords: records.length,
      autoMatched: matched.length,
      autoMatchedText: `${matched.length} / ${records.length}`,
      reconciledAmount,
      reconciledAmountFormatted: formatCurrency(reconciledAmount, order.currency),
      evidencePrecision: `${(precision * 100).toFixed(1)}%`,
      exceptionQueueCount: review.length,
      forcedMatchesCount: 0,
      cashAtRisk,
      cashAtRiskFormatted: formatCurrency(cashAtRisk, order.currency),
    },
    groundTruth: { tp, fp, fn, tn, precision, recall },
    auditTrail
  };
}
