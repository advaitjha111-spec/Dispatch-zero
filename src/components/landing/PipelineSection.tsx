"use client";

import { motion } from "framer-motion";

export default function PipelineSection() {
  const STAGES = [
    {
      num: "01",
      title: "Audio Capture & VAD",
      subtitle: "TURN-TAKING WITH INTERRUPTION HANDLING",
      detail: "16kHz PCM audio stream parsed via Silero VAD. When a caller interrupts, active TTS playback immediately halts.",
      tech: "LiveKit WebRTC + Silero",
      status: "ACTIVE LISTENER",
      statusColor: "#38c8ff",
    },
    {
      num: "02",
      title: "Local In-Memory Indexing",
      subtitle: "DETERMINISTIC MOSS PROTOCOL MOAT",
      detail: "Transcript queries the local in-memory session. Matched procedures (DOT-ERG, NFPA, CPR) are returned in under 10ms.",
      tech: "@moss-dev/moss SDK",
      status: "< 10MS RETRIEVAL",
      statusColor: "#42E0B2",
    },
    {
      num: "03",
      title: "Streaming Directive & Voice",
      subtitle: "SUB-SECOND VERBAL GUIDANCE",
      detail: "Groq LPU streams concise life-safety tokens directly into Cartesia Sonic TTS, reaching the operator headset in 836ms.",
      tech: "Groq Llama-3 + Cartesia",
      status: "STREAMING READY",
      statusColor: "#ff765e",
    },
  ];

  return (
    <section
      id="pipeline"
      aria-labelledby="pipeline-heading"
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
          / HOW IT WORKS
        </span>
        <h2
          id="pipeline-heading"
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F2EA] mb-4"
        >
          Three stages. Sub-second delivery.
        </h2>
        <p className="text-base sm:text-lg text-[#8fa2b8] leading-relaxed">
          From voice input to synthesized response, the entire pipeline runs on the tactical edge with zero cloud dependency.
        </p>
      </motion.div>

      {/* 3 Connected Numbered Stages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {STAGES.map((stage, i) => (
          <motion.div
            key={stage.num}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: i * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="p-7 sm:p-8 bg-[#081224] border border-[rgba(124,165,216,0.14)] rounded-[20px] flex flex-col justify-between hover:border-[rgba(124,165,216,0.28)] transition-all duration-300 group"
          >
            <div>
              {/* Stage Number & Operational Status */}
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#38c8ff] tracking-tight">
                  {stage.num}
                </span>
                <span
                  className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-[#071321] border font-semibold tracking-wider uppercase"
                  style={{
                    color: stage.statusColor,
                    borderColor: `${stage.statusColor}33`,
                  }}
                >
                  {stage.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#F4F2EA] mb-1.5 tracking-tight">
                {stage.title}
              </h3>
              <div className="text-[11px] font-mono tracking-wider text-[#38c8ff] uppercase mb-4">
                {stage.subtitle}
              </div>

              <p className="text-sm text-[#8fa2b8] leading-relaxed mb-6">
                {stage.detail}
              </p>
            </div>

            {/* Stack Info Footer */}
            <div className="pt-4 border-t border-[rgba(124,165,216,0.12)] flex items-center justify-between text-xs font-mono">
              <span className="text-[#8fa2b8] uppercase text-[10px] tracking-wider">
                ENGINE
              </span>
              <span className="text-[#F4F2EA] font-semibold text-[11px]">
                {stage.tech}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
