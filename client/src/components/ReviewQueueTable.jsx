import React from "react";

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ReviewQueueTable({
  records,
  activeFilter,
  onFilterChange,
  selectedRecord,
  onSelectRecord,
}) {
  return (
    <div className="bg-[#0d1424]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="p-6 border-b border-white/5 flex justify-between items-end bg-gradient-to-r from-[#040914] to-[#0d1424]">
        <div>
          <p className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest mb-2 font-sans">REVIEW QUEUE</p>
          <h2 className="text-2xl tracking-tight text-white m-0">
            <span className="font-sans font-bold">Decisions,</span> <span className="font-serif italic font-light text-slate-400">not guesses</span>
          </h2>
        </div>

        <div className="flex bg-[#040914] p-1 rounded-full border border-white/10">
          <button
            className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-all ${
              activeFilter === "all" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => onFilterChange("all")}
          >
            All
          </button>
          <button
            className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-all ${
              activeFilter === "Cleared" ? "bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]" : "text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => onFilterChange("Cleared")}
          >
            Matched
          </button>
          <button
            className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-all ${
              activeFilter === "Anomaly" ? "bg-[#FF007A]/20 text-[#FF007A] shadow-[0_0_10px_rgba(255,0,122,0.2)]" : "text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => onFilterChange("Anomaly")}
          >
            Review
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#040914]/80 text-slate-400 border-b border-white/5 font-sans">
            <tr>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Record</th>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Value</th>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Decision</th>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Evidence</th>
              <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-sans">
            {records.map((record) => {
              const isSelected = selectedRecord?.id === record.id;
              const isMatch = record.status === "Cleared";

              return (
                <React.Fragment key={record.id}>
                  <tr
                    className={`transition-colors cursor-pointer ${
                      isSelected ? "bg-[#3b82f6]/10" : "hover:bg-white/5"
                    }`}
                    onClick={() => onSelectRecord(record)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{record.id}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest">{record.type}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">{formatINR(record.amount)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                          isMatch
                            ? "bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                            : "bg-[#FF007A]/10 text-[#FF007A] border-[#FF007A]/30 shadow-[0_0_10px_rgba(255,0,122,0.15)]"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{record.evidence}%</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                          isSelected ? "text-[#00F0FF]" : "text-slate-500 hover:text-white"
                        }`}
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                  
                  {/* EXPANDABLE ROW - Visual Evidence Timeline */}
                  {isSelected && (
                    <tr className="bg-[#040914]">
                      <td colSpan="5" className="px-6 py-8 border-b border-white/5 shadow-inner">
                        <div className="w-full relative">
                           {/* Glow behind timeline */}
                           <div className="absolute top-1/2 left-1/4 w-full h-10 bg-[#3b82f6]/20 blur-3xl rounded-full pointer-events-none"></div>

                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3 relative z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] inline-block"></span>
                            Visual Evidence Timeline
                          </h4>
                          <div className="flex items-stretch justify-start gap-4 overflow-x-auto pb-4 custom-scrollbar relative z-10">
                            {record.timeline?.map((step, idx) => {
                              const isFailed = step.startsWith("❌");
                              const stepText = step.replace("❌ ", "");
                              const isLast = idx === record.timeline.length - 1;
                              
                              return (
                                <React.Fragment key={idx}>
                                  <div 
                                    className={`relative flex flex-col p-5 rounded-2xl border flex-shrink-0 w-72 transition-all backdrop-blur-md ${
                                      isFailed 
                                        ? "bg-gradient-to-br from-[#FF007A]/20 to-[#040914] border-[#FF007A]/50 shadow-[0_0_30px_rgba(255,0,122,0.2)]" 
                                        : "bg-[#0d1424]/80 border-white/10"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 mb-4">
                                      {isFailed ? (
                                        <div className="w-7 h-7 rounded-full bg-[#FF007A] flex items-center justify-center text-white text-sm font-bold shadow-[0_0_15px_#FF007A]">&times;</div>
                                      ) : (
                                        <div className="w-7 h-7 rounded-full bg-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF] text-sm font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]">&#10003;</div>
                                      )}
                                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isFailed ? "text-[#FF007A]" : "text-[#00F0FF]"}`}>
                                        {isFailed ? "Failed Validation" : "Step Passed"}
                                      </span>
                                    </div>
                                    <span className="text-sm text-slate-300 whitespace-normal leading-relaxed font-serif italic">
                                      {stepText}
                                    </span>
                                  </div>
                                  {!isLast && (
                                    <div className="flex items-center justify-center flex-shrink-0 text-white/20 px-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                      </svg>
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
