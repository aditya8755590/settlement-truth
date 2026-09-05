import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { runReconciliation } from "./engine.js";
import { parseCSVStream, buildDataset } from "./csvParser.js";
import { explainRecord } from "./aiExplainer.js";
import { createSession, getSession, saveEngineResults, deleteSession } from "./db.js";
import { orders as seedOrders } from "./data/orders.js";
import { payments as seedPayments } from "./data/payments.js";
import { refunds as seedRefunds } from "./data/refunds.js";
import { settlements as seedSettlements } from "./data/settlements.js";
import { bankCredits as seedBankCredits } from "./data/bankCredits.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Multer: disk storage for memory safety
const uploadDir = path.join(__dirname, ".data", "uploads");
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
  }),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit per file
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are accepted."));
    }
  },
});

const uploadMiddleware = (req, res, next) => {
  upload.array("files", 15)(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: `File too large.` });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

app.use(cors());
app.use(express.json());

// Session Middleware
app.use((req, res, next) => {
  let sessionId = req.headers["x-session-id"];
  if (!sessionId && req.headers.cookie) {
    const match = req.headers.cookie.match(/sessionId=([^;]+)/);
    if (match) sessionId = match[1];
  }

  if (!sessionId) {
    sessionId = uuidv4();
    // Initialize seed data for new sessions implicitly
    createSession(sessionId, false, null, null, {
      orders: seedOrders,
      payments: seedPayments,
      refunds: seedRefunds,
      settlements: seedSettlements,
      bankCredits: seedBankCredits,
    });
  }
  req.sessionId = sessionId;
  res.setHeader("X-Session-Id", sessionId);
  res.setHeader("Set-Cookie", `sessionId=${sessionId}; Path=/; HttpOnly`);
  next();
});

function requireSession(req, res, next) {
  const session = getSession(req.sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found or expired." });
  }
  req.sessionData = session;
  next();
}

function getSourceCounts(dataset, isCustom) {
  if (!dataset) return { orders: 0, payments: 0, refunds: 0, settlements: 0, bankCredits: 0, isCustom: false };
  return {
    orders: dataset.orders?.length || 0,
    payments: dataset.payments?.length || 0,
    refunds: dataset.refunds?.length || 0,
    settlements: dataset.settlements?.length || 0,
    bankCredits: dataset.bankCredits?.length || 0,
    isCustom,
  };
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/sources", requireSession, (req, res) => {
  res.json(getSourceCounts(req.sessionData.dataset, req.sessionData.isCustom));
});

// ─── Records ──────────────────────────────────────────────────────────────────
app.get("/api/records", requireSession, (req, res) => {
  const { status, limit = 100, offset = 0 } = req.query;
  const results = req.sessionData.engineResults || [];
  
  let records = results;
  if (status && status !== "all") {
    records = records.filter(r => r.status === status);
  }
  
  const total = records.length;
  // Apply pagination
  records = records.slice(Number(offset), Number(offset) + Number(limit));

  res.json({
    count: records.length,
    total,
    filter: status || "all",
    records,
  });
});

app.get("/api/records/:id", requireSession, (req, res) => {
  const results = req.sessionData.engineResults || [];
  const record = results.find(r => r.id === req.params.id);
  if (!record) return res.status(404).json({ error: `Record not found` });
  res.json(record);
});

// ─── Reconciliation ───────────────────────────────────────────────────────────
app.post("/api/reconcile", requireSession, async (req, res) => {
  const dataset = req.sessionData.dataset;
  if (!dataset) return res.status(400).json({ error: "No dataset available." });
  
  // Accept custom rates if passed from frontend (Phase 2 feature)
  const options = {
    gatewayRate: req.body.gatewayRate || 0.0236,
    gstRate: req.body.gstRate || 0.18,
  };

  const result = await runReconciliation(dataset, req.sessionData.isCustom, options);
  
  // Save results back to session DB
  saveEngineResults(req.sessionId, result.records, result.metrics, result.groundTruth, result.auditTrail);
  
  // Don't send the full records array back on the POST to save bandwidth, just metrics
  res.json({
    success: true,
    hasReconciled: true,
    metrics: result.metrics,
    groundTruth: result.groundTruth,
    auditTrail: result.auditTrail,
  });
});

// ─── Explain ──────────────────────────────────────────────────────────────────
app.post("/api/explain/:id", requireSession, async (req, res) => {
  const results = req.sessionData.engineResults || [];
  const record = results.find(r => r.id === req.params.id);
  
  if (!record) {
    return res.status(404).json({ error: `Record not found. Run reconciliation first.` });
  }

  try {
    const explanation = await explainRecord(record);
    res.json({
      orderId: record.id,
      status: record.status,
      ...explanation,
    });
  } catch (err) {
    res.status(500).json({ error: "AI explainer failed." });
  }
});

app.get("/api/explain/config", (_req, res) => {
  res.json({
    aiEnabled: !!process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_API_KEY ? "gemini-2.0-flash" : "deterministic",
    guardrails: ["AI receives pre-computed facts only", "No math allowed", "No guessing"],
  });
});

// ─── Upload (Streaming) ───────────────────────────────────────────────────────
app.post("/api/upload", uploadMiddleware, async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No CSV files provided." });
  }

  const parsedTables = {};
  const parseResults = [];
  const allErrors = [];

  for (const file of req.files) {
    // Stream parse instead of buffer block
    const result = await parseCSVStream(file.path, file.originalname);
    
    if (result.type === "skipped") continue;
    
    parseResults.push({
      filename: file.originalname,
      detectedType: result.type,
      rowCount: result.rowCount,
      validRowCount: result.rows.length,
    });

    if (result.type !== "unknown" && result.rows.length > 0) {
      if (parsedTables[result.type]) {
        parsedTables[result.type].rows.push(...result.rows);
      } else {
        parsedTables[result.type] = result;
      }
    }

    if (result.errors.length > 0) {
      allErrors.push(...result.errors.slice(0, 5).map(e => `[${file.originalname}] ${e}`));
    }
  }

  const dataset = buildDataset(parsedTables);
  if (!dataset.orders.length) {
    return res.status(422).json({ error: "Upload must include an orders CSV." });
  }

  const meta = { files: req.files.map(f => f.originalname), uploadedAt: new Date().toISOString() };
  
  createSession(req.sessionId, true, meta.uploadedAt, meta, dataset);

  res.json({
    success: true,
    sources: getSourceCounts(dataset, true),
    message: `Loaded ${dataset.orders.length} orders successfully. Ready to reconcile.`,
  });
});

// ─── Status & Reset ───────────────────────────────────────────────────────────
app.get("/api/upload/status", requireSession, (req, res) => {
  res.json({
    isCustom: req.sessionData.isCustom,
    uploadedAt: req.sessionData.uploadedAt,
    meta: req.sessionData.uploadMeta,
    sources: getSourceCounts(req.sessionData.dataset, req.sessionData.isCustom),
  });
});

app.post("/api/upload/clear", (req, res) => {
  const sessionId = req.sessionId;
  createSession(sessionId, false, null, null, {
    orders: seedOrders,
    payments: seedPayments,
    refunds: seedRefunds,
    settlements: seedSettlements,
    bankCredits: seedBankCredits,
  });
  const session = getSession(sessionId);
  res.json({
    success: true,
    message: "Reverted to seed dataset.",
    sources: getSourceCounts(session.dataset, false),
  });
});

app.post("/api/reset", (req, res) => {
  const session = getSession(req.sessionId);
  if (session) {
    saveEngineResults(req.sessionId, null, null, null, null);
  }
  res.json({ success: true, message: "Engine state reset." });
});

const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(clientDistPath, "index.html"));
});

app.listen(PORT, () => console.log(`[Settlement Truth] Server → http://localhost:${PORT}`));
