import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQS = [
  {
    q: 'What makes Settlement Truth deterministic?',
    a: "We use an O(N) hash-map algorithm — every order ID is resolved in constant time with no fuzzy matching, no ML prediction, and no tolerance thresholds. A record either matches exactly or it doesn't. This eliminates false positives entirely.",
  },
  {
    q: 'How does it handle custom gateway formats?',
    a: 'Settlement Truth ingests raw CSV exports from Razorpay, PayU, Cashfree, Stripe, and custom bank settlement sheets. Our field-mapping layer normalizes them into a universal transaction schema before reconciliation begins.',
  },
  {
    q: 'Can I upload my own merchant CSV files?',
    a: 'Yes — drag & drop your gateway settlement CSV and your internal orders CSV into the footer dropzone. The engine will begin reconciliation automatically and surface all discrepancies within seconds.',
  },
  {
    q: 'What is an "orphaned charge"?',
    a: "An orphaned charge occurs when a customer's card is debited by the payment gateway but no corresponding order settlement appears in the merchant's payout — the money is trapped between the gateway and the merchant account.",
  },
  {
    q: 'Is the AI explanation layer mandatory?',
    a: 'No. Gemini AI translations are an optional presentation layer that converts raw JSON exception records into plain-English instructions. All underlying logic is purely deterministic and auditable without AI.',
  },
  {
    q: 'What scale can the engine handle?',
    a: 'The hash-map engine processes 50,000 transaction pairs in under 12ms on commodity hardware. In production, we batch-process millions of rows across rolling settlement windows with no performance degradation.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section
      id="faq"
      className="relative py-20"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="section-divider mb-20" />

      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-10"
        >
          <p className="eyebrow">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold"
              style={{ color: 'var(--text-primary)' }}>
            Common questions
          </h2>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-2">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.05 }}
              >
                <div
                  className="rounded-xl overflow-hidden transition-all duration-200"
                  style={{
                    background: isOpen ? 'var(--bg-raised)' : 'var(--bg-surface)',
                    border: `1px solid ${isOpen ? 'var(--border)' : 'var(--border-sub)'}`,
                  }}
                >
                  {/* Question row */}
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left gap-4"
                  >
                    <span
                      className="text-sm font-semibold leading-snug"
                      style={{ color: isOpen ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    >
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{
                        background: isOpen ? 'var(--accent-dim)' : 'var(--bg-raised)',
                        border: `1px solid ${isOpen ? 'var(--accent-border)' : 'var(--border)'}`,
                        color: isOpen ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </motion.div>
                  </button>

                  {/* Answer */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <div className="h-px mb-3" style={{ background: 'var(--border)' }} />
                          <p className="text-sm leading-relaxed"
                             style={{ color: 'var(--text-secondary)' }}>
                            {faq.a}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
