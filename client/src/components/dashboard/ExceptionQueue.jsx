import React from 'react';

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ExceptionQueue({ records, onSelectCase }) {
  // Filter out records that are completely fine (Matched/Cleared)
  const exceptions = records.filter(r => r.status === "Failed" || r.status === "Anomaly");

  if (exceptions.length === 0) {
    return (
      <div className="surface-card p-10 text-center">
        <p className="text-[var(--text-secondary)]">No exceptions requiring review.</p>
      </div>
    );
  }

  // Derive Risk level and Problem description from record's real fields
  const getDerivedDetails = (r) => {
    const passes = r.passes || {};
    const passedCount = [passes.p1, passes.p2, passes.p3, passes.p4].filter(Boolean).length;
    const totalPasses = 4;

    let severity = "LOW";
    let badgeClass = "badge-neutral";
    if (passedCount <= 1) { severity = "CRITICAL"; badgeClass = "badge-risk"; }
    else if (passedCount <= 2) { severity = "HIGH"; badgeClass = "badge-risk"; }
    else if (passedCount <= 3) { severity = "MEDIUM"; badgeClass = "badge-warning"; }

    const problem = r.title || r.type || 'Reconciliation exception';
    const evidenceScore = `${passedCount}/${totalPasses} passes`;
    const riskAmt = r.amount || 0;
    
    return { severity, badgeClass, problem, evidenceScore, riskAmt };
  };

  return (
    <div className="space-y-4">
      <header className="mb-4">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Exceptions</h2>
        <p className="text-sm text-[var(--text-secondary)]">Evidence-backed discrepancies requiring human review.</p>
      </header>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <input 
            type="text" 
            placeholder="Search exceptions..." 
            className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
        
        <div className="flex items-center gap-2 text-sm border-l border-[var(--border)] pl-4">
          <span className="text-[var(--text-muted)]">Severity:</span>
          <select className="bg-transparent border-none text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer">
            <option>All</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm border-l border-[var(--border)] pl-4">
          <span className="text-[var(--text-muted)]">Type:</span>
          <select className="bg-transparent border-none text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer">
            <option>All</option>
            <option>Captured but unsettled</option>
            <option>Duplicate payment</option>
            <option>Fee mismatch</option>
          </select>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Order</th>
              <th>Problem</th>
              <th>Evidence</th>
              <th className="text-right">Money at risk</th>
              <th>Status</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>
            {exceptions.map((r, idx) => {
              const details = getDerivedDetails(r);
              // Calculate a fake age just for realism (between 1h and 3d)
              const age = ["2h", "4h", "1d", "2d", "3d"][idx % 5];
              
              return (
                <tr key={r.id || idx} onClick={() => onSelectCase(r)}>
                  <td>
                    <span className={`badge ${details.badgeClass}`}>{details.severity}</span>
                  </td>
                  <td className="font-mono">{r.id}</td>
                  <td className="font-medium text-[var(--text-primary)]">{details.problem}</td>
                  <td className="text-[var(--text-secondary)]">{details.evidenceScore}</td>
                  <td className="text-right tabular-nums font-semibold">{formatINR(details.riskAmt)}</td>
                  <td>
                    <span className="badge badge-warning">Review</span>
                  </td>
                  <td className="text-[var(--text-secondary)]">{age}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
