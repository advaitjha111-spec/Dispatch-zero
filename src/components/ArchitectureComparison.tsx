"use client";

import { motion } from "framer-motion";
import { Zap, WifiOff, Cloud } from "lucide-react";

export default function ArchitectureComparison() {
  return (
    <section className="relative w-full min-h-[80vh] flex flex-col items-center justify-center border-y border-border-subtle py-12">
      
      <div className="max-w-7xl mx-auto px-12 w-full flex flex-col gap-12">
        <div className="text-center">
          <h2 className="text-[2.25rem] font-[700] leading-[1.15] tracking-[-0.02em] text-text-primary" style={{ fontFamily: "var(--font-sans)" }}>
            Architecture Comparison
          </h2>
          <p className="text-text-secondary mt-4 max-w-2xl mx-auto">
            Standard emergency response systems rely on fragile cloud connections. DispatchZero moves the entire intelligence stack to the tactical edge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          
          {/* Cloud Stack */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col border border-border-subtle bg-surface-panel/50 backdrop-blur-md rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border-subtle bg-surface-ground flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cloud className="w-5 h-5 text-text-tertiary" />
                <h3 className="font-mono text-lg font-semibold text-text-secondary">Standard Cloud Stack</h3>
              </div>
              <span className="font-mono text-sm text-accent-crimson font-bold">2200ms RTT</span>
            </div>
            <div className="p-6 flex flex-col gap-6 flex-1">
              <ComparisonRow label="Vector Search" desc="Pinecone / Weaviate (Cloud)" metric="150ms" />
              <ComparisonRow label="LLM Inference" desc="OpenAI GPT-4 / Anthropic Claude" metric="1500ms" />
              <ComparisonRow label="Network Dependency" desc="High-bandwidth persistent connection" metric="Critical" />
              <ComparisonRow label="Failure Mode" desc="System halts on packet loss" metric="Catastrophic" />
            </div>
          </motion.div>

          {/* Edge Dispatch */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col border border-accent-cyan shadow-[0_0_30px_rgba(0,245,255,0.05)] bg-surface-panel/50 backdrop-blur-md rounded-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-2 pointer-events-none">
              <WifiOff className="w-16 h-16 text-surface-elevated/50" />
            </div>
            <div className="p-6 border-b border-accent-cyan/30 bg-accent-cyan/5 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-accent-cyan" />
                <h3 className="font-mono text-lg font-semibold text-text-primary">DispatchZero Edge</h3>
              </div>
              <span className="font-mono text-sm text-accent-cyan font-bold">836ms RTT</span>
            </div>
            <div className="p-6 flex flex-col gap-6 flex-1 relative z-10">
              <ComparisonRow label="Vector Search" desc="Local Moss Memory (WASM)" metric="<10ms" highlight />
              <ComparisonRow label="LLM Inference" desc="Groq LPU (or Local Llama 3)" metric="115ms" highlight />
              <ComparisonRow label="Network Dependency" desc="Zero reliance (Offline capable)" metric="None" highlight />
              <ComparisonRow label="Failure Mode" desc="Local fallback synthesis" metric="Resilient" highlight />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function ComparisonRow({ label, desc, metric, highlight = false }: { label: string, desc: string, metric: string, highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center pb-4 border-b border-border-subtle/50 last:border-0 last:pb-0 gap-4">
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-sm font-semibold text-text-primary truncate">{label}</span>
        <span className="text-xs text-text-secondary mt-1 leading-snug">{desc}</span>
      </div>
      <span className={`font-mono text-sm font-bold whitespace-nowrap shrink-0 ${highlight ? 'text-accent-cyan' : 'text-text-secondary'}`}>
        {metric}
      </span>
    </div>
  );
}
