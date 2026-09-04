import React from "react";

export default function MetricsGrid({ metrics, groundTruth, hasRun }) {
  const precision = groundTruth
    ? `${(groundTruth.precision * 100).toFixed(1)}%`
    : "—";
  const recall = groundTruth
    ? `${(groundTruth.recall * 100).toFixed(1)}%`
    : "—";

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <article className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col transition-all hover:border-slate-700">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cleared</span>
        <strong id="matchedValue" className="text-3xl font-bold mt-2 mb-1 text-slate-100">
          {hasRun && metrics ? metrics.autoMatchedText : "—"}
        </strong>
        <small id="matchedHint" className="text-xs text-slate-500">
          {hasRun && metrics
            ? `${metrics.reconciledAmountFormatted} reconciled`
            : "Awaiting run"}
        </small>
      </article>

      <article className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col transition-all hover:border-slate-700">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evidence precision</span>
        <strong id="precisionValue" className="text-3xl font-bold mt-2 mb-1 text-slate-100">
          {hasRun && metrics ? metrics.evidencePrecision : "—"}
        </strong>
        <small className="text-xs text-slate-500">Derived from 4-pass engine</small>
      </article>

      <article className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col transition-all hover:border-slate-700">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exception queue</span>
        <strong id="exceptionValue" className="text-3xl font-bold mt-2 mb-1 text-slate-100">
          {hasRun && metrics ? metrics.exceptionQueueCount : "—"}
        </strong>
        <small id="exceptionHint" className="text-xs text-slate-500">
          {hasRun && metrics ? "0 forced matches" : "Requires human review"}
        </small>
      </article>

      <article className="bg-slate-900 border border-red-900/50 rounded-xl p-5 flex flex-col relative overflow-hidden transition-all hover:border-red-500/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <span className="text-xs font-semibold text-red-400 uppercase tracking-wider relative z-10">Total Money at Risk</span>
        <strong id="riskValue" className="text-3xl font-bold mt-2 mb-1 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)] relative z-10">
          {hasRun && metrics ? metrics.cashAtRiskFormatted : "—"}
        </strong>
        <small className="text-xs text-red-500/70 relative z-10">Across unresolved items</small>
      </article>

      <article className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col transition-all hover:border-slate-700">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ground truth</span>
        <strong id="groundTruthValue" className="text-2xl font-bold mt-2 mb-1 text-slate-100 tracking-tight">
          {hasRun && groundTruth ? (
            <>
              <span className="text-green-400">{groundTruth.tp}TP</span><span className="text-slate-600 mx-1">·</span>
              <span className="text-red-400">{groundTruth.fp}FP</span><span className="text-slate-600 mx-1">·</span>
              <span className="text-orange-400">{groundTruth.fn}FN</span>
            </>
          ) : "—"}
        </strong>
        <small className="text-xs text-slate-500">
          {hasRun && groundTruth
            ? `P: ${precision}  R: ${recall}`
            : "Vs known outcomes"}
        </small>
      </article>
    </section>
  );
}
