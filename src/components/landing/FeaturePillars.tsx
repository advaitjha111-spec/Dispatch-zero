"use client";

import { motion } from "framer-motion";
import { Mic, Cpu, ShieldCheck } from "lucide-react";

interface PillarItem {
  id: string;
  title: string;
  microLabel: string;
  description: string;
  icon: typeof Mic;
  accent: "cyan" | "mint" | "coral";
}

const PILLARS: PillarItem[] = [
  {
    id: "capture",
    title: "Capture",
    microLabel: "FIELD-SECURE AUDIO",
    description: "Secure voice input from field, device, or radio, with zero external exposure.",
    icon: Mic,
    accent: "cyan",
  },
  {
    id: "understand",
    title: "Understand",
    microLabel: "LOCAL LANGUAGE INTELLIGENCE",
    description: "Proprietary language models tuned for critical and multilingual scenarios.",
    icon: Cpu,
    accent: "mint",
  },
  {
    id: "act",
    title: "Act",
    microLabel: "GUIDED RESPONSE",
    description: "Deliver structured intelligence and guided response in real time.",
    icon: ShieldCheck,
    accent: "coral",
  },
];

export default function FeaturePillars() {
  return (
    <section
      id="platform"
      aria-labelledby="pillars-heading"
      className="py-24 max-w-7xl mx-auto px-4 sm:px-8"
    >
      {/* Editorial Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl mb-16"
      >
        <span className="font-mono text-xs font-semibold tracking-[0.2em] text-[#38c8ff] uppercase block mb-3">
          / THE EDGE ADVANTAGE
        </span>
        <h2
          id="pillars-heading"
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F2EA] mb-4"
        >
          Clarity when seconds matter.
        </h2>
        <p className="text-base sm:text-lg text-[#8fa2b8] leading-relaxed">
          The system is deliberately quiet. It removes the cloud hop between a caller&apos;s voice and the next correct action.
        </p>
      </motion.div>

      {/* 3 Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {PILLARS.map((p, index) => {
          const Icon = p.icon;
          const isCyan = p.accent === "cyan";
          const isMint = p.accent === "mint";

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
              className="p-8 rounded-[20px] bg-[#081224] border border-[rgba(124,165,216,0.14)] hover:border-[rgba(124,165,216,0.28)] transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Header Icon + Micro Label */}
                <div className="flex items-center justify-between mb-8">
                  <div
                    className={`w-12 h-12 rounded-[14px] flex items-center justify-center border transition-all duration-300 ${
                      isCyan
                        ? "bg-[#071321] border-[#38c8ff]/30 text-[#38c8ff] group-hover:border-[#38c8ff] group-hover:shadow-[0_0_15px_rgba(56,200,255,0.3)]"
                        : isMint
                        ? "bg-[#071321] border-[#42E0B2]/30 text-[#42E0B2] group-hover:border-[#42E0B2] group-hover:shadow-[0_0_15px_rgba(66,224,178,0.3)]"
                        : "bg-[#071321] border-[#ff765e]/30 text-[#ff765e] group-hover:border-[#ff765e] group-hover:shadow-[0_0_15px_rgba(255,118,94,0.3)]"
                    }`}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>

                  <span className="font-mono text-[10px] tracking-[0.16em] uppercase font-semibold text-[#8fa2b8]">
                    {p.microLabel}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-[#F4F2EA] mb-3 tracking-tight">
                  {p.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[#8fa2b8] leading-relaxed mb-6">
                  {p.description}
                </p>
              </div>

              {/* Restrained Accent Indicator */}
              <div
                className={`h-[2px] w-8 rounded-full transition-all duration-300 group-hover:w-16 ${
                  isCyan ? "bg-[#38c8ff]" : isMint ? "bg-[#42E0B2]" : "bg-[#ff765e]"
                }`}
                aria-hidden="true"
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
