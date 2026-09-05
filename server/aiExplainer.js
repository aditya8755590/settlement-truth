/**
 * Settlement Truth — Deterministic AI Explainer
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  ARCHITECTURE: TWO-LAYER SEPARATION                             ║
 * ║                                                                  ║
 * ║  Layer 1 — Deterministic Engine (engine.js)                     ║
 * ║    Finds EXACT mismatches using hash-map matching.              ║
 * ║    Computes all financial values. Assigns pass/fail.            ║
 * ║    Output: structured JSON evidence (no prose, no guessing)     ║
 * ║                                                                  ║
 * ║  Layer 2 — AI Explainer (this file)                            ║
 * ║    Receives ONLY pre-computed JSON facts.                       ║
 * ║    Calls Gemini with a strict SYSTEM PROMPT that forbids:       ║
 * ║      • Doing any math or computation                            ║
 * ║      • Guessing values not in the JSON                         ║
 * ║      • Making up context                                        ║
 * ║    AI's ONLY job: translate JSON facts into plain English       ║
 * ║    and suggest ONE safe, rule-bound next action.                ║
 * ║                                                                  ║
 * ║  If no API key → deterministic fallback (template-based)        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Gemini client (lazy init — only if API key present) ──────────────────────
let _gemini = null;

function getGeminiClient() {
  if (_gemini) return _gemini;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  _gemini = new GoogleGenerativeAI(key);
  return _gemini;
}

// ─── SYSTEM PROMPT — the guardrail ────────────────────────────────────────────
// This prompt is the "responsible AI guardrail" for fintech.
// It hard-codes what the model MAY and MAY NOT do.
const SYSTEM_PROMPT = `You are a financial operations translator. You are forbidden from performing mathematical calculations, guessing missing values, or hallucinating context. Read the provided JSON evidence. Output strictly: 1. A two-sentence plain-English summary of the exact failure. 2. One safe, actionable next step for the operations team.

RESPONSE FORMAT — return ONLY valid JSON, no markdown, no extra text:
{
  "summary": "<2-sentence plain-English summary of the exact failure>",
  "safeAction": "<one safe, actionable next step>",
  "riskLevel": "<one of: low | medium | high | critical>",
  "breakpoint": "<exact step where the chain broke: order | payment | settlement | bank_credit | refund | none>"
}`;

// ─── Build the evidence payload sent to the AI ────────────────────────────────
// This function takes the record from the engine and produces a strictly
// typed JSON object. The LLM never sees raw text — only machine-readable facts.
function buildEvidencePayload(record) {
  const passed = Object.entries(record.passes || {})
    .filter(([, v]) => v)
    .map(([k]) => k);
  const failed = Object.entries(record.passes || {})
    .filter(([, v]) => !v)
    .map(([k]) => k);

  // Detect exact breakpoint from timeline
  const failedCheck = record.timeline?.find((c) => c.startsWith("❌"))?.replace("❌ ", "") ?? null;

  return {
    orderId:       record.id,
    status:        record.status,        // "matched" | "review"
    exceptionType: record.title,         // title contains the exception type string
    evidenceScore: record.evidence,      // 0-100 confidence
    orderAmount:   record.amount,
    currency:      record.currency || "INR",
    passesPassed:  passed,               // ["p1", "p2"]
    passesFailed:  failed,               // ["p3", "p4"]
    exactFailure:  failedCheck,          // verbatim machine-generated text
    paymentId:     record.paymentId     ?? null,
    settlementId:  record.settlementId  ?? null,
    bankUtr:       record.bankUtr       ?? null,
    safeAction:    record.action,        // pre-computed safe action from engine
    type:          record.type,          // e.g. "Fee exception"
  };
}

// ─── Deterministic fallback — no LLM needed ───────────────────────────────────
// When no API key is set, we generate a precise explanation from the
// structured evidence using pure string templates. Same quality for demos.
function deterministicFallback(evidence) {
  const { status, exceptionType, exactFailure, evidenceScore,
          passesPassed, passesFailed, orderAmount, orderId, safeAction, currency = "INR" } = evidence;

  if (status === "matched") {
    return {
      summary: `Order ${orderId} passed all four evidence checks with ${evidenceScore}% confidence. ` +
               `The gateway payment, settlement batch, and bank credit all link correctly with amounts within tolerance.`,
      safeAction: safeAction || "No action required. Record is auto-matched and safe to book.",
      riskLevel: "low",
      breakpoint: "none",
      source: "deterministic",
    };
  }

  // Exception cases — map exception type to precise explanation
  const explanations = {
    "Missing payment capture": {
      summary: `Order ${orderId} (${formatCurrency(orderAmount, currency)}) has no corresponding gateway payment record. ` +
               `The order exists in the merchant system but Pass 1 found zero payment events. ` +
               `Cash has not moved — do not treat this order as paid.`,
      riskLevel: "critical",
      breakpoint: "payment",
    },
    "Missing settlement credit": {
      summary: `Order ${orderId} has a captured payment but no matching settlement batch. ` +
               `Pass 2 failed: the payment was processed by the gateway but never grouped into a settlement payout. ` +
               `The merchant has not received funds for this order.`,
      riskLevel: "high",
      breakpoint: "settlement",
    },
    "Missing bank credit": {
      summary: `Order ${orderId} has a settlement record but no corresponding bank credit. ` +
               `Pass 3 failed: the settlement was created but no matching UTR was found in the bank statement. ` +
               `Funds may still be in transit or the bank credit is mislabelled.`,
      riskLevel: "high",
      breakpoint: "bank_credit",
    },
    "Unexpected fee deduction": {
      summary: `Order ${orderId} (${formatCurrency(orderAmount, currency)}) has a fee deduction outside the approved tolerance. ` +
               `Pass 2 found the actual fee differs from the contracted gateway rate. ` +
               `${exactFailure ?? "Variance exceeds policy threshold"}.`,
      riskLevel: "medium",
      breakpoint: "settlement",
    },
    "Bank reference mismatch": {
      summary: `Order ${orderId} has a settlement record but the bank UTR links to a different settlement batch. ` +
               `Pass 3 failed: the bank credited funds under the wrong reference, making cross-matching impossible without manual verification.`,
      riskLevel: "high",
      breakpoint: "bank_credit",
    },
    "Possible duplicate refund": {
      summary: `Order ${orderId} has multiple refund events from the same customer case. ` +
               `Pass 4 detected ${passesFailed.length > 0 ? "a duplicate refund pattern" : "an anomaly"} — ` +
               `the same customer appears to have triggered more than one refund for this payment.`,
      riskLevel: "critical",
      breakpoint: "refund",
    },
    "Partial capture requires review": {
      summary: `Order ${orderId} was partially captured: the gateway collected a different amount than the order value. ` +
               `Pass 1 detected a mismatch between the order amount and the captured amount. ` +
               `${exactFailure ?? "Partial captures require manual review before settlement."}.`,
      riskLevel: "high",
      breakpoint: "payment",
    },
    "Duplicate payment capture": {
      summary: `Order ${orderId} has multiple gateway payment records linked to it. ` +
               `Pass 1 detected a duplicate capture — the customer was likely charged twice for the same order. ` +
               `This requires immediate operations intervention before settlement to prevent dispute.`,
      riskLevel: "high",
      breakpoint: "payment",
    },
  };

  // Map pass failure to layer
  const bpMap = { p1: "order", p2: "payment", p3: "settlement", p4: "refund" };
  const fallbackBp = passesFailed[0] ? (bpMap[passesFailed[0]] ?? "unknown") : "unknown";

  const found = explanations[exceptionType] ?? {
    summary: `Order ${orderId} failed ${passesFailed.length} of 4 evidence checks (${passesFailed.join(", ")}). ` +
             `${exactFailure ?? exceptionType ?? "A reconciliation anomaly was detected."}`,
    riskLevel: "medium",
    breakpoint: fallbackBp,
  };

  return {
    ...found,
    safeAction: safeAction || "Escalate to payments operations for manual verification.",
    source: "deterministic",
  };
}

function formatCurrency(v, currency) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
}

const _explanationCache = new Map();

// ─── Main explain function ────────────────────────────────────────────────────
/**
 * Given a reconciliation record from the engine, produce a structured
 * AI explanation. The deterministic engine output is NEVER modified.
 *
 * @param {object} record — the full reconciliation record from engine.getRecordById()
 * @returns {Promise<{summary, safeAction, riskLevel, breakpoint, source, evidence}>}
 */
export async function explainRecord(record) {
  // Step 1: Build the strictly typed evidence JSON from engine output
  const evidence = buildEvidencePayload(record);
  
  if (_explanationCache.has(record.id)) {
    return _explanationCache.get(record.id);
  }

  // Step 2: Try Gemini — fall back to deterministic if no key
  const gemini = getGeminiClient();

  if (!gemini) {
    // No API key — use the deterministic fallback (equally safe for demos)
    const fallback = deterministicFallback(evidence);
    return { ...fallback, evidence, source: "deterministic" };
  }

  try {
    const model = gemini.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1,          // near-zero — we want factual, not creative
        topP: 0.85,
        maxOutputTokens: 512,
        responseMimeType: "application/json",  // force JSON output
      },
      systemInstruction: SYSTEM_PROMPT,
    });

    // The user turn is ONLY the pre-computed evidence JSON.
    // The model sees no free text, no conversation history — just facts.
    const userTurn = `Here are the pre-computed reconciliation facts for this record. Explain them:\n\n${JSON.stringify(evidence, null, 2)}`;

    const result = await model.generateContent(userTurn);
    const text = result.response.text().trim();

    // Parse and validate the JSON response
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // If Gemini returned something non-JSON (shouldn't happen with responseMimeType),
      // fall back to deterministic
      return { ...deterministicFallback(evidence), evidence, source: "deterministic_fallback" };
    }

    // Validate required fields — reject if model hallucinated extra keys or missing keys
    const requiredKeys = ["summary", "safeAction", "riskLevel", "breakpoint"];
    if (!requiredKeys.every((k) => k in parsed)) {
      return { ...deterministicFallback(evidence), evidence, source: "deterministic_fallback" };
    }

    // Sanitize: ensure risk level is one of the allowed values
    const allowedRisk = ["low", "medium", "high", "critical"];
    if (!allowedRisk.includes(parsed.riskLevel)) {
      parsed.riskLevel = deterministicFallback(evidence).riskLevel;
    }

    const finalResult = {
      summary:    parsed.summary,
      safeAction: parsed.safeAction,
      riskLevel:  parsed.riskLevel,
      breakpoint: parsed.breakpoint,
      evidence,
      source: "gemini",
    };
    
    _explanationCache.set(record.id, finalResult);
    return finalResult;
  } catch (err) {
    // Network error, quota exceeded, etc. — always fall back gracefully
    console.error("[AI Explainer] Gemini error:", err.message);
    return { ...deterministicFallback(evidence), evidence, source: "deterministic_fallback" };
  }
}
