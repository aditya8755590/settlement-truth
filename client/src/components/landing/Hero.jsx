import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// ─── Animated counter ─────────────────────────────────────────────────────
function useAnimatedCounter(target, duration = 1800, startDelay = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(eased * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, startDelay);
    return () => clearTimeout(t);
  }, [target, duration, startDelay]);
  return value;
}

// ─── Light streaks (kept — they're genuine motion, not decoration) ─────────
const STREAKS = [
  { delay: 0,   y: '15%', width: '30%', opacity: 0.25, duration: 6 },
  { delay: 1.5, y: '30%', width: '18%', opacity: 0.15, duration: 8 },
  { delay: 3,   y: '10%', width: '40%', opacity: 0.20, duration: 5.5 },
  { delay: 0.8, y: '45%', width: '22%', opacity: 0.12, duration: 9 },
];

function LightStreak({ delay, y, width, opacity, duration }) {
  return (
    <motion.div
      className="absolute h-px pointer-events-none"
      style={{
        top: y, width,
        /* Use single accent color for streaks — no multi-color rainbow */
        background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.6) 50%, transparent 100%)',
        opacity,
      }}
      animate={{ x: ['-110vw', '110vw'] }}
      transition={{ repeat: Infinity, duration, delay, ease: 'linear' }}
    />
  );
}

// ─── KPI Card — flat surface, no float animation, no glow ────────────────
function KPICard() {
  const amount = useAnimatedCounter(42850, 1800, 1200);

  return (
    <motion.div
      initial={{ opacity: 0, x: 48, y: -8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 22, delay: 1.0 }}
      className="absolute top-24 right-6 lg:right-12 xl:right-20 z-20"
    >
      <div className="surface-card p-4 w-60 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {/* Live indicator */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative w-2 h-2">
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-60"
              style={{ background: 'var(--status-success)' }}
            />
            <span
              className="relative block w-2 h-2 rounded-full"
              style={{ background: 'var(--status-success)' }}
            />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}>
            Live
          </span>
        </div>

        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
          Money at Risk Detected
        </p>

        <div className="text-[28px] font-bold tabular-nums leading-none mb-3"
             style={{ color: 'var(--text-primary)' }}>
          ₹{amount.toLocaleString('en-IN')}
        </div>

        <div className="badge badge-risk">
          ↑ 18.4% vs last cycle
        </div>
      </div>
    </motion.div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────
export default function Hero({ onLaunchAudit }) {
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
  };

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg-base)', paddingTop: '80px' }}
    >
      {/* Minimal ambient — single accent radial, no purple/cyan blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)' }}
        />
        {/* Top hairline accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, var(--accent-border), transparent)' }}
        />
      </div>

      {/* Light streaks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {STREAKS.map((s, i) => <LightStreak key={i} {...s} />)}
      </div>

      {/* KPI Card */}
      <KPICard />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center max-w-4xl mx-auto px-6"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Eyebrow — plain text label, no pill/glow */}
        <motion.p variants={fadeUp} className="eyebrow mb-6">
          Deterministic Reconciliation Engine
        </motion.p>

        {/* Headline — serif italic kept here only */}
        <motion.h1
          variants={fadeUp}
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-[80px] font-bold leading-[1.04] tracking-tight mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          We create{' '}
          <span className="block">financial truth for</span>
          <span className="hero-serif" style={{ color: 'var(--accent)' }}>
            Merchants
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
          style={{ color: 'var(--text-secondary)' }}
        >
          Auditing every payment from customer charge to bank payout.{' '}
          <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            Zero forced matches.
          </strong>{' '}
          <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            Zero financial guesswork.
          </strong>
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
        >
          <button
            onClick={onLaunchAudit}
            className="btn-primary text-base px-7 py-3 w-full sm:w-auto"
          >
            Start Free Audit
          </button>
          <button
            className="btn-secondary text-base px-7 py-3 w-full sm:w-auto flex items-center gap-2.5"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 7L2 12V2Z" fill="currentColor" />
            </svg>
            Watch 2-Min Demo
          </button>
        </motion.div>

        {/* Proof — plain row, NO fake avatar circles */}
        <motion.div variants={fadeUp} className="flex justify-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--status-success)' }}
            />
            <span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>10M+</span>
              {' '}rows processed without failure
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--text-muted)' }}>Scroll</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="w-4 h-7 rounded-full flex items-start justify-center pt-1.5"
          style={{ border: '1px solid var(--border)' }}
        >
          <div className="w-0.5 h-2 rounded-full"
               style={{ background: 'var(--accent)', opacity: 0.6 }} />
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--bg-base), transparent)' }}
      />
    </section>
  );
}
