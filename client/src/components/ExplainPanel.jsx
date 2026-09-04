import React, { useState, useEffect } from "react";

const RISK_COLORS = {
  low:      { bg: "#e8f5ee", text: "#28745b", border: "#28745b30", label: "LOW RISK" },
  medium:   { bg: "#fdf8f0", text: "#c9922d", border: "#c9922d30", label: "MEDIUM RISK" },
  high:     { bg: "#fdf4f3", text: "#b44b3f", border: "#b44b3f30", label: "HIGH RISK" },
  critical: { bg: "#fdf0ef", text: "#8b1a14", border: "#8b1a1430", label: "CRITICAL" },
};

const BREAKPOINT_LABELS = {
  none:        { icon: "✓", label: "Full chain" },
  order:       { icon: "📋", label: "Order layer" },
  payment:     { icon: "💳", label: "Payment layer" },
  settlement:  { icon: "🏦", label: "Settlement layer" },
  bank_credit: { icon: "🔁", label: "Bank credit layer" },
  refund:      { icon: "↩", label: "Refund layer" },
};

function TimelineNode({ label, status, isLast }) {
  let icon = "✓";
  let className = "tl-node-ok";
  if (status === "missing") {
    icon = "✗";
    className = "tl-node-missing";
  } else if (status === "pending") {
    icon = "○";
    className = "tl-node-pending";
  }

  return (
    <div className={`tl-node ${className}`}>
      <div className="tl-icon">{icon}</div>
      <div className="tl-label">{label}</div>
      {!isLast && <div className="tl-line" />}
    </div>
  );
}

function PassBadge({ label, ok }) {
  return (
    <span className={`pass-badge ${ok ? "pass-ok" : "pass-fail"}`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

export default function ExplainPanel({ record }) {
  const [aiState, setAiState] = useState("idle"); // idle | loading | done | error
  const [aiResult, setAiResult] = useState(null);
  const [aiConfig, setAiConfig] = useState(null);
  const [showEvidence, setShowEvidence] = useState(false);

  // Fetch AI config on mount (to show which mode is active)
  useEffect(() => {
    fetch("/api/explain/config")
      .then((r) => r.json())
      .then(setAiConfig)
      .catch(() => {});
  }, []);

  // Reset AI state when record changes
  useEffect(() => {
    setAiState("idle");
    setAiResult(null);
    setShowEvidence(false);
  }, [record?.id]);

  if (!record) {
    return (
      <aside className="explain-panel" id="explainPanel">
        <p className="eyebrow">SELECT A RECORD</p>
        <h2>Every decision has receipts.</h2>
        <p className="panel-copy">
          Choose a record to inspect the evidence, policy checks and safe next
          step.
        </p>
        <div className="guardrail">
          <span>✓</span>
          <div>
            <b>Abstention is a feature</b>
            <br />
            Low-confidence items are routed to a human—not force-matched.
          </div>
        </div>
      </aside>
    );
  }

  const isMatch = record.status === "Cleared";

  const handleGenerateExplanation = async () => {
    if (aiState === "loading") return;
    setAiState("loading");
    setAiResult(null);

    try {
      const res = await fetch(`/api/explain/${record.id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Explain failed");
      setAiResult(data);
      setAiState("done");
    } catch (err) {
      setAiState("error");
    }
  };

  const risk = aiResult ? (RISK_COLORS[aiResult.riskLevel] ?? RISK_COLORS.medium) : null;
  const bp = aiResult ? (BREAKPOINT_LABELS[aiResult.breakpoint] ?? BREAKPOINT_LABELS.order) : null;

  // Derive visual timeline status
  const p = record.passes || {};
  const tOrder = "ok";
  const tPayment = p.p1 ? "ok" : (isMatch ? "ok" : "missing");
  const tSettlement = p.p1 ? (p.p2 ? "ok" : "missing") : "pending";
  const tBank = p.p2 ? (p.p3 ? "ok" : "missing") : "pending";

  return (
    <aside className="explain-panel" id="explainPanel">
      {/* Header */}
      <div className="ep-header">
        <p className="eyebrow">DECISION EXPLAINER</p>
        {aiConfig && (
          <span className={`ai-mode-chip ${aiConfig.aiEnabled ? "ai-live" : "ai-det"}`}>
            {aiConfig.aiEnabled ? "⚡ Gemini" : "⚙ Deterministic"}
          </span>
        )}
      </div>

      <h2>{record.id}</h2>
      <p
        className="detail-status"
        style={{ color: isMatch ? "var(--green)" : "var(--red)" }}
      >
        {record.title}
      </p>
      <p className="detail-copy">{record.reason}</p>

      {/* Pass indicators */}
      <div className="pass-indicators">
        {Object.entries(record.passes || {}).map(([p, ok]) => (
          <PassBadge
            key={p}
            label={`P${p.replace("p","")}: ${
              p === "p1" ? "Order→Pay" :
              p === "p2" ? "Pay→Setl" :
              p === "p3" ? "Setl→Bank" : "Refund"
            }`}
            ok={ok}
          />
        ))}
      </div>

      {/* Evidence checks (collapsed by default when AI result available) */}
      <div className="evidence-section">
        <button
          className="evidence-toggle"
          onClick={() => setShowEvidence((v) => !v)}
        >
          <span>EVIDENCE CHECKS</span>
          <span className="evidence-confidence">{record.evidence}% CONFIDENCE</span>
          <span className="evidence-chevron">{showEvidence ? "▲" : "▼"}</span>
        </button>

        {(showEvidence || aiState === "idle") && (
          <ul className="evidence-list">
            {record.checks.map((check, idx) => (
              <li key={idx} className={check.startsWith("❌") ? "check-fail" : ""}>
                <span>{check.startsWith("❌") ? "✗" : "✓"}</span>
                {check.replace("❌ ", "")}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Deterministic AI Explain Button ── */}
      {aiState === "idle" && (
        <button
          className="btn-explain"
          onClick={handleGenerateExplanation}
          id="generateExplanationBtn"
        >
          <span className="btn-explain-icon">✦</span>
          Generate AI Explanation
        </button>
      )}

      {aiState === "loading" && (
        <div className="ai-loading-block">
          <div className="ai-loading-inner">
            <span className="ai-spinner" />
            <span>Translating evidence into plain English…</span>
          </div>
          <p className="ai-loading-sub">
            Engine facts locked. AI explains only.
          </p>
        </div>
      )}

      {/* ── AI Result ── */}
      {aiState === "done" && aiResult && (
        <div className="ai-result-block">
          {/* Risk badge + breakpoint */}
          <div className="ai-result-meta">
            <span
              className="risk-badge"
              style={{ background: risk.bg, color: risk.text, borderColor: risk.border }}
            >
              {risk.label}
            </span>
            {bp && (
              <span className="breakpoint-chip">
                {bp.icon} Broke at {bp.label}
              </span>
            )}
            <span className="ai-source-chip">
              {aiResult.source === "gemini" ? "⚡ Gemini" : "⚙ Deterministic"}
            </span>
          </div>

          {/* AI Summary */}
          <div className="ai-summary-card">
            <p className="ai-summary-label">AI SUMMARY</p>
            <p className="ai-summary-text">{aiResult.summary}</p>
          </div>

          {/* Safe Action */}
          <div className="ai-safe-action">
            <span className="safe-action-icon">🛡</span>
            <div>
              <p className="ai-summary-label">SAFE NEXT ACTION</p>
              <p className="ai-safe-action-text">{aiResult.safeAction}</p>
            </div>
          </div>

          {/* Visual Timeline (The Break in the Chain) */}
          <div className="visual-timeline-card">
            <p className="ai-summary-label">EVIDENCE TIMELINE</p>
            <div className="visual-timeline">
              <TimelineNode label="Order Placed" status={tOrder} />
              <TimelineNode label="Gateway Captured" status={tPayment} />
              <TimelineNode label="Batch Settled" status={tSettlement} />
              <TimelineNode label="Bank Credit" status={tBank} isLast />
            </div>
          </div>

          {/* Action Hub */}
          <div className="action-hub">
            <button className="btn-action btn-escalate">Escalate</button>
            <button className="btn-action btn-resolve">Resolve</button>
            <button className="btn-action btn-ignore">Ignore</button>
          </div>

          {/* Evidence JSON — the "receipts" judges love */}
          <details className="ai-evidence-details">
            <summary className="ai-evidence-summary">
              View raw evidence sent to AI ↗
            </summary>
            <pre className="ai-evidence-json">
              {JSON.stringify(aiResult.evidence, null, 2)}
            </pre>
          </details>

          {/* Regenerate */}
          <button
            className="btn-explain-small"
            onClick={handleGenerateExplanation}
          >
            ↺ Re-generate
          </button>
        </div>
      )}

      {aiState === "error" && (
        <div className="ai-error-block">
          <span>⚠</span> Explanation failed.{" "}
          <button className="btn-explain-small" onClick={handleGenerateExplanation}>
            Retry
          </button>
        </div>
      )}

      {/* Guardrail footer */}
      <div className="guardrail guardrail-ai">
        <span>🛡</span>
        <div>
          <b>Deterministic-first guardrail</b>
          <br />
          AI receives only pre-computed facts. It cannot change the verdict,
          perform math, or guess missing values.
          {aiConfig?.guardrails && (
            <ul className="guardrail-list">
              {aiConfig.guardrails.map((g, i) => (
                <li key={i}>✓ {g}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
