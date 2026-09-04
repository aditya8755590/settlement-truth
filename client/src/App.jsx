import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import DataSourceBanner from "./components/DataSourceBanner";
import DatasetUpload from "./components/DatasetUpload";
import WorkflowSteps from "./components/WorkflowSteps";
import ControlPanel from "./components/ControlPanel";
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
  const [metrics, setMetrics] = useState(null);
  const [groundTruth, setGroundTruth] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [hasRun, setHasRun] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCustomDataset, setIsCustomDataset] = useState(false);

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

  const fetchRecords = async (filter) => {
    try {
      const res = await fetch(`/api/records?status=${filter}`);
      if (!res.ok) return;
      const data = await res.json();
      setRecords(data.records ?? []);
    } catch (_) {}
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    fetchRecords(filter);
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

      const res = await fetch("/api/reconcile", { method: "POST" });
      if (!res.ok) throw new Error("Reconciliation failed");
      const data = await res.json();

      setMetrics(data.metrics);
      setGroundTruth(data.groundTruth);
      setAuditTrail(data.auditTrail);
      setHasRun(true);

      // Refresh record list
      const recRes = await fetch(`/api/records?status=${activeFilter}`);
      const recData = await recRes.json();
      const updatedRecords = recData.records ?? [];
      setRecords(updatedRecords);

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
    <main className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col space-y-8">
      {/* Sleek Command Center Header */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg mt-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)]">
            <span className="text-slate-950 font-bold text-lg leading-none">R</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">AI Finance Controller</h1>
            <p className="text-xs text-slate-400">
              {isCustomDataset ? "Custom Dataset Active" : "Synthetic Demo Data Active"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset} 
            disabled={isResetting}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
          >
            {isResetting ? "Resetting..." : "Reset Data"}
          </button>

          <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-2">
            <span>{isCustomDataset ? "Upload More CSVs" : "Upload Custom CSVs"}</span>
            <input 
              type="file" 
              multiple 
              accept=".csv"
              className="hidden" 
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (!files.length) return;
                const formData = new FormData();
                files.forEach(f => formData.append("files", f));
                try {
                  const res = await fetch("/api/upload", { method: "POST", body: formData });
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
            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white text-sm font-bold rounded-lg transition-all shadow-[0_4px_14px_rgba(52,211,153,0.25)] flex items-center gap-2"
          >
            {isReconciling ? (
              <span className="animate-pulse">Reconciling...</span>
            ) : hasRun ? (
              "Engine Complete"
            ) : (
              <>
                <span className="text-emerald-200">▶</span> Run Engine
              </>
            )}
          </button>
        </div>
      </header>

      {/* Command Center Layout */}
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <MetricsGrid metrics={metrics} groundTruth={groundTruth} hasRun={hasRun} />

        <section className="flex flex-col xl:flex-row gap-6 items-start w-full">
          <div className="flex-1 w-full xl:w-2/3 overflow-hidden">
            <ReviewQueueTable
              records={records}
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              selectedRecord={selectedRecord}
              onSelectRecord={setSelectedRecord}
            />
          </div>
          <aside className="w-full xl:w-1/3 shrink-0 xl:sticky xl:top-6">
            <ExplainPanel record={selectedRecord} />
          </aside>
        </section>
      </div>

      <TruthTestTraps />
      <AuditTrail auditTrail={auditTrail} />
    </main>
  );
}
