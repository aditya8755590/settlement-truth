import React, { useState, useEffect } from "react";

const RISK_COLORS = {
  low:      { bg: "bg-emerald-900/40", text: "text-emerald-400", border: "border-emerald-500/50", label: "LOW RISK" },
  medium:   { bg: "bg-amber-900/40", text: "text-amber-400", border: "border-amber-500/50", label: "MEDIUM RISK" },
  high:     { bg: "bg-orange-900/40", text: "text-orange-400", border: "border-orange-500/50", label: "HIGH RISK" },
  critical: { bg: "bg-[#FF007A]/20", text: "text-[#FF007A]", border: "border-[#FF007A]/50", label: "CRITICAL" },
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
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
      ok ? "bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30 shadow-[0_0_10px_rgba(0,240,255,0.15)]" : "bg-[#FF007A]/10 text-[#FF007A] border-[#FF007A]/30 shadow-[0_0_10px_rgba(255,0,122,0.15)]"
    }`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

export default function ExplainPanel({ record }) {
  const [aiState, setAiState] = useState("idle");
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
      <aside className="w-full bg-[#0d1424]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] h-[calc(100vh-8rem)] flex flex-col justify-center text-center p-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00F0FF]/10 blur-3xl rounded-full pointer-events-none"></div>
        <p className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest mb-4 font-sans relative z-10">SELECT A RECORD</p>
        <h2 className="text-3xl tracking-tight text-white m-0 relative z-10">
          <span className="font-sans font-bold">Every decision</span> <br/> <span className="font-serif italic font-light text-[#00F0FF]">has receipts.</span>
        </h2>
        <p className="text-slate-400 text-sm mt-4 mb-8 relative z-10">
          Choose a record to inspect the evidence, policy checks and safe next step.
        </p>
        <div className="bg-[#040914]/50 rounded-xl p-5 text-left border border-white/10 flex items-start gap-4 shadow-inner relative z-10 backdrop-blur-md">
          <span className="text-[#00F0FF] drop-shadow-[0_0_5px_#00F0FF]">✓</span>
          <div>
            <b className="text-white text-sm block mb-1">Abstention is a feature</b>
            <span className="text-xs text-slate-400 leading-relaxed font-serif italic">Low-confidence items are routed to a human—not force-matched.</span>
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
    <aside className="w-full bg-[#0d1424]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[calc(100vh-8rem)] relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#3b82f6]/10 blur-3xl rounded-full pointer-events-none"></div>

      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-[#040914] to-[#0d1424] flex justify-between items-center relative z-10">
        <p className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest font-sans">DECISION EXPLAINER</p>
        {aiConfig && (
          <span className={`text-[9px] uppercase tracking-widest px-3 py-1 rounded-full font-bold ${aiConfig.aiEnabled ? "bg-white/10 text-white border border-white/20" : "bg-[#040914] text-slate-500 border border-white/5"}`}>
            {aiConfig.aiEnabled ? "⚡ Gemini" : "⚙ Deterministic"}
          </span>
        )}
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative z-10">
        <h2 className="text-3xl font-bold text-white mb-1 font-sans">{record.id}</h2>
        <p className={`font-serif italic font-light text-lg mb-4 ${isMatch ? "text-[#00F0FF]" : "text-[#FF007A]"}`}>
          {record.title}
        </p>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed border-l-2 border-[#3b82f6]/50 pl-3">{record.reason}</p>

        <div className="flex flex-wrap gap-3 mb-8">
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
            className="w-full py-4 bg-gradient-to-r from-[#00F0FF]/10 to-[#3b82f6]/10 hover:from-[#00F0FF]/20 hover:to-[#3b82f6]/20 text-[#00F0FF] rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(0,240,255,0.1)] flex items-center justify-center gap-3 border border-[#00F0FF]/30 backdrop-blur-md group"
          >
            <span className="text-xl group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_#00F0FF]">✦</span>
            GENERATE AI EXPLANATION
          </button>
        )}

        {aiState === "loading" && (
          <div className="w-full p-8 border border-[#00F0FF]/30 bg-[#00F0FF]/5 rounded-2xl flex flex-col items-center justify-center gap-4 backdrop-blur-md shadow-inner">
            <div className="w-8 h-8 border-2 border-[#00F0FF]/30 border-t-[#00F0FF] rounded-full animate-spin shadow-[0_0_15px_#00F0FF]"></div>
            <span className="text-sm font-bold text-white">Translating evidence into plain English…</span>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-sans mt-1">Engine facts locked. AI explains only.</p>
          </div>
        )}

        {aiState === "done" && aiResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-wrap gap-3">
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-widest ${risk.bg} ${risk.text} ${risk.border} shadow-[0_0_10px_currentColor]`}>
                {risk.label}
              </span>
              {bp && (
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#040914] text-slate-300 border border-white/10 uppercase tracking-widest">
                  {bp.icon} Broke at {bp.label}
                </span>
              )}
            </div>

            <div className="bg-[#040914]/60 rounded-2xl p-5 border border-white/5 shadow-inner">
              <p className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest mb-3 font-sans">AI SUMMARY</p>
              <p className="text-sm text-slate-200 leading-relaxed font-serif italic">{aiResult.summary}</p>
            </div>

            <div className="bg-gradient-to-br from-[#1056B3]/30 to-[#040914] rounded-2xl p-5 border border-[#3b82f6]/30 flex gap-4 shadow-inner backdrop-blur-sm">
              <span className="text-[#00F0FF] text-xl drop-shadow-[0_0_5px_#00F0FF]">🛡</span>
              <div>
                <p className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-widest mb-2 font-sans">SAFE NEXT ACTION</p>
                <p className="text-sm font-medium text-white leading-relaxed">{aiResult.safeAction}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/10">
              <button className="col-span-2 py-3.5 bg-gradient-to-r from-[#FF007A] to-[#ff4d94] hover:from-[#ff4d94] hover:to-[#FF007A] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-[0_0_20px_rgba(255,0,122,0.4)]">
                Escalate Exception
              </button>
              <button className="py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all border border-white/10">
                Force Resolve
              </button>
              <button className="py-3 bg-[#040914] hover:bg-white/5 text-slate-400 hover:text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all border border-white/10">
                Ignore
              </button>
            </div>

            <details className="mt-6 text-xs text-slate-500 group">
              <summary className="cursor-pointer hover:text-slate-300 transition-colors mb-2 list-none flex items-center gap-1 font-sans text-[11px] font-semibold tracking-wide">
                <span className="group-open:rotate-90 transition-transform">▸</span> View raw evidence sent to AI
              </summary>
              <pre className="p-4 bg-[#040914] rounded-xl overflow-x-auto border border-white/5 text-[#3b82f6] font-mono text-[10px] leading-relaxed shadow-inner">
                {JSON.stringify(aiResult.evidence, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {aiState === "error" && (
          <div className="p-4 bg-[#FF007A]/10 border border-[#FF007A]/30 rounded-xl text-[#FF007A] text-sm flex justify-between items-center mt-4">
            <span className="font-bold">⚠ Explanation failed.</span>
            <button className="px-4 py-1.5 bg-[#FF007A]/20 hover:bg-[#FF007A]/30 rounded-full text-white font-bold text-xs transition-colors" onClick={handleGenerateExplanation}>
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="p-5 bg-gradient-to-r from-[#040914] to-[#0d1424] border-t border-white/10 flex gap-4 text-xs text-slate-400 shrink-0 relative z-10">
        <span className="text-xl opacity-50">🛡</span>
        <div>
          <b className="text-white block mb-1 font-sans text-sm">Deterministic-first guardrail</b>
          <span className="font-serif italic text-slate-400">AI receives only pre-computed facts. It cannot change the verdict, perform math, or guess missing values.</span>
        </div>
      </div>
    </aside>
  );
}
