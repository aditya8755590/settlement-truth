import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { engine } from "./engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Settlement Truth API",
    timestamp: new Date().toISOString(),
  });
});

// ─── Data source counts (for the Data Source Banner) ─────────────────────────
app.get("/api/sources", (_req, res) => {
  res.json(engine.sourceCounts());
});

// ─── Records ──────────────────────────────────────────────────────────────────
app.get("/api/records", (req, res) => {
  const { status } = req.query;
  const records = engine.getRecords(status);
  res.json({
    count: records.length,
    total: engine.records.length,
    filter: status || "all",
    records,
  });
});

app.get("/api/records/:id", (req, res) => {
  const record = engine.getRecordById(req.params.id);
  if (!record) {
    return res
      .status(404)
      .json({ error: `Record ${req.params.id} not found` });
  }
  res.json(record);
});

// ─── Reconciliation ───────────────────────────────────────────────────────────
app.post("/api/reconcile", (_req, res) => {
  const result = engine.runReconciliation();
  res.json(result);
});

// ─── Audit ────────────────────────────────────────────────────────────────────
app.get("/api/audit", (_req, res) => {
  res.json({ auditTrail: engine.getAuditTrail() });
});

// ─── Ground-truth evaluation metrics ─────────────────────────────────────────
app.get("/api/metrics/groundtruth", (_req, res) => {
  const gt = engine.getGroundTruth();
  if (!gt) {
    return res
      .status(409)
      .json({ error: "Run reconciliation first to compute ground-truth metrics." });
  }
  res.json(gt);
});

// ─── Reset ────────────────────────────────────────────────────────────────────
app.post("/api/reset", (_req, res) => {
  const result = engine.reset();
  res.json({
    ...result,
    message: "Reconciliation engine reset to initial state.",
    sources: engine.sourceCounts(),
  });
});

// ─── Serve React build in production ─────────────────────────────────────────
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
    if (err) res.status(200).send("Settlement Truth API is running.");
  });
});

app.listen(PORT, () => {
  console.log(`[Settlement Truth] Server → http://localhost:${PORT}`);
});
