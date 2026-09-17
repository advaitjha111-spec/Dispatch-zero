"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function HeroSection({ onLaunchConsole }: { onLaunchConsole: () => void }) {
  return (
    <section className="relative w-full h-screen flex flex-col overflow-hidden">

      {/* Navigation Bar */}
      <nav className="absolute top-0 w-full h-[56px] border-b border-border-subtle backdrop-blur-[12px] z-50 flex items-center justify-between px-12">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-accent-cyan" />
          <span className="font-mono text-lg font-bold tracking-widest text-text-primary">DISPATCHZERO</span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-surface-panel rounded-full border border-border-subtle font-mono text-xs">
          <span className="text-text-secondary">REGION: EDGE-AP-SOUTH</span>
          <span className="text-border-subtle">{"//"}</span>
          <span className="text-accent-emerald flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
            LATENCY: OPTIMAL
          </span>
        </div>

        <button 
          onClick={onLaunchConsole}
          className="px-4 py-2 font-mono text-xs font-semibold text-surface-ground bg-accent-cyan hover:bg-white transition-colors uppercase cursor-pointer rounded-full"
        >
          Launch Tactical Console
        </button>
      </nav>

      {/* Main Content Split Layout */}
      <div className="flex-1 flex items-center justify-center max-w-7xl mx-auto w-full px-12 gap-16 z-10 pt-[56px]">
        
        {/* Left Column */}
        <div className="flex-1 flex flex-col items-start gap-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-[4.5rem] leading-[1.05] font-normal tracking-[-0.02em] text-text-primary"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Engineered for <br/>
            <span className="italic text-accent-cyan pr-4">sub-second</span> dispatch.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-text-secondary text-[15px] leading-relaxed max-w-lg"
          >
            Local voice inference and verified protocol indexing running completely detached from the cloud. Critical communications that survive network failure.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex gap-4 mt-4"
          >
            <button className="px-6 py-3 font-mono text-sm font-semibold text-surface-ground bg-text-primary hover:bg-white transition-colors flex items-center gap-2 cursor-pointer rounded-full">
              <Zap className="w-4 h-4" />
              Connect Voice Socket
            </button>
            <button className="px-6 py-3 font-mono text-sm font-semibold text-text-primary border border-border-subtle bg-surface-panel hover:bg-surface-elevated transition-colors cursor-pointer rounded-full">
              Review Protocol Set
            </button>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="flex-1 flex justify-end">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="w-full max-w-md bg-surface-panel/50 backdrop-blur-md border border-accent-cyan p-6 rounded-2xl shadow-[0_0_40px_rgba(0,245,255,0.1)] flex flex-col gap-4 font-mono"
          >
            <div className="flex justify-between items-center border-b border-border-subtle pb-4 mb-2">
              <span className="text-xs text-text-secondary uppercase tracking-widest">Live Telemetry</span>
              <span className="text-accent-emerald text-xs">STREAM_ACTIVE</span>
            </div>
            
            <TickerRow label="VAD OFFSET" value="12" />
            <TickerRow label="WHISPER STT" value="240" />
            <TickerRow label="MOSS RETRIEVAL" value="8" highlight />
            <TickerRow label="GROQ LPU" value="115" />
            <TickerRow label="CARTESIA TTS" value="180" />
            
            <div className="mt-4 pt-4 border-t border-border-subtle flex justify-between items-end">
              <span className="text-sm text-text-secondary">TOTAL RTT</span>
              <span className="text-2xl text-accent-cyan font-bold tracking-tighter">555<span className="text-text-tertiary text-sm ml-1">ms</span></span>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

function TickerRow({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center group">
      <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">{label}</span>
      <span className={`text-lg font-bold tracking-tighter ${highlight ? 'text-accent-cyan' : 'text-text-primary'}`}>
        {value}
        <span className="text-text-tertiary text-xs ml-1 font-normal">ms</span>
      </span>
    </div>
  );
}
