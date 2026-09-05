import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Card 1: Orphaned Charges ─────────────────────────────────────────────
function OrphanedChargesCard() {
  const [showAnomaly, setShowAnomaly] = useState(false);

  return (
    <div className="surface-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1"
             style={{ color: 'var(--text-muted)' }}>
            Orphaned Charges
          </p>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Customer Debited ≠ Merchant Credited
          </h3>
        </div>
        <div className="badge badge-risk shrink-0 mt-0.5">Critical</div>
      </div>

      {/* State display */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-sub)' }}>
        <AnimatePresence mode="wait">
          {!showAnomaly ? (
            <motion.div key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="p-3 space-y-2">
              <TxRow icon="💳" label="Customer Card" sub="Axis Bank •••• 4891" amount="-₹3,420" status="ok" />
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>MATCHED</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              <TxRow icon="🏦" label="Merchant Order" sub="ORD-88135 — Settled" amount="+₹3,420" status="ok" />
            </motion.div>
          ) : (
            <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="p-3 space-y-2">
              <TxRow icon="💳" label="Customer Card" sub="Charged ₹3,420" amount="-₹3,420" status="risk" />
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px" style={{ background: 'rgba(248,113,113,0.3)' }} />
                <span className="text-[10px] font-mono" style={{ color: 'var(--status-risk)' }}>ORPHANED</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(248,113,113,0.3)' }} />
              </div>
              <TxRow icon="❌" label="Merchant Order" sub="Missing in settlements" amount="₹0" status="muted" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {showAnomaly ? 'Showing anomaly state' : 'Normal state'}
        </span>
        <button
          onClick={() => setShowAnomaly(v => !v)}
          className="relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
          style={{ background: showAnomaly ? 'var(--status-risk)' : 'var(--border)' }}
        >
          <motion.div
            animate={{ x: showAnomaly ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
          />
        </button>
      </div>
    </div>
  );
}

function TxRow({ icon, label, sub, amount, status }) {
  const amountColor = status === 'ok' && amount.startsWith('+')
    ? 'var(--status-success)'
    : status === 'risk' || amount.startsWith('-')
    ? 'var(--status-risk)'
    : 'var(--text-muted)';

  return (
    <div className="flex items-center justify-between p-2 rounded-md"
         style={{ background: 'var(--bg-surface)' }}>
      <div className="flex items-center gap-2">
        <span className="text-xs w-5 text-center">{icon}</span>
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        </div>
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color: amountColor }}>{amount}</span>
    </div>
  );
}

// ─── Card 2: Fee Creep ────────────────────────────────────────────────────
function FeeCreepCard() {
  return (
    <div className="surface-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1"
             style={{ color: 'var(--text-muted)' }}>Gateway Fee Creep</p>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            MDR Deduction Mismatch
          </h3>
        </div>
        <div className="badge badge-warning shrink-0 mt-0.5">Warning</div>
      </div>

      <div className="space-y-3">
        {[
          { label: 'Expected MDR', val: '2.00%', w: '40%', color: 'var(--status-success)' },
          { label: 'Actual Deducted', val: '2.45%', w: '49%', color: 'var(--status-risk)' },
        ].map((row) => (
          <div key={row.label}
               className="p-3 rounded-lg"
               style={{ background: 'var(--bg-base)', border: '1px solid var(--border-sub)' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: row.color }}>{row.label}</span>
              <span className="text-base font-bold tabular-nums"
                    style={{ color: row.color }}>{row.val}</span>
            </div>
            <div className="h-1 rounded-full" style={{ background: 'var(--border)' }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: row.w }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="h-1 rounded-full"
                style={{ background: row.color }}
              />
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between p-2.5 rounded-lg"
             style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--status-warning)' }}>
            Extra Charged
          </span>
          <span className="text-sm font-bold tabular-nums"
                style={{ color: 'var(--status-warning)' }}>+₹128 / txn</span>
        </div>
      </div>
    </div>
  );
}

// ─── Card 3: Deterministic Engine ─────────────────────────────────────────
function DeterministicCard() {
  const rows = [
    { rows: '1,000',    time: '<1ms',  pct: 12 },
    { rows: '10,000',   time: '<4ms',  pct: 35 },
    { rows: '50,000',   time: '<12ms', pct: 70 },
    { rows: '1,00,000', time: '<22ms', pct: 90 },
  ];

  return (
    <div className="surface-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1"
             style={{ color: 'var(--text-muted)' }}>Deterministic Engine</p>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            O(N) Hash Map Execution
          </h3>
        </div>
        <div className="badge badge-success shrink-0 mt-0.5">Verified</div>
      </div>

      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[11px] font-mono w-18 shrink-0"
                  style={{ color: 'var(--text-muted)', width: 72 }}>{r.rows}</span>
            <div className="flex-1 h-1 rounded-full" style={{ background: 'var(--border)' }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${r.pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                className="h-1 rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            </div>
            <span className="text-[11px] font-mono font-semibold shrink-0"
                  style={{ color: 'var(--accent)', width: 36, textAlign: 'right' }}>
              {r.time}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-3 flex items-center gap-2"
           style={{ borderTop: '1px solid var(--border-sub)' }}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: 'var(--status-success)' }} />
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          50,000 records reconciled in{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>&lt;12ms</span>
        </span>
      </div>
    </div>
  );
}

// ─── Card 4: AI Translation ───────────────────────────────────────────────
function AITranslationCard() {
  return (
    <div className="surface-card p-5 flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1"
             style={{ color: 'var(--text-muted)' }}>Responsible AI</p>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Plain-English Insight Layer
          </h3>
        </div>
        <div className="badge badge-neutral shrink-0 mt-0.5">Optional</div>
      </div>

      {/* JSON log */}
      <div className="rounded-lg p-3 font-mono text-[10px] leading-relaxed"
           style={{ background: 'var(--bg-base)', border: '1px solid var(--border-sub)',
                    color: 'var(--text-muted)' }}>
        <span>{'{'}</span><br/>
        &nbsp;&nbsp;<span style={{ color: '#6366F1' }}>"order_id"</span>:{' '}
        <span style={{ color: '#FBBF24' }}>"ORD-88135"</span>,<br/>
        &nbsp;&nbsp;<span style={{ color: '#6366F1' }}>"status"</span>:{' '}
        <span style={{ color: '#F87171' }}>"SETTLEMENT_GAP"</span>,<br/>
        &nbsp;&nbsp;<span style={{ color: '#6366F1' }}>"delta_inr"</span>:{' '}
        <span style={{ color: '#F87171' }}>-128.00</span>,<br/>
        &nbsp;&nbsp;<span style={{ color: '#6366F1' }}>"mdr_applied"</span>:{' '}
        <span style={{ color: '#FBBF24' }}>0.0245</span><br/>
        <span>{'}'}</span>
      </div>

      {/* AI output */}
      <div className="rounded-lg p-3"
           style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
           style={{ color: 'var(--accent)' }}>Gemini AI</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Order ORD-88135</span>{' '}
          was charged ₹128 more in gateway MDR than your agreed rate. The gateway applied{' '}
          <span style={{ color: 'var(--status-warning)', fontWeight: 600 }}>2.45%</span> instead of{' '}
          <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>2.00%</span>.
          Raise a dispute ticket with your payment gateway.
        </p>
      </div>
    </div>
  );
}

// ─── BentoGrid ────────────────────────────────────────────────────────────
export default function BentoGrid() {
  return (
    <section
      id="features"
      className="relative py-20"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="section-divider mb-20" />

      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-12"
        >
          <p className="eyebrow">What We Catch</p>
          <h2 className="text-3xl sm:text-4xl font-bold"
              style={{ color: 'var(--text-primary)' }}>
            Four failure modes. Zero tolerance.
          </h2>
          <p className="text-base mt-3 max-w-lg"
             style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Every exception type is detected, classified, and traced back to its exact
            source — no black boxes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[OrphanedChargesCard, FeeCreepCard, DeterministicCard, AITranslationCard].map(
            (Card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.08 }}
                className="h-full"
              >
                <Card />
              </motion.div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
