import React from 'react';
import { Database, CheckCircle2, AlertCircle } from 'lucide-react';

const SOURCE_META = {
  orders:      { icon: '📦', label: 'Orders',       desc: 'Merchant order records' },
  payments:    { icon: '💳', label: 'Payments',     desc: 'Gateway payment captures' },
  refunds:     { icon: '↩️',  label: 'Refunds',      desc: 'Refund & review events' },
  settlements: { icon: '🏦', label: 'Settlements',  desc: 'Gateway settlement batches' },
  bankCredits: { icon: '✅', label: 'Bank Credits', desc: 'Bank account credit events' },
};

export default function DataSources({ sources }) {
  const hasData = sources && typeof sources.orders === 'number';
  const isCustom = sources?.isCustom;
  const totalRecords = hasData
    ? (sources.orders || 0) + (sources.payments || 0) + (sources.refunds || 0) + (sources.settlements || 0) + (sources.bankCredits || 0)
    : 0;

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Data Sources</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Ingested CSV files and live record counts.
        </p>
      </header>

      {/* Status bar */}
      <div className="surface-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${hasData ? 'bg-[var(--status-success)]' : 'bg-[var(--border)]'}`}></div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {isCustom ? 'Custom dataset loaded' : hasData ? 'Seed dataset loaded' : 'No data loaded'}
          </span>
        </div>
        {hasData && (
          <span className="text-xs text-[var(--text-muted)] font-mono">
            {totalRecords.toLocaleString()} total records
          </span>
        )}
      </div>

      {/* Source cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(SOURCE_META).map(([key, meta]) => {
          const count = hasData && typeof sources[key] === 'number' ? sources[key] : null;
          const loaded = count !== null && count > 0;
          return (
            <div key={key} className={`surface-card p-5 border-l-4 ${loaded ? 'border-l-[var(--status-success)]' : 'border-l-[var(--border)]'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.icon}</span>
                  <div>
                    <div className="font-semibold text-sm text-[var(--text-primary)]">{meta.label}</div>
                    <div className="text-xs text-[var(--text-muted)]">{meta.desc}</div>
                  </div>
                </div>
                {loaded
                  ? <CheckCircle2 className="w-4 h-4 text-[var(--status-success)] shrink-0" />
                  : <AlertCircle className="w-4 h-4 text-[var(--border)] shrink-0" />}
              </div>
              <div className="text-3xl font-bold tabular-nums text-[var(--text-primary)]">
                {count !== null ? count.toLocaleString() : '—'}
              </div>
              <div className={`text-xs font-medium mt-1 ${loaded ? 'text-[var(--status-success)]' : 'text-[var(--text-muted)]'}`}>
                {loaded ? 'records loaded' : 'not provided'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Schema reference */}
      <div className="surface-card p-6">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Expected CSV Schema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { file: 'orders.csv',      cols: 'order_id, amount, currency, created_at, order_status' },
            { file: 'payments.csv',    cols: 'order_id, payment_id, captured_amount, payment_type, captured_at' },
            { file: 'settlements.csv', cols: 'settlement_id, settlement_date, net_amount, payment_ids' },
            { file: 'bank_credits.csv',cols: 'utr, reference, amount, credit_date' },
            { file: 'refunds.csv',     cols: 'refund_id, order_id, payment_id, refund_amount, refund_status' },
          ].map(({ file, cols }) => (
            <div key={file} className="bg-[var(--bg-base)] rounded-md p-3 border border-[var(--border-sub)]">
              <div className="font-mono text-xs font-bold text-[var(--accent)] mb-1">{file}</div>
              <div className="font-mono text-[11px] text-[var(--text-muted)] leading-relaxed break-all">{cols}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-4">
          Column names are flexible — common aliases are auto-detected (e.g. <code>total_amount</code> → <code>amount</code>, <code>payment_value</code> → <code>captured_amount</code>).
        </p>
      </div>
    </div>
  );
}
