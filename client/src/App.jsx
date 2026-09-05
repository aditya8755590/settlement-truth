import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import MetricsGrid from "./components/MetricsGrid";
import ReviewQueueTable from "./components/ReviewQueueTable";
import ExplainPanel from "./components/ExplainPanel";
import TruthTestTraps from "./components/TruthTestTraps";
import AuditTrail from "./components/AuditTrail";

export default function App() {
  const [sources, setSources] = useState(null);
  const [records, setRecords] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const RECORDS_PER_PAGE = 50;
  
  const [metrics, setMetrics] = useState(null);
  const [groundTruth, setGroundTruth] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [hasRun, setHasRun] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCustomDataset, setIsCustomDataset] = useState(false);
  const [gatewayRate, setGatewayRate] = useState(2.36);
  const [gstRate, setGstRate] = useState(18);

  // On mount: load raw source counts, audit trail, and upload state
  useEffect(() => {
    fetch("/api/sources")
      .then((r) => r.json())
      .then((d) => { setSources(d); if (d.isCustom) setIsCustomDataset(true); })
      .catch(() => {});

    fetch("/api/audit")
      .then((r) => r.json())
      .then((d) => setAuditTrail(d.auditTrail ?? []))
      .catch(() => {});

    fetch("/api/upload/status")
      .then((r) => r.json())
      .then((d) => { if (d.isCustom) setIsCustomDataset(true); })
      .catch(() => {});
  }, []);

  const fetchRecords = async (filter, page = 1) => {
    try {
      const offset = (page - 1) * RECORDS_PER_PAGE;
      const res = await fetch(`/api/records?status=${filter}&limit=${RECORDS_PER_PAGE}&offset=${offset}`);
      if (!res.ok) return;
      const data = await res.json();
      setRecords(data.records ?? []);
      setTotalPages(Math.max(1, Math.ceil(data.total / RECORDS_PER_PAGE)));
    } catch (_) {}
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    fetchRecords(filter, 1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchRecords(activeFilter, newPage);
  };

  // Called when CSV upload succeeds — refresh sources, reset reconciliation
  const handleUploadSuccess = (newSources) => {
    setSources(newSources);
    setIsCustomDataset(true);
    setHasRun(false);
    setRecords([]);
    setMetrics(null);
    setGroundTruth(null);
    setSelectedRecord(null);
    fetch("/api/audit")
      .then((r) => r.json())
      .then((d) => setAuditTrail(d.auditTrail ?? []))
      .catch(() => {});
  };

  // Called when user reverts to seed data
  const handleClearDataset = (newSources) => {
    setSources(newSources);
    setIsCustomDataset(false);
    setHasRun(false);
    setRecords([]);
    setMetrics(null);
    setGroundTruth(null);
    setSelectedRecord(null);
    fetch("/api/audit")
      .then((r) => r.json())
      .then((d) => setAuditTrail(d.auditTrail ?? []))
      .catch(() => {});
  };

  const handleRunReconciliation = async () => {
    if (isReconciling || hasRun) return;
    setIsReconciling(true);
    try {
      // Simulate 800ms verification delay for realism
      await new Promise((resolve) => setTimeout(resolve, 800));

      const res = await fetch("/api/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gatewayRate: parseFloat(gatewayRate) / 100,
          gstRate: parseFloat(gstRate) / 100,
        })
      });
      if (!res.ok) throw new Error("Reconciliation failed");
      const data = await res.json();

      setMetrics(data.metrics);
      setGroundTruth(data.groundTruth);
      setAuditTrail(data.auditTrail);
      setHasRun(true);

      // Refresh record list (page 1)
      setCurrentPage(1);
      const recRes = await fetch(`/api/records?status=${activeFilter}&limit=${RECORDS_PER_PAGE}&offset=0`);
      const recData = await recRes.json();
      const updatedRecords = recData.records ?? [];
      setRecords(updatedRecords);
      setTotalPages(Math.max(1, Math.ceil(recData.total / RECORDS_PER_PAGE)));

      // Auto-select the most interesting exception
      const highlight =
        updatedRecords.find((r) => r.id === "ORD-88135") ?? updatedRecords[0];
      if (highlight) setSelectedRecord(highlight);
    } catch (err) {
      console.error("Reconciliation error:", err);
    } finally {
      setIsReconciling(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (!res.ok) throw new Error("Reset failed");
      const data = await res.json();

      setSources(data.sources ?? null);
      setRecords([]);
      setActiveFilter("all");
      setSelectedRecord(null);
      setCurrentPage(1);
      setTotalPages(1);
      setMetrics(null);
      setGroundTruth(null);
      setHasRun(false);

      const auditRes = await fetch("/api/audit");
      const auditData = await auditRes.json();
      setAuditTrail(auditData.auditTrail ?? []);
    } catch (err) {
      console.error("Reset error:", err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 overflow-x-hidden">

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 1 — Full Landing Page Experience
      ───────────────────────────────────────────────────────────────── */}
      <Dashboard />

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 2 — Reconciliation Engine (anchor target for "Launch Audit")
      ───────────────────────────────────────────────────────────────── */}
      <section id="reconcile-engine" className="relative" style={{ background: 'var(--bg-base)' }}>
        {/* Section separator */}
        <div style={{ height: 1, background: 'var(--border-sub)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20">

          {/* Engine Command Header */}
          <header
            className="flex items-center justify-between p-4 rounded-xl mb-8"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M2 11L6 6.5L9.5 9.5L13 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold m-0 leading-tight"
                    style={{ color: 'var(--text-primary)' }}>
                  Reconciliation Engine
                  <span className="ml-2 badge badge-success">live</span>
                </h2>
                <p className="text-xs mt-0.5"
                   style={{ color: 'var(--text-muted)' }}>
                  {isCustomDataset ? 'Custom Dataset Active' : 'Synthetic Demo Data Active'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Gateway Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={gatewayRate}
                  onChange={(e) => setGatewayRate(e.target.value)}
                  disabled={hasRun || isReconciling}
                  className="bg-transparent border rounded px-2 py-1 w-20 text-right focus:outline-none focus:border-[var(--accent)]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  disabled={hasRun || isReconciling}
                  className="bg-transparent border rounded px-2 py-1 w-20 text-right focus:outline-none focus:border-[var(--accent)]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="btn-secondary text-sm px-4 py-2"
              >
                {isResetting ? 'Resetting…' : 'Reset Data'}
              </button>

              <label
                className="btn-secondary text-sm px-4 py-2 cursor-pointer flex items-center gap-2"
              >
                <span>{isCustomDataset ? 'Upload More CSVs' : 'Upload Custom CSVs'}</span>
                <input
                  type="file"
                  multiple
                  accept=".csv"
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    if (!files.length) return;
                    const formData = new FormData();
                    files.forEach((f) => formData.append('files', f));
                    try {
                      const res = await fetch('/api/upload', { method: 'POST', body: formData });
                      if (res.ok) {
                        const data = await res.json();
                        handleUploadSuccess(data.sources);
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                />
              </label>

              <button
                onClick={handleRunReconciliation}
                disabled={isReconciling || hasRun}
                className="btn-primary text-sm px-5 py-2"
                style={isReconciling || hasRun ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
              >
                {isReconciling ? 'Reconciling…' : hasRun ? 'Engine Complete ✓' : 'Start Reconciliation'}
              </button>
            </div>
          </header>

          {/* Engine UI Components */}
          <div className="space-y-6">
            <MetricsGrid metrics={metrics} groundTruth={groundTruth} hasRun={hasRun} />

            <section className="flex flex-col xl:flex-row gap-6 items-start w-full">
              <div className="flex-1 w-full xl:w-2/3 overflow-hidden">
                <ReviewQueueTable
                  records={records}
                  activeFilter={activeFilter}
                  onFilterChange={handleFilterChange}
                  selectedRecord={selectedRecord}
                  onSelectRecord={setSelectedRecord}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
              <aside className="w-full xl:w-1/3 shrink-0 xl:sticky xl:top-6">
                <ExplainPanel record={selectedRecord} />
              </aside>
            </section>
          </div>

          <div className="mt-6 space-y-6">
            <TruthTestTraps />
            <AuditTrail auditTrail={auditTrail} />
          </div>
        </div>
      </section>
    </div>
  );
}
