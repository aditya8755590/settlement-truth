import React from "react";

const SOURCE_LABELS = [
  { key: "orders",      label: "Orders",       icon: "📋" },
  { key: "payments",    label: "Payments",     icon: "💳" },
  { key: "refunds",     label: "Refunds",      icon: "↩" },
  { key: "settlements", label: "Settlements",  icon: "🏦" },
  { key: "bankCredits", label: "Bank Credits", icon: "✅" },
];

export default function DataSourceBanner({ sources, hasRun }) {
  if (!sources) return null;

  return (
    <div className="data-source-banner">
      <span className="data-source-label">INGESTED SOURCES</span>
      <div className="data-source-items">
        {SOURCE_LABELS.map(({ key, label, icon }, idx) => (
          <React.Fragment key={key}>
            <span className="data-source-item">
              <span className="data-source-icon">{icon}</span>
              <span className="data-source-name">{label}</span>
              <span className={`data-source-count ${hasRun ? "active" : ""}`}>
                {sources[key] ?? "—"}
              </span>
            </span>
            {idx < SOURCE_LABELS.length - 1 && (
              <span className="data-source-arrow">→</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
