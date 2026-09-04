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
      <Navbar onReset={handleReset} isResetting={isResetting} />
      <HeroSection totalRecords={sources?.orders ?? 100} />
      <DataSourceBanner sources={sources} hasRun={hasRun} isCustom={isCustomDataset} />
      <DatasetUpload
        onUploadSuccess={handleUploadSuccess}
        onClearDataset={handleClearDataset}
        isCustom={isCustomDataset}
      />
      <WorkflowSteps hasRun={hasRun} isReconciling={isReconciling} />
      <ControlPanel
        onRun={handleRunReconciliation}
        isReconciling={isReconciling}
        hasRun={hasRun}
      />
      
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
