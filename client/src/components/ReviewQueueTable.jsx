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
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20">
      <div className="p-6 border-b border-slate-800 flex justify-between items-end">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">REVIEW QUEUE</p>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Decisions, not guesses</h2>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeFilter === "all" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => onFilterChange("all")}
          >
            All
          </button>
          <button
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeFilter === "Cleared" ? "bg-emerald-900/50 text-emerald-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => onFilterChange("Cleared")}
          >
            Matched
          </button>
          <button
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeFilter === "Anomaly" ? "bg-red-900/50 text-red-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => onFilterChange("Anomaly")}
          >
            Review
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium">Record</th>
              <th className="px-6 py-4 font-medium">Value</th>
              <th className="px-6 py-4 font-medium">Decision</th>
              <th className="px-6 py-4 font-medium">Evidence</th>
              <th className="px-6 py-4 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {records.map((record) => {
              const isSelected = selectedRecord?.id === record.id;
              const isMatch = record.status === "Cleared";

              return (
                <React.Fragment key={record.id}>
                  <tr
                    className={`transition-colors cursor-pointer ${
                      isSelected ? "bg-slate-800/50" : "hover:bg-slate-800/30"
                    }`}
                    onClick={() => onSelectRecord(record)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{record.id}</div>
                      <div className="text-xs text-slate-500">{record.type}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">{formatINR(record.amount)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          isMatch
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{record.evidence}% evidence</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className={`text-sm font-medium transition-colors ${
                          isSelected ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                  
                  {/* EXPANDABLE ROW - Visual Evidence Timeline */}
                  {isSelected && (
                    <tr className="bg-slate-950/30">
                      <td colSpan="5" className="px-6 py-8 border-b-2 border-slate-700 shadow-inner">
                        <div className="w-full">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                            Visual Evidence Timeline
                          </h4>
                          <div className="flex items-stretch justify-start gap-3 overflow-x-auto pb-4 custom-scrollbar">
                            {record.timeline?.map((step, idx) => {
                              const isFailed = step.startsWith("❌");
                              const stepText = step.replace("❌ ", "");
                              const isLast = idx === record.timeline.length - 1;
                              
                              return (
                                <React.Fragment key={idx}>
                                  <div 
                                    className={`relative flex flex-col p-4 rounded-xl border flex-shrink-0 w-64 transition-all ${
                                      isFailed 
                                        ? "bg-red-950/30 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20" 
                                        : "bg-slate-900 border-slate-700 opacity-80"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-3">
                                      {isFailed ? (
                                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-sm font-bold shadow-sm shadow-red-500/20">&times;</div>
                                      ) : (
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-sm font-bold">&#10003;</div>
                                      )}
                                      <span className={`text-xs font-bold uppercase tracking-wider ${isFailed ? "text-red-400" : "text-emerald-500"}`}>
                                        {isFailed ? "Failed Validation" : "Step Passed"}
                                      </span>
                                    </div>
                                    <span className="text-sm text-slate-300 whitespace-normal leading-relaxed">
                                      {stepText}
                                    </span>
                                  </div>
                                  {!isLast && (
                                    <div className="flex items-center justify-center flex-shrink-0 text-slate-600 px-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
