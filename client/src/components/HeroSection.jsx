import React from "react";

export default function HeroSection({ totalRecords = 100 }) {
  return (
    <section className="hero" id="top">
      <div>
        <p className="eyebrow">AI FINANCE CONTROLLER · RAZORPAY BUILDATHON</p>
        <h1>
          Reconcile cash.
          <br />
          <em>Never invent the truth.</em>
        </h1>
        <p className="hero-copy">
          Settlement Truth compares merchant orders, gateway events, refunds,
          settlements and bank credits. It auto-matches only evidence-backed
          records—and escalates the rest.
        </p>
      </div>

      <aside className="hero-card">
        <p className="mini-label">TODAY'S BATCH</p>
        <strong>{totalRecords}</strong>
        <span> synthetic records</span>
        <div className="hero-rule"></div>
        <p>
          <span className="badge safe">SAFE BY DESIGN</span>
          <br />
          No money action is taken. Every recommendation is explainable and
          reviewable.
        </p>
      </aside>
    </section>
  );
}
