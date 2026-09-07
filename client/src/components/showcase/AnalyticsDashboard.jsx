import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tabs = ["Reconciliation flow", "Exception types"];

export default function AnalyticsDashboard({ audit }) {
  const [tab, setTab] = useState(tabs[0]);
  const data = useMemo(() => {
    if (!audit.hasAudit) return [{ name: "No evidence", count: 0 }];
    if (tab === "Reconciliation flow") return [
      { name: "Cleared", count: audit.autoMatched },
      { name: "Review", count: audit.exceptions },
    ];
    return audit.categories.length ? audit.categories.slice(0, 6) : [{ name: "No exceptions", count: 0 }];
  }, [audit, tab]);
  const chartLabel = tab === "Reconciliation flow" ? "Record outcome" : "Exception category";

  return <section id="analytics" className="bg-[#eef5ff] px-5 py-24">
    <div className="mx-auto max-w-6xl overflow-hidden rounded-[34px] bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-6 text-white shadow-2xl shadow-blue-950/30 sm:p-10">
      <div className="mb-10 flex flex-wrap justify-between gap-5">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-200">Analytics panel</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Clear only what evidence supports.</h2></div>
        <div role="tablist" aria-label="Audit chart view" className="flex rounded-full border border-white/15 bg-white/[.08] p-1">
          {tabs.map((item) => <button type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} key={item} className={`rounded-full px-3 py-2 text-xs ${tab === item ? "bg-white text-blue-950" : "text-blue-100"}`}>{item}</button>)}
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[.08] p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-widest text-blue-200">Evidence-cleared records</p>
          <p className="mt-4 text-4xl font-semibold tracking-[-.06em]">{audit.hasAudit ? `${audit.matchRate}%` : "—"}</p>
          <p className="mt-2 text-sm text-blue-100">{audit.hasAudit ? `${audit.autoMatched} of ${audit.total} records cleared` : "Upload and run an audit to populate this panel."}</p>
          <div className="mt-10 h-2 overflow-hidden rounded-full bg-white/10"><div style={{ width: `${audit.matchRate}%` }} className="h-full rounded-full bg-gradient-to-r from-cyan-200 to-white" /></div>
        </div>
        <div className="h-72 rounded-3xl border border-white/10 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:28px_28px] p-4">
          <p className="mb-1 text-xs text-blue-200">{chartLabel}</p>
          <ResponsiveContainer width="100%" height="92%"><BarChart data={data}><XAxis dataKey="name" stroke="#bfdbfe" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} stroke="#bfdbfe" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "rgba(255,255,255,.06)" }} /><Bar dataKey="count" fill="#dbeafe" radius={[10, 10, 2, 2]} /></BarChart></ResponsiveContainer>
        </div>
      </div>
    </div>
  </section>;
}
