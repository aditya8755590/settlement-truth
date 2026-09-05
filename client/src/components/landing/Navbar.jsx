import React, { useState, useEffect } from 'react';
import { motion, useScroll } from 'framer-motion';

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features',     href: '#features' },
  { label: 'Analytics',    href: '#analytics' },
  { label: 'FAQ',          href: '#faq' },
];

export default function Navbar({ onLaunchAudit }) {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const unsub = scrollY.on('change', (v) => setScrolled(v > 48));
    return unsub;
  }, [scrollY]);

  return (
    <motion.nav
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.1 }}
      /* z-50 keeps nav above all content; top-3 + w-calc gives floating effect */
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl"
    >
      <div
        className={`
          nav-surface rounded-xl px-5 h-14 flex items-center justify-between
          transition-shadow duration-300
          ${scrolled ? 'shadow-[0_4px_24px_rgba(0,0,0,0.5)]' : ''}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 9L5 5.5L8 8L11 3.5" stroke="#fff" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[var(--text-primary)] font-bold text-sm tracking-tight">
            Settlement<span style={{ color: 'var(--accent)' }}>Truth</span>
          </span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onLaunchAudit}
          className="btn-primary text-sm px-5 py-2"
        >
          Launch Audit
        </button>
      </div>
    </motion.nav>
  );
}
