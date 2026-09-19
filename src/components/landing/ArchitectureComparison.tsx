"use client";

import { motion } from "framer-motion";

export default function ArchitectureComparison() {
  const COMPARISONS = [
    {
      metric: "Audio Transport & STT",
      cloud: "350ms (Cloud roundtrip)",
      edge: "180ms (Direct streaming PCM)",
      status: "3x Faster",
    },
    {
      metric: "Protocol & Context Retrieval",
      cloud: "250–450ms (Remote Pinecone/Milvus API)",
      edge: "< 10ms (In-Memory Moss SDK)",
      status: "Local Moat",
    },
    {
      metric: "Reasoning & LLM Directives",
      cloud: "1,100ms (Multi-turn Cloud LLM)",
      edge: "115ms (Groq LPU token streaming)",
      status: "Sub-Second",
    },
    {
      metric: "Spoken Voice Synthesis",
      cloud: "500ms (Batched Cloud TTS)",
      edge: "180ms (Cartesia streaming frames)",
      status: "Zero Buffer",
    },
    {
      metric: "Total Voice-to-Voice RTT",
      cloud: "2,200ms+ (Exceeds emergency safety threshold)",
      edge: "836ms (Immediate verbal guidance)",
      status: "Mission Ready",
    },
    {
      metric: "Disaster / Blackout Resilience",
      cloud: "Total system halt on cell tower drop",
      edge: "100% operational on local node",
      status: "Air-Gapped",
    },
  ];

  return (
    <section
      id="architecture"
      aria-labelledby="architecture-heading"
      className="py-24 max-w-7xl mx-auto px-4 sm:px-8"
    >
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl mb-14"
      >
        <span className="font-mono text-xs font-semibold tracking-[0.2em] text-[#38c8ff] uppercase block mb-3">
          / ARCHITECTURE
        </span>
        <h2
          id="architecture-heading"
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F2EA] mb-4"
        >
          Cloud dependency is the vulnerability.
        </h2>
        <p className="text-base sm:text-lg text-[#8fa2b8] leading-relaxed">
          Standard emergency response systems rely on fragile cloud connections. DispatchZero moves the entire intelligence stack to the tactical edge.
        </p>
      </motion.div>

      {/* Comparison Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#081224] border border-[rgba(124,165,216,0.14)] rounded-[20px] overflow-hidden"
      >
        {/* Table Header (Desktop) */}
        <div className="hidden md:grid grid-cols-12 px-8 py-4 bg-[#071321] border-b border-[rgba(124,165,216,0.14)] text-xs font-mono tracking-wider text-[#8fa2b8] uppercase">
          <div className="col-span-4">DIMENSION</div>
          <div className="col-span-4">STANDARD CLOUD CAD</div>
          <div className="col-span-4 text-[#38c8ff] flex items-center gap-2">
            <span>DISPATCHZERO TACTICAL EDGE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#42E0B2]" aria-hidden="true" />
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[rgba(124,165,216,0.08)]">
          {COMPARISONS.map((row, i) => (
            <div
              key={i}
              className="p-5 sm:p-6 md:px-8 md:py-4.5 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-0 items-center hover:bg-[#0d1e3a]/40 transition-colors"
            >
              {/* Metric Title */}
              <div className="md:col-span-4">
                <span className="text-sm font-semibold text-[#F4F2EA]">
                  {row.metric}
                </span>
              </div>

              {/* Cloud Value (Mobile stack labeled) */}
              <div className="md:col-span-4 flex items-center justify-between md:justify-start gap-2">
                <span className="text-[10px] md:hidden font-mono uppercase text-[#8fa2b8] px-2 py-0.5 rounded bg-[#040914]">
                  Cloud CAD
                </span>
                <span className="text-xs sm:text-sm text-[#8fa2b8] font-mono">
                  {row.cloud}
                </span>
              </div>

              {/* Edge Value (Mobile stack labeled) */}
              <div className="md:col-span-4 flex items-center justify-between md:justify-start gap-3 md:border-l md:border-[rgba(124,165,216,0.14)] md:pl-6">
                <span className="text-[10px] md:hidden font-mono uppercase text-[#38c8ff] px-2 py-0.5 rounded bg-[#071321] border border-[#38c8ff]/20">
                  Tactical Edge
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-mono font-bold text-[#F4F2EA]">
                    {row.edge}
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#42E0B2]/15 text-[#42E0B2] border border-[#42E0B2]/30 font-semibold shrink-0">
                    {row.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
