import React, { useMemo } from 'react';
import { ShieldCheck, AlertCircle, TrendingDown, CheckSquare } from 'lucide-react';

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function OverviewDashboard({ metrics, records, hasRun, isReconciling, auditTrail = [] }) {
  
  // Calculate breakdown dynamically from records
  const breakdown = useMemo(() => {
    if (!records || records.length === 0) return [];
    
    let capturedUnsettled = 0;
    let duplicatePayments = 0;
    let feeDiscrepancies = 0;
    let refundDiscrepancies = 0;
    let partialCaptures = 0;

    records.forEach(r => {
      if (r.status !== "Anomaly") return;
      const amt = r.amount || 0;

      const type = (r.title || r.type || '').toLowerCase();
      if (type.includes('duplicate')) duplicatePayments += amt;
      else if (type.includes('fee')) feeDiscrepancies += amt;
      else if (type.includes('refund')) refundDiscrepancies += amt;
      else if (type.includes('partial')) partialCaptures += amt;
      else capturedUnsettled += amt; // missing settlement, missing bank credit, etc.
    });

    return [
      { label: "Captured but unsettled", amount: capturedUnsettled },
      { label: "Duplicate payments", amount: duplicatePayments },
      { label: "Fee discrepancies", amount: feeDiscrepancies },
      { label: "Duplicate refunds", amount: refundDiscrepancies },
      { label: "Partial captures", amount: partialCaptures },
    ].filter(i => i.amount > 0).sort((a, b) => b.amount - a.amount);

  }, [records]);

  // Real per-category outcome counts — must be declared here (before early returns) to satisfy Rules of Hooks
  const outcomes = useMemo(() => {
    if (!records || records.length === 0) return [];
    const anomaly = records.filter((r) => r.status === 'Anomaly' || r.status === 'Failed');
    const byCause = (key) => anomaly.filter((r) => (r.title || r.type || '').toLowerCase().includes(key)).length;
    return [
      { label: 'Auto-matched', n: records.length - anomaly.length, pct: records.length ? ((records.length - anomaly.length) / records.length) * 100 : 0, color: 'bg-[var(--status-success)]' },
      { label: 'Missing settlements', n: byCause('settlement'), pct: records.length ? (byCause('settlement') / records.length) * 100 : 0, color: 'bg-[var(--status-warning)]' },
      { label: 'Fee deductions', n: byCause('fee'), pct: records.length ? (byCause('fee') / records.length) * 100 : 0, color: 'bg-[var(--status-warning)]' },
      { label: 'Duplicate evidence', n: byCause('duplicate'), pct: records.length ? (byCause('duplicate') / records.length) * 100 : 0, color: 'bg-[var(--status-risk)]' },
      { label: 'Partial captures', n: byCause('partial'), pct: records.length ? (byCause('partial') / records.length) * 100 : 0, color: 'bg-[var(--status-risk)]' },
    ].filter((o) => o.n > 0);
  }, [records]);

  // Precision / recall from ground-truth comparison. Uploaded datasets have no
  // ground-truth labels, so report N/A instead of a misleading 0%.
  const hasGroundTruth = metrics?.evidencePrecision != null || metrics?.groundTruth?.precision != null;
  const precision = hasGroundTruth ? parseFloat(metrics?.evidencePrecision || String(metrics?.groundTruth?.precision)) : null;
  const recall = hasGroundTruth ? (metrics?.groundTruth?.recall ?? null) : null;

  // Real last-run time, taken from the newest engine audit entry (server-generated)
  const engineEntry = [...auditTrail].reverse().find((e) => /Pass 1–3|Policy gate/i.test(e.title || ''));
  const lastRunAt = engineEntry
    ? new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) + ' · ' + engineEntry.timestamp
    : 'not run yet';

  if (isReconciling) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Running audit engine…</h3>
        <p className="text-[var(--text-secondary)] mt-2 text-sm">Processing all records across 5 sources.</p>
      </div>
    );
  }

  if (!hasRun) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck className="w-16 h-16 text-[var(--border)] mb-4" />
        <h3 className="text-xl font-bold text-[var(--text-primary)]">No audit data yet</h3>
        <p className="text-[var(--text-secondary)] mt-2 text-sm max-w-sm">
          Click <strong>Upload Data</strong> to load your CSV files and begin reconciliation.
        </p>
      </div>
    );
  }

  const recRate = metrics?.totalRecords
    ? `${((metrics.autoMatched / metrics.totalRecords) * 100).toFixed(1)}%`
    : "0.0%";
  const exceptions = metrics?.exceptionQueueCount || 0;
  const moneyAtRisk = metrics?.cashAtRisk || 0;




  return (
    <div className="space-y-6">
      
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Audit overview</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {metrics?.totalRecords?.toLocaleString()} orders · Last run {lastRunAt}
        </p>
      </header>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="surface-card p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">Reconciliation Rate</span>
            <ShieldCheck className="w-5 h-5 text-[var(--status-success)]" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{recRate}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{metrics?.autoMatchedText || "0 / 0"} records</div>
          </div>
        </div>

        <div className="surface-card p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">Exceptions</span>
            <AlertCircle className="w-5 h-5 text-[var(--status-warning)]" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{exceptions}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Require review</div>
          </div>
        </div>

        <div className="surface-card p-5 flex flex-col justify-between h-32 border-[var(--status-risk)] border-l-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">Money at risk</span>
            <TrendingDown className="w-5 h-5 text-[var(--status-risk)]" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--status-risk)]">{formatINR(moneyAtRisk)}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Across unresolved exceptions</div>
          </div>
        </div>

        <div className="surface-card p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">Forced Matches</span>
            <CheckSquare className="w-5 h-5 text-[var(--text-muted)]" />
          </div>
          <div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{metrics?.forcedMatchesCount ?? 0}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">No financial guesses</div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Money at risk breakdown */}
        <div className="surface-card p-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Money at risk</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Across {exceptions} unresolved exceptions</p>
          
          <div className="space-y-4">
            {breakdown.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] italic">No breakdown available.</p>
            )}
            {breakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center pb-3 border-b border-[var(--border-sub)] last:border-0">
                <span className="text-sm font-medium text-[var(--text-primary)]">{item.label}</span>
                <span className="tabular-nums font-semibold text-[var(--status-risk)]">{formatINR(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reconciliation health */}
        <div className="surface-card p-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Reconciliation health</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Outcomes from the latest engine run</p>
          
          <div className="space-y-4">
            {outcomes.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] italic">No records to break down.</p>
            )}
            {outcomes.map((stat, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-[var(--text-primary)]">{stat.label}</span>
                  <span className="font-semibold text-[var(--text-secondary)]">{stat.n} records · {stat.pct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[var(--border)] rounded-full h-2">
                  <div className={`${stat.color} h-2 rounded-full`} style={{ width: `${stat.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
