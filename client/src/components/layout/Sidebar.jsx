import React from 'react';
import { LayoutDashboard, FileSpreadsheet, AlertOctagon, Briefcase, List, Activity, Settings, Database, Code } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView }) {
  const primaryNav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'reconciliation', label: 'Reconciliation', icon: FileSpreadsheet },
    { id: 'exceptions', label: 'Exceptions', icon: AlertOctagon },
    { id: 'cases', label: 'Cases', icon: Briefcase },
    { id: 'transactions', label: 'Transactions', icon: List },
    { id: 'audit', label: 'Audit Log', icon: Activity },
  ];

  const secondaryNav = [
    { id: 'sources', label: 'Data Sources', icon: Database },
    { id: 'rules', label: 'Rules', icon: Code },
  ];

  const bottomNav = [
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderNavGroup = (items) => (
    <ul className="space-y-1">
      {items.map(item => (
        <li key={item.id}>
          <button
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === item.id 
                ? 'bg-blue-50 text-[var(--accent)]' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]'
            }`}
          >
            <item.icon className="w-4 h-4" strokeWidth={currentView === item.id ? 2.5 : 2} />
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="w-64 flex-shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border)] h-screen sticky top-0 flex flex-col">
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--accent)] flex items-center justify-center">
             <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
              <path d="M2 11L6 6.5L9.5 9.5L13 4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[var(--text-primary)] font-bold tracking-tight">Settlement Truth</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        <div>
          {renderNavGroup(primaryNav)}
        </div>
        
        <div>
          <span className="eyebrow px-3">Infrastructure</span>
          {renderNavGroup(secondaryNav)}
        </div>
      </div>

      <div className="p-3 border-t border-[var(--border)]">
        {renderNavGroup(bottomNav)}
        
        <div className="mt-4 px-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--status-success)]"></span>
          <span className="text-xs font-medium text-[var(--text-secondary)]">Audit Live</span>
        </div>
      </div>
    </div>
  );
}
