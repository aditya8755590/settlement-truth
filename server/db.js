import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const db = new Database(path.join(__dirname, '.data/settlement.db'));

// Init schema
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    isCustom INTEGER DEFAULT 0,
    uploadedAt TEXT,
    uploadMeta TEXT,
    datasetJson TEXT,
    engineResultsJson TEXT,
    metricsJson TEXT,
    groundTruthJson TEXT,
    auditTrailJson TEXT,
    casesJson TEXT
  );
`);

db.pragma('journal_mode = WAL');

// Migration: older DBs predate the cases column
const sessionCols = db.prepare("PRAGMA table_info(sessions)").all().map((c) => c.name);
if (!sessionCols.includes("casesJson")) {
  db.exec("ALTER TABLE sessions ADD COLUMN casesJson TEXT");
}

// ─── Data Access Helpers ──────────────────────────────────────────────────────

export function createSession(sessionId, isCustom, uploadedAt, uploadMeta, dataset) {
  const stmt = db.prepare(`
    INSERT INTO sessions (id, isCustom, uploadedAt, uploadMeta, datasetJson)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      isCustom = excluded.isCustom,
      uploadedAt = excluded.uploadedAt,
      uploadMeta = excluded.uploadMeta,
      datasetJson = excluded.datasetJson,
      engineResultsJson = NULL,
      metricsJson = NULL,
      groundTruthJson = NULL,
      auditTrailJson = NULL,
      casesJson = NULL
  `);
  stmt.run(
    sessionId,
    isCustom ? 1 : 0,
    uploadedAt,
    JSON.stringify(uploadMeta),
    JSON.stringify(dataset)
  );
}

export function getSession(sessionId) {
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!row) return null;
  return {
    id: row.id,
    isCustom: !!row.isCustom,
    uploadedAt: row.uploadedAt,
    uploadMeta: row.uploadMeta ? JSON.parse(row.uploadMeta) : null,
    dataset: row.datasetJson ? JSON.parse(row.datasetJson) : null,
    engineResults: row.engineResultsJson ? JSON.parse(row.engineResultsJson) : null,
    metrics: row.metricsJson ? JSON.parse(row.metricsJson) : null,
    groundTruth: row.groundTruthJson ? JSON.parse(row.groundTruthJson) : null,
    auditTrail: row.auditTrailJson ? JSON.parse(row.auditTrailJson) : null,
    cases: row.casesJson ? JSON.parse(row.casesJson) : null,
  };
}

export function saveEngineResults(sessionId, results, metrics, groundTruth, auditTrail) {
  const stmt = db.prepare(`
    UPDATE sessions
    SET engineResultsJson = ?,
        metricsJson = ?,
        groundTruthJson = ?,
        auditTrailJson = ?
    WHERE id = ?
  `);
  stmt.run(
    JSON.stringify(results),
    JSON.stringify(metrics),
    JSON.stringify(groundTruth),
    JSON.stringify(auditTrail),
    sessionId
  );
}

export function saveCases(sessionId, cases) {
  const stmt = db.prepare('UPDATE sessions SET casesJson = ? WHERE id = ?');
  stmt.run(JSON.stringify(cases), sessionId);
}

export function appendAuditEntry(sessionId, entry) {
  const session = getSession(sessionId);
  if (!session) return [];
  const trail = session.auditTrail || [];
  const next = [...trail, entry];
  saveEngineResults(sessionId, session.engineResults, session.metrics, session.groundTruth, next);
  return next;
}

export function deleteSession(sessionId) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}
