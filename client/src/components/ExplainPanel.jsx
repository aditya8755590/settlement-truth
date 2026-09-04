import React from "react";

export default function ExplainPanel({ record }) {
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

  const isMatch = record.status === "matched";

  return (
    <aside className="explain-panel" id="explainPanel">
      <p className="eyebrow">DECISION EXPLAINER</p>
      <h2>{record.id}</h2>
      <p
        className="detail-status"
        style={{ color: isMatch ? "var(--green)" : "var(--red)" }}
      >
        {record.title}
      </p>
      <p className="detail-copy">{record.reason}</p>

      <p className="detail-label">
        EVIDENCE CHECKS · {record.evidence}% CONFIDENCE
      </p>

      <ul className="evidence-list">
        {record.checks.map((check, idx) => (
          <li key={idx}>
            <span>✓</span>
            {check}
          </li>
        ))}
      </ul>

      <div className="next-action">
        <b>SAFE NEXT STEP</b>
        {record.action}
      </div>

      <div className="guardrail">
        <span>✓</span>
        <div>
          <b>Financial Safety Principle</b>
          <br />
          Deterministic evidence is validated prior to model explanations.
        </div>
      </div>
    </aside>
  );
}
