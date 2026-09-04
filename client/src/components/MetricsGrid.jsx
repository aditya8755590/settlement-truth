import React from "react";

export default function MetricsGrid({ metrics, hasRun }) {
  return (
    <section className="metrics">
      <article>
        <span>Auto-matched</span>
        <strong id="matchedValue">
          {hasRun && metrics ? metrics.autoMatchedText : "—"}
        </strong>
        <small id="matchedHint">
          {hasRun && metrics
            ? `${metrics.reconciledAmountFormatted} reconciled`
            : "Awaiting run"}
        </small>
      </article>

      <article>
        <span>Evidence precision</span>
        <strong id="precisionValue">
          {hasRun && metrics ? metrics.evidencePrecision : "—"}
        </strong>
        <small>Held-out evaluation batch</small>
      </article>

      <article>
        <span>Exception queue</span>
        <strong id="exceptionValue">
          {hasRun && metrics ? metrics.exceptionQueueCount : "—"}
        </strong>
        <small id="exceptionHint">
          {hasRun && metrics ? "0 forced matches" : "Requires human review"}
        </small>
      </article>

      <article>
        <span>Cash at risk</span>
        <strong id="riskValue">
          {hasRun && metrics ? metrics.cashAtRiskFormatted : "—"}
        </strong>
        <small>Across unresolved items</small>
      </article>
    </section>
  );
}
