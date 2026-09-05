import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const METRICS = [
  {
    value: 10,
    suffix: 'M+',
    label: 'Transactions Reconciled',
    sublabel: 'Without a single hallucinated match',
    color: '#38bdf8',
    unit: '',
  },
  {
    value: 1.4,
    suffix: 'Cr',
    label: 'Leakage Recovered',
    sublabel: 'Returned to merchant accounts',
    color: '#10b981',
    unit: '₹',
    isDecimal: true,
  },
  {
    value: 100,
    suffix: '%',
    label: 'Deterministic Rule Accuracy',
    sublabel: 'O(N) hash-map — no ML drift',
    color: '#a855f7',
    unit: '',
  },
  {
    value: 0,
    suffix: '',
    label: 'Hallucinated Balances',
    sublabel: 'Every figure is provably sourced',
    color: '#f59e0b',
    unit: '',
  },
];

// Dashed Arc SVG
function ArcGauge({ progress = 0.75, color = '#38bdf8' }) {
  const r = 88;
  const cx = 110;
  const cy = 110;
  const total = Math.PI * r; // half circle
  const dashOffset = total * (1 - progress);

  // Particle positions on arc
  const particles = [0.1, 0.3, 0.55, 0.75, 0.92].map((t) => {
    const angle = Math.PI + t * Math.PI;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      size: t === 0.55 ? 5 : t === 0.92 ? 4 : 3,
    };
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg width="220" height="130" viewBox="0 0 220 130" className="overflow-visible">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="3"
          strokeDasharray="6 8"
          strokeLinecap="round"
        />

        {/* Progress arc */}
        <motion.path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${total}`}
          strokeLinecap="round"
          initial={{ strokeDashoffset: total }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />

        {/* Glow particles */}
        {particles.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill={color}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0.4, 1, 0.4], scale: 1 }}
            transition={{
              opacity: { repeat: Infinity, duration: 2, delay: i * 0.3 },
              scale: { duration: 0.5, delay: i * 0.1 + 0.5 },
            }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        ))}

        {/* Center tick lines */}
        {[-60, -30, 0, 30, 60].map((deg, i) => {
          const rad = (Math.PI + (deg + 90) * (Math.PI / 180));
          const x1 = cx + (r - 8) * Math.cos(rad);
          const y1 = cy + (r - 8) * Math.sin(rad);
          const x2 = cx + (r + 8) * Math.cos(rad);
          const y2 = cy + (r + 8) * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
}

// Animated number display
function AnimatedNumber({ metric, visible }) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const duration = 1400;
    const start = performance.now();
    const run = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(metric.isDecimal
        ? +(eased * metric.value).toFixed(1)
        : Math.round(eased * metric.value)
      );
      if (t < 1) rafRef.current = requestAnimationFrame(run);
    };
    rafRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(rafRef.current);
  }, [metric, visible]);

  return (
    <div className="text-center">
      <div
        className="text-7xl sm:text-8xl font-bold tabular-nums leading-none mb-4"
        style={{ color: metric.color, textShadow: `0 0 60px ${metric.color}40` }}
      >
        {metric.unit}
        {metric.isDecimal ? displayed.toFixed(1) : displayed}
        <span className="text-5xl">{metric.suffix}</span>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{metric.label}</h3>
      <p className="text-sm text-slate-500 font-medium">{metric.sublabel}</p>
    </div>
  );
}

export default function MetricsArc() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  // Auto-cycle every 3.5s
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % METRICS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [visible]);

  // Trigger on scroll into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const active = METRICS[activeIndex];

  return (
    <section ref={sectionRef} className="relative py-32 bg-[#030712] overflow-hidden" id="how-it-works">
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ opacity: [0.06, 0.12, 0.06] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: `radial-gradient(circle, ${active.color}20, transparent 70%)` }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-4"
        >
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-slate-500">
            The Numbers Speak
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
          className="text-3xl sm:text-4xl font-bold text-white mb-16"
        >
          At the scale where{' '}
          <span className="font-serif-italic gradient-text-cyan">accuracy matters</span>
        </motion.h2>

        {/* Arc + Metric display */}
        <div className="flex flex-col items-center gap-6">
          <ArcGauge
            progress={activeIndex === 3 ? 0.05 : (activeIndex + 1) / METRICS.length}
            color={active.color}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            >
              <AnimatedNumber metric={active} visible={visible} />
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="flex gap-3 mt-6">
            {METRICS.map((m, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`
                  h-1.5 rounded-full transition-all duration-400
                  ${i === activeIndex ? 'w-8' : 'w-1.5 bg-white/10 hover:bg-white/20'}
                `}
                style={i === activeIndex ? { background: active.color, boxShadow: `0 0 10px ${active.color}` } : {}}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
