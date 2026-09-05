import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Card 1: Orphaned Charges ─────────────────────────────────────────────
function OrphanedChargesCard() {
  const [isOn, setIsOn] = useState(false);

  return (
    <div className="bento-card p-6 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Orphaned Charges</p>
          <h3 className="text-base font-bold text-white">Customer Debited ≠ Merchant Credited</h3>
        </div>
        <div className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#ef4444" strokeWidth="1.5"/>
            <path d="M8 5V8.5M8 10.5V11" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Toggle state display */}
      <div className="relative rounded-xl overflow-hidden bg-black/20 p-4">
        <AnimatePresence mode="wait">
          {!isOn ? (
            <motion.div
              key="normal"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs">💳</div>
                  <div>
                    <p className="text-xs font-semibold text-white">Customer Card</p>
                    <p className="text-[10px] text-slate-500">Axis Bank •••• 4891</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-red-400">-₹3,420</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] text-slate-600 font-mono">MATCHED</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">🏦</div>
                  <div>
                    <p className="text-xs font-semibold text-white">Merchant Order</p>
                    <p className="text-[10px] text-slate-500">ORD-88135 — Settled</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-400">+₹3,420</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="orphaned"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-xs">💳</div>
                  <div>
                    <p className="text-xs font-semibold text-white">Customer Card</p>
                    <p className="text-[10px] text-red-400">Charged ₹3,420</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-red-400">-₹3,420</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="h-px flex-1 bg-red-500/30" />
                <span className="text-[10px] text-red-400 font-mono">ORPHANED</span>
                <div className="h-px flex-1 bg-red-500/30" />
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs">❌</div>
                  <div>
                    <p className="text-xs font-semibold text-white">Merchant Order</p>
                    <p className="text-[10px] text-slate-500">Missing in settlements</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-600">₹0</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs text-slate-500">{isOn ? 'Showing anomaly' : 'Normal state'}</span>
        <button
          onClick={() => setIsOn(!isOn)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${isOn ? 'bg-red-500' : 'bg-white/10'}`}
        >
          <motion.div
            animate={{ x: isOn ? 22 : 2 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
          />
        </button>
      </div>
    </div>
  );
}

// ─── Card 2: Gateway Fee Creep ─────────────────────────────────────────────
function FeeCreepCard() {
  return (
    <div className="bento-card p-6 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Gateway Fee Creep</p>
          <h3 className="text-base font-bold text-white">MDR Deduction Mismatch</h3>
        </div>
        <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
          <span className="text-base">⚠️</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Expected */}
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Expected MDR</span>
            <span className="text-lg font-bold text-emerald-400 tabular-nums">2.00%</span>
          </div>
          <div className="h-2 rounded-full bg-emerald-500/20 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '40%' }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full rounded-full bg-emerald-500"
            />
          </div>
        </div>

        {/* Actual */}
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Actual Deducted</span>
            <span className="text-lg font-bold text-red-400 tabular-nums">2.45%</span>
          </div>
          <div className="h-2 rounded-full bg-red-500/20 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '49%' }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full rounded-full bg-red-500"
            />
          </div>
        </div>

        {/* Gap callout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
        >
          <span className="text-xs text-amber-400 font-semibold">Extra Charged</span>
          <span className="text-base font-bold text-amber-300 tabular-nums">+₹128 / txn</span>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Card 3: Deterministic Engine ─────────────────────────────────────────
function DeterministicCard() {
  const [active, setActive] = useState(false);

  return (
    <div className="bento-card p-6 flex flex-col gap-5 h-full col-span-1 md:col-span-2 lg:col-span-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Deterministic Engine</p>
          <h3 className="text-base font-bold text-white">O(N) Hash Map Execution</h3>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/20 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 4H13M3 8H9M3 12H11" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { rows: '1,000', time: '< 1ms', pct: 12 },
          { rows: '10,000', time: '< 4ms', pct: 35 },
          { rows: '50,000', time: '< 12ms', pct: 70 },
          { rows: '1,00,000', time: '< 22ms', pct: 90 },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono w-20 shrink-0">{item.rows}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${item.pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 + 0.3, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #38bdf8, #2563eb)',
                  boxShadow: '0 0 8px rgba(56,189,248,0.5)',
                }}
              />
            </div>
            <span className="text-xs text-[#38bdf8] font-mono font-semibold w-14 text-right">{item.time}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
          <span className="text-xs text-slate-400 font-medium">
            50,000 records reconciled in <span className="text-[#38bdf8] font-bold">{'<'}12ms</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Card 4: Responsible AI ───────────────────────────────────────────────
function AITranslationCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bento-card p-6 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Responsible AI</p>
          <h3 className="text-base font-bold text-white">Plain-English Insight Layer</h3>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#a855f7]/15 border border-[#a855f7]/20 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L9.5 6H14L10.5 8.5L12 12.5L8 10L4 12.5L5.5 8.5L2 6H6.5L8 2Z" stroke="#a855f7" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Raw JSON log */}
      <div className="rounded-xl bg-black/30 border border-white/[0.06] p-3 font-mono text-[10px] text-slate-600 leading-relaxed overflow-hidden">
        <span className="text-slate-500">{'{'}</span><br/>
        &nbsp;&nbsp;<span className="text-[#38bdf8]">"order_id"</span>: <span className="text-amber-400">"ORD-88135"</span>,<br/>
        &nbsp;&nbsp;<span className="text-[#38bdf8]">"status"</span>: <span className="text-red-400">"SETTLEMENT_GAP"</span>,<br/>
        &nbsp;&nbsp;<span className="text-[#38bdf8]">"delta_inr"</span>: <span className="text-red-400">-128.00</span>,<br/>
        &nbsp;&nbsp;<span className="text-[#38bdf8]">"mdr_applied"</span>: <span className="text-amber-400">0.0245</span><br/>
        <span className="text-slate-500">{'}'}</span>
      </div>

      {/* AI translation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="p-3.5 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/20"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold text-[#a855f7] tracking-widest uppercase">Gemini AI</span>
          <div className="h-px flex-1 bg-[#a855f7]/20" />
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-white">Order ORD-88135</span> was charged ₹128 more in gateway MDR than your agreed rate. The gateway applied <span className="text-amber-300">2.45%</span> instead of <span className="text-emerald-400">2.00%</span>. Raise a dispute ticket with your payment gateway.
        </p>
      </motion.div>
    </div>
  );
}

// ─── Main BentoGrid ───────────────────────────────────────────────────────
export default function BentoGrid() {
  return (
    <section className="relative py-24 bg-[#030712] overflow-hidden" id="features">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-slate-500 block mb-4">
            What We Catch
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
            Four failure modes.{' '}
            <span className="font-serif-italic gradient-text-cyan">Zero tolerance.</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base font-light">
            Every exception type is detected, classified, and traced back to its exact source — no black boxes.
          </p>
        </motion.div>

        {/* 2x2 Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[OrphanedChargesCard, FeeCreepCard, DeterministicCard, AITranslationCard].map((Card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
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
