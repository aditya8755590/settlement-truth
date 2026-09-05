import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function Footer({ onLaunchAudit }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'done'
  const fileInputRef = useRef(null);

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'));
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
    files.forEach(f => formData.append('files', f));
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        setUploadStatus('done');
        setTimeout(() => {
          document.getElementById('reconcile-engine')?.scrollIntoView({ behavior: 'smooth' });
        }, 1200);
      }
    } catch {
      setUploadStatus(null);
    }
  };

  return (
    <footer
      className="relative py-20 overflow-hidden"
      style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border-sub)' }}
    >
      <div className="max-w-2xl mx-auto px-6 text-center">

        {/* CTA copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <p className="eyebrow">Get Started</p>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4 leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Ready to eliminate payment leakage?
          </h2>
          <p className="text-base mb-10"
             style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Drop your raw merchant CSV files below and let the engine do the rest. No signup required.
          </p>
        </motion.div>

        {/* Dropzone */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.12 }}
        >
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => uploadStatus !== 'uploading' && fileInputRef.current?.click()}
            className="relative rounded-xl p-10 border-2 border-dashed cursor-pointer transition-all duration-200"
            style={{
              borderColor: isDragging
                ? 'var(--accent)'
                : uploadStatus === 'done'
                ? 'var(--status-success)'
                : 'var(--border)',
              background: isDragging
                ? 'var(--accent-dim)'
                : uploadStatus === 'done'
                ? 'rgba(52,211,153,0.06)'
                : 'var(--bg-surface)',
            }}
          >
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
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12L10 17L19 8" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Files uploaded!
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Scrolling to the reconciliation engine…
                </p>
              </motion.div>
            ) : uploadStatus === 'uploading' ? (
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                  className="w-10 h-10 rounded-full border-2"
                  style={{
                    borderColor: 'var(--border)',
                    borderTopColor: 'var(--accent)',
                  }}
                />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Processing CSV files…
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    background: isDragging ? 'var(--accent-dim)' : 'var(--bg-raised)',
                    border: `1px solid ${isDragging ? 'var(--accent-border)' : 'var(--border)'}`,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 14V7M8 10L11 7L14 10"
                          stroke={isDragging ? '#6366F1' : '#6B7280'}
                          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 16C2.5 16 2 14.9 2 14C2 12.7 2.9 11.6 4.1 11.3C3.9 10.8 3.8 10.3 3.8 9.8C3.8 7.5 5.7 5.6 8 5.6C8.8 5.6 9.6 5.9 10.2 6.3C11 5 12.5 4 14.2 4C16.8 4 19 6.2 19 8.8V9C20.5 9.5 21.5 10.9 21.5 12.5C21.5 14.4 20 16 18.1 16"
                          stroke={isDragging ? '#6366F1' : '#6B7280'}
                          strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1"
                     style={{ color: 'var(--text-primary)' }}>
                    Drop your CSV files here
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Gateway settlements + order exports ·{' '}
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                      click to browse
                    </span>
                  </p>
                </div>
                {/* Accepted formats */}
                <div className="flex items-center gap-1.5">
                  {['Razorpay', 'PayU', 'Cashfree', 'Stripe'].map(gw => (
                    <span
                      key={gw}
                      className="text-[10px] font-medium px-2 py-0.5 rounded"
                      style={{
                        background: 'var(--bg-raised)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {gw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
          className="flex items-center justify-center gap-4 mt-6"
        >
          <button
            onClick={onLaunchAudit}
            className="btn-primary text-base px-7 py-3"
          >
            Launch the Engine →
          </button>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No signup. Instant results.
          </span>
        </motion.div>

        {/* Footer nav */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid var(--border-sub)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M1 6L3 3.5L5.5 5.5L8 2" stroke="#fff" strokeWidth="1.4"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
              SettlementTruth
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Deterministic · Auditable · Zero hallucination · Built for Indian merchants
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            © 2026 Settlement Truth
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
