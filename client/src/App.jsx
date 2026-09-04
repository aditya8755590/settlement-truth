import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import WorkflowSteps from "./components/WorkflowSteps";
import ControlPanel from "./components/ControlPanel";
import MetricsGrid from "./components/MetricsGrid";
import ReviewQueueTable from "./components/ReviewQueueTable";
import ExplainPanel from "./components/ExplainPanel";
import TruthTestTraps from "./components/TruthTestTraps";
import AuditTrail from "./components/AuditTrail";

export default function App() {
  const [records, setRecords] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [hasRun, setHasRun] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [totalBatchSize, setTotalBatchSize] = useState(100);

  // Fetch initial records and audit log
  useEffect(() => {
    fetchRecords("all");
    fetchAudit();
  }, []);

  const fetchRecords = async (filter) => {
    try {
      const res = await fetch(`/api/records?status=${filter}`);
      if (!res.ok) throw new Error("Failed to fetch records");
      const data = await res.json();
      setRecords(data.records || []);
      if (data.total) setTotalBatchSize(data.total);
    } catch (err) {
      console.warn("Backend API unavailable or error, records couldn't be loaded:", err);
    }
  };

  const fetchAudit = async () => {
    try {
      const res = await fetch("/api/audit");
      if (!res.ok) throw new Error("Failed to fetch audit trail");
      const data = await res.json();
      setAuditTrail(data.auditTrail || []);
    } catch (err) {
      console.warn("Audit trail fetch failed:", err);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    fetchRecords(filter);
  };

  const handleRunReconciliation = async () => {
    if (isReconciling || hasRun) return;

    setIsReconciling(true);

    try {
      // Simulate verification delay for realism
      await new Promise((resolve) => setTimeout(resolve, 800));

      const res = await fetch("/api/reconcile", { method: "POST" });
      if (!res.ok) throw new Error("Reconciliation failed");
      const data = await res.json();

      setMetrics(data.metrics);
      setAuditTrail(data.auditTrail);
      setHasRun(true);

      // Refresh records list
      const recordsRes = await fetch(`/api/records?status=${activeFilter}`);
      const recordsData = await recordsRes.json();
      const updatedRecords = recordsData.records || [];
      setRecords(updatedRecords);

      // Auto-select a noteworthy exception (e.g. ORD-88135: Missing settlement)
      const highlight =
        updatedRecords.find((r) => r.id === "ORD-88135") || updatedRecords[0];
      if (highlight) {
        setSelectedRecord(highlight);
      }
    } catch (err) {
      console.error("Error executing reconciliation:", err);
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

      setRecords(data.records || []);
      setActiveFilter("all");
      setSelectedRecord(null);
      setMetrics(null);
      setHasRun(false);
      fetchAudit();
    } catch (err) {
      console.error("Error resetting demo:", err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="app-shell">
      <Navbar onReset={handleReset} isResetting={isResetting} />
      <HeroSection totalRecords={totalBatchSize} />
      <WorkflowSteps hasRun={hasRun} isReconciling={isReconciling} />
      <ControlPanel
        onRun={handleRunReconciliation}
        isReconciling={isReconciling}
        hasRun={hasRun}
      />
      <MetricsGrid metrics={metrics} hasRun={hasRun} />

      <section className="workspace">
        <ReviewQueueTable
          records={records}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          selectedRecord={selectedRecord}
          onSelectRecord={setSelectedRecord}
        />
        <ExplainPanel record={selectedRecord} />
      </section>

      <TruthTestTraps />
      <AuditTrail auditTrail={auditTrail} />
    </main>
  );
}
