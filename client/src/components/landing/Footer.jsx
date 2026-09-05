import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function Footer({ onLaunchAudit }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'done'
  const fileInputRef = useRef(null);

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.csv'));
    if (!files.length) return;
    await processFiles(files);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    await processFiles(files);
  };

  const processFiles = async (files) => {
    setUploadStatus('uploading');
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        setUploadStatus('done');
        // Scroll to engine after brief delay
        setTimeout(() => {
          document.getElementById('reconcile-engine')?.scrollIntoView({ behavior: 'smooth' });
        }, 1200);
      }
    } catch {
      setUploadStatus(null);
    }
  };

  return (
    <footer className="relative py-24 overflow-hidden bg-[#030712]">
      {/* Top separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* Deep midnight radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px]"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.18) 0%, rgba(37,99,235,0.1) 40%, transparent 70%)',
          }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-t from-[#030712] to-transparent" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* CTA Copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-slate-500 block mb-6">
            Get Started
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Ready to eliminate{' '}
            <span className="font-serif-italic gradient-text-cyan">payment leakage?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 font-light max-w-xl mx-auto">
            Drop your raw merchant CSV files below and let the engine do the rest. No signup required.
          </p>
        </motion.div>

        {/* Upload Dropzone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.15 }}
        >
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => uploadStatus !== 'uploading' && fileInputRef.current?.click()}
            className={`
              relative rounded-3xl p-10 border-2 border-dashed cursor-pointer transition-all duration-300
              ${isDragging
                ? 'border-[#38bdf8]/60 bg-[#38bdf8]/[0.08] scale-[1.02]'
                : uploadStatus === 'done'
                ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                : 'border-white/[0.1] bg-white/[0.02] hover:border-[#38bdf8]/30 hover:bg-white/[0.04]'
              }
            `}
          >
            {/* Inner glow on drag */}
            {isDragging && (
              <div className="absolute inset-0 rounded-3xl bg-[#38bdf8]/[0.05] pointer-events-none" />
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />

            {uploadStatus === 'done' ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M6 14L11 19L22 9" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-lg font-bold text-white">Files uploaded!</p>
                <p className="text-sm text-slate-400">Scrolling to the reconciliation engine…</p>
              </motion.div>
            ) : uploadStatus === 'uploading' ? (
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-12 h-12 rounded-full border-2 border-[#38bdf8]/30 border-t-[#38bdf8]"
                />
                <p className="text-sm text-slate-400 font-medium">Processing CSV files…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className={`
                  w-16 h-16 rounded-full border-2 flex items-center justify-center transition-colors
                  ${isDragging ? 'border-[#38bdf8]/60 bg-[#38bdf8]/10' : 'border-white/[0.1] bg-white/[0.04]'}
                `}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M14 18V10M10 14L14 10L18 14" stroke={isDragging ? '#38bdf8' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 20C4.3 20 3 18.7 3 17C3 15.5 4 14.2 5.4 13.9C5.1 13.3 5 12.7 5 12C5 9.2 7.2 7 10 7C10.9 7 11.8 7.3 12.5 7.7C13.4 6.1 15.1 5 17 5C19.8 5 22 7.2 22 10C22 10.1 22 10.2 22 10.3C23.7 10.8 25 12.3 25 14C25 16.2 23.2 18 21 18" stroke={isDragging ? '#38bdf8' : '#64748b'} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-white mb-1">
                    Drop your CSV files here
                  </p>
                  <p className="text-sm text-slate-500">
                    Gateway settlements + order exports · <span className="text-[#38bdf8]">click to browse</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">Razorpay</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">PayU</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">Cashfree</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">Stripe</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.25 }}
          className="flex items-center justify-center gap-4 mt-8"
        >
          <motion.button
            onClick={onLaunchAudit}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="glow-btn px-8 py-4 rounded-full text-white font-semibold text-base tracking-wide"
          >
            Launch the Engine →
          </motion.button>
          <span className="text-sm text-slate-600">No signup. Instant results.</span>
        </motion.div>

        {/* Footer nav */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#2563eb] flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 7L3.5 4L6 6L9 2" stroke="#030712" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-400">SettlementTruth</span>
          </div>
          <p className="text-xs text-slate-600">
            Deterministic · Auditable · Zero hallucination · Built for Indian merchants
          </p>
          <p className="text-xs text-slate-700">© 2026 Settlement Truth</p>
        </motion.div>
      </div>
    </footer>
  );
}
