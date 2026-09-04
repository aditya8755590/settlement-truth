import React, { useState, useEffect } from "react";

const RISK_COLORS = {
  low:      { bg: "bg-emerald-950/40", text: "text-emerald-400", border: "border-emerald-500/30", label: "LOW RISK" },
  medium:   { bg: "bg-amber-950/40", text: "text-amber-400", border: "border-amber-500/30", label: "MEDIUM RISK" },
  high:     { bg: "bg-orange-950/40", text: "text-orange-400", border: "border-orange-500/30", label: "HIGH RISK" },
  critical: { bg: "bg-red-950/40", text: "text-red-400", border: "border-red-500/30", label: "CRITICAL" },
};

const BREAKPOINT_LABELS = {
  none:        { icon: "✓", label: "Full chain" },
  order:       { icon: "📋", label: "Order layer" },
  payment:     { icon: "💳", label: "Payment layer" },
  settlement:  { icon: "🏦", label: "Settlement layer" },
  bank_credit: { icon: "🔁", label: "Bank credit layer" },
  refund:      { icon: "↩", label: "Refund layer" },
};

function PassBadge({ label, ok }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${
      ok ? "bg-emerald-950/30 text-emerald-500 border-emerald-900" : "bg-red-950/30 text-red-400 border-red-900"
    }`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

export default function ExplainPanel({ record }) {
  const [aiState, setAiState] = useState("idle"); // idle | loading | done | error
  const [aiResult, setAiResult] = useState(null);
  const [aiConfig, setAiConfig] = useState(null);

  useEffect(() => {
    fetch("/api/explain/config")
      .then((r) => r.json())
      .then(setAiConfig)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setAiState("idle");
    setAiResult(null);
  }, [record?.id]);

  if (!record) {
    return (
      <aside className="w-full bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl h-[calc(100vh-8rem)] flex flex-col justify-center text-center">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">SELECT A RECORD</p>
        <h2 className="text-xl font-bold text-slate-200 mb-4">Every decision has receipts.</h2>
        <p className="text-slate-400 text-sm mb-8">
          Choose a record to inspect the evidence, policy checks and safe next step.
        </p>
        <div className="bg-slate-950/50 rounded-lg p-4 text-left border border-slate-800 flex items-start gap-3">
          <span className="text-emerald-500">✓</span>
          <div>
            <b className="text-slate-200 text-sm block mb-1">Abstention is a feature</b>
            <span className="text-xs text-slate-400 leading-relaxed">Low-confidence items are routed to a human—not force-matched.</span>
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

  return (
    <aside className="w-full bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
      <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DECISION EXPLAINER</p>
        {aiConfig && (
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${aiConfig.aiEnabled ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-slate-800 text-slate-400"}`}>
            {aiConfig.aiEnabled ? "⚡ Gemini" : "⚙ Deterministic"}
          </span>
        )}
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">{record.id}</h2>
        <p className={`font-semibold mb-3 ${isMatch ? "text-emerald-400" : "text-red-400"}`}>
          {record.title}
        </p>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">{record.reason}</p>

        <div className="flex flex-wrap gap-2 mb-8">
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

        {aiState === "idle" && (
          <button
            onClick={handleGenerateExplanation}
            className="w-full py-4 bg-gradient-to-r from-indigo-900/80 to-blue-900/80 hover:from-indigo-800 hover:to-blue-800 text-indigo-200 hover:text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.15)] flex items-center justify-center gap-2 border border-indigo-500/30"
          >
            <span className="text-xl">✦</span>
            Generate AI Explanation
          </button>
        )}

        {aiState === "loading" && (
          <div className="w-full p-6 border border-indigo-500/30 bg-indigo-950/20 rounded-xl flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-indigo-300">Translating evidence into plain English…</span>
            <p className="text-xs text-indigo-500/70 mt-1">Engine facts locked. AI explains only.</p>
          </div>
        )}

        {aiState === "done" && aiResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs font-bold px-2 py-1 rounded-md border ${risk.bg} ${risk.text} ${risk.border}`}>
                {risk.label}
              </span>
              {bp && (
                <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {bp.icon} Broke at {bp.label}
                </span>
              )}
            </div>

            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 shadow-inner">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">AI SUMMARY</p>
              <p className="text-sm text-slate-200 leading-relaxed">{aiResult.summary}</p>
            </div>

            <div className="bg-blue-950/30 rounded-xl p-4 border border-blue-900/50 flex gap-3 shadow-inner">
              <span className="text-blue-500 text-lg">🛡</span>
              <div>
                <p className="text-[10px] font-bold text-blue-500/80 uppercase tracking-wider mb-1">SAFE NEXT ACTION</p>
                <p className="text-sm font-medium text-blue-100 leading-relaxed">{aiResult.safeAction}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
              <button className="col-span-2 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-red-900/20">
                Escalate Exception
              </button>
              <button className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors border border-slate-700">
                Force Resolve
              </button>
              <button className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg font-medium transition-colors border border-slate-700">
                Ignore
              </button>
            </div>

            <details className="mt-6 text-xs text-slate-500 group">
              <summary className="cursor-pointer hover:text-slate-300 transition-colors mb-2 list-none flex items-center gap-1">
                <span className="group-open:rotate-90 transition-transform">▸</span> View raw evidence sent to AI
              </summary>
              <pre className="p-3 bg-slate-950 rounded-lg overflow-x-auto border border-slate-800 text-slate-400 font-mono text-[10px] leading-relaxed">
                {JSON.stringify(aiResult.evidence, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {aiState === "error" && (
          <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-sm flex justify-between items-center mt-4">
            <span>⚠ Explanation failed.</span>
            <button className="px-3 py-1 bg-red-900/50 hover:bg-red-800/50 rounded text-red-200 transition-colors" onClick={handleGenerateExplanation}>
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex gap-3 text-xs text-slate-400 shrink-0">
        <span className="text-lg">🛡</span>
        <div>
          <b className="text-slate-300 block mb-1">Deterministic-first guardrail</b>
          AI receives only pre-computed facts. It cannot change the verdict, perform math, or guess missing values.
        </div>
      </div>
    </aside>
  );
}
