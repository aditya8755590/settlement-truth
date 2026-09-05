import React from 'react';

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCreatedAt(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const badgeFor = (status) => {
  switch (status) {
    case 'Open': return 'badge-warning';
    case 'Investigating': return 'badge-accent';
    case 'Escalated': return 'badge-risk';
    case 'Resolved': return 'badge-success';
    default: return 'badge-accent';
  }
};

export default function CaseManagement({ cases = [] }) {
  return (
    <div className="space-y-4">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Cases</h2>
        <p className="text-sm text-[var(--text-secondary)]">Manage escalated reconciliation exceptions.</p>
      </header>

      <div className="surface-card overflow-hidden">
        {cases.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">No cases yet.</p>
            <p className="text-xs text-[var(--text-muted)]">Open an exception from the Reconciliation Queue and click <span className="font-semibold">Create Case</span> to escalate it for human review.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Order</th>
                <th>Issue</th>
                <th className="text-right">Money at risk</th>
                <th>Created</th>
                <th>Owner</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c, i) => (
                <tr key={c.id || i}>
                  <td className="font-mono text-[var(--accent)] font-semibold">{c.id}</td>
                  <td className="font-mono">{c.orderId}</td>
                  <td className="font-medium text-[var(--text-primary)]">{c.title}</td>
                  <td className="text-right tabular-nums font-semibold">{formatINR(c.amountAtRisk)}</td>
                  <td className="text-[var(--text-secondary)]">{formatCreatedAt(c.createdAt)}</td>
                  <td className="text-[var(--text-secondary)]">{c.owner || 'Unassigned'}</td>
                  <td>
                    <span className={`badge ${badgeFor(c.status)}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}