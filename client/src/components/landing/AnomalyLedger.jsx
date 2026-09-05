import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TRANSACTIONS = [
  { id: 'ORD-88135', label: 'Razorpay MDR Overcharge', amount: '-₹128', type: 'fee', date: 'Aug 5' },
  { id: 'ORD-72041', label: 'Orphaned Charge — No Order', amount: '-₹3,420', type: 'orphan', date: 'Aug 3' },
  { id: 'ORD-64892', label: 'Duplicate Settlement Credit', amount: '+₹890', type: 'duplicate', date: 'Jul 31' },
  { id: 'ORD-55210', label: 'Gateway Fee Rounding Error', amount: '-₹12', type: 'fee', date: 'Jul 28' },
  { id: 'ORD-49033', label: 'Refund Not Propagated', amount: '-₹2,100', type: 'orphan', date: 'Jul 25' },
];

const TIMELINE_STEPS = [
  { label: 'Order Placed', time: '14:02:11', status: 'ok', icon: '📦' },
  { label: 'Gateway Captured', time: '14:02:14', status: 'ok', icon: '💳' },
  { label: 'Settlement', time: '—', status: 'broken', icon: '🔴' },
  { label: 'Bank Credit', time: '—', status: 'pending', icon: '🏦' },
];

// Odometer digit
function OdometerDigit({ digit }) {
  return (
    <div className="relative w-10 h-14 overflow-hidden rounded-lg bg-black/30 border border-white/[0.08] flex items-center justify-center mx-0.5">
      <motion.span
        key={digit}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-3xl font-bold tabular-nums text-white font-mono"
      >
        {digit}
      </motion.span>
    </div>
  );
}

function AuditCounter() {
  const [count, setCount] = useState(9998847);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3 + 1));
    }, 1200);
    return () => clearInterval(intervalRef.current);
  }, []);

  const digits = String(count).split('');

  return (
    <div className="bento-card rounded-2xl p-6 flex flex-col gap-5 h-full">
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Live Audit Counter</p>
        <h3 className="text-base font-bold text-white">Records Verified in Real-Time</h3>
      </div>

      {/* Odometer */}
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-0.5">
          {digits.map((d, i) => (
            <React.Fragment key={i}>
              {i > 0 && i % 3 === digits.length % 3 && (
                <span className="text-slate-600 text-xl font-bold mx-1">,</span>
              )}
              <OdometerDigit key={`${i}-${d}`} digit={d} />
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <div className="relative w-2.5 h-2.5">
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
          <span className="relative block w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs text-slate-400 font-medium">Incrementing live</span>
      </div>
    </div>
  );
}

function ExpenseTracker() {
  return (
    <div className="bento-card rounded-2xl p-6 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Leak Tracker</p>
          <h3 className="text-base font-bold text-white">Detected Exceptions</h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">Aug 2026</span>
      </div>

      <div className="space-y-2.5 flex-1">
        {TRANSACTIONS.map((tx, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 100, damping: 20 }}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors cursor-default"
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-7 h-7 rounded-lg flex items-center justify-center text-xs
                ${tx.type === 'fee' ? 'bg-amber-500/15 text-amber-400' :
                  tx.type === 'orphan' ? 'bg-red-500/15 text-red-400' :
                  'bg-emerald-500/15 text-emerald-400'}
              `}>
                {tx.type === 'fee' ? '⚠' : tx.type === 'orphan' ? '!' : '↑'}
              </div>
              <div>
                <p className="text-xs font-semibold text-white leading-tight">{tx.label}</p>
                <p className="text-[10px] text-slate-600 font-mono">{tx.id} · {tx.date}</p>
              </div>
            </div>
            <span className={`text-sm font-bold tabular-nums ${
              tx.amount.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {tx.amount}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 rounded-xl bg-[#2563eb]/20 border border-[#2563eb]/30 text-[#60a5fa] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#2563eb]/30 transition-colors mt-auto"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1V9M4 6L7 9L10 6M2 11H12" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Generate Evidence Packet
      </motion.button>
    </div>
  );
}

function TimelineDrawer() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bento-card rounded-2xl p-6 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Audit Pipeline</p>
          <h3 className="text-base font-bold text-white">ORD-88135 Timeline</h3>
        </div>
        <motion.button
          onClick={() => setExpanded(!expanded)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.span>
        </motion.button>
      </div>

      {/* Collapsed preview */}
      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white">Settlement step BROKEN</p>
          <p className="text-[10px] text-red-400 font-mono truncate">MDR applied: 2.45% vs expected 2.00%</p>
        </div>
      </div>

      {/* Expanded timeline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-1">
              {TIMELINE_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  {/* Connector */}
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0
                      ${step.status === 'ok' ? 'bg-emerald-500/20 border border-emerald-500/30' :
                        step.status === 'broken' ? 'bg-red-500/20 border border-red-500/50 animate-border-glow' :
                        'bg-white/[0.05] border border-white/[0.1]'}
                    `}>
                      {step.icon}
                    </div>
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div className={`w-px h-6 mt-1 ${
                        step.status === 'broken' ? 'bg-red-500/50' : 'bg-white/[0.08]'
                      }`} />
                    )}
                  </div>

                  <div className="pb-3">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-semibold ${
                        step.status === 'ok' ? 'text-white' :
                        step.status === 'broken' ? 'text-red-400' :
                        'text-slate-600'
                      }`}>
                        {step.status === 'broken' && '✕ BROKEN: '}{step.label}
                      </p>
                      <span className="text-[10px] text-slate-600 font-mono">{step.time}</span>
                    </div>
                    {step.status === 'broken' && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-2 p-2.5 rounded-lg bg-[#a855f7]/10 border border-[#a855f7]/20"
                      >
                        <p className="text-[10px] text-[#c084fc] font-semibold mb-0.5">✦ Gemini AI</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Settlement deducted ₹128 excess MDR. Gateway applied 2.45% instead of contracted 2.00%. Action: dispute via Razorpay dashboard.
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnomalyLedger() {
  return (
    <section className="relative py-24 bg-[#030712] overflow-hidden">
      {/* Dark ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#a855f7]/[0.04] blur-[100px] rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#2563eb]/[0.05] blur-[80px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-slate-500 block mb-4">
            The Anomaly Ledger
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
            Every exception.{' '}
            <span className="font-serif-italic" style={{ color: '#a855f7' }}>Traceable.</span>
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto font-light">
            Not just detected — every discrepancy has a paper trail, a timestamp, and an explanation.
          </p>
        </motion.div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[ExpenseTracker, AuditCounter, TimelineDrawer].map((Card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.1 }}
            >
              <Card />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
