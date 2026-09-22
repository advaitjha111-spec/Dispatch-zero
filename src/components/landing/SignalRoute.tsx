"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

interface NodeItem {
  id: string;
  label: string;
  color: "cyan" | "coral";
  latency: string;
  detail: string;
  engine: string;
}

const NODES: NodeItem[] = [
  {
    id: "audio",
    label: "AUDIO",
    color: "cyan",
    latency: "180ms",
    detail: "16kHz PCM audio stream with Silero VAD for micro-pause turn taking.",
    engine: "Silero VAD / LiveKit",
  },
  {
    id: "index",
    label: "LOCAL INDEX",
    color: "cyan",
    latency: "8.2ms",
    detail: "In-memory Moss vector query over local emergency protocols with zero cloud hops.",
    engine: "Moss In-Memory SDK",
  },
  {
    id: "inference",
    label: "INFERENCE",
    color: "cyan",
    latency: "115ms",
    detail: "Groq LPU token streaming for instantaneous, concise verbal directives.",
    engine: "Groq Llama-3 8B",
  },
  {
    id: "output",
    label: "VOICE OUTPUT",
    color: "coral",
    latency: "180ms",
    detail: "Cartesia Sonic streaming TTS delivering audio directly over WebRTC.",
    engine: "Cartesia Sonic WebRTC",
  },
];

export default function SignalRoute() {
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(0);
  const [isAutoCycling, setIsAutoCycling] = useState<boolean>(true);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Automatic shifting animation: advances through nodes sequentially (disabled if reduced motion requested)
  useEffect(() => {
    if (!isAutoCycling || prefersReducedMotion) return;

    const interval = setInterval(() => {
      setActiveNodeIndex((prev) => (prev + 1) % NODES.length);
    }, 2400);

    return () => clearInterval(interval);
  }, [isAutoCycling, prefersReducedMotion]);

  const handleManualSelect = (index: number) => {
    setActiveNodeIndex(index);
    // Pause auto-cycling temporarily on manual interaction, then resume
    setIsAutoCycling(false);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      if (!prefersReducedMotion) {
        setIsAutoCycling(true);
      }
    }, 6000);
  };

  const activeNode = NODES[activeNodeIndex];

  return (
    <div
      className="relative w-full aspect-[16/11] sm:aspect-[16/10] max-w-2xl mx-auto flex flex-col justify-between p-4 sm:p-6 rounded-[24px] overflow-hidden select-none border border-[rgba(124,165,216,0.18)] bg-[#071321] shadow-2xl shadow-[#040914]"
      aria-label="Interactive Tactical Signal Route"
    >
      {/* Generative Abstract Lunar Cocoon Backdrop (CSS/SVG) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Soft Radial Ambient Glows */}
        <div className="absolute -top-1/4 -right-1/4 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(56,200,255,0.18)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(255,118,94,0.12)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] rounded-full bg-[radial-gradient(ellipse,rgba(13,30,58,0.85)_0%,transparent_80%)]" />

        {/* Abstract Concentric Lunar Cocoon Rings */}
        <svg
          className="absolute inset-0 w-full h-full opacity-35"
          viewBox="0 0 600 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="300" cy="190" rx="270" ry="140" stroke="rgba(124,165,216,0.12)" strokeWidth="1" strokeDasharray="4 6" />
          <ellipse cx="300" cy="190" rx="210" ry="105" stroke="rgba(56,200,255,0.14)" strokeWidth="1" />
          <ellipse cx="300" cy="190" rx="140" ry="70" stroke="rgba(124,165,216,0.1)" strokeWidth="1" strokeDasharray="2 4" />
          <ellipse cx="300" cy="190" rx="70" ry="35" stroke="rgba(66,224,178,0.16)" strokeWidth="1" />
        </svg>

        {/* Dark Vignette Edges */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071321] via-transparent to-[#071321]/60" />
      </div>

      {/* Header Banner: Status + Auto-shift Indicator + Total RTT */}
      <div className="relative z-20 flex items-center justify-between border-b border-[rgba(124,165,216,0.12)] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#42E0B2] animate-pulse" aria-hidden="true" />
          <span className="font-mono text-[11px] tracking-[0.2em] font-bold text-[#38c8ff] uppercase">
            SIGNAL ROUTE / LIVE
          </span>
          <button
            type="button"
            onClick={() => setIsAutoCycling(!isAutoCycling)}
            title={isAutoCycling ? "Click to pause auto-cycle" : "Click to resume auto-cycle"}
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#081224] border border-[#38c8ff]/20 font-mono text-[9px] text-[#93A9C0] hover:text-[#38c8ff] hover:border-[#38c8ff]/40 transition-colors cursor-pointer"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAutoCycling ? "bg-[#38c8ff] animate-ping" : "bg-[#8fa2b8]"}`} />
            <span>{isAutoCycling ? "AUTO-STREAMING" : "PAUSED"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#93A9C0] uppercase tracking-wider hidden sm:inline">
            TOTAL RTT
          </span>
          <span className="font-mono font-bold text-xs tracking-wider text-[#42E0B2] px-2.5 py-0.5 rounded-full bg-[#081224] border border-[#42E0B2]/30">
            836ms total RTT
          </span>
        </div>
      </div>

      {/* Interactive Signal Flow Canvas with SVG Wave and Traveling Signal Pulse */}
      <div className="relative z-20 my-auto py-6">
        {/* Luminous Connecting Wave SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 600 160"
          fill="none"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="wave_grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38c8ff" stopOpacity="0.4" />
              <stop offset="35%" stopColor="#42E0B2" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#38c8ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff765e" stopOpacity="0.75" />
            </linearGradient>
            <filter id="glow_filter" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Underlying glowing ambient path */}
          <path
            d="M 60 80 C 140 20, 200 140, 290 80 C 380 20, 440 140, 540 80"
            stroke="url(#wave_grad)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.25"
            filter="url(#glow_filter)"
          />

          {/* Main animated trace line */}
          <path
            id="signal_wave_path"
            d="M 60 80 C 140 20, 200 140, 290 80 C 380 20, 440 140, 540 80"
            stroke="url(#wave_grad)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Core filament */}
          <path
            d="M 60 80 C 140 20, 200 140, 290 80 C 380 20, 440 140, 540 80"
            stroke="#F4F2EA"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Traveling Signal Pulse Packet (Continuous animation along wave, omitted if reduced motion preferred) */}
          {!prefersReducedMotion && (
            <>
              <circle r="6" fill="#38c8ff" filter="url(#glow_filter)">
                <animateMotion dur="2.4s" repeatCount="indefinite">
                  <mpath href="#signal_wave_path" />
                </animateMotion>
              </circle>
              <circle r="3" fill="#F4F2EA">
                <animateMotion dur="2.4s" repeatCount="indefinite">
                  <mpath href="#signal_wave_path" />
                </animateMotion>
              </circle>
            </>
          )}
        </svg>

        {/* 4 Connected Nodes with Active Highlight State */}
        <div className="relative z-10 grid grid-cols-4 gap-2 sm:gap-4 px-2 sm:px-6">
          {NODES.map((node, index) => {
            const isSelected = activeNodeIndex === index;
            const isCyan = node.color === "cyan";

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => handleManualSelect(index)}
                aria-pressed={isSelected}
                aria-label={`${node.label} node, ${node.latency}, ${node.detail}`}
                className="flex flex-col items-center group cursor-pointer text-center focus-visible:ring-2 focus-visible:ring-[#38c8ff] rounded-xl p-1 transition-transform"
              >
                {/* Node Label Above */}
                <span
                  className={`font-mono text-[9px] sm:text-[11px] font-bold tracking-[0.15em] mb-2 sm:mb-3 transition-all duration-300 ${
                    isSelected
                      ? isCyan
                        ? "text-[#38c8ff] drop-shadow-[0_0_8px_#38c8ff] scale-105"
                        : "text-[#ff765e] drop-shadow-[0_0_8px_#ff765e] scale-105"
                      : "text-[#8fa2b8] group-hover:text-[#F4F2EA]"
                  }`}
                >
                  {node.label}
                </span>

                {/* Circular Glass Node Orb */}
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-500 relative backdrop-blur-md ${
                    isCyan
                      ? isSelected
                        ? "bg-[#0b2447] border-2 border-[#38c8ff] shadow-[0_0_30px_rgba(56,200,255,0.85)] scale-110"
                        : "bg-[#081224]/80 border border-[rgba(56,200,255,0.3)] hover:border-[#38c8ff] hover:shadow-[0_0_15px_rgba(56,200,255,0.35)]"
                      : isSelected
                      ? "bg-[#331818] border-2 border-[#ff765e] shadow-[0_0_30px_rgba(255,118,94,0.85)] scale-110"
                      : "bg-[#1f0d0d]/80 border border-[rgba(255,118,94,0.3)] hover:border-[#ff765e] hover:shadow-[0_0_15px_rgba(255,118,94,0.35)]"
                  }`}
                >
                  {/* Subtle pulsing beacon when actively selected */}
                  {isSelected && (
                    <span
                      className={`absolute -inset-1 rounded-full border opacity-75 animate-ping pointer-events-none ${
                        isCyan ? "border-[#38c8ff]" : "border-[#ff765e]"
                      }`}
                    />
                  )}

                  {/* Node Glyphs */}
                  {node.id === "audio" && (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#38c8ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 2v20M17 5v14M7 5v14M2 10v4M22 10v4" />
                    </svg>
                  )}
                  {node.id === "index" && (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#42E0B2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    </svg>
                  )}
                  {node.id === "inference" && (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#38c8ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <rect x="9" y="9" width="6" height="6" />
                      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
                    </svg>
                  )}
                  {node.id === "output" && (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff765e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  )}
                </div>

                {/* Latency Pill Below */}
                <span className="font-mono text-[10px] sm:text-xs font-semibold text-[#F4F2EA] mt-2 tabular-nums">
                  {node.latency}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reduced-Motion Fallback Static Banner */}
      <div className={`${prefersReducedMotion ? "block my-2" : "hidden motion-reduce:block"} text-center py-2 px-4 bg-[#081224] rounded-xl border border-[#42E0B2]/30 shadow-inner`}>
        <span className="font-mono text-xs sm:text-sm font-bold text-[#42E0B2] tracking-wider uppercase">
          PIPELINE ACTIVE — MOSS RETRIEVAL 8.2MS
        </span>
      </div>

      {/* Lower Detail Tray matching Spec — updates dynamically as active node shifts */}
      <div
        className="relative z-20 bg-[#040914]/90 backdrop-blur-md rounded-[16px] px-4 sm:px-5 py-3 border border-[rgba(56,200,255,0.2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg transition-all duration-300"
        aria-live="polite"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              activeNode.color === "cyan" ? "bg-[#38c8ff] node-pulse-cyan" : "bg-[#ff765e] node-pulse-coral"
            }`}
            aria-hidden="true"
          />
          <div className="truncate">
            <span className="font-mono text-xs font-bold text-[#F4F2EA]">
              {activeNode.label}
            </span>
            <span className="text-xs text-[#8fa2b8] ml-2 hidden sm:inline">
              — {activeNode.detail}
            </span>
            <p className="text-[11px] text-[#8fa2b8] sm:hidden truncate">
              {activeNode.detail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <span className="font-mono text-[10px] text-[#93A9C0] uppercase">
            {activeNode.engine}
          </span>
          <span className="font-mono text-xs font-bold text-[#42E0B2] px-2.5 py-0.5 rounded-full bg-[#081224] border border-[#42E0B2]/30 tabular-nums">
            {activeNode.latency}
          </span>
        </div>
      </div>
    </div>
  );
}
