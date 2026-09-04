import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { engine, formatINR } from "./engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Settlement Truth API",
    timestamp: new Date().toISOString(),
  });
});

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
    return res.status(404).json({ error: `Record ${req.params.id} not found` });
  }
  res.json(record);
});

app.post("/api/reconcile", (req, res) => {
  const result = engine.runReconciliation();
  res.json(result);
});

app.get("/api/audit", (req, res) => {
  res.json({
    auditTrail: engine.getAuditTrail(),
  });
});

app.post("/api/reset", (req, res) => {
  engine.reset();
  res.json({
    success: true,
    message: "Reconciliation batch reset to initial state",
    records: engine.getRecords("all"),
  });
});

// Serve client in production
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
    if (err) {
      res.status(200).send("Settlement Truth API Server is running. Client build not found yet.");
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Settlement Truth] Server running at http://localhost:${PORT}`);
});
