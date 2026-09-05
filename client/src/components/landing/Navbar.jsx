import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navbar({ onLaunchAudit }) {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const unsub = scrollY.on('change', (v) => setScrolled(v > 40));
    return unsub;
  }, [scrollY]);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl"
    >
      <div
        className={`
          glass-pill rounded-full px-5 py-3 flex items-center justify-between
          transition-all duration-500
          ${scrolled
            ? 'bg-[rgba(3,7,18,0.85)] border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
            : 'bg-[rgba(3,7,18,0.5)] border-white/[0.06]'
          }
        `}
      >
        {/* Brand Mark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#2563eb] flex items-center justify-center shadow-[0_0_16px_rgba(56,189,248,0.5)]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10L5.5 6L8.5 8.5L12 4" stroke="#030712" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white font-bold text-sm tracking-tight">
            Settlement<span className="text-[#38bdf8]">Truth</span>
          </span>
        </div>

        {/* Nav Links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-all duration-200 font-medium"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          onClick={onLaunchAudit}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="glow-btn px-5 py-2 rounded-full text-white text-sm font-semibold tracking-wide"
        >
          Launch Audit
        </motion.button>
      </div>
    </motion.nav>
  );
}
