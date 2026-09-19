"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface CTASectionProps {
  onLaunchConsole: () => void;
}

export default function CTASection({ onLaunchConsole }: CTASectionProps) {
  const FEATURE_FLAGS = [
    "No sign-up required",
    "Runs in-browser",
    "Your mic stays local",
  ];

  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="p-8 sm:p-12 md:p-16 rounded-[24px] bg-[#081224] border border-[rgba(124,165,216,0.18)] relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 shadow-2xl shadow-black/50"
      >
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-[radial-gradient(circle,rgba(56,200,255,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-xl z-10">
          {/* Readiness Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#071321] border border-[#42E0B2]/30 mb-5">
            <span className="w-2 h-2 rounded-full bg-[#42E0B2] animate-pulse" aria-hidden="true" />
            <span className="font-mono text-xs text-[#42E0B2] tracking-wider uppercase font-semibold">
              OPERATIONAL READINESS: 100%
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F4F2EA] tracking-tight mb-4">
            INITIALIZE THE SYSTEM.
          </h2>

          <p className="text-base text-[#8fa2b8] leading-relaxed mb-6">
            Enter the tactical mission console to test real-time voice capture, witness sub-10ms Moss protocol matches, and monitor live latency telemetry.
          </p>

          {/* Feature Flags */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#8fa2b8]">
            {FEATURE_FLAGS.map((flag) => (
              <div key={flag} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#42E0B2]" aria-hidden="true" />
                <span>{flag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="z-10 w-full sm:w-auto">
          <button
            onClick={onLaunchConsole}
            id="cta-engage-mission-console-btn"
            className="btn-glow-cyan w-full sm:w-auto px-8 py-4 text-sm font-mono tracking-wider gap-3 group cursor-pointer"
            aria-label="Engage Mission Console"
          >
            <span>ENGAGE MISSION CONSOLE</span>
            <span className="group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
          </button>
        </div>
      </motion.div>
    </section>
  );
}
