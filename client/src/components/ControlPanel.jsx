import React from "react";

export default function ControlPanel({ onRun, isReconciling, hasRun }) {
  return (
    <section className="control-panel">
      <div>
        <p className="eyebrow">CONTROL ROOM</p>
        <h2>August settlement reconciliation</h2>
        <p>5 sources · 100 records · 15 deliberately difficult exceptions</p>
      </div>
      <button
        className="primary-button"
        id="runButton"
        onClick={onRun}
        disabled={isReconciling || hasRun}
      >
        {isReconciling ? (
          <>
            <span className="status-dot pulse-animation"></span>
            Verifying 5 sources…
          </>
        ) : hasRun ? (
          <>✓ Reconciliation complete</>
        ) : (
          <>
            <span className="play">▶</span> Run reconciliation
          </>
        )}
      </button>
    </section>
  );
}
