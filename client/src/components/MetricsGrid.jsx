import React from "react";

export default function MetricsGrid({ metrics, groundTruth, hasRun }) {
  const precision = groundTruth
    ? `${(groundTruth.precision * 100).toFixed(1)}%`
    : "—";
  const recall = groundTruth
    ? `${(groundTruth.recall * 100).toFixed(1)}%`
    : "—";

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
        <small>Derived from 4-pass engine</small>
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

      <article className="metric-critical">
        <span>Total Money at Risk</span>
        <strong id="riskValue">
          {hasRun && metrics ? metrics.cashAtRiskFormatted : "—"}
        </strong>
        <small>Across unresolved items</small>
      </article>

      <article className="ground-truth-metric">
        <span>Ground truth</span>
        <strong id="groundTruthValue">
          {hasRun && groundTruth ? (
            <span style={{ fontSize: "18px", letterSpacing: "-0.5px" }}>
              {groundTruth.tp}TP · {groundTruth.fp}FP · {groundTruth.fn}FN
            </span>
          ) : "—"}
        </strong>
        <small>
          {hasRun && groundTruth
            ? `P: ${precision}  R: ${recall}`
            : "Vs known outcomes"}
        </small>
      </article>
    </section>
  );
}
