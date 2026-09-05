import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import OverviewDashboard from '../dashboard/OverviewDashboard';
import ExceptionQueue from '../dashboard/ExceptionQueue';
import TransactionInvestigation from '../dashboard/TransactionInvestigation';
import DataSources from '../dashboard/DataSources';
import RulesConfig from '../dashboard/RulesConfig';
import CaseManagement from '../dashboard/CaseManagement';
import AuditTrail from '../AuditTrail';

export default function AppShell({ 
  setAppMode, 
  metrics, 
  records, 
  sources,
  groundTruth, 
  hasRun, 
  isReconciling,
  auditTrail,
  handleRunReconciliation,
  handleUpload,
  uploadStatus,
  uploadError
}) {
  const [currentView, setCurrentView] = useState('overview');
  const [selectedCase, setSelectedCase] = useState(null);

  return (
    <div className="flex h-screen w-full bg-[var(--bg-base)] overflow-hidden">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header setAppMode={setAppMode} handleUpload={handleUpload} uploadStatus={uploadStatus} uploadError={uploadError} />
        
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="max-w-7xl mx-auto flex gap-6 h-full">
            
            <div className={`flex-1 transition-all ${selectedCase ? 'max-w-3xl' : 'max-w-5xl'}`}>
              {currentView === 'overview' && (
                <OverviewDashboard metrics={metrics} records={records} hasRun={hasRun} isReconciling={isReconciling} />
              )}

              {currentView === 'reconciliation' && (
                <div className="space-y-6">
                  <header>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Reconciliation Engine</h2>
                    <p className="text-sm text-[var(--text-secondary)]">Run the deterministic audit across all loaded data sources.</p>
                  </header>

                  {/* Sources summary */}
                  {sources && (
                    <div className="surface-card p-5">
                      <div className="eyebrow mb-3">Loaded Data Sources</div>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {Object.entries(sources).filter(([k]) => k !== 'isCustom').map(([key, count]) => (
                          <div key={key} className="text-center">
                            <div className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">{typeof count === 'number' ? count.toLocaleString() : '—'}</div>
                            <div className="text-xs text-[var(--text-muted)] font-medium mt-1 capitalize">{key}</div>
                          </div>
                        ))}
                      </div>
                      {sources.isCustom && (
                        <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[var(--status-success)]"></span>
                          <span className="text-xs font-semibold text-[var(--status-success)]">Custom dataset active</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="surface-card p-10 flex flex-col items-center text-center">
                    <div className="text-sm text-[var(--text-secondary)] mb-6 max-w-md">
                      {hasRun
                        ? `Last audit processed ${metrics?.totalRecords?.toLocaleString() || 0} orders and found ${metrics?.exceptionQueueCount || 0} exceptions.`
                        : 'Upload your CSV files and click Start Audit to run the reconciliation engine.'}
                    </div>
                    <button
                      onClick={handleRunReconciliation}
                      disabled={isReconciling}
                      className="btn-primary"
                    >
                      {isReconciling ? 'Running Audit…' : hasRun ? 'Re-run Audit' : 'Start Audit'}
                    </button>
                    {hasRun && !isReconciling && (
                      <p className="text-xs text-[var(--text-muted)] mt-3">Upload new CSV files above to replace data, then Re-run.</p>
                    )}
                  </div>
                </div>
              )}

              {currentView === 'exceptions' && (
                <ExceptionQueue records={records} onSelectCase={setSelectedCase} />
              )}
              
              {currentView === 'cases' && (
                <CaseManagement />
              )}
              
              {currentView === 'transactions' && (
                <div className="space-y-6">
                  <header>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Transactions</h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {hasRun ? `${records.length.toLocaleString()} records from the last reconciliation run.` : 'Run a reconciliation to see all records.'}
                    </p>
                  </header>
                  <div className="surface-card overflow-hidden">
                    {records.length === 0 ? (
                      <div className="p-10 text-center text-[var(--text-secondary)]">No records yet — run a reconciliation first.</div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Payment ID</th>
                            <th>Status</th>
                            <th>Type</th>
                            <th className="text-right">Amount</th>
                            <th>Evidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.slice(0, 200).map((r, i) => (
                            <tr key={r.id || i}>
                              <td className="font-mono">{r.id}</td>
                              <td className="font-mono text-[var(--text-muted)]">{r.paymentId || '—'}</td>
                              <td>
                                <span className={`badge ${r.status === 'Cleared' ? 'badge-success' : 'badge-risk'}`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="text-[var(--text-secondary)]">{r.type}</td>
                              <td className="text-right tabular-nums">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: r.currency || 'INR', maximumFractionDigits: 0 }).format(r.amount || 0)}
                              </td>
                              <td className="tabular-nums">{r.evidence}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {records.length > 200 && (
                      <div className="px-6 py-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                        Showing 200 of {records.length.toLocaleString()} records. Export CSV for full dataset.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentView === 'audit' && (
                <AuditTrail auditTrail={auditTrail} />
              )}
              
              {currentView === 'sources' && (
                <DataSources sources={sources} />
              )}
              
              {currentView === 'rules' && (
                <RulesConfig metrics={metrics} records={records} />
              )}
              
              {currentView === 'settings' && (
                <div className="surface-card p-6">
                  <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Settings</h2>
                  <p className="text-[var(--text-secondary)]">Configure MDR rates, tolerance thresholds, and Webhook URLs here.</p>
                </div>
              )}
            </div>

            {/* Right side investigation panel */}
            {selectedCase && currentView === 'exceptions' && (
              <aside className="w-[450px] shrink-0 sticky top-0 h-[calc(100vh-120px)]">
                <TransactionInvestigation 
                  record={selectedCase} 
                  onClose={() => setSelectedCase(null)} 
                />
              </aside>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
