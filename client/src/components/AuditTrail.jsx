import React from 'react';
import { Clock } from 'lucide-react';

export default function AuditTrail({ auditTrail }) {
  if (!auditTrail || auditTrail.length === 0) {
    return (
      <div className="space-y-4">
        <header className="mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Audit Log</h2>
          <p className="text-sm text-[var(--text-secondary)]">Everything Settlement Truth checked, changed, and refused to infer.</p>
        </header>
        <div className="surface-card p-10 text-center">
          <p className="text-[var(--text-secondary)]">Run a reconciliation to see the audit trail.</p>
        </div>
      </div>
    );
  }

  // Engine returns objects: { timestamp, title, description }
  // Or sometimes legacy strings like "[12:34] ..."
  const parseEntry = (entry) => {
    if (typeof entry === 'object' && entry !== null) {
      return {
        time: entry.timestamp || '--:--',
        title: entry.title || '',
        description: entry.description || '',
      };
    }
    // Legacy string format fallback
    const match = String(entry).match(/^[[\(]?(\d{1,2}:\d{2}(?::\d{2})?)[)\]]?\s+(.*)/);
    if (match) {
      return { time: match[1], title: match[2], description: '' };
    }
    return { time: '--:--', title: String(entry), description: '' };
  };

  return (
    <div className="space-y-4">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Audit Log</h2>
        <p className="text-sm text-[var(--text-secondary)]">Everything Settlement Truth checked, changed, and refused to infer.</p>
      </header>

      <div className="surface-card divide-y divide-[var(--border)]">
        {auditTrail.map((entry, idx) => {
          const { time, title, description } = parseEntry(entry);
          return (
            <div key={idx} className="px-6 py-4 flex gap-6">
              <div className="flex items-start gap-2 min-w-[80px] shrink-0 pt-0.5">
                <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] mt-0.5" />
                <span className="font-mono text-xs text-[var(--text-secondary)]">{time}</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">{title}</div>
                {description && (
                  <div className="text-xs text-[var(--text-secondary)] leading-relaxed">{description}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
