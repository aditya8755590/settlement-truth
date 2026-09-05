import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid
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
  { month: 'Mar', val: 12, type: 'Orphan' },
  { month: 'Apr', val: 28, type: 'Orphan' },
  { month: 'May', val: 19, type: 'Fee' },
  { month: 'Jun', val: 45, type: 'Orphan' },
  { month: 'Jul', val: 33, type: 'Fee' },
  { month: 'Aug', val: 62, type: 'Orphan', peak: true },
  { month: 'Sep', val: 41, type: 'Fee' },
];

const LEAKAGE_DATA = [
  { month: 'Mar', val: 32000 },
  { month: 'Apr', val: 48000 },
  { month: 'May', val: 41000 },
  { month: 'Jun', val: 67000 },
  { month: 'Jul', val: 55000 },
  { month: 'Aug', val: 98000, peak: true },
  { month: 'Sep', val: 72000 },
];

// Custom bar shape with rounded top
function RoundedBar(props) {
  const { x, y, width, height, fill } = props;
  const radius = 6;
  if (!height || height < 0) return null;
  return (
    <path
      d={`M${x},${y + height} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + width - radius},${y} Q${x + width},${y} ${x + width},${y + radius} L${x + width},${y + height} Z`}
      fill={fill}
    />
  );
}

// Custom tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl px-3.5 py-2.5 text-xs font-semibold">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

// Floating anomaly badge
function AnomalyBadge({ data, activeTab }) {
  const peak = data.find((d) => d.peak);
  if (!peak) return null;
  const val = activeTab === 0
    ? `${peak.discrepancy}% Discrepancy Caught`
    : activeTab === 1
    ? `${peak.val} Breakpoints`
    : `₹${(peak.val / 1000).toFixed(0)}K Leaked`;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, type: 'spring', stiffness: 100 }}
      className="absolute -top-3 right-[11%] z-20"
    >
      <div className="px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-xs font-bold text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] whitespace-nowrap">
        ↑ {val}
      </div>
    </motion.div>
  );
}

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState(0);

  const data = activeTab === 0 ? CHART_DATA : activeTab === 1 ? BREAKPOINT_DATA : LEAKAGE_DATA;
  const dataKey = activeTab === 0 ? 'cleared' : 'val';
  const barColor = activeTab === 0 ? '#60a5fa' : activeTab === 1 ? '#a855f7' : '#34d399';

  return (
    <section className="relative py-24 bg-[#030712] overflow-hidden" id="analytics">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-[#1d4ed8]/[0.07] blur-[100px] rounded-full" />
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
            Interactive Analytics
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
            See inside every{' '}
            <span className="font-serif-italic gradient-text-blue">payment cycle</span>
          </h2>
        </motion.div>

        {/* Main Dashboard Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.15 }}
          className="rounded-3xl overflow-hidden border border-[#1e40af]/30"
          style={{
            background: 'linear-gradient(145deg, #0f1f4a 0%, #0d1b3e 40%, #0a1530 100%)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 80px rgba(37,99,235,0.1)',
          }}
        >
          {/* Blueprint grid overlay */}
          <div className="blueprint-grid absolute inset-0 rounded-3xl opacity-40 pointer-events-none" />

          <div className="relative z-10 p-6 sm:p-8">
            {/* Top row: Stats + Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              {/* Key metric */}
              <div>
                <p className="text-xs text-blue-300/60 uppercase tracking-widest font-semibold mb-1">
                  Total Cleared
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-white tabular-nums">₹895.6M</span>
                  <span className="text-sm text-emerald-400 font-semibold mb-1.5 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 9V3M3 6L6 3L9 6" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    12.4%
                  </span>
                </div>
                <p className="text-xs text-blue-300/40 mt-1">vs. previous 6-month cycle</p>
              </div>

              {/* Tab switcher */}
              <div className="flex items-center gap-1 p-1 rounded-full bg-black/20 border border-white/[0.06]">
                {TABS.map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`
                      px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300
                      ${activeTab === i
                        ? 'bg-[#2563eb] text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]'
                        : 'text-blue-300/50 hover:text-blue-300/80'
                      }
                    `}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Circular gauge row */}
            <div className="flex flex-wrap gap-6 mb-8">
              {[
                { label: 'Matched', value: '97.4%', color: '#34d399', angle: 350 },
                { label: 'Exceptions', value: '2.1%', color: '#f59e0b', angle: 45 },
                { label: 'Pending', value: '0.5%', color: '#a855f7', angle: 18 },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
                      <motion.circle
                        cx="20" cy="20" r="16" fill="none"
                        stroke={stat.color} strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(stat.angle / 360) * 100} 100`}
                        pathLength="100"
                        initial={{ strokeDasharray: '0 100' }}
                        whileInView={{ strokeDasharray: `${(stat.angle / 360) * 100} 100` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.2 + 0.5 }}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', filter: `drop-shadow(0 0 4px ${stat.color})` }}
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-bold text-white tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[10px] text-blue-300/50 font-medium">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div className="relative h-56">
              <AnomalyBadge data={data} activeTab={activeTab} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={28} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(147,197,253,0.4)', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(147,197,253,0.4)', fontSize: 10, fontFamily: 'Plus Jakarta Sans' }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }} />
                      <Bar dataKey={dataKey} shape={<RoundedBar />} radius={[6, 6, 0, 0]}>
                        {data.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.peak
                              ? `url(#peakGradient-${activeTab})`
                              : `url(#barGradient-${activeTab})`
                            }
                          />
                        ))}
                        <defs>
                          <linearGradient id={`barGradient-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={barColor} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={barColor} stopOpacity={0.2} />
                          </linearGradient>
                          <linearGradient id={`peakGradient-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.4} />
                          </linearGradient>
                        </defs>
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
