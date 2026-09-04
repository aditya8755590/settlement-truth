import React from "react";

export default function WorkflowSteps({ hasRun, isReconciling }) {
  return (
    <section className="workflow">
      <div className="workflow-step active">
        <span>01</span> Ingest sources
      </div>
      <div className="workflow-line"></div>
      <div className={`workflow-step ${hasRun || isReconciling ? "active" : ""}`}>
        <span>02</span> Verify evidence
      </div>
      <div className="workflow-line"></div>
      <div className={`workflow-step ${hasRun ? "active" : ""}`}>
        <span>03</span> Match or escalate
      </div>
    </section>
  );
}
