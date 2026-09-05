import React, { useState } from 'react';
import { ArrowDown, Check, X, AlertTriangle } from 'lucide-react';

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function TransactionInvestigation({ record, onClose, onCreateCase, createdCases = [] }) {
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);
  if (!record) return null;

  const alreadyCreated = createdCases.some((c) => c.orderId === record.id);

  const passes = record.passes || {};
  const amt = formatINR(record.amount || 0);
  
  // The engine's passes: p1=Order+Payment, p2=Settlement+Fee, p3=BankCredit, p4=Refund
  const p1 = passes.p1; // Order linked to payment
  const p2 = passes.p2; // Settlement within window, fees OK
  const p3 = passes.p3; // Bank credit confirms settlement
  const p4 = passes.p4; // No duplicate refunds

  const ruleText = record.reason || 'Reconciliation exception — human review required.';

  const Step = ({ label, id, status, isLast }) => (
    <div className="flex flex-col items-center w-full">
      <div className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider mb-2">{label}</div>
      <div className={`px-4 py-2 border rounded-md mb-2 text-center w-full max-w-[280px] ${
        status === false
          ? 'bg-red-50 border-red-200'
          : status === true
          ? 'bg-green-50 border-green-200'
          : 'bg-[var(--bg-base)] border-[var(--border)] opacity-60'
      }`}>
        <div className="font-mono text-sm font-semibold text-[var(--text-primary)]">{id || '—'}</div>
      </div>
      <div className="flex items-center gap-1 text-xs font-semibold mb-2">
        {status === false
          ? <><X className="w-3.5 h-3.5 text-[var(--status-risk)]" /> <span className="text-[var(--status-risk)] uppercase tracking-wide">Missing / Failed</span></>
          : status === true
          ? <><Check className="w-3.5 h-3.5 text-[var(--status-success)]" /> <span className="text-[var(--status-success)] uppercase tracking-wide">Verified</span></>
          : <><AlertTriangle className="w-3.5 h-3.5 text-[var(--status-warning)]" /> <span className="text-[var(--status-warning)] uppercase tracking-wide">Unknown</span></>
        }
      </div>
      {!isLast && <ArrowDown className="w-4 h-4 text-[var(--border)] my-1" />}
    </div>
  );

  const passedCount = [p1, p2, p3, p4].filter(Boolean).length;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg shadow-sm overflow-hidden flex flex-col" style={{maxHeight: '85vh'}}>
      
      {/* Header */}
      <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-raised)] flex justify-between items-start shrink-0">
        <div>
          <div className="eyebrow mb-1">INVESTIGATION</div>
          <h2 className="text-base font-bold text-[var(--text-primary)] leading-snug max-w-[260px]">
            {record.title || record.type || 'Exception'}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="badge badge-risk">UNRECONCILED</span>
            <span className="text-xs text-[var(--text-secondary)]">{record.id}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-medium text-[var(--text-secondary)]">Money at risk</div>
          <div className="text-2xl font-bold text-[var(--status-risk)]">{amt}</div>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        
        {/* Evidence Passes */}
        <div>
          <h3 className="text-xs font-bold text-[var(--text-primary)] mb-3 border-b border-[var(--border)] pb-2 uppercase tracking-wide">
            Evidence Passes ({passedCount}/4)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'P1: Order + Payment', pass: p1 },
              { label: 'P2: Settlement + Fee', pass: p2 },
              { label: 'P3: Bank Credit', pass: p3 },
              { label: 'P4: Refund Check', pass: p4 },
            ].map((item) => (
              <div key={item.label} className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium ${
                item.pass
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {item.pass
                  ? <Check className="w-3.5 h-3.5 shrink-0" />
                  : <X className="w-3.5 h-3.5 shrink-0" />}
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Money Trail */}
        <div>
          <h3 className="text-xs font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border)] pb-2 uppercase tracking-wide">Money Trail</h3>
          <div className="flex flex-col items-center py-4 px-4 bg-[var(--bg-base)] rounded-lg border border-[var(--border-sub)]">
            <Step label="ORDER" id={record.id} status={true} />
            <Step label="PAYMENT" id={record.paymentId || '—'} status={p1} />
            <Step label="SETTLEMENT" id={record.settlementId || 'Not found'} status={p2 === true ? true : p1 === true ? false : null} />
            <Step label="BANK CREDIT" id={record.bankUtr ? `UTR: ${record.bankUtr}` : 'Not confirmed'} status={p3} isLast={true} />
          </div>
        </div>

        {/* Engine's determination */}
        <div>
          <h3 className="text-xs font-bold text-[var(--text-primary)] mb-3 border-b border-[var(--border)] pb-2 uppercase tracking-wide">Why wasn't this reconciled?</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
            <div className="text-xs font-bold text-amber-700 mb-1">NOT RECONCILED</div>
            <p className="text-sm text-amber-900 leading-relaxed">{ruleText}</p>
          </div>
        </div>

        {/* Recommended action */}
        <div>
          <h3 className="text-xs font-bold text-[var(--text-primary)] mb-2 border-b border-[var(--border)] pb-2 uppercase tracking-wide">Recommended action</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{record.action}</p>
        </div>

        {/* Timeline */}
        {record.timeline && record.timeline.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-[var(--text-primary)] mb-3 border-b border-[var(--border)] pb-2 uppercase tracking-wide">Engine trace</h3>
            <div className="space-y-1.5">
              {record.timeline.map((step, idx) => (
                <div key={idx} className={`text-xs px-3 py-1.5 rounded ${
                  step.startsWith('❌')
                    ? 'bg-red-50 text-red-800 font-semibold'
                    : 'bg-[var(--bg-base)] text-[var(--text-secondary)]'
                }`}>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between gap-3 shrink-0">
        {createMsg && (
          <span className="text-xs font-semibold text-[var(--status-success)]">{createMsg}</span>
        )}
        <div className="flex justify-end gap-3 ml-auto">
          <button onClick={onClose} className="btn-secondary text-xs">Close</button>
          <button
            onClick={async () => {
              if (creating || alreadyCreated) return;
              setCreating(true);
              const created = await onCreateCase?.(record);
              setCreating(false);
              if (created) {
                setCreateMsg(`Escalated as ${created.id} — no automation will act on this record.`);
              } else {
                setCreateMsg('Could not create case. The server may be offline.');
              }
            }}
            disabled={creating || alreadyCreated}
            className={`text-xs ${alreadyCreated ? 'btn-secondary' : 'btn-primary'}`}
          >
            {alreadyCreated ? 'Case Escalated' : creating ? 'Creating…' : 'Create Case'}
          </button>
        </div>
      </div>

    </div>
  );
}
