import React, { useState, useRef, useCallback } from "react";

const TABLE_LABELS = {
  orders:      { icon: "📦", label: "Orders",       color: "#c9922d" },
  payments:    { icon: "💳", label: "Payments",     color: "#335a85" },
  orderItems:  { icon: "🛒", label: "Order Items",  color: "#c9922d" },
  settlements: { icon: "🏦", label: "Settlements",  color: "#28745b" },
  bankCredits: { icon: "✅", label: "Bank Credits", color: "#6a4f9e" },
  refunds:     { icon: "↩️", label: "Refunds / Reviews", color: "#b44b3f" },
  customers:   { icon: "👤", label: "Customers",    color: "#76736b" },
  skipped:     { icon: "⏭",  label: "Skipped",      color: "#b8b3a9" },
  unknown:     { icon: "❓", label: "Unknown",      color: "#76736b" },
};

export default function DatasetUpload({ onUploadSuccess, onClearDataset, isCustom }) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);       // { file, status, result }
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [globalError, setGlobalError] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith(".csv"));
    if (dropped.length) addFiles(dropped);
  }, []);

  const handleFileInput = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length) addFiles(selected);
    e.target.value = "";
  };

  const addFiles = (newFiles) => {
    setGlobalError(null);
    setUploadResult(null);
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.file.name));
      const toAdd = newFiles.filter((f) => !existing.has(f.name));
      return [...prev, ...toAdd.map((f) => ({ file: f, status: "pending" }))];
    });
    if (!isExpanded) setIsExpanded(true);
  };

  const removeFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.file.name !== name));
  };

  const handleUpload = async () => {
    if (!files.length || isUploading) return;
    setIsUploading(true);
    setGlobalError(null);
    setUploadResult(null);

    const formData = new FormData();
    files.forEach(({ file }) => formData.append("files", file));

    // Mark all as uploading
    setFiles((prev) => prev.map((f) => ({ ...f, status: "uploading" })));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setGlobalError(data.error ?? "Upload failed.");
        setFiles((prev) => prev.map((f) => ({ ...f, status: "error" })));
        return;
      }

      // Map results back to files
      const resultMap = new Map(data.parseResults.map((r) => [r.filename, r]));
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: resultMap.get(f.file.name)?.errors?.length > 0 ? "warning" : "success",
          result: resultMap.get(f.file.name),
        }))
      );

      setUploadResult(data);
      if (onUploadSuccess) onUploadSuccess(data.sources);
    } catch (err) {
      setGlobalError("Network error. Is the server running?");
      setFiles((prev) => prev.map((f) => ({ ...f, status: "error" })));
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      const res = await fetch("/api/upload/clear", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setFiles([]);
        setUploadResult(null);
        setGlobalError(null);
        setIsExpanded(false);
        if (onClearDataset) onClearDataset(data.sources);
      }
    } catch (err) {
      setGlobalError("Failed to clear dataset.");
    } finally {
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileStatusIcon = (status) => {
    if (status === "uploading") return <span className="upload-spinner" />;
    if (status === "success")   return <span className="file-status-icon success">✓</span>;
    if (status === "warning")   return <span className="file-status-icon warning">⚠</span>;
    if (status === "error")     return <span className="file-status-icon error">✗</span>;
    return null;
  };

  const readyToUpload = files.length > 0 && !isUploading && !uploadResult;

  return (
    <section className="dataset-upload-section">
      {/* Header row */}
      <div className="upload-header-row">
        <div className="upload-title-block">
          <span className="upload-title-icon">⬆</span>
          <div>
            <h3 className="upload-title">Upload Dataset</h3>
            <p className="upload-subtitle">
              Drop your own CSV files (Olist format or any order/payment export)
            </p>
          </div>
        </div>
        <div className="upload-header-actions">
          {isCustom && (
            <span className="custom-dataset-badge">
              <span className="badge-dot" />
              Custom Dataset Active
            </span>
          )}
          {isCustom && (
            <button
              className="btn-revert"
              onClick={handleClear}
              disabled={isClearing}
            >
              {isClearing ? "Reverting…" : "Use Seed Data"}
            </button>
          )}
          <button
            className="btn-toggle-upload"
            onClick={() => setIsExpanded((v) => !v)}
          >
            {isExpanded ? "Hide" : "Upload CSV"}
          </button>
        </div>
      </div>

      {/* Expandable upload panel */}
      {isExpanded && (
        <div className="upload-panel">
          {/* Drop zone */}
          <div
            className={`drop-zone ${isDragging ? "dragging" : ""} ${isUploading ? "uploading-state" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              multiple
              style={{ display: "none" }}
              onChange={handleFileInput}
            />
            <div className="drop-zone-content">
              <div className={`drop-icon-ring ${isDragging ? "ring-active" : ""}`}>
                <span className="drop-icon">📂</span>
              </div>
              <p className="drop-primary">
                {isDragging ? "Release to upload" : "Drag & drop CSV files here"}
              </p>
              <p className="drop-secondary">
                or <span className="drop-link">click to browse</span>
              </p>
              <div className="drop-hints">
                {["orders", "payments", "settlements", "bank_credits", "refunds"].map((t) => (
                  <span key={t} className="drop-hint-chip">{t}.csv</span>
                ))}
              </div>
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="file-list">
              {files.map(({ file, status, result }) => {
                const meta = result ? TABLE_LABELS[result.detectedType] ?? TABLE_LABELS.unknown : null;
                return (
                  <div key={file.name} className={`file-card ${status}`}>
                    <div className="file-card-left">
                      <span className="file-card-type-icon">
                        {meta ? meta.icon : "📄"}
                      </span>
                      <div className="file-card-info">
                        <span className="file-card-name">{file.name}</span>
                        <span className="file-card-meta">
                          {formatBytes(file.size)}
                          {meta && (
                            <>
                              {" · "}
                              <span style={{ color: meta.color, fontWeight: 600 }}>
                                {meta.label}
                              </span>
                              {result && ` · ${result.validRowCount ?? result.rowCount} rows`}
                            </>
                          )}
                        </span>
                        {result?.errors?.length > 0 && (
                          <ul className="file-error-list">
                            {result.errors.slice(0, 3).map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                            {result.errors.length > 3 && (
                              <li>…and {result.errors.length - 3} more</li>
                            )}
                          </ul>
                        )}
                        {/* Column preview */}
                        {result?.detectedColumns?.length > 0 && (
                          <div className="col-chips">
                            {result.detectedColumns.slice(0, 6).map((c) => (
                              <span key={c} className="col-chip">{c}</span>
                            ))}
                            {result.detectedColumns.length > 6 && (
                              <span className="col-chip muted">+{result.detectedColumns.length - 6}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="file-card-right">
                      {fileStatusIcon(status)}
                      {status === "pending" && (
                        <button
                          className="file-remove-btn"
                          onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                          title="Remove"
                        >×</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Row preview table */}
          {uploadResult?.parseResults?.some((r) => r.preview?.length > 0) && (
            <div className="preview-section">
              <p className="preview-label">Data Preview</p>
              {uploadResult.parseResults.filter((r) => r.preview?.length > 0).map((r) => {
                const meta = TABLE_LABELS[r.detectedType] ?? TABLE_LABELS.unknown;
                return (
                  <div key={r.filename} className="preview-table-wrap">
                    <div className="preview-table-header">
                      <span>{meta.icon} {r.filename}</span>
                      <span className="preview-badge" style={{ background: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="preview-scroll">
                      <table className="preview-table">
                        <thead>
                          <tr>
                            {Object.keys(r.preview[0] ?? {}).slice(0, 8).map((col) => (
                              <th key={col}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {r.preview.map((row, i) => (
                            <tr key={i}>
                              {Object.values(row).slice(0, 8).map((val, j) => (
                                <td key={j}>{val ?? "—"}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Global error */}
          {globalError && (
            <div className="upload-error-banner">
              <span>⚠</span> {globalError}
            </div>
          )}

          {/* Success banner */}
          {uploadResult && !globalError && (
            <div className="upload-success-banner">
              <span>✓</span> {uploadResult.message}
              {uploadResult.errors?.length > 0 && (
                <span className="upload-partial"> ({uploadResult.errors.length} warnings)</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="upload-actions">
            {readyToUpload && (
              <button className="btn-upload-submit" onClick={handleUpload}>
                <span>⬆</span> Load Dataset into Engine
              </button>
            )}
            {isUploading && (
              <button className="btn-upload-submit loading" disabled>
                <span className="upload-spinner-inline" /> Parsing & loading…
              </button>
            )}
            {files.length > 0 && !isUploading && (
              <button
                className="btn-clear-files"
                onClick={() => { setFiles([]); setUploadResult(null); setGlobalError(null); }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
