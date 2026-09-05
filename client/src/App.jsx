import React, { useState, useEffect, useRef } from "react";
import CondensedLanding from "./components/landing/CondensedLanding";
import AppShell from "./components/layout/AppShell";

export default function App() {
  const [appMode, setAppMode] = useState("landing"); // 'landing' or 'product'

  // Data State
  const [sources, setSources] = useState(null);
  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [groundTruth, setGroundTruth] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [cases, setCases] = useState([]);

  // Process State
  const [hasRun, setHasRun] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // 'uploading' | 'done' | 'error'

  // Settings
  const [gatewayRate, setGatewayRate] = useState(2);
  const [gstRate, setGstRate] = useState(18);

  // Prevent concurrent runs
  const isReconcilingRef = useRef(false);

  // Load initial source counts from the server (to show what's loaded)
  useEffect(() => {
    fetch("/api/sources")
      .then((r) => r.json())
      .then((d) => setSources(d))
      .catch(() => {});
    fetch("/api/cases")
      .then((r) => r.json())
      .then((d) => setCases(d.cases ?? []))
      .catch(() => {});
  }, []);

  /**
   * Escalate a reconciled (or exception) record into a tracked case.
   * Persists via the API and appends an audit-trail entry server-side.
   */
  const createCase = async (record) => {
    if (!record) return null;
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: record.id }),
      });
      if (!res.ok) throw new Error("Case creation failed");
      const data = await res.json();

      // Reflect the new case and appended audit entry without a full reload
      setCases((prev) => [...prev, data.case]);
      if (data.auditTrail) setAuditTrail(data.auditTrail);
      return data.case;
    } catch (err) {
      console.error("Create case error:", err);
      return null;
    }
  };

  /** Run the reconciliation engine. Always runs fresh. */
  const runReconciliation = async () => {
    if (isReconcilingRef.current) return;
    isReconcilingRef.current = true;
    setIsReconciling(true);
    // Clear old results while running
    setMetrics(null);
    setRecords([]);
    setGroundTruth(null);
    setAuditTrail([]);

    try {
      const res = await fetch("/api/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gatewayRate: parseFloat(gatewayRate) / 100,
          gstRate: parseFloat(gstRate) / 100,
        }),
      });

      if (!res.ok) throw new Error("Reconciliation failed");
      const data = await res.json();

      setMetrics(data.metrics);
      setGroundTruth(data.groundTruth);
      setAuditTrail(data.auditTrail ?? []);
      setHasRun(true);

      // Fetch all records
      const recRes = await fetch(`/api/records?status=all&limit=5000&offset=0`);
      const recData = await recRes.json();
      setRecords(recData.records ?? []);
    } catch (err) {
      console.error("Reconciliation error:", err);
    } finally {
      isReconcilingRef.current = false;
      setIsReconciling(false);
    }
  };

  /** Upload CSV files. On success, automatically re-runs reconciliation. */
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    e.target.value = ""; // allow re-selecting same file

    setUploadError(null);
    setUploadStatus("uploading");

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Upload failed. Check that you included an orders CSV.");
        setUploadStatus("error");
        return;
      }

      setSources(data.sources);
      setUploadStatus("done");
      setHasRun(false); // clear guard before running

      // Auto-run reconciliation on new data
      await runReconciliation();
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError("Network error — is the server running?");
      setUploadStatus("error");
    }
  };

  /** Trigger a manual reconciliation run */
  const handleRunReconciliation = () => runReconciliation();

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await fetch("/api/reset", { method: "POST" });
      await fetch("/api/upload/clear", { method: "POST" });

      const srcRes = await fetch("/api/sources");
      setSources(await srcRes.json());

      setRecords([]);
      setMetrics(null);
      setGroundTruth(null);
      setAuditTrail([]);
      setCases([]);
      setHasRun(false);
      setUploadStatus(null);
      setUploadError(null);
    } catch (err) {
      console.error("Reset error:", err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {appMode === "landing" ? (
        <CondensedLanding
          setAppMode={setAppMode}
          handleRunReconciliation={handleRunReconciliation}
        />
      ) : (
        <AppShell
          setAppMode={setAppMode}
          sources={sources}
          records={records}
          metrics={metrics}
          groundTruth={groundTruth}
          auditTrail={auditTrail}
          cases={cases}
          createCase={createCase}
          hasRun={hasRun}
          isReconciling={isReconciling}
          gatewayRate={gatewayRate}
          setGatewayRate={setGatewayRate}
          gstRate={gstRate}
          setGstRate={setGstRate}
          handleRunReconciliation={handleRunReconciliation}
          handleReset={handleReset}
          isResetting={isResetting}
          handleUpload={handleUpload}
          uploadStatus={uploadStatus}
          uploadError={uploadError}
        />
      )}
    </>
  );
}
