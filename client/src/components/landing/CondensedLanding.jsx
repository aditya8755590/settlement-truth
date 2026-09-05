import React from 'react';
import { ArrowRight, CheckCircle2, XCircle, UploadCloud } from 'lucide-react';

export default function CondensedLanding({ setAppMode }) {
  const handleStart = () => {
    setAppMode('product');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans">
      
      {/* Simple Header */}
      <header className="flex items-center justify-between px-8 py-5 bg-[var(--bg-surface)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[var(--accent)] flex items-center justify-center">
             <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
              <path d="M2 11L6 6.5L9.5 9.5L13 4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">Settlement Truth</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--text-secondary)]">
          <a href="#" className="hover:text-[var(--text-primary)] transition-colors">How it works</a>
          <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Product</a>
          <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Security / Trust</a>
        </nav>

        <button onClick={handleStart} className="btn-primary text-sm px-5 py-2">
          Open Dashboard
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center">
        <span className="eyebrow mb-4 text-[var(--accent)]">Financial Reconciliation</span>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[var(--text-primary)] max-w-3xl mb-6">
          Find the money that doesn't add up.
        </h1>
        <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed">
          Settlement Truth reconciles every order, payment, refund, settlement and bank credit to identify evidence-backed financial leakage.
        </p>
        
        <div className="flex items-center gap-4 mb-20">
          <button onClick={handleStart} className="btn-primary text-base px-6 py-3 flex items-center gap-2">
            <UploadCloud className="w-5 h-5" />
            Upload my CSVs
          </button>
          <button onClick={handleStart} className="btn-secondary text-base px-6 py-3">
            Open Dashboard
          </button>
        </div>

        {/* Simplified Transaction Lifecycle Diagram */}
        <div className="w-full max-w-4xl mx-auto bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider mb-2">ORDER</span>
              <div className="px-4 py-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-md mb-2">
                <span className="font-mono text-sm font-semibold">₹4,260</span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[var(--status-success)]" />
            </div>

            <ArrowRight className="w-5 h-5 text-[var(--border)] hidden md:block" />

            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider mb-2">PAYMENT</span>
              <div className="px-4 py-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-md mb-2">
                <span className="font-mono text-sm font-semibold">₹4,260</span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[var(--status-success)]" />
            </div>

            <ArrowRight className="w-5 h-5 text-[var(--border)] hidden md:block" />

            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider mb-2">SETTLEMENT</span>
              <div className="px-4 py-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-md mb-2 opacity-50">
                <span className="font-mono text-sm font-semibold">—</span>
              </div>
              <XCircle className="w-5 h-5 text-[var(--status-risk)]" />
            </div>

            <ArrowRight className="w-5 h-5 text-[var(--border)] hidden md:block" />

            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider mb-2">BANK CREDIT</span>
              <div className="px-4 py-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-md mb-2 opacity-50">
                <span className="font-mono text-sm font-semibold">—</span>
              </div>
              <XCircle className="w-5 h-5 text-[var(--status-risk)]" />
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-center">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--status-risk)]/10 border border-[var(--status-risk)]/20 rounded-md">
                <span className="w-2 h-2 rounded-full bg-[var(--status-risk)] animate-pulse"></span>
                <span className="text-sm font-bold text-[var(--status-risk)]">₹4,260 AT RISK</span>
             </div>
          </div>
        </div>

      </main>

    </div>
  );
}
