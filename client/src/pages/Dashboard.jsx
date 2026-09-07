import { useCallback, useEffect, useState } from "react";
import Hero from "../components/showcase/Hero";
import Statement from "../components/showcase/Statement";
import MetricsArc from "../components/showcase/MetricsArc";
import BentoGrid from "../components/showcase/BentoGrid";
import AnalyticsDashboard from "../components/showcase/AnalyticsDashboard";
import AnomalyLedger from "../components/showcase/AnomalyLedger";
import FAQ from "../components/showcase/FAQ";
import Footer from "../components/showcase/Footer";
import { deriveAuditView } from "../lib/dashboardData";

async function readJson(response) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "The request could not be completed.");
  return payload;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [records, setRecords] = useState([]);
  const [sources, setSources] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const audit = deriveAuditView(metrics, records);

  const refresh = useCallback(async () => {
    const [recordData, sourceData] = await Promise.all([
      fetch("/api/records?status=all&limit=5000").then(readJson),
      fetch("/api/sources").then(readJson),
    ]);
    setRecords(recordData.records || []);
    setMetrics(recordData.metrics || null);
    setSources(sourceData);
  }, []);

  useEffect(() => {
    refresh().catch(() => setNotice({ type: "error", text: "Could not load this audit session. Check that the server is running." }));
  }, [refresh]);

  const runAudit = async () => {
    if (loading || !sources?.orders) return;
    setLoading(true);
    setNotice(null);
    try {
      const data = await fetch("/api/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gatewayRate: 0.02 }),
      }).then(readJson);
      setMetrics(data.metrics || null);
      await refresh();
      setNotice({ type: "success", text: "Audit complete. Results below are based only on the uploaded evidence." });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const upload = async (event) => {
    const files = [...event.target.files];
    event.target.value = "";
    if (!files.length || loading) return;
    setLoading(true);
    setNotice(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      await fetch("/api/upload", { method: "POST", body: formData }).then(readJson);
      const data = await fetch("/api/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gatewayRate: 0.02 }),
      }).then(readJson);
      setMetrics(data.metrics || null);
      await refresh();
      setNotice({ type: "success", text: "Audit complete. Results below are based only on the uploaded evidence." });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const clearAudit = async () => {
    if (loading) return;
    setLoading(true);
    setNotice(null);
    try {
      await fetch("/api/upload/clear", { method: "POST" }).then(readJson);
      await refresh();
      setNotice({ type: "success", text: "Source data cleared from this browser session." });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const launch = () => document.querySelector("#upload")?.scrollIntoView({ behavior: "smooth" });

  return <main>
    <Hero audit={audit} onLaunch={launch} />
    <Statement />
    <MetricsArc audit={audit} />
    <BentoGrid />
    <AnalyticsDashboard audit={audit} />
    <AnomalyLedger audit={audit} records={records} />
    <FAQ />
    <Footer
      onUpload={upload}
      onRunAudit={runAudit}
      onClearAudit={clearAudit}
      loading={loading}
      notice={notice}
      sources={sources}
    />
  </main>;
}
