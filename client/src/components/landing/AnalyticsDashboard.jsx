import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';

const TABS = ['Reconciliation Flow', 'Breakpoints', 'Gateway Leakages'];

const CHART_DATA = [
  { month: 'Mar', cleared: 68, discrepancy: 4.2 },
  { month: 'Apr', cleared: 75, discrepancy: 5.8 },
  { month: 'May', cleared: 82, discrepancy: 6.1 },
  { month: 'Jun', cleared: 71, discrepancy: 8.4 },
  { month: 'Jul', cleared: 88, discrepancy: 7.2 },
  { month: 'Aug', cleared: 94, discrepancy: 13.3, peak: true },
  { month: 'Sep', cleared: 89, discrepancy: 9.1 },
];
const BREAKPOINT_DATA = [
  { month: 'Mar', val: 12 }, { month: 'Apr', val: 28 }, { month: 'May', val: 19 },
  { month: 'Jun', val: 45 }, { month: 'Jul', val: 33 },
  { month: 'Aug', val: 62, peak: true }, { month: 'Sep', val: 41 },
];
const LEAKAGE_DATA = [
  { month: 'Mar', val: 32000 }, { month: 'Apr', val: 48000 }, { month: 'May', val: 41000 },
  { month: 'Jun', val: 67000 }, { month: 'Jul', val: 55000 },
  { month: 'Aug', val: 98000, peak: true }, { month: 'Sep', val: 72000 },
];

// Flat rounded bar — same geometry, no gradient
function FlatBar({ x, y, width, height, fill }) {
  const r = 4;
  if (!height || height < 0) return null;
  return (
    <path
      d={`M${x},${y+height} L${x},${y+r} Q${x},${y} ${x+r},${y} L${x+width-r},${y} Q${x+width},${y} ${x+width},${y+r} L${x+width},${y+height} Z`}
      fill={fill}
    />
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-card-sm px-3 py-2 text-xs font-medium"
         style={{ color: 'var(--text-secondary)' }}>
      <p className="mb-1" style={{ color: 'var(--text-muted)', fontSize: 10 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: 'var(--text-primary)' }}>{p.value}</p>
      ))}
    </div>
  );
}

// Anomaly label — flat badge, no rounded-pill glow
function AnomalyBadge({ data, activeTab }) {
  const peak = data.find(d => d.peak);
  if (!peak) return null;
  const val = activeTab === 0
    ? `${peak.discrepancy}% discrepancy`
    : activeTab === 1
    ? `${peak.val} breakpoints`
    : `₹${(peak.val / 1000).toFixed(0)}K leaked`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="absolute -top-2 right-[10%] z-20"
    >
      <div className="badge badge-risk">↑ {val}</div>
    </motion.div>
  );
}

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState(0);

  const data    = activeTab === 0 ? CHART_DATA : activeTab === 1 ? BREAKPOINT_DATA : LEAKAGE_DATA;
  const dataKey = activeTab === 0 ? 'cleared' : 'val';
  // One bar color per tab — all from token set
  const barNormal = activeTab === 0 ? '#6366F1' : activeTab === 1 ? '#6366F1' : '#34D399';

  return (
    <section
      id="analytics"
      className="relative py-20"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="section-divider mb-20" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-10"
        >
          <p className="eyebrow">Analytics</p>
          <h2 className="text-3xl sm:text-4xl font-bold"
              style={{ color: 'var(--text-primary)' }}>
            See inside every payment cycle
          </h2>
        </motion.div>

        {/* Dashboard card — flat surface, no gradient fill, no blueprint grid */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.12 }}
          className="surface-card overflow-hidden"
          style={{ borderRadius: 16 }}
        >
          <div className="p-6 sm:p-8">
            {/* Top row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
              {/* Key stat */}
              <div>
                <p className="eyebrow">Total Cleared</p>
                <div className="flex items-end gap-2.5">
                  <span className="text-4xl font-bold tabular-nums"
                        style={{ color: 'var(--text-primary)' }}>₹895.6M</span>
                  <span className="text-sm font-semibold mb-1 flex items-center gap-1"
                        style={{ color: 'var(--status-success)' }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 8V2M2 5L5 2L8 5" stroke="currentColor" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    12.4%
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  vs. previous 6-month cycle
                </p>
              </div>

              {/* Tab switcher — using consistent tab-group class */}
              <div className="tab-group">
                {TABS.map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`tab-btn ${activeTab === i ? 'active' : ''}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Status row — circular mini gauges → flat stat rows */}
            <div className="flex flex-wrap gap-6 mb-8 pb-6"
                 style={{ borderBottom: '1px solid var(--border-sub)' }}>
              {[
                { label: 'Matched',    value: '97.4%', color: 'var(--status-success)' },
                { label: 'Exceptions', value: '2.1%',  color: 'var(--status-risk)' },
                { label: 'Pending',    value: '0.5%',  color: 'var(--status-warning)' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                       style={{ background: stat.color }} />
                  <span className="text-base font-bold tabular-nums"
                        style={{ color: stat.color }}>{stat.value}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="relative h-52">
              <AnomalyBadge data={data} activeTab={activeTab} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={26} margin={{ top: 16, right: 0, bottom: 0, left: -24 }}>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis
                        dataKey="month" axisLine={false} tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                      />
                      <YAxis
                        axisLine={false} tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Plus Jakarta Sans' }}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)', radius: 4 }} />
                      <Bar dataKey={dataKey} shape={<FlatBar />}>
                        {data.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.peak ? '#F87171' : barNormal}
                            fillOpacity={entry.peak ? 0.9 : 0.7}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
