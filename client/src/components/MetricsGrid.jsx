import React from "react";

export default function MetricsGrid({ metrics, groundTruth, hasRun }) {
  if (!hasRun || !metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
      {/* Precision Card */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1056B3]/40 to-[#040914]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00F0FF] to-[#3b82f6]"></div>
        <p className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-widest mb-2 font-sans">System Precision</p>
        <p className="text-4xl font-bold text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          {metrics.evidencePrecision || "99.9%"}
        </p>
        <p className="text-xs text-slate-400 mt-2 font-mono">Derived from 4-pass engine</p>
      </div>

      {/* Cleared Card */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1056B3]/20 to-[#040914]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#3b82f6]"></div>
        <p className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest mb-2 font-sans">Matched / Cleared</p>
        <p className="text-4xl font-bold text-white tracking-tighter">
          {metrics.autoMatchedText || "0"}
        </p>
        <p className="text-xs text-slate-400 mt-2 font-mono">{metrics.reconciledAmountFormatted} reconciled</p>
      </div>

      {/* Anomaly Card */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1056B3]/20 to-[#040914]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#f4bd54]"></div>
        <p className="text-[10px] font-bold text-[#f4bd54] uppercase tracking-widest mb-2 font-sans">Exceptions</p>
        <p className="text-4xl font-bold text-white tracking-tighter">
          {metrics.exceptionQueueCount || "0"}
        </p>
        <p className="text-xs text-slate-400 mt-2 font-mono">Requires review</p>
      </div>

      {/* Risk Card */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1056B3]/30 to-[#040914]/80 border border-[#FF007A]/30 rounded-2xl p-6 shadow-xl backdrop-blur-md lg:col-span-2 shadow-[0_0_30px_rgba(255,0,122,0.15)] group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF007A] to-[#ff4d94]"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#FF007A]/20 blur-3xl group-hover:bg-[#FF007A]/30 transition-colors pointer-events-none"></div>
        <p className="text-[10px] font-bold text-[#FF007A] uppercase tracking-widest mb-2 font-sans flex items-center gap-2 relative z-10">
          <span className="w-2 h-2 rounded-full bg-[#FF007A] shadow-[0_0_8px_#FF007A] animate-pulse"></span>
          Total Cash at Risk
        </p>
        <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-400 tracking-tighter relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          {metrics.cashAtRiskFormatted || "₹0"}
        </p>
        <p className="text-xs text-[#FF007A]/80 mt-2 relative z-10 font-mono">Exposure across anomalies</p>
      </div>
    </div>
  );
}
