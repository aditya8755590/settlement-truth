import React, { useCallback } from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Statement from '../components/landing/Statement';
import MetricsArc from '../components/landing/MetricsArc';
import BentoGrid from '../components/landing/BentoGrid';
import AnalyticsDashboard from '../components/landing/AnalyticsDashboard';
import AnomalyLedger from '../components/landing/AnomalyLedger';
import FAQ from '../components/landing/FAQ';
import Footer from '../components/landing/Footer';

export default function Dashboard() {
  const handleLaunchAudit = useCallback(() => {
    document.getElementById('reconcile-engine')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  return (
    <div className="relative">
      {/* Floating Navbar */}
      <Navbar onLaunchAudit={handleLaunchAudit} />

      {/* ── Section A: Hero ── */}
      <Hero onLaunchAudit={handleLaunchAudit} />

      {/* ── Section B: Statement (Dark → Light) ── */}
      <Statement />

      {/* ── Section C: Metrics Arc ── */}
      <MetricsArc />

      {/* ── Section D: Bento Feature Grid ── */}
      <BentoGrid />

      {/* ── Section E: Interactive Analytics ── */}
      <AnalyticsDashboard />

      {/* ── Section F: Anomaly Ledger ── */}
      <AnomalyLedger />

      {/* ── Section G: FAQ ── */}
      <FAQ />

      {/* ── Section H: Footer with CSV Upload ── */}
      <Footer onLaunchAudit={handleLaunchAudit} />
    </div>
  );
}
