import { motion } from "framer-motion";
import { ChevronDown, FileDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function downloadEvidence(records) {
  const rows = [["Record ID", "Exception", "Amount at risk", "Reason", "Recommended action"], ...records.map((record) => [record.id, record.title || record.type, record.amount, record.reason, record.action])];
  const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "settlement-truth-exceptions.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function AnomalyLedger({ audit, records }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const anomalies = useMemo(() => records.filter((record) => record.status === "Anomaly"), [records]);
  const selected = anomalies.find((record) => record.id === selectedId) || anomalies[0] || null;

  useEffect(() => {
    if (selected && !anomalies.some((record) => record.id === selectedId)) setSelectedId(selected.id);
  }, [anomalies, selected, selectedId]);

  return <section id="ledger" className="bg-[#030712] px-5 py-24 text-white">
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Exception workbench</p>
      <h2 className="mt-2 text-4xl font-semibold tracking-[-.05em]">The anomaly ledger.</h2>
      <div className="mt-9 grid gap-4 lg:grid-cols-3">
        <article className="rounded-3xl border border-white/10 bg-white/[.04] p-6 backdrop-blur-2xl">
          <p className="text-sm text-slate-400">Expense & leak tracker</p>
          <div className="mt-6 space-y-2">
            {anomalies.length ? anomalies.slice(0, 3).map((record) => <button type="button" onClick={() => { setSelectedId(record.id); setOpen(true); }} key={record.id} className={`flex w-full justify-between border-b border-white/10 pb-3 text-left text-sm ${selected?.id === record.id ? "text-cyan-100" : "text-white"}`}><span className="truncate pr-3">{record.title || record.type}</span><b className="shrink-0 text-red-300">{money(record.amount)}</b></button>) : <p className="text-sm text-slate-400">No exception evidence loaded.</p>}
          </div>
          <button type="button" disabled={!anomalies.length} onClick={() => downloadEvidence(anomalies)} className="mt-6 flex items-center gap-2 text-xs text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"><FileDown size={14} />Download exception evidence</button>
        </article>
        <article className="grid min-h-64 place-items-center rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_center,rgba(37,99,235,.38),transparent_62%)] p-6 text-center">
          <div><p className="text-xs uppercase tracking-[.18em] text-blue-200">Verified records</p><motion.strong key={audit.autoMatched} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 block text-6xl font-semibold tracking-[-.09em]">{audit.hasAudit ? audit.autoMatched : "—"}</motion.strong><p className="mt-3 text-sm text-slate-400">No forced matches</p></div>
        </article>
        <article className="rounded-3xl border border-white/10 bg-white/[.04] p-6 backdrop-blur-2xl">
          <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left"><span><span className="block text-xs text-slate-400">Evidence trace</span><b className="mt-1 block text-sm">{selected ? selected.id : "Follow the money trail"}</b></span><ChevronDown className={open ? "rotate-180 transition" : "transition"} size={18} /></button>
          {open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-6 space-y-3 overflow-hidden text-xs">{selected ? <><p className="rounded-lg bg-cyan-200/10 p-3 leading-5 text-cyan-100">{selected.action}</p>{(selected.timeline || [selected.reason]).filter(Boolean).map((step, index) => <span key={`${selected.id}-${index}`} className={`block rounded-lg p-3 ${step.startsWith("❌") ? "border border-red-400/30 bg-red-500/10 text-red-100" : "bg-white/5"}`}>{step}</span>)}</> : <p className="rounded-lg bg-white/5 p-3 text-slate-400">Upload and run an audit to inspect an evidence trace.</p>}</motion.div>}
        </article>
      </div>
    </div>
  </section>;
}
