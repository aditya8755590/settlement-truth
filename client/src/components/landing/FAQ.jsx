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
    <section className="relative py-24 bg-[#030712] overflow-hidden" id="faq">
      {/* Subtle ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-slate-500 block mb-4">
            Common Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Everything you need to{' '}
            <span className="font-serif-italic gradient-text-cyan">know</span>
          </h2>
        </motion.div>

        {/* Accordion items */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.06 }}
            >
              <div
                className={`
                  rounded-2xl border transition-all duration-300 overflow-hidden
                  ${openIndex === i
                    ? 'bg-white/[0.06] border-white/[0.12]'
                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]'
                  }
                `}
              >
                {/* Question */}
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className={`text-sm font-semibold leading-snug pr-4 transition-colors ${
                    openIndex === i ? 'text-white' : 'text-slate-300'
                  }`}>
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: openIndex === i ? 45 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                      openIndex === i
                        ? 'bg-[#2563eb]/20 border-[#2563eb]/40 text-[#60a5fa]'
                        : 'border-white/[0.1] text-slate-500'
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </motion.div>
                </button>

                {/* Answer */}
                <AnimatePresence initial={false}>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5">
                        <div className="h-px bg-white/[0.06] mb-4" />
                        <p className="text-sm text-slate-400 leading-relaxed font-light">
                          {faq.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
