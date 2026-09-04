import React, { useState, useEffect } from "react";
import MetricsGrid from "./components/MetricsGrid";
import ReviewQueueTable from "./components/ReviewQueueTable";
import ExplainPanel from "./components/ExplainPanel";
import TruthTestTraps from "./components/TruthTestTraps";
import AuditTrail from "./components/AuditTrail";
import Hero from "./components/Hero";
import TrustMetrics from "./components/TrustMetrics";
import Features from "./components/Features";
import AnalyticsView from "./components/AnalyticsView";

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
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between p-5 bg-gradient-to-r from-[#0d1424] to-[#040914] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] mt-6 relative overflow-hidden">
        {/* Subtle glow behind header */}
        <div className="absolute top-0 left-1/4 w-96 h-full bg-[#00F0FF]/10 blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#3b82f6] flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)]">
            <span className="text-[#040914] font-bold text-xl leading-none">C</span>
          </div>
          <div>
            <h1 className="text-2xl tracking-tight text-white m-0 leading-tight">
              <span className="font-sans font-bold">Settlement Truth</span>{" "}
              <span className="font-serif italic font-light text-[#00F0FF]">for Finance</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 tracking-wide uppercase">
              {isCustomDataset ? "Custom Dataset Active" : "Synthetic Demo Data Active"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={handleReset} 
            disabled={isResetting}
            className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 backdrop-blur-md"
          >
            {isResetting ? "Resetting..." : "Reset Data"}
          </button>

          <label className="cursor-pointer px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 text-sm font-semibold rounded-full border border-white/10 backdrop-blur-md transition-all flex items-center gap-2">
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
            className="px-8 py-2.5 bg-white hover:bg-slate-200 disabled:bg-white/20 disabled:text-white/50 text-[#040914] text-sm font-bold rounded-full transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2 tracking-wide"
          >
            {isReconciling ? (
              <span className="animate-pulse">Reconciling...</span>
            ) : hasRun ? (
              "Engine Complete"
            ) : (
              "Start Reconciliation"
            )}
          </button>
        </div>
      </header>

      <Hero />
      <TrustMetrics />
      <Features />
      <AnalyticsView />

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
