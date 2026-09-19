"use client";

import { motion } from "framer-motion";

export default function MetricsBanner() {
  const METRICS = [
    {
      value: "< 1.2s",
      label: "END-TO-END LATENCY",
      target: "BENCHMARK TARGET",
    },
    {
      value: "99.97%",
      label: "RECOGNITION ACCURACY",
      target: "LOCAL VAD / STT",
    },
    {
      value: "100%",
      label: "AIR-GAPPED OPERATION",
      target: "ZERO CLOUD HOPS",
    },
    {
      value: "24/7",
      label: "MISSION READINESS",
      target: "FAILOVER RESILIENT",
    },
  ];

  return (
    <section
      aria-label="Key Performance Demonstration Metrics"
      className="py-14 border-t border-b border-[rgba(124,165,216,0.14)] bg-[#040914]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
          {METRICS.map((m, index) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`flex flex-col items-center text-center px-4 ${
                index !== 0 ? "lg:border-l lg:border-[rgba(124,165,216,0.14)]" : ""
              }`}
            >
              <div className="font-mono text-3xl sm:text-4xl lg:text-5xl font-light text-[#F4F2EA] tracking-tight mb-2 tabular-nums">
                {m.value}
              </div>
              <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] font-semibold text-[#8fa2b8] uppercase mb-1">
                {m.label}
              </div>
              <div className="font-mono text-[9px] tracking-wider text-[#93A9C0]/70 uppercase">
                {m.target}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
