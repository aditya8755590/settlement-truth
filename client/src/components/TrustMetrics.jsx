import React from "react";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

export default function TrustMetrics() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2, // Trigger when 20% visible
  });

  return (
    <section className="w-full bg-gradient-to-b from-[#e0f2fe] to-[#f0f9ff] py-24 border-y border-blue-200">
      <div className="max-w-7xl mx-auto px-6">
        <div 
          ref={ref} 
          className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-blue-200"
        >
          {/* Stat 1 */}
          <div className="flex flex-col items-center justify-center p-4">
            <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-3 font-sans">
              Volume Processed
            </h3>
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tighter">
              {inView ? (
                <CountUp start={0} end={5.2} decimals={1} duration={2.5} suffix="M+" />
              ) : (
                "0M+"
              )}
            </div>
            <p className="text-slate-600 mt-4 text-sm font-medium font-serif italic">
              Transactions matched globally
            </p>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col items-center justify-center p-4">
            <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-3 font-sans">
              Accuracy
            </h3>
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tighter">
              {inView ? (
                <CountUp start={0} end={99.9} decimals={1} duration={2.5} suffix="%" />
              ) : (
                "0%"
              )}
            </div>
            <p className="text-slate-600 mt-4 text-sm font-medium font-serif italic">
              Zero false positives. Ever.
            </p>
          </div>

          {/* Stat 3 */}
          <div className="flex flex-col items-center justify-center p-4">
            <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-3 font-sans">
              Protected Revenue
            </h3>
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tighter">
              {inView ? (
                <CountUp start={0} end={12.5} decimals={1} duration={2.5} prefix="₹" suffix="B" />
              ) : (
                "₹0B"
              )}
            </div>
            <p className="text-slate-600 mt-4 text-sm font-medium font-serif italic">
              Saved from gateway leakage
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
