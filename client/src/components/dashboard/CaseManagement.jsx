import React from 'react';

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CaseManagement() {
  const cases = [
    { id: "CASE-ST-1028", order: "ORD-88135", issue: "Payment captured but never settled", risk: 4260, created: "2h ago", owner: "Unassigned", status: "Open" },
    { id: "CASE-ST-1027", order: "ORD-72041", issue: "Orphaned payment", risk: 3420, created: "1d ago", owner: "Payment Ops", status: "Investigating" },
    { id: "CASE-ST-1026", order: "ORD-55210", issue: "Fee mismatch", risk: 128, created: "1d ago", owner: "Finance", status: "Escalated" },
  ];

  return (
    <div className="space-y-4">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Cases</h2>
        <p className="text-sm text-[var(--text-secondary)]">Manage escalated reconciliation exceptions.</p>
      </header>

      <div className="surface-card overflow-hidden">
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
              <tr key={i}>
                <td className="font-mono text-[var(--accent)] font-semibold">{c.id}</td>
                <td className="font-mono">{c.order}</td>
                <td className="font-medium text-[var(--text-primary)]">{c.issue}</td>
                <td className="text-right tabular-nums font-semibold">{formatINR(c.risk)}</td>
                <td className="text-[var(--text-secondary)]">{c.created}</td>
                <td className="text-[var(--text-secondary)]">{c.owner}</td>
                <td>
                  <span className={`badge ${c.status === 'Open' ? 'badge-warning' : c.status === 'Investigating' ? 'badge-accent' : 'badge-risk'}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
