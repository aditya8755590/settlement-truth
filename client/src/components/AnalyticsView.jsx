import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AnalyticsView() {
  // Generate 30 days of mock data
  const data = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      // Simulate realistic looking variance
      const base = 2000 + Math.random() * 3000;
      return {
        name: `Day ${i + 1}`,
        reconciled: Math.floor(base),
        anomalous: Math.floor(base * (Math.random() * 0.05 + 0.01)), // 1-6% anomaly rate
      };
    });
  }, []);

  return (
    <section className="w-full bg-[#040914] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.2 }}
          className="w-full bg-[#0d1424]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative overflow-hidden group"
        >
          {/* Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#9333ea]/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-[#9333ea]/20 transition-colors duration-700"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#3b82f6]/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-[#3b82f6]/20 transition-colors duration-700"></div>

          <div className="relative z-10 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest mb-2 font-sans">
                PERFORMANCE INSIGHTS
              </p>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Reconciliation <span className="font-serif italic font-light text-[#9333ea]">Velocity</span>
              </h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gradient-to-b from-[#60a5fa] to-[#9333ea]"></span>
                Reconciled
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gradient-to-b from-[#f4bd54] to-[#ea580c]"></span>
                Anomalous
              </span>
            </div>
          </div>

          <div className="w-full h-[400px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReconciled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                    <stop offset="100%" stopColor="#9333ea" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="colorAnomalous" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f4bd54" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity={1} />
                  </linearGradient>
                </defs>
                
                {/* Hide Grid lines completely */}
                
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 11 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 11 }} 
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
                />
                <Tooltip 
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  contentStyle={{ 
                    backgroundColor: "rgba(13, 20, 36, 0.9)", 
                    backdropFilter: "blur(10px)",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                  labelStyle={{ color: "#94a3b8", fontWeight: "bold", marginBottom: "8px" }}
                />
                
                <Bar 
                  dataKey="reconciled" 
                  name="Reconciled" 
                  fill="url(#colorReconciled)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={12}
                />
                <Bar 
                  dataKey="anomalous" 
                  name="Anomalous" 
                  fill="url(#colorAnomalous)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
