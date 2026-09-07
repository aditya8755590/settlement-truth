import { motion } from "framer-motion";
import { ArrowDownRight, ArrowRight, ShieldCheck } from "lucide-react";

const spring = { type: "spring", stiffness: 100, damping: 20 };
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function Hero({ audit, onLaunch }) {
  const label = audit.hasAudit ? "Money at risk detected" : "Evidence status";
  const value = audit.hasAudit ? money(audit.cashAtRisk) : "Awaiting audit";
  return <section className="relative isolate min-h-[760px] overflow-hidden bg-[#030712] px-5 pb-16 pt-5 text-white sm:px-8">
    <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_75%_15%,rgba(37,99,235,.35),transparent_26%),radial-gradient(circle_at_15%_60%,rgba(168,85,247,.2),transparent_30%)]" />
    {["top-28", "top-44", "top-64"].map((top, index) => <motion.div key={top} className={`absolute ${top} h-px w-[70vw] bg-gradient-to-r from-transparent via-sky-300 to-transparent blur-[1px]`} animate={{ x: ["-45vw", "115vw"] }} transition={{ duration: 7 + index * 2, repeat: Infinity, ease: "linear", delay: index }} />)}
    <nav className="relative mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/10 bg-white/[.06] px-4 py-3 backdrop-blur-2xl sm:px-5">
      <a href="#top" className="flex items-center gap-2 text-sm font-bold tracking-tight"><span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-cyan-300 to-blue-600"><ShieldCheck size={15}/></span>Settlement Truth</a>
      <div className="hidden gap-6 text-xs text-slate-300 md:flex"><a href="#evidence">Evidence</a><a href="#analytics">Analytics</a><a href="#ledger">Ledger</a></div>
      <button onClick={onLaunch} className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-950 shadow-[0_0_28px_rgba(125,211,252,.45)]">Launch Audit</button>
    </nav>
    <div id="top" className="relative mx-auto grid max-w-6xl gap-12 pb-20 pt-28 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <p className="mb-6 text-xs font-bold uppercase tracking-[.22em] text-cyan-300">Evidence-first reconciliation</p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[.98] tracking-[-.06em] sm:text-7xl">We create financial truth for <em className="font-serif font-normal text-cyan-200 [text-shadow:0_0_42px_rgba(56,189,248,.55)]">merchants.</em></h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-slate-300">Auditing every payment from customer charge to bank payout. Zero forced matches. Zero financial guesswork.</p>
        <div className="mt-9 flex flex-wrap gap-3"><button onClick={onLaunch} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950">Start evidence audit <ArrowRight size={16}/></button><a href="#evidence" className="rounded-full border border-white/15 bg-white/[.05] px-5 py-3 text-sm text-white backdrop-blur-xl">See the rules</a></div>
      </motion.div>
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="ml-auto w-full max-w-sm rounded-[28px] border border-white/10 bg-white/[.06] p-6 shadow-[0_8px_32px_rgba(0,0,0,.36)] backdrop-blur-2xl">
        <div className="mb-10 flex items-center justify-between"><span className="flex items-center gap-2 text-xs text-slate-300"><i className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]"/>Live evidence ledger</span><ArrowDownRight className="text-cyan-200" size={18}/></div>
        <p className="text-xs uppercase tracking-[.18em] text-slate-400">{label}</p><p className="mt-2 text-4xl font-semibold tracking-[-.05em]">{value}</p>
        <div className="mt-5 inline-flex rounded-full border border-cyan-200/15 bg-cyan-200/10 px-3 py-1 text-xs text-cyan-100">{audit.hasAudit ? `${audit.exceptions} item${audit.exceptions === 1 ? "" : "s"} need review` : "Upload source files to begin"}</div>
      </motion.div>
    </div>
    <div className="relative mx-auto flex max-w-6xl items-center gap-2 text-xs text-slate-400"><span className="grid size-7 place-items-center rounded-full border border-white/10"><ArrowDownRight size={13}/></span>{audit.hasAudit ? `${audit.total.toLocaleString()} source records evaluated` : "No evidence loaded — results will remain unclaimed"}</div>
  </section>;
}
