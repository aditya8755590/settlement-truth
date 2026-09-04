import React from "react";

export default function AuditTrail({ auditTrail }) {
  return (
    <section className="audit-section">
      <div>
        <p className="eyebrow">AUDIT TRAIL</p>
        <h2>What the agent did—and what it refused to do.</h2>
      </div>

      <ol id="auditList" className="audit-list">
        {auditTrail && auditTrail.length > 0 ? (
          auditTrail.map((item, index) => (
            <li key={index}>
              <span>{item.timestamp}</span>
              <div>
                <b>{item.title}</b>
                <p>{item.description}</p>
              </div>
            </li>
          ))
        ) : (
          <li>
            <span>00:00</span>
            <div>
              <b>Waiting for reconciliation run</b>
              <p>The audit log records both matches and abstentions.</p>
            </div>
          </li>
        )}
      </ol>
    </section>
  );
}
