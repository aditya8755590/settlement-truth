import React from 'react';
import { Activity } from 'lucide-react';

export default function RulesConfig({ metrics, records }) {
  const total = metrics?.totalRecords ?? 0;
  const payments = total; // one payment per order in the reconciled set
  const settled = total - (metrics?.exceptionQueueCount ?? 0);
  const exceptions = metrics?.exceptionQueueCount ?? 0;

  // Derive pass/fail counts from actual records
  const p1Fail = records ? records.filter(r => r.status === 'Anomaly' && r.passes && !r.passes.p1).length : 0;
  const p2Fail = records ? records.filter(r => r.status === 'Anomaly' && r.passes && !r.passes.p2).length : 0;
  const p3Fail = records ? records.filter(r => r.status === 'Anomaly' && r.passes && !r.passes.p3).length : 0;
  const p4Fail = records ? records.filter(r => r.status === 'Anomaly' && r.passes && !r.passes.p4).length : 0;
  const dupFail = records ? records.filter(r => (r.type || '').toLowerCase().includes('duplicate')).length : 0;
  const feeFail = records ? records.filter(r => (r.type || '').toLowerCase().includes('fee')).length : 0;

  const rules = [
    {
      id: "RULE-001",
      name: "Exact payment match",
      desc: "Order ID + payment reference + amount must agree exactly.",
      evaluated: total,
      exceptions: p1Fail,
    },
    {
      id: "RULE-002",
      name: "Settlement validation",
      desc: "A captured payment cannot be considered settled without settlement evidence.",
      evaluated: payments,
      exceptions: p2Fail,
    },
    {
      id: "RULE-003",
      name: "Bank confirmation",
      desc: "Settlement must correspond to a confirmed bank credit (UTR match).",
      evaluated: payments,
      exceptions: p3Fail,
    },
    {
      id: "RULE-004",
      name: "Duplicate payment detection",
      desc: "Multiple successful captures for the same order are flagged as critical.",
      evaluated: payments,
      exceptions: dupFail,
    },
    {
      id: "RULE-005",
      name: "Fee validation (MDR)",
      desc: "Actual gateway deduction is compared against configured MDR + GST rates.",
      evaluated: payments,
      exceptions: feeFail,
    },
    {
      id: "RULE-006",
      name: "Refund validation",
      desc: "Multiple refund events are cross-checked against payment state and customer requests.",
      evaluated: payments,
      exceptions: p4Fail,
    },
  ];

  const notRun = total === 0;

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Reconciliation Rules</h2>
        <p className="text-sm text-[var(--text-secondary)]">The deterministic policies powering the engine. All counts reflect the current audit run.</p>
      </header>

      {notRun && (
        <div className="surface-card p-8 text-center text-[var(--text-secondary)]">
          Run a reconciliation to see live rule evaluation counts.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map(rule => (
          <div key={rule.id} className="surface-card p-5">
            <div className="flex justify-between items-start mb-3">
              <span className="font-mono text-xs font-bold text-[var(--accent)] bg-[var(--accent-dim)] px-2 py-1 rounded">{rule.id}</span>
              <div className="flex items-center gap-1 text-[var(--status-success)] text-xs font-medium bg-[var(--status-success)]/10 px-2 py-1 rounded">
                <Activity className="w-3 h-3" /> Active
              </div>
            </div>

            <h3 className="font-bold text-[var(--text-primary)] mb-1">{rule.name}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 min-h-[40px]">{rule.desc}</p>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-sub)]">
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Evaluated</div>
                <div className="font-mono text-sm">
                  {notRun ? '—' : rule.evaluated.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Exceptions</div>
                <div className={`font-mono text-sm ${rule.exceptions > 0 ? 'text-[var(--status-risk)]' : 'text-[var(--status-success)]'}`}>
                  {notRun ? '—' : rule.exceptions.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
