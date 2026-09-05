import React, { useRef } from 'react';
import { Download, UploadCloud, UserCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function Header({ setAppMode, handleUpload, uploadStatus, uploadError }) {
  const fileInputRef = useRef(null);

  const uploadLabel = uploadStatus === 'uploading' ? 'Uploading…'
    : uploadStatus === 'done' ? 'Uploaded ✓'
    : 'Upload Data';

  const uploadIcon = uploadStatus === 'uploading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
    : uploadStatus === 'done' ? <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
    : uploadStatus === 'error' ? <XCircle className="w-3.5 h-3.5 text-[var(--status-risk)]" />
    : <UploadCloud className="w-3.5 h-3.5" />;

  return (
    <header className="h-16 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center justify-between px-6 sticky top-0 z-40">
      
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-[var(--text-primary)] border-r border-[var(--border)] pr-4">
          Merchant Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] font-medium">Period:</span>
          <span className="text-xs font-bold px-2 py-1 bg-[var(--bg-raised)] border border-[var(--border)] rounded-md">
            {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          className="btn-secondary text-xs px-3 py-1.5 rounded"
          onClick={() => setAppMode('landing')}
        >
          Exit to Website
        </button>

        <button className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border)] px-3 py-1.5 rounded bg-[var(--bg-raised)]">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>

        {/* Real upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadStatus === 'uploading'}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border)] px-3 py-1.5 rounded bg-[var(--bg-raised)] disabled:opacity-60"
        >
          {uploadIcon}
          {uploadLabel}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv"
          className="hidden"
          onChange={handleUpload}
        />

        {uploadError && (
          <span className="text-xs text-[var(--status-risk)] max-w-xs truncate" title={uploadError}>
            ⚠ {uploadError}
          </span>
        )}

        <div className="w-8 h-8 rounded-full bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] ml-2">
          <UserCircle className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
}
