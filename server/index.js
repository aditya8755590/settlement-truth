import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { engine } from "./engine.js";
import { parseCSV, buildDataset } from "./csvParser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Multer: in-memory storage, up to 5 files, 100 MB per file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are accepted."));
    }
  },
});

// Multer error handler wrapper
const uploadMiddleware = (req, res, next) => {
  upload.array("files", 15)(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: `File too large. Maximum size is 100 MB per file.` });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

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

// ─── Dataset Upload ───────────────────────────────────────────────────────────

// POST /api/upload — accept up to 5 CSV files, parse & load into engine
app.post("/api/upload", uploadMiddleware, async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No CSV files provided." });
  }

  const parsed = {};
  const parseResults = [];
  const allErrors = [];

  for (const file of req.files) {
    const result = parseCSV(file.buffer, file.originalname);
    parseResults.push({
      filename: file.originalname,
      detectedType: result.type,
      rowCount: result.rowCount,
      validRowCount: result.validRowCount ?? result.rows.length,
      errors: result.errors,
      preview: result.preview,
      detectedColumns: result.detectedColumns,
    });

    if (result.type !== "unknown" && result.rows.length > 0) {
      // If same type uploaded twice, merge rows
      if (parsed[result.type]) {
        parsed[result.type] = {
          ...result,
          rows: [...parsed[result.type].rows, ...result.rows],
        };
      } else {
        parsed[result.type] = result;
      }
    }

    if (result.errors.length > 0) {
      allErrors.push(...result.errors.map((e) => `[${file.originalname}] ${e}`));
    }
  }

  // Build the complete dataset (derives missing tables from what was uploaded)
  const dataset = buildDataset(parsed);

  // Guard: need at least orders + payments to run
  if (!dataset.orders.length || !dataset.payments.length) {
    return res.status(422).json({
      error: "Upload must include at least an orders CSV and a payments CSV.",
      parseResults,
      errors: allErrors,
    });
  }

  // Load into the engine
  const meta = {
    files: req.files.map((f) => f.originalname),
    parsedTables: parseResults,
    uploadedAt: new Date().toISOString(),
  };

  const loadResult = engine.loadDataset(dataset, meta);

  return res.json({
    success: true,
    parseResults,
    errors: allErrors,
    sources: loadResult.sources,
    dataset: {
      orders:      dataset.orders.length,
      payments:    dataset.payments.length,
      refunds:     dataset.refunds.length,
      settlements: dataset.settlements.length,
      bankCredits: dataset.bankCredits.length,
    },
    message: `Loaded ${dataset.orders.length} orders from ${req.files.length} CSV file(s). Ready to reconcile.`,
  });
});

// GET /api/upload/status — current upload state
app.get("/api/upload/status", (_req, res) => {
  res.json({
    ...engine.getUploadState(),
    sources: engine.sourceCounts(),
  });
});

// POST /api/upload/clear — revert to seed data
app.post("/api/upload/clear", (_req, res) => {
  const result = engine.revertToSeed();
  res.json({
    success: true,
    message: "Reverted to seed dataset.",
    sources: result.sources,
  });
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
