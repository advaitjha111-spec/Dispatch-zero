"use client";

import { motion } from "framer-motion";
import SignalRoute from "./SignalRoute";

interface HeroSectionProps {
  onLaunchConsole: () => void;
}

export default function HeroSection({ onLaunchConsole }: HeroSectionProps) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative pt-28 pb-16 md:pt-40 md:pb-24 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column: Headline and CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 flex flex-col items-start"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#081224] border border-[rgba(124,165,216,0.18)] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38c8ff]" aria-hidden="true" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-[#38c8ff] uppercase">
              AIR-GAPPED EMERGENCY VOICE INTELLIGENCE
            </span>
          </div>

          {/* Master 3-Line Headline with Outlined EMERGENCY */}
          <h1
            id="hero-heading"
            className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-[#F4F2EA] leading-[1.0] mb-6 select-none"
          >
            <span>SUB-SECOND</span>
            <br />
            <span className="text-outlined">EMERGENCY</span>
            <br />
            <span>INTELLIGENCE</span>
          </h1>

          {/* Subtitle / Body Copy */}
          <p className="text-base sm:text-lg text-[#8fa2b8] leading-relaxed mb-8 max-w-lg">
            Real-time voice understanding, secured in isolation. Built for critical moments.
          </p>

          {/* Action CTAs: Primary + Secondary */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <button
              onClick={onLaunchConsole}
              id="hero-engage-console-btn"
              className="btn-glow-cyan px-7 py-3.5 text-sm font-mono tracking-wider gap-2 group cursor-pointer"
              aria-label="Engage Mission Console"
            >
              <span>Engage Console</span>
              <span className="group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
            </button>

            <a
              href="#protocols"
              className="px-6 py-3.5 rounded-full border border-[rgba(124,165,216,0.22)] bg-[#081224]/80 text-[#F4F2EA] hover:bg-[#0d1e3a] hover:border-[#38c8ff]/40 text-sm font-mono tracking-wider transition-all duration-200 cursor-pointer"
            >
              Review Protocol Set
            </a>
          </div>

          {/* Proof Labels */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[rgba(124,165,216,0.12)]">
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#081224] border border-[rgba(124,165,216,0.14)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#42E0B2]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold tracking-wider text-[#F4F2EA] uppercase">
                LOCAL-FIRST INFERENCE
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#081224] border border-[rgba(124,165,216,0.14)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38c8ff]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-semibold tracking-wider text-[#F4F2EA] uppercase">
                &lt; 900MS TARGET
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Interactive 4-Node Signal Route */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 w-full"
        >
          <SignalRoute />
        </motion.div>
      </div>
    </section>
  );
}
