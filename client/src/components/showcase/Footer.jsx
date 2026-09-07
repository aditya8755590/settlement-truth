import { RotateCcw, Trash2, Upload } from "lucide-react";
import { useRef } from "react";

export default function Footer({ onUpload, onRunAudit, onClearAudit, loading, notice, sources }) {
  const input = useRef();
  const sourceCount = sources ? ["orders", "payments", "refunds", "settlements", "bankCredits"].reduce((sum, key) => sum + (sources[key] || 0), 0) : 0;
  const hasOrders = Boolean(sources?.orders);

  return <footer id="upload" className="bg-[#030712] px-5 pb-8 pt-10 text-white">
    <div className="mx-auto max-w-6xl rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,.6),transparent_52%),linear-gradient(120deg,#09122b,#111843)] p-8 text-center sm:p-16">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-200">Start with source evidence</p>
      <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-[-.06em] sm:text-5xl">Ready to eliminate payment leakage?</h2>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-blue-100">Upload merchant CSV exports. The engine preserves uncertainty where the trail cannot be proven.</p>
      <button type="button" onClick={() => input.current?.click()} disabled={loading} className="mx-auto mt-8 flex w-full max-w-xl items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-100/40 bg-white/[.07] px-5 py-8 text-sm text-cyan-50 backdrop-blur-xl hover:bg-white/[.11] disabled:cursor-not-allowed disabled:opacity-60">
        <Upload size={18} />{loading ? "Processing evidence…" : "Choose CSV files to run an audit"}
      </button>
      <input ref={input} onChange={onUpload} accept=".csv,text/csv" multiple className="hidden" type="file" />
      {hasOrders && <div className="mx-auto mt-5 flex max-w-xl flex-wrap items-center justify-center gap-3 text-xs text-blue-100"><span>{sourceCount.toLocaleString()} source rows loaded</span><button type="button" onClick={onRunAudit} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-cyan-100/30 px-3 py-2 hover:bg-white/10 disabled:opacity-60"><RotateCcw size={13} />Run again</button><button type="button" onClick={onClearAudit} disabled={loading} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-slate-300 hover:bg-white/10 disabled:opacity-60"><Trash2 size={13} />Clear session</button></div>}
      {notice && <p role="status" className={`mx-auto mt-5 max-w-xl rounded-xl px-4 py-3 text-sm ${notice.type === "error" ? "bg-red-500/15 text-red-100" : "bg-emerald-400/10 text-emerald-100"}`}>{notice.text}</p>}
    </div>
    <p className="mx-auto mt-7 max-w-6xl text-xs text-slate-500">Settlement Truth · Deterministic financial reconciliation</p>
  </footer>;
}
