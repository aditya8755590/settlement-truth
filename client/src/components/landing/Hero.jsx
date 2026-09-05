import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

// ─── Animated counter hook ────────────────────────────────────────────────
function useAnimatedCounter(target, duration = 2000, startDelay = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = performance.now();
      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, startDelay);
    return () => clearTimeout(timer);
  }, [target, duration, startDelay]);
  return value;
}

// ─── Light Streak Component ────────────────────────────────────────────────
const STREAKS = [
  { delay: 0, y: '18%', width: '35%', opacity: 0.6, duration: 5.5 },
  { delay: 1.2, y: '28%', width: '22%', opacity: 0.35, duration: 7 },
  { delay: 2.8, y: '12%', width: '45%', opacity: 0.45, duration: 6 },
  { delay: 0.5, y: '35%', width: '18%', opacity: 0.25, duration: 8 },
  { delay: 3.5, y: '22%', width: '30%', opacity: 0.5, duration: 5 },
  { delay: 1.8, y: '8%', width: '40%', opacity: 0.3, duration: 9 },
];

function LightStreak({ delay, y, width, opacity, duration }) {
  return (
    <motion.div
      className="absolute h-px pointer-events-none"
      style={{
        top: y,
        width,
        background: 'linear-gradient(90deg, transparent 0%, #38bdf8 40%, #ffffff 60%, #38bdf8 80%, transparent 100%)',
        filter: 'blur(0.5px)',
        opacity,
      }}
      animate={{ x: ['-120vw', '120vw'] }}
      transition={{
        repeat: Infinity,
        duration,
        delay,
        ease: 'linear',
        repeatDelay: 0,
      }}
    />
  );
}

// ─── Floating KPI Card ─────────────────────────────────────────────────────
function FloatingKPICard() {
  const amount = useAnimatedCounter(42850, 1800, 1200);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 1.0 }}
      className="absolute top-24 right-6 lg:right-12 xl:right-20 z-20"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
        className="glass-card rounded-2xl p-5 w-64 shadow-[0_16px_64px_rgba(0,0,0,0.5)]"
      >
        {/* Live indicator */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative w-2.5 h-2.5">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            <span className="relative block w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Live</span>
        </div>

        {/* Label */}
        <p className="text-xs text-slate-400 mb-1 font-medium">Money at Risk Detected</p>

        {/* Amount */}
        <div className="text-3xl font-bold text-white tabular-nums mb-2">
          ₹{amount.toLocaleString('en-IN')}
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/20">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 2V5.5M5 7.5V8" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="text-xs font-semibold text-red-400">+18.4% vs last cycle</span>
        </div>

        {/* Decorative glow */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#38bdf8]/10 to-transparent pointer-events-none" />
      </motion.div>
    </motion.div>
  );
}

// ─── Main Hero Component ───────────────────────────────────────────────────
export default function Hero({ onLaunchAudit }) {
  const containerRef = useRef(null);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#030712] pt-20"
    >
      {/* ── Cosmic Background ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#2563eb]/[0.12] blur-[120px] rounded-full" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#a855f7]/[0.06] blur-[100px] rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-[#38bdf8]/[0.07] blur-[80px] rounded-full" />
        {/* Conic gradient accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-[#38bdf8]/30 to-transparent" />
      </div>

      {/* ── Light Streaks ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {STREAKS.map((s, i) => (
          <LightStreak key={i} {...s} />
        ))}
      </div>

      {/* ── Floating KPI Card ── */}
      <FloatingKPICard />

      {/* ── Hero Content ── */}
      <motion.div
        className="relative z-10 text-center max-w-4xl mx-auto px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Eyebrow badge */}
        <motion.div variants={itemVariants} className="mb-8 flex justify-center">
          <div className="glass-pill inline-flex items-center gap-2 px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
            <span className="text-xs font-semibold text-[#38bdf8] tracking-widest uppercase">
              Deterministic Reconciliation Engine
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-6"
        >
          We create{' '}
          <span className="block">
            financial truth for{' '}
          </span>
          <span className="font-serif-italic gradient-text-cyan">
            Merchants
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10 font-light"
        >
          Auditing every payment from customer charge to bank payout.{' '}
          <span className="text-slate-300 font-medium">Zero forced matches.</span>{' '}
          <span className="text-slate-300 font-medium">Zero financial guesswork.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <motion.button
            onClick={onLaunchAudit}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="glow-btn px-8 py-4 rounded-full text-white font-semibold text-base tracking-wide w-full sm:w-auto"
          >
            Start Free Audit
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.97 }}
            className="glass-pill px-8 py-4 rounded-full text-white font-semibold text-base tracking-wide flex items-center gap-3 w-full sm:w-auto justify-center"
          >
            <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
              <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
                <path d="M1 1L9 6L1 11V1Z"/>
              </svg>
            </span>
            Watch 2-Min Demo
          </motion.button>
        </motion.div>

        {/* Social Proof Scroll Pill */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="glass-pill inline-flex items-center gap-3 px-5 py-2.5 rounded-full">
            <div className="flex -space-x-1.5">
              {['#38bdf8', '#a855f7', '#10b981', '#f59e0b'].map((color, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ background: `${color}30`, borderColor: color + '50' }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="text-sm text-slate-300 font-medium">
              <span className="text-white font-bold">10M+</span> rows processed without failure
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Bottom Scroll Indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-slate-600 tracking-widest uppercase font-medium">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-full border border-white/10 flex items-center justify-center"
        >
          <div className="w-1 h-2 rounded-full bg-[#38bdf8]/60" />
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030712] to-transparent pointer-events-none" />
    </section>
  );
}
