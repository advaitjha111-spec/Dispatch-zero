"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

interface ProtocolItem {
  id: string;
  tag: string;
  title: string;
  action: string;
  retrieval: string;
  whyMatch: string;
  steps: string[];
  hazardLevel?: string;
}

const PROTOCOLS: ProtocolItem[] = [
  {
    id: "EMS-CPR-01",
    tag: "TRAUMA // LIFE SAFETY",
    title: "Adult Cardiac Arrest",
    action: "Place flat on hard surface. Begin immediate chest compressions at 100–120/min.",
    retrieval: "8.2ms",
    whyMatch: "Matched via phrase 'collapsed, not breathing'. Local index prioritizes CPR directives without network hops.",
    steps: [
      "Instruct caller: Place patient flat on firm back surface.",
      "Direct compressions: 100 to 120 beats per minute, 2 inches deep.",
      "Do not stop compressions until ALS unit arrives or AED is charged.",
    ],
  },
  {
    id: "DOT-ERG-119",
    tag: "HAZMAT // UN 1005",
    title: "Anhydrous Ammonia Vapor Release",
    hazardLevel: "TOXIC INHALATION HAZARD",
    action: "Isolate spill zone 100m in all directions. Evacuate downwind. SCBA required.",
    retrieval: "8.5ms",
    whyMatch: "Indexed from DOT Emergency Response Guidebook. Extracts initial isolation distance within 9ms.",
    steps: [
      "Establish 100m (330ft) initial isolation perimeter immediately.",
      "Direct callers and units: Stay strictly upwind, uphill, upstream.",
      "Prohibit entry into closed spaces without positive-pressure SCBA.",
    ],
  },
  {
    id: "NFPA-SOP-21",
    tag: "FIRE // STRUCTURAL",
    title: "Commercial Structural Collapse",
    hazardLevel: "STRUCTURAL FAILURE",
    action: "Establish collapse zone 1.5x building height. Sound evacuation audible tones.",
    retrieval: "9.1ms",
    whyMatch: "Parsed from NFPA structural safety guides. Flags imminent wall failure and sets perimeter.",
    steps: [
      "Sound emergency evacuation tones across all operational tactical channels.",
      "Establish collapse zone equal to 1.5 times wall height minimum.",
      "Account for all interior crews via immediate PAR (Personnel Accountability Report).",
    ],
  },
];

export default function ProtocolGrid() {
  const [expandedId, setExpandedId] = useState<string | null>(PROTOCOLS[0].id);

  return (
    <section
      id="protocols"
      aria-labelledby="protocols-heading"
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
        <div className="flex items-center gap-3 mb-3">
          <span className="font-mono text-xs font-semibold tracking-[0.2em] text-[#38c8ff] uppercase">
            / PROTOCOL ENGINE
          </span>
          <span className="font-mono text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#081224] border border-[#ff765e]/30 text-[#ff765e]">
            DEMO CONTENT
          </span>
        </div>
        <h2
          id="protocols-heading"
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F2EA] mb-4"
        >
          Verified protocols. Instant retrieval.
        </h2>
        <p className="text-base sm:text-lg text-[#8fa2b8] leading-relaxed">
          Our embedded protocol engine indexes critical operating procedures the moment a call begins, presenting actionable steps faster than any human could search a database.
        </p>
      </motion.div>

      {/* 3 Expandable Protocol Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PROTOCOLS.map((p, index) => {
          const isExpanded = expandedId === p.id;

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`p-6 sm:p-7 rounded-[20px] border transition-all duration-300 flex flex-col justify-between ${
                isExpanded
                  ? "bg-[#0d1e3a]/90 border-[#38c8ff]/40 shadow-xl shadow-black/40"
                  : "bg-[#081224] border-[rgba(124,165,216,0.14)] hover:border-[rgba(124,165,216,0.25)]"
              }`}
            >
              <div>
                {/* Header Tag + Latency Badge */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="font-mono text-[10px] sm:text-[11px] font-semibold text-[#8fa2b8] tracking-wider truncate">
                    {p.tag}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 rounded-full bg-[#040914] text-[#ff765e] border border-[#ff765e]/25">
                      DEMO
                    </span>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#071321] text-[#42E0B2] border border-[#42E0B2]/30 font-semibold tabular-nums">
                      MOSS {p.retrieval}
                    </span>
                  </div>
                </div>

                {/* ID & Title */}
                <div className="font-mono text-xs text-[#93A9C0] mb-1">
                  {p.id}
                </div>
                <h3 className="text-xl font-bold text-[#F4F2EA] mb-3 tracking-tight">
                  {p.title}
                </h3>

                {/* Optional Hazard Banner */}
                {p.hazardLevel && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ff765e]/15 border border-[#ff765e]/30 text-[#ff765e] font-mono text-[10px] font-bold mb-4 tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{p.hazardLevel}</span>
                  </div>
                )}

                {/* Immediate Action Directive */}
                <div className="bg-[#040914]/70 p-4 rounded-[14px] border border-[rgba(124,165,216,0.12)] mb-5">
                  <span className="block font-mono text-[10px] text-[#38c8ff] mb-1 uppercase tracking-wider font-semibold">
                    IMMEDIATE DIRECTIVE
                  </span>
                  <p className="text-sm font-medium text-[#F4F2EA] leading-relaxed">
                    {p.action}
                  </p>
                </div>

                {/* Expanded Steps & Match Logic */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-4 pt-4 border-t border-[rgba(124,165,216,0.14)] text-xs"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-[#38c8ff] uppercase tracking-wider block mb-1 font-semibold">
                        MATCH LOGIC
                      </span>
                      <p className="text-[#8fa2b8] leading-relaxed">
                        {p.whyMatch}
                      </p>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] text-[#93A9C0] uppercase tracking-wider block mb-2 font-semibold">
                        SEQUENTIAL ACTIONS
                      </span>
                      <div className="space-y-2">
                        {p.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="text-[#F4F2EA] bg-[#071321]/90 p-2.5 rounded-[10px] border border-[rgba(124,165,216,0.1)] font-mono text-[11px] leading-relaxed flex items-start gap-2.5"
                          >
                            <span className="text-[#38c8ff] font-bold shrink-0">
                              0{idx + 1}
                            </span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Expand / Collapse Action Button */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
                aria-expanded={isExpanded}
                className="mt-5 pt-3 border-t border-[rgba(124,165,216,0.1)] text-xs font-mono font-semibold tracking-wider text-[#38c8ff] hover:text-[#42E0B2] flex items-center justify-between cursor-pointer group"
              >
                <span>{isExpanded ? "HIDE DETAILS" : "REVEAL PROCEDURAL STEPS"}</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Protocol Display Disclaimer */}
      <div className="mt-8 p-3 rounded-[12px] bg-[#081224] border border-[rgba(124,165,216,0.12)] flex items-center justify-between text-[11px] text-[#8fa2b8]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#42E0B2] shrink-0" aria-hidden="true" />
          <span>DEMO CONTENT — Follow certified emergency dispatch procedures and local authority guidance.</span>
        </div>
        <span className="font-mono text-[10px] text-[#93A9C0] uppercase hidden sm:inline">
          LOCAL IN-MEMORY INDEX
        </span>
      </div>
    </section>
  );
}
