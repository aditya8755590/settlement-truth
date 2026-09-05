import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const HIGHLIGHTS = [
  'deterministic', 'transparent', 'auditable',
  'gateway', 'fee', 'orphaned',
];

function HighlightedText({ text }) {
  return (
    <>
      {text.split(' ').map((word, i) => {
        const clean = word.replace(/[.,—]/g, '').toLowerCase();
        const isKey = HIGHLIGHTS.some(h => clean === h || clean.startsWith(h));
        return (
          <React.Fragment key={i}>
            <span
              style={isKey
                ? { color: '#6366F1', fontWeight: 600 }
                : { color: '#374151' }
              }
            >
              {word}
            </span>
            {i < text.split(' ').length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </>
  );
}

export default function Statement() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const panelOpacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
  const panelScale   = useTransform(scrollYProgress, [0, 0.35], [0.97, 1]);

  const narrative =
    'We believe the future of merchant payments is deterministic, transparent, and auditable. Our platform eliminates silent gateway leaks, fee creeps, and orphaned charges — restoring every rupee that belongs to the merchant.';

  return (
    <section ref={containerRef} className="relative py-24 overflow-hidden"
             style={{ background: 'var(--bg-base)' }}>

      {/* Scroll-driven icy panel */}
      <motion.div
        style={{ opacity: panelOpacity, scale: panelScale }}
        className="absolute inset-x-6 sm:inset-x-16 lg:inset-x-32 inset-y-6 rounded-2xl overflow-hidden pointer-events-none"
      >
        <div style={{
          background: 'linear-gradient(160deg, #EEF2FF 0%, #E0E7FF 50%, #EDE9FE 100%)',
          position: 'absolute', inset: 0,
        }} />
        {/* Single subtle top glow */}
        <div style={{
          position: 'absolute', top: 0, left: '25%', right: '25%', height: '60px',
          background: 'rgba(99,102,241,0.06)', filter: 'blur(24px)',
        }} />
      </motion.div>

      <div className="relative z-10 max-w-3xl mx-auto px-8 sm:px-16 py-16 text-center">

        {/* Narrative */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-2xl sm:text-3xl lg:text-4xl leading-[1.55] font-light"
          style={{ color: '#374151' }}
        >
          <HighlightedText text={narrative} />
        </motion.p>

        {/* Rule + sub-line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <div className="w-8 h-px" style={{ background: '#6366F1', opacity: 0.4 }} />
          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
            Built on hash-map determinism. Not machine learning guesswork.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
