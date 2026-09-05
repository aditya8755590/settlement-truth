export function formatCurrency(value, currencyCode = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

const SETTLEMENT_WINDOW_DAYS = 3;
const FEE_TOLERANCE_INR = 25;
const AMOUNT_TOLERANCE_INR = 1;

// Documented capture-to-settlement fee policy. The reconciliation rate is
// configurable (UI → Rules); this is the default when none is supplied.
const GATEWAY_RATE = 0.02;
const GST_ON_FEE = 0.18;

function amountTolerance(currency) {
  return currency === "USD" ? 0.05 : AMOUNT_TOLERANCE_INR;
}

function feeTolerance(currency, expectedFee) {
  if (currency === "USD") return Math.max(0.5, expectedFee * 0.05);
  return FEE_TOLERANCE_INR;
}

function buildIndices(data) {
  const { payments = [], settlements = [], bankCredits = [], refunds = [] } = data;
  const paymentById = new Map(payments.map((p) => [p.paymentId, p]));

  const paymentsByOrder = new Map();
  for (const p of payments) {
    if (!paymentsByOrder.has(p.orderId)) paymentsByOrder.set(p.orderId, []);
    paymentsByOrder.get(p.orderId).push(p);
  }

  // settlement → payment linking, two independent routes:
  //  • gateway_ref (preferred, modern export format)
  //  • paymentIds (legacy/derived format)
  const settlementByPayment = new Map();
  const settlementsByGateway = new Map();
  const linkedSettlementIds = new Set();
  for (const s of settlements) {
    const ids = Array.isArray(s.paymentIds) ? s.paymentIds.filter(Boolean) : [];
    for (const pid of ids) {
      if (!settlementByPayment.has(pid)) settlementByPayment.set(pid, s);
      if (paymentById.has(pid)) linkedSettlementIds.add(s.settlementId);
    }
    if (s.gatewayRef) {
      if (!settlementsByGateway.has(s.gatewayRef)) settlementsByGateway.set(s.gatewayRef, []);
      settlementsByGateway.get(s.gatewayRef).push(s);
      const owner = payments.find((p) => p.gatewayRef === s.gatewayRef);
      if (owner) linkedSettlementIds.add(s.settlementId);
    }
  }

  // Bank credit indexes.
  const bankByPayout = new Map();
  const creditByReference = new Map();
  const settlementById = new Map();
  for (const s of settlements) settlementById.set(s.settlementId, s);
  for (const c of bankCredits) {
    if (c.payoutRef) {
      if (!bankByPayout.has(c.payoutRef)) bankByPayout.set(c.payoutRef, []);
      bankByPayout.get(c.payoutRef).push(c);
    }
    if (c.reference) creditByReference.set(c.reference, c);
  }

  // Payout groups: one bank payout aggregates every settlement sharing its
  // payout_ref (including negative reversal lines).
  const payoutIndex = new Map();
  for (const s of settlements) {
    if (!s.payoutRef) continue;
    if (!payoutIndex.has(s.payoutRef)) payoutIndex.set(s.payoutRef, { settlements: [], netSum: 0 });
    const g = payoutIndex.get(s.payoutRef);
    g.settlements.push(s);
    g.netSum += s.netAmount || 0;
  }

  const refundsByPayment = new Map();
  for (const r of refunds) {
    if (!r.paymentId) continue;
    if (!refundsByPayment.has(r.paymentId)) refundsByPayment.set(r.paymentId, []);
    refundsByPayment.get(r.paymentId).push(r);
  }

  return { paymentById, paymentsByOrder, settlementByPayment, settlementsByGateway, settlementById, linkedSettlementIds, bankByPayout, creditByReference, payoutIndex, refundsByPayment };
}

// ─── Reversal consumption (refund lifecycle) ─────────────────────────────────
// A refund is legitimate only when the money actually flowed back: a negative
// settlement line backed by a negative bank credit. Such reversals are
// consumed here so they are never reported as leakage.
function consumeRefundReversals(refunds, idx) {
  const consumedSettlements = new Set();
  const consumedCredits = new Set();
  if (!refunds.length) return { consumedSettlements, consumedCredits };

  for (const r of refunds) {
    const amt = r.refundAmount || 0;
    if (amt <= 0) continue;
    const currency = r.currency || "USD";
    const tol = amountTolerance(currency);
    for (const settlement of Array.from(idx.payoutIndex.values()).flatMap((g) => g.settlements)) {
      if (consumedSettlements.has(settlement.settlementId)) continue;
      if (!(settlement.grossAmount < 0)) continue;
      if (Math.abs(-settlement.grossAmount - amt) > tol) continue;
      const credits = idx.bankByPayout.get(settlement.payoutRef) || [];
      const credit = credits.find((c) => c.amount < 0 && Math.abs(c.amount - (settlement.netAmount || 0)) <= tol);
      if (credit) {
        consumedSettlements.add(settlement.settlementId);
        consumedCredits.add(credit.bankTxId || `${settlement.payoutRef}:${credit.amount}`);
      }
    }
  }
  return { consumedSettlements, consumedCredits };
}

function renderException(order, currency, payment, settlement, credit, verdict) {
  const risk = verdict.risk ?? 0;
  const tl = verdict.timeline || [];
  const passes = verdict.passes;
  let type = "Reconciliation exception";
  if (verdict.kind === "missing-payment") type = "Payment exception";
  else if (verdict.kind === "duplicate-payment" || verdict.kind === "over-capture") type = "Payment exception";
  else if (verdict.kind === "partial-capture") type = "Payment exception";
  else if (verdict.kind === "fee-creep") type = "Fee exception";
  else if (verdict.kind === "no-settlement") type = "Settlement exception";
  else if (verdict.kind === "refund-error") type = "Refund exception";
  return {
    status: "Anomaly",
    exceptionType: verdict.title,
    type,
    title: verdict.title,
    amount: risk,
    reason: verdict.reason || tl.filter((c) => c.startsWith("❌")).join(" "),
    action: verdict.action || "Review failed evidence before taking any money action.",
    passes,
    evidence: verdict.evidence ?? (passes ? [passes.p1, passes.p2, passes.p3, passes.p4].filter(Boolean).length * 25 : 0),
    paymentId: payment ? payment.paymentId : null,
    settlementId: settlement ? settlement.settlementId : null,
    bankUtr: credit ? (credit.payoutRef || credit.reference || credit.utr || null) : null,
    netAmount: credit ? credit.amount : null,
    timeline: tl,
  };
}

function analyzeOrder(order, idx, gatewayRate, modernSchema) {
  const currency = order.currency || "USD";
  const amtTol = amountTolerance(currency);
  const timeline = [];

  const orderPayments = idx.paymentsByOrder.get(order.orderId) || [];
  const totalCaptured = orderPayments.reduce((sum, p) => sum + (p.capturedAmount || 0), 0);
  const amountDiff = totalCaptured - order.amount;

  timeline.push(`Order ${order.orderId} found — ${formatCurrency(order.amount, currency)} ${order.currency}`);

  // ── P1: Order ↔ Payment ───────────────────────────────────────────────────
  if (orderPayments.length === 0) {
    return renderException(order, currency, null, null, null, {
      kind: "missing-payment",
      title: "Missing payment capture",
      risk: order.amount,
      reason: `Order ${order.orderId} (${formatCurrency(order.amount, currency)}) has no captured payment.`,
      action: "Escalate to payments operations. Do not mark the order as paid.",
      passes: { p1: false, p2: false, p3: false, p4: false },
      timeline: [...timeline, "❌ No gateway payment found for the order"],
    });
  }

  if (orderPayments.length > 1 && Math.abs(amountDiff) > amtTol) {
    const payLines = orderPayments.map((p) => `${p.paymentId} ${formatCurrency(p.capturedAmount, currency)}`).join(" + ");
    return renderException(order, currency, orderPayments[0], null, null, {
      kind: "duplicate-payment",
      title: "Duplicate payment capture",
      risk: Math.abs(amountDiff),
      reason: `${orderPayments.length} full captures for one order: ${payLines} = ${formatCurrency(totalCaptured, currency)} vs order ${formatCurrency(order.amount, currency)}. Excess at risk: ${formatCurrency(Math.abs(amountDiff), currency)}.`,
      action: "Escalate immediately. Process a refund for the duplicate capture before settlement.",
      passes: { p1: false, p2: false, p3: false, p4: false },
      timeline: [...timeline, `❌ ${orderPayments.length} payments captured for a single order (${payLines})`],
    });
  }

  const payment = orderPayments[0];
  const paymentCaptured = String(payment.status || "").toLowerCase() === "captured";
  const p1ok = Math.abs(amountDiff) <= amtTol && paymentCaptured;

  if (!p1ok) {
    if (amountDiff < -amtTol) {
      const shortfall = order.amount - totalCaptured;
      return renderException(order, currency, payment, null, null, {
        kind: "partial-capture",
        title: "Partial capture — payment below order amount",
        risk: shortfall,
        reason: `Order ${order.orderId} is worth ${formatCurrency(order.amount, currency)} but only ${formatCurrency(totalCaptured, currency)} was captured (${payment.paymentId}). ${formatCurrency(shortfall, currency)} never captured.`,
        action: "Verify capture records with the gateway before fulfilling or refunding.",
        passes: { p1: false, p2: false, p3: false, p4: false },
        timeline: [...timeline, `Payment ${payment.paymentId} captured ${formatCurrency(payment.capturedAmount, currency)}`, `❌ Captured ${formatCurrency(totalCaptured, currency)} vs order ${formatCurrency(order.amount, currency)} — partial capture (${formatCurrency(shortfall, currency)} short)`],
      });
    }
    return renderException(order, currency, payment, null, null, {
      kind: "partial-capture",
      title: "Over capture — payment above order amount",
      risk: amountDiff,
      reason: `Captured ${formatCurrency(totalCaptured, currency)} for an order worth ${formatCurrency(order.amount, currency)}. ${formatCurrency(amountDiff, currency)} excess captured.`,
      action: "Verify capture records; a refund of the excess must be initiated.",
      passes: { p1: false, p2: false, p3: false, p4: false },
      timeline: [...timeline, `Payment ${payment.paymentId} captured ${formatCurrency(payment.capturedAmount, currency)}`, `❌ Captured ${formatCurrency(totalCaptured, currency)} exceeds order amount ${formatCurrency(order.amount, currency)}`],
    });
  }

  timeline.push(`Payment ${payment.paymentId} captured ${formatCurrency(payment.capturedAmount, currency)} — matches order amount`);

  // ── P2: Settlement + fee ──────────────────────────────────────────────────
  const settlements = [];
  if (payment.gatewayRef) settlements.push(...(idx.settlementsByGateway.get(payment.gatewayRef) || []));
  if (settlements.length === 0 && idx.settlementByPayment.has(payment.paymentId)) settlements.push(idx.settlementByPayment.get(payment.paymentId));

  if (settlements.length === 0) {
    return renderException(order, currency, payment, null, null, {
      kind: "no-settlement",
      title: "Settlement missing for captured payment",
      risk: payment.capturedAmount,
      reason: `Payment ${payment.paymentId} captured ${formatCurrency(payment.capturedAmount, currency)} but no settlement credit references gateway ${payment.gatewayRef || payment.paymentId}.`,
      action: "Escalate to payments operations. Do not mark the funds as received.",
      passes: { p1: true, p2: false, p3: false, p4: false },
      timeline: [...timeline, `Expected settlement within T+${SETTLEMENT_WINDOW_DAYS} days`, "❌ No settlement credit found for the captured payment"],
    });
  }

  const primarySettlement = settlements[0];
  timeline.push(`Settlement ${primarySettlement.settlementId} found for gateway ${primarySettlement.gatewayRef || "-"} (net ${formatCurrency(primarySettlement.netAmount || 0, currency)})`);

  let p2ok = true;
  let feeException = null;
  for (const s of settlements) {
    if (s.grossAmount != null && s.feeAmount != null) {
      const expectedFee = s.grossAmount * gatewayRate;
      const diff = s.feeAmount - expectedFee;
      if (Math.abs(diff) > feeTolerance(currency, expectedFee)) {
        p2ok = false;
        feeException = {
          settlement: s,
          expectedFee,
          actualFee: s.feeAmount,
          excess: s.feeAmount - expectedFee,
          gross: s.grossAmount,
        };
        break;
      }
    }
  }
  if (feeException) {
    return renderException(order, currency, payment, feeException.settlement, null, {
      kind: "fee-creep",
      title: "Unexpected fee deduction (fee creep)",
      risk: feeException.excess,
      reason: `Settlement ${feeException.settlement.settlementId}: gross ${formatCurrency(feeException.gross, currency)} was charged gateway fee ${formatCurrency(feeException.actualFee, currency)}. Expected fee at ${(gatewayRate * 100).toFixed(2)}% is ${formatCurrency(feeException.expectedFee, currency)}. Excess at risk: ${formatCurrency(feeException.excess, currency)}.`,
      action: "Challenge the additional deduction with the gateway before recording the settlement as received.",
      passes: { p1: true, p2: false, p3: false, p4: false },
      timeline: [...timeline, `Settlement ${feeException.settlement.settlementId}: gross ${formatCurrency(feeException.gross, currency)}`, `❌ Fee charged ${formatCurrency(feeException.actualFee, currency)} vs expected ${formatCurrency(feeException.expectedFee, currency)} (${formatCurrency(feeException.excess, currency)} excess)`],
    });
  }
  timeline.push("Gateway fee within policy tolerance");

  // ── P3: Bank credit (aggregated by payout reference) ──────────────────────
  const payoutRefs = new Set(settlements.filter((s) => s.payoutRef).map((s) => s.payoutRef));
  let bankException = null;
  let bankCredit = null;
  if (payoutRefs.size > 0) {
    for (const ref of payoutRefs) {
      const group = idx.payoutIndex.get(ref);
      const credits = idx.bankByPayout.get(ref) || [];
      const netTotal = group ? group.netSum : 0;
      if (credits.length === 0) {
        bankException = { kind: "missing-bank", ref, netTotal };
        break;
      }
      const bankTotal = credits.reduce((sum, c) => sum + (c.amount || 0), 0);
      if (Math.abs(bankTotal - netTotal) > amountTolerance(currency)) {
        bankException = { kind: "amount-mismatch", ref, bankTotal, netTotal };
        break;
      }
      bankCredit = credits[0];
    }
  } else if (primarySettlement) {
    // Legacy schema: bank credit references the settlement directly.
    const credit = idx.creditByReference.get(primarySettlement.settlementId);
    if (!credit) {
      bankException = { kind: "missing-bank", ref: primarySettlement.settlementId, netTotal: primarySettlement.netAmount || 0 };
    } else {
      bankCredit = credit;
      const net = primarySettlement.netAmount || 0;
      if (Math.abs((credit.amount || 0) - net) > amountTolerance(currency)) {
        bankException = { kind: "amount-mismatch", ref: primarySettlement.settlementId, bankTotal: credit.amount, netTotal: net };
      }
    }
  }
  if (bankException) {
    const msg = bankException.kind === "missing-bank"
      ? `❌ No bank credit found for payout ${bankException.ref} (combined settlement net ${formatCurrency(bankException.netTotal, currency)})`
      : `❌ Bank payout ${bankException.ref} credit ${formatCurrency(bankException.bankTotal, currency)} ≠ combined settlement net ${formatCurrency(bankException.netTotal, currency)}`;
    return renderException(order, currency, payment, primarySettlement, bankCredit, {
      kind: "bank-mismatch",
      title: bankException.kind === "missing-bank" ? "Bank payout missing for settlement" : "Bank payout amount mismatch",
      risk: bankException.kind === "missing-bank" ? bankException.netTotal : Math.abs(bankException.bankTotal - bankException.netTotal),
      reason: bankException.kind === "missing-bank"
        ? `Settlements for payout ${bankException.ref} total ${formatCurrency(bankException.netTotal, currency)} but no bank credit exists for that payout.`
        : `Combined settlements for payout ${bankException.ref} net ${formatCurrency(bankException.netTotal, currency)} but bank credited ${formatCurrency(bankException.bankTotal, currency)}.`,
      action: "Verify with the bank. Do not report cash as received.",
      passes: { p1: true, p2: true, p3: false, p4: false },
      timeline: [...timeline, msg],
    });
  }
  if (bankCredit) timeline.push(`Bank payout ${bankCredit.payoutRef || "-"} credit ${formatCurrency(bankCredit.amount || 0, currency)} confirms combined settlement net`);

  // ── P4: Refund validation ─────────────────────────────────────────────────
  const orderRefunds = idx.refundsByPayment.get(payment.paymentId) || [];
  let p4ok = true;
  let refundException = null;
  if (orderRefunds.length > 1) {
    p4ok = false;
    refundException = "duplicate-refund";
  } else if (orderRefunds.length === 1) {
    const r = orderRefunds[0];
    const refundAmt = r.refundAmount || 0;
    const reversalExists = Array.from(idx.payoutIndex.values())
      .flatMap((g) => g.settlements)
      .some((s) => {
        if (!(s.grossAmount < 0)) return false;
        if (Math.abs(-s.grossAmount - refundAmt) > amountTolerance(currency)) return false;
        const credits = idx.bankByPayout.get(s.payoutRef) || [];
        return credits.some((c) => c.amount < 0 && Math.abs(c.amount - (s.netAmount || 0)) <= amountTolerance(currency));
      });
    if (modernSchema && !reversalExists) {
      p4ok = false;
      refundException = "refund-without-reversal";
    } else {
      p4ok = true;
      timeline.push(modernSchema
        ? `Refund ${r.refundId} supported by negative settlement and bank reversal — valid lifecycle`
        : `Refund ${r.refundId} attached to payment — lifecycle accepted`);
    }
  }

  if (refundException) {
    return renderException(order, currency, payment, primarySettlement, bankCredit, {
      kind: "refund-error",
      title: refundException === "duplicate-refund" ? "Possible duplicate refund" : "Refund without bank reversal",
      risk: refundException === "duplicate-refund" ? orderRefunds[0].refundAmount || 0 : orderRefunds[0].refundAmount || 0,
      reason: refundException === "duplicate-refund"
        ? `More than one refund event is linked to payment ${payment.paymentId}.`
        : `Payment ${payment.paymentId} has a refund but no negative settlement / bank reversal proves the money flowed back.`,
      action: "Verify refund intent with the customer and bank before processing.",
      passes: { p1: true, p2: true, p3: true, p4: false },
      timeline: [...timeline, "❌ Refund lifecycle not confirmed by bank reversal"],
    });
  }

  timeline.push(
    orderRefunds.length === 0
      ? "No refund attached — full money trail verified"
      : "Refund lifecycle verified end-to-end"
  );

  return {
    orderId: order.orderId,
    status: "Cleared",
    exceptionType: null,
    kind: "matched",
    title: "Exact settlement match",
    amount: order.amount,
    reason: "Order, captured payment, settlement line and aggregated bank payout agree within the approved tolerance.",
    action: "Auto-matched. No money action required.",
    passes: { p1: p1ok, p2: p2ok, p3: true, p4: p4ok },
    evidence: 100,
    paymentId: payment.paymentId,
    settlementId: primarySettlement.settlementId,
    bankUtr: bankCredit ? (bankCredit.payoutRef || bankCredit.reference || bankCredit.utr || null) : null,
    netAmount: bankCredit ? bankCredit.amount : null,
    timeline,
  };
}

function orphanSettlementRecord(s, idx, gatewayRate) {
  const currency = s.currency || "USD";
  const net = s.netAmount || 0;
  const credits = idx.bankByPayout.get(s.payoutRef) || [];
  const bankTotal = credits.reduce((sum, c) => sum + (c.amount || 0), 0);
  const bankOk = Math.abs(bankTotal - net) <= amountTolerance(currency);
  return {
    id: s.settlementId,
    orderId: null,
    type: "Settlement exception",
    title: "Orphan settlement with bank credit",
    amount: bankOk ? Math.abs(net) : Math.abs(bankTotal - net),
    currency,
    status: "Anomaly",
    reason: `Settlement ${s.settlementId} references gateway ${s.gatewayRef || "-"} which matches no order or payment. Bank payout ${s.payoutRef || "-"} credited ${formatCurrency(bankTotal, currency)} (settlement net ${formatCurrency(net, currency)}).`,
    action: "Identify the true merchant order or hold the funds in suspense.",
    passes: { p1: false, p2: false, p3: bankOk, p4: false },
    evidence: bankOk ? 25 : 0,
    paymentId: null,
    settlementId: s.settlementId,
    bankUtr: s.payoutRef || null,
    netAmount: bankTotal,
    timeline: [
      `Settlement ${s.settlementId} exists (gross ${formatCurrency(s.grossAmount || 0, currency)}, net ${formatCurrency(net, currency)})`,
      `❌ No order or payment references gateway ${s.gatewayRef || "-"}`,
      bankOk
        ? `⚠ Bank payout ${s.payoutRef || "-"} received ${formatCurrency(bankTotal, currency)} — money moved but recipient unknown`
        : `❌ Bank payout ${s.payoutRef || "-"} credit ${formatCurrency(bankTotal, currency)} does not match net ${formatCurrency(net, currency)}`,
    ],
  };
}

function orphanBankRecord(c, idx) {
  const currency = c.currency || "USD";
  return {
    id: c.bankTxId || `BTX-${Math.abs(c.amount || 0)}`,
    orderId: null,
    type: "Bank exception",
    title: "Orphan bank credit — unexplained credit",
    amount: Math.abs(c.amount || 0),
    currency,
    status: "Anomaly",
    reason: `Bank credit ${formatCurrency(Math.abs(c.amount || 0), currency)} has no payout reference and matches no settlement/payout. Label: ${c.description || "none"}.`,
    action: "Contact the bank to identify the source. Never assign to the nearest order.",
    passes: { p1: false, p2: false, p3: false, p4: false },
    evidence: 0,
    paymentId: null,
    settlementId: null,
    bankUtr: null,
    netAmount: Math.abs(c.amount || 0),
    timeline: [
      `Bank credit ${formatCurrency(Math.abs(c.amount || 0), currency)} received`,
      `❌ No payout reference links it to a settlement`,
      `❌ No settlement references this payout — unexplained credit`,
    ],
  };
}

export async function runReconciliation(dataset, isCustom, options = {}) {
  const { gatewayRate = GATEWAY_RATE, gstRate = GST_ON_FEE } = options;
  const currency = dataset.orders[0]?.currency || "USD";
  const idx = buildIndices(dataset);

  // Modern exports carry settlement fee/payout detail (gross, fee, payout_ref)
  // which is required to prove refund reversals end-to-end. Legacy exports
  // without those columns use the lighter refund lifecycle check.
  const modernSchema = dataset.settlements.some(
    (s) => s.grossAmount != null || s.feeAmount != null || s.payoutRef
  );

  const { consumedSettlements, consumedCredits } = consumeRefundReversals(dataset.refunds || [], idx);

  const results = [];
  for (const o of dataset.orders) {
    results.push(analyzeOrder(o, idx, gatewayRate, modernSchema));
  }

  const records = dataset.orders.map((order, i) => {
    const r = results[i];
    return {
      id: order.orderId,
      orderId: order.orderId,
      merchantId: order.merchantId || "MID-UPLOAD",
      customerId: order.customerId || null,
      currency: order.currency || currency,
      status: r.status,
      type: r.kind === "matched" ? "Order + gateway + settlement" : r.type,
      title: r.title,
      amount: r.kind === "matched" ? order.amount : r.amount,
      reason: r.reason,
      action: r.action,
      passes: r.passes,
      evidence: r.evidence,
      paymentId: r.paymentId,
      settlementId: r.settlementId,
      bankUtr: r.bankUtr,
      netAmount: r.netAmount,
      timeline: r.timeline,
      dates: {
        order: order.createdAt || null,
        payment: dataset.payments.find((p) => p.paymentId === r.paymentId)?.capturedAt || null,
        settlement: dataset.settlements.find((s) => s.settlementId === r.settlementId)?.settlementDate || null,
        bank: null,
      },
      submitted: false,
      groundTruth: null,
      productCategory: null,
      isRefund: (dataset.refunds || []).some((rf) => rf.paymentId === r.paymentId),
    };
  });

  // Orphan settlements: settlement lines with no order/payment (excluding
  // consumed refund reversals). Never hide the money — show it for review.
  const orphanSettlements = dataset.settlements.filter(
    (s) => !idx.linkedSettlementIds.has(s.settlementId) && !consumedSettlements.has(s.settlementId)
  );
  const orphanSettlementRecords = orphanSettlements.map((s) => orphanSettlementRecord(s, idx, gatewayRate));

  // Orphan bank credits: credits whose payout reference matches no settlement
  // (or has no payout reference at all). Include negative reversals only if not
  // consumed.
  const orphanBankCredits = dataset.bankCredits.filter((c) => {
    if (consumedCredits.has(c.bankTxId || `${c.payoutRef}:${c.amount}`)) return false;
    if (c.payoutRef) return !idx.payoutIndex.has(c.payoutRef);
    if (c.reference && idx.settlementById.has(c.reference)) return false;
    return true;
  });
  const orphanBankRecords = orphanBankCredits.map((c) => orphanBankRecord(c, idx));

  const allRecords = [...records, ...orphanSettlementRecords, ...orphanBankRecords];
  const matched = records.filter((r) => r.status === "Cleared");
  const review = allRecords.filter((r) => r.status === "Anomaly");
  const reconciledAmount = matched.reduce((sum, r) => sum + (r.amount || 0), 0);
  const cashAtRisk = review.reduce((sum, r) => sum + (r.amount || 0), 0);

  const now = new Date();
  const ts = (delta) => `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes() + delta).padStart(2, "0")}`;

  const auditTrail = [
    { timestamp: ts(0), title: `Ingested ${dataset.orders.length} orders across 5 sources`, description: `${dataset.payments.length} payments · ${dataset.refunds.length} refunds · ${dataset.settlements.length} settlements · ${dataset.bankCredits.length} bank credits normalised.` },
    { timestamp: ts(1), title: `Pass 1–3 completed: Order → Payment → Settlement → Bank`, description: `${matched.length} orders passed all evidence checks. ${review.length} records flagged (${orphanSettlementRecords.length} orphan settlements, ${orphanBankRecords.length} unexplained bank credits).` },
    { timestamp: ts(2), title: `Pass 4 completed: Refund validation`, description: `${dataset.refunds.length} refund event(s) validated against settlement/bank reversals.` },
    { timestamp: ts(3), title: `Policy gate: ${matched.length} auto-matched · ${review.length} escalated · 0 forced`, description: `${formatCurrency(cashAtRisk, currency)} protected in review queue.` },
  ];

  // Uploaded datasets carry no ground-truth labels, so a legitimate
  // evidence-precision figure cannot be computed. Return null so the frontend
  // renders N/A instead of a misleading 0%.
  const groundTruth = null;

  return {
    records: allRecords,
    metrics: {
      totalRecords: dataset.orders.length,
      autoMatched: matched.length,
      autoMatchedText: `${matched.length} / ${dataset.orders.length}`,
      reconciledAmount,
      reconciledAmountFormatted: formatCurrency(reconciledAmount, currency),
      exceptionQueueCount: review.length,
      forcedMatchesCount: 0,
      cashAtRisk,
      cashAtRiskFormatted: formatCurrency(cashAtRisk, currency),
      evidencePrecision: null,
      currency,
    },
    groundTruth,
    auditTrail,
  };
}