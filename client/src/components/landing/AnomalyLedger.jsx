import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TRANSACTIONS = [
  { id: 'ORD-88135', label: 'Razorpay MDR Overcharge',     amount: '-₹128',   type: 'fee',       date: 'Aug 5' },
  { id: 'ORD-72041', label: 'Orphaned Charge — No Order',  amount: '-₹3,420', type: 'orphan',    date: 'Aug 3' },
  { id: 'ORD-64892', label: 'Duplicate Settlement Credit', amount: '+₹890',   type: 'duplicate', date: 'Jul 31' },
  { id: 'ORD-55210', label: 'Gateway Fee Rounding Error',  amount: '-₹12',    type: 'fee',       date: 'Jul 28' },
  { id: 'ORD-49033', label: 'Refund Not Propagated',       amount: '-₹2,100', type: 'orphan',    date: 'Jul 25' },
];

const TIMELINE_STEPS = [
  { label: 'Order Placed',     time: '14:02:11', status: 'ok',      icon: '📦' },
  { label: 'Gateway Captured', time: '14:02:14', status: 'ok',      icon: '💳' },
  { label: 'Settlement',       time: '—',        status: 'broken',  icon: '🔴' },
  { label: 'Bank Credit',      time: '—',        status: 'pending', icon: '🏦' },
];

// Odometer — flat digit cell, consistent radius
function OdometerDigit({ digit }) {
  return (
    <div
      className="relative w-9 h-12 overflow-hidden rounded-md flex items-center justify-center mx-[1px]"
      style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
    >
      <motion.span
        key={digit}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="text-2xl font-bold tabular-nums font-mono"
        style={{ color: 'var(--text-primary)' }}
      >
        {digit}
      </motion.span>
    </div>
  );
}

function AuditCounter() {
  const [count, setCount] = useState(9998847);
  const iv = useRef(null);

  useEffect(() => {
    iv.current = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 3 + 1));
    }, 1200);
    return () => clearInterval(iv.current);
  }, []);

  const digits = String(count).split('');

  return (
    <div className="surface-card p-5 flex flex-col gap-4 h-full">
      <div>
        <p className="eyebrow">Live Audit Counter</p>
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          Records Verified in Real-Time
        </h3>
      </div>

      <div className="flex items-center justify-center py-4">
        <div className="flex items-center">
          {digits.map((d, i) => (
            <React.Fragment key={i}>
              {i > 0 && i % 3 === digits.length % 3 && (
                <span className="text-lg font-bold mx-0.5" style={{ color: 'var(--text-muted)' }}>,</span>
              )}
              <OdometerDigit key={`${i}-${d}`} digit={d} />
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <div className="relative w-2 h-2">
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-50"
            style={{ background: 'var(--status-success)' }}
          />
          <span className="relative block w-2 h-2 rounded-full"
                style={{ background: 'var(--status-success)' }} />
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Incrementing live
        </span>
      </div>
    </div>
  );
}

function LeakTracker() {
  const typeStyle = {
    fee:       { color: 'var(--status-warning)', label: '⚠' },
    orphan:    { color: 'var(--status-risk)',    label: '!' },
    duplicate: { color: 'var(--status-success)', label: '↑' },
  };

  return (
    <div className="surface-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Leak Tracker</p>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Detected Exceptions
          </h3>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Aug 2026</span>
      </div>

      <div className="space-y-2 flex-1">
        {TRANSACTIONS.map((tx, i) => {
          const st = typeStyle[tx.type];
          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 100, damping: 20 }}
              className="flex items-center justify-between p-2.5 rounded-lg cursor-default transition-colors"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-sub)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: `${st.color}14`,
                    color: st.color,
                    border: `1px solid ${st.color}22`,
                  }}
                >
                  {st.label}
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight"
                     style={{ color: 'var(--text-primary)' }}>{tx.label}</p>
                  <p className="text-[10px] font-mono"
                     style={{ color: 'var(--text-muted)' }}>{tx.id} · {tx.date}</p>
                </div>
              </div>
              <span
                className="text-sm font-bold tabular-nums flex-shrink-0 ml-2"
                style={{ color: tx.amount.startsWith('+') ? 'var(--status-success)' : 'var(--status-risk)' }}
              >
                {tx.amount}
              </span>
            </motion.div>
          );
        })}
      </div>

      <button className="btn-secondary w-full py-2.5 text-xs mt-auto flex items-center justify-center gap-2">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1V8M4 6L6 8L8 6M2 10H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Generate Evidence Packet
      </button>
    </div>
  );
}

function TimelineDrawer() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="surface-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Audit Pipeline</p>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            ORD-88135 Timeline
          </h3>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
          style={{
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          <motion.span animate={{ rotate: expanded ? 180 : 0 }}
                       transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.span>
        </button>
      </div>

      {/* Alert row */}
      <div
        className="p-3 rounded-lg flex items-center gap-3"
        style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0"
             style={{ background: 'var(--status-risk)' }} />
        <div className="min-w-0">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            Settlement step BROKEN
          </p>
          <p className="text-[10px] font-mono truncate"
             style={{ color: 'var(--status-risk)' }}>
            MDR applied: 2.45% vs expected 2.00%
          </p>
        </div>
      </div>

      {/* Timeline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pt-1">
              {TIMELINE_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                      style={{
                        background: step.status === 'ok'
                          ? 'rgba(52,211,153,0.12)'
                          : step.status === 'broken'
                          ? 'rgba(248,113,113,0.12)'
                          : 'var(--bg-raised)',
                        border: `1px solid ${
                          step.status === 'ok'     ? 'rgba(52,211,153,0.25)'
                          : step.status === 'broken' ? 'rgba(248,113,113,0.3)'
                          : 'var(--border)'
                        }`,
                      }}
                    >
                      {step.icon}
                    </div>
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div className="w-px h-5 mt-1"
                           style={{ background: step.status === 'broken' ? 'rgba(248,113,113,0.3)' : 'var(--border)' }} />
                    )}
                  </div>

                  <div className="pb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold"
                         style={{ color: step.status === 'broken' ? 'var(--status-risk)' : step.status === 'ok' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {step.status === 'broken' ? '✕ ' : ''}{step.label}
                      </p>
                      <span className="text-[10px] font-mono"
                            style={{ color: 'var(--text-muted)' }}>{step.time}</span>
                    </div>

                    {step.status === 'broken' && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        className="mt-2 p-2.5 rounded-lg"
                        style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                           style={{ color: 'var(--accent)' }}>Gemini AI</p>
                        <p className="text-[10px] leading-relaxed"
                           style={{ color: 'var(--text-secondary)' }}>
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
    <section className="relative py-20" style={{ background: 'var(--bg-base)' }}>
      <div className="section-divider mb-20" />

      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-12"
        >
          <p className="eyebrow">The Anomaly Ledger</p>
          <h2 className="text-3xl sm:text-4xl font-bold"
              style={{ color: 'var(--text-primary)' }}>
            Every exception.{' '}
            <span style={{ color: 'var(--accent)', fontWeight: 800 }}>Traceable.</span>
          </h2>
          <p className="text-base mt-3 max-w-lg"
             style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Not just detected — every discrepancy has a paper trail, a timestamp, and an explanation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[LeakTracker, AuditCounter, TimelineDrawer].map((Card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.1 }}
              className="h-full"
            >
              <Card />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
