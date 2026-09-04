import React from "react";
import { motion } from "framer-motion";
import { Cpu, Bot, ShieldAlert, Clock } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 200, damping: 20 } 
  },
};

export default function Features() {
  return (
    <section className="w-full bg-[#040914] py-24 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[600px] bg-[#3b82f6]/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <p className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-widest mb-3 font-sans">
            Built for Scale
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            The modern <span className="font-serif italic font-light text-[#3b82f6]">financial</span> stack.
          </h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 auto-rows-[250px]"
        >
          {/* Card 1: O(N) Engine (Spans 2 columns) */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2 relative overflow-hidden bg-[#0d1424]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group hover:border-white/20 transition-colors"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00F0FF]/10 blur-3xl rounded-full group-hover:bg-[#00F0FF]/20 transition-colors pointer-events-none"></div>
            
            <div className="w-14 h-14 mb-6 rounded-2xl bg-[#00F0FF]/10 flex items-center justify-center border border-[#00F0FF]/30 shadow-[0_0_20px_rgba(0,240,255,0.2)] group-hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-shadow">
              <Cpu className="text-[#00F0FF] w-7 h-7 drop-shadow-[0_0_8px_#00F0FF]" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2 font-sans">O(N) Matching Engine</h3>
            <p className="text-slate-400 font-serif italic text-lg leading-relaxed max-w-md">
              4-pass deterministic pipeline parsing thousands of rows instantly with zero thread-blocking.
            </p>
          </motion.div>

          {/* Card 2: AI Explanations (Spans 2 rows) */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-1 md:row-span-2 relative overflow-hidden bg-gradient-to-b from-[#1056B3]/20 to-[#040914] backdrop-blur-xl border border-[#3b82f6]/30 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group hover:border-[#3b82f6]/50 transition-colors flex flex-col justify-between"
          >
            <div className="absolute bottom-0 right-0 w-full h-1/2 bg-[#3b82f6]/10 blur-3xl group-hover:bg-[#3b82f6]/20 transition-colors pointer-events-none"></div>
            
            <div>
              <div className="w-14 h-14 mb-6 rounded-2xl bg-[#3b82f6]/20 flex items-center justify-center border border-[#3b82f6]/40 shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-shadow">
                <Bot className="text-[#3b82f6] w-7 h-7 drop-shadow-[0_0_8px_#3b82f6]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 font-sans leading-tight">Deterministic AI Explanations</h3>
              <p className="text-slate-400 font-serif italic text-base leading-relaxed">
                Gemini translates structured anomaly data into actionable plain-English—strictly forbidden from math or guessing.
              </p>
            </div>
            
            {/* Decorative mockup inside the tall card */}
            <div className="mt-8 bg-[#040914]/80 border border-white/5 rounded-xl p-4 shadow-inner">
              <div className="flex gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              </div>
              <p className="text-[10px] text-[#3b82f6] font-mono leading-relaxed">
                "Payment cleared but Settlement amount mismatch. Expected ₹5,200, received ₹5,100."
              </p>
            </div>
          </motion.div>

          {/* Card 3: Zero Forced Matches (1 column, 1 row) */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden bg-[#0d1424]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group hover:border-white/20 transition-colors"
          >
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FF007A]/10 blur-2xl rounded-full group-hover:bg-[#FF007A]/20 transition-colors pointer-events-none"></div>
            
            <div className="w-12 h-12 mb-4 rounded-xl bg-[#FF007A]/10 flex items-center justify-center border border-[#FF007A]/30 shadow-[0_0_15px_rgba(255,0,122,0.2)] group-hover:shadow-[0_0_25px_rgba(255,0,122,0.4)] transition-shadow">
              <ShieldAlert className="text-[#FF007A] w-6 h-6 drop-shadow-[0_0_5px_#FF007A]" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 font-sans">Zero Forced Matches</h3>
            <p className="text-slate-400 font-serif italic text-sm leading-relaxed">
              When in doubt, we route to a human. Abstention is a core feature, not a bug.
            </p>
          </motion.div>

          {/* Card 4: Smart Tolerances (1 column, 1 row) */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden bg-[#0d1424]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group hover:border-white/20 transition-colors"
          >
            <div className="w-12 h-12 mb-4 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-shadow">
              <Clock className="text-amber-400 w-6 h-6 drop-shadow-[0_0_5px_#fbbf24]" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 font-sans">T+2 Window Tolerance</h3>
            <p className="text-slate-400 font-serif italic text-sm leading-relaxed">
              Handles gateway delays automatically while accounting for acceptable fee creep.
            </p>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
