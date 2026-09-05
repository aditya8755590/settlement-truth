import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const HIGHLIGHTS = [
  'deterministic',
  'transparent',
  'auditable',
  'silent gateway leaks',
  'fee creeps',
  'orphaned charges',
];

function HighlightedText({ text }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => {
        const clean = word.replace(/[.,]/g, '').toLowerCase();
        const isHighlight = HIGHLIGHTS.some((h) => h.includes(clean) || clean.includes(h.split(' ')[0]));
        return (
          <React.Fragment key={i}>
            <span
              className={isHighlight
                ? 'text-[#2563eb] font-semibold'
                : 'text-slate-700'
              }
            >
              {word}
            </span>
            {i < words.length - 1 ? ' ' : ''}
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

  const bgOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.4], [0.95, 1]);

  const narrative =
    'We believe the future of merchant payments is deterministic, transparent, and auditable. Our platform eliminates silent gateway leaks, fee creeps, and orphaned charges — restoring every rupee that belongs to the merchant.';

  return (
    <section
      ref={containerRef}
      className="relative py-32 overflow-hidden"
    >
      {/* Dark → Light transition gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#0a0f2a] to-[#030712]" />

      {/* Ice white frosted inner panel */}
      <motion.div
        style={{ opacity: bgOpacity, scale }}
        className="absolute inset-x-4 sm:inset-x-12 lg:inset-x-24 inset-y-8 rounded-3xl overflow-hidden"
      >
        <div className="absolute inset-0 ice-section opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#dbe8ff]/60 via-[#eff4ff]/80 to-[#e8f0ff]/60" />
        {/* Ambient blue glow top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-32 bg-[#2563eb]/[0.08] blur-3xl rounded-full" />
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto px-8 sm:px-16 py-20">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="flex justify-center mb-10"
        >
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-[#2563eb] bg-[#2563eb]/10 px-4 py-2 rounded-full border border-[#2563eb]/20">
            Our Belief
          </span>
        </motion.div>

        {/* Narrative Text */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.15 }}
          className="text-2xl sm:text-3xl lg:text-4xl text-center leading-[1.5] font-light text-slate-700"
        >
          <HighlightedText text={narrative} />
        </motion.p>

        {/* Divider with icon */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          className="mt-14 flex items-center gap-4 justify-center"
        >
          <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-[#2563eb]/30" />
          <div className="w-10 h-10 rounded-full bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M8 3L13 8L8 13" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-[#2563eb]/30" />
        </motion.div>

        {/* Sub-statement */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 100, damping: 20 }}
          className="mt-8 text-center text-base text-slate-500 font-medium tracking-wide"
        >
          Built on hash-map determinism. Not machine learning guesswork.
        </motion.p>
      </div>
    </section>
  );
}
