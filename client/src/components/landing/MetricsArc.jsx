import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// All 4 KPIs — colors from the semantic palette only
const METRICS = [
  {
    value: 10, suffix: 'M+', unit: '',
    label: 'Transactions Reconciled',
    sublabel: 'Without a single hallucinated match',
    color: '#6366F1', // accent
  },
  {
    value: 1.4, suffix: 'Cr', unit: '₹', isDecimal: true,
    label: 'Leakage Recovered',
    sublabel: 'Returned to merchant accounts',
    color: '#34D399', // success
  },
  {
    value: 100, suffix: '%', unit: '',
    label: 'Deterministic Rule Accuracy',
    sublabel: 'O(N) hash-map — no ML drift',
    color: '#F5F5F7', // neutral white — not a decorative color
  },
  {
    value: 0, suffix: '', unit: '',
    label: 'Hallucinated Balances',
    sublabel: 'Every figure is provably sourced',
    color: '#34D399',
  },
];

// Animated counter — same logic, preserved
function AnimatedNumber({ metric, visible }) {
  const [displayed, setDisplayed] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const duration = 1200;
    const start = performance.now();
    const run = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(metric.isDecimal
        ? +(eased * metric.value).toFixed(1)
        : Math.round(eased * metric.value)
      );
      if (t < 1) raf.current = requestAnimationFrame(run);
    };
    raf.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf.current);
  }, [metric, visible]);

  return (
    <div className="text-center">
      {/* Large number — no arc gauge, no decorative dial */}
      <div
        className="tabular-nums font-bold leading-none mb-4"
        style={{
          fontSize: 'clamp(72px, 12vw, 120px)',
          color: metric.color,
          letterSpacing: '-0.04em',
        }}
      >
        {metric.unit}
        {metric.isDecimal ? displayed.toFixed(1) : displayed}
        <span style={{ fontSize: '0.55em', letterSpacing: '-0.02em' }}>
          {metric.suffix}
        </span>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}>
        {metric.label}
      </h3>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {metric.sublabel}
      </p>
    </div>
  );
}

export default function MetricsArc() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const iv = setInterval(() => setActiveIndex(i => (i + 1) % METRICS.length), 3500);
    return () => clearInterval(iv);
  }, [visible]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const active = METRICS[activeIndex];

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative py-28"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Section separator */}
      <div className="section-divider mb-0" />

      <div className="max-w-3xl mx-auto px-6 text-center pt-16">

        {/* Eyebrow — plain text, consistent with design token */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="eyebrow"
        >
          The Numbers
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.08 }}
          className="text-3xl sm:text-4xl font-bold mb-20"
          style={{ color: 'var(--text-primary)' }}
        >
          At the scale where accuracy matters
        </motion.h2>

        {/* Large number display — no arc gauge, no dial */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            <AnimatedNumber metric={active} visible={visible} />
          </motion.div>
        </AnimatePresence>

        {/* Dot indicator */}
        <div className="flex items-center justify-center gap-2 mt-12">
          {METRICS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width:  i === activeIndex ? 24 : 6,
                height: 6,
                background: i === activeIndex
                  ? 'var(--accent)'
                  : 'var(--border)',
              }}
            />
          ))}
        </div>

        {/* Static grid of all 4 below — so nothing is hidden while cycling */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 pt-8"
             style={{ borderTop: '1px solid var(--border)' }}>
          {METRICS.map((m, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="text-left p-3 rounded-lg transition-colors"
              style={{
                background: i === activeIndex ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${i === activeIndex ? 'var(--accent-border)' : 'transparent'}`,
              }}
            >
              <p className="text-lg font-bold tabular-nums"
                 style={{ color: m.color }}>
                {m.unit}{m.isDecimal ? m.value.toFixed(1) : m.value}{m.suffix}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {m.label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
