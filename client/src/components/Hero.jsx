import React from "react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 py-16 px-6">
      {/* Left Content */}
      <div className="flex-1 max-w-2xl flex flex-col gap-8 relative z-10">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-sans leading-tight">
          Reconcile with confidence.
        </h1>
        <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
          The AI-native finance controller that detects anomalies, matches records instantly, and secures your revenue automatically.
        </p>
        <div className="flex items-center gap-4">
          <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all flex items-center gap-2">
            Start Free Trial <span className="text-xl leading-none">&rarr;</span>
          </button>
          <button className="px-8 py-4 bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 text-slate-300 rounded-full font-semibold transition-all backdrop-blur-sm">
            Learn More
          </button>
        </div>
      </div>

      {/* Right Content - Floating Glass Card */}
      <div className="relative flex-1 w-full flex justify-center lg:justify-end min-h-[300px]">
        {/* Glow behind the card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>
        
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="relative z-10 w-full max-w-sm bg-[#0a0f1c]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)]">
              <span className="text-xl">🛡</span>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-widest">
              Live Feed
            </span>
          </div>
          
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 font-sans">Money Protected</p>
          <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200 tracking-tighter drop-shadow-[0_0_15px_rgba(52,211,153,0.2)]">
            ₹10,629
          </p>
          
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-sm font-medium text-slate-300">ORD-88135</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">Matched</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-sm font-medium text-slate-300">ORD-12004</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">Matched</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
