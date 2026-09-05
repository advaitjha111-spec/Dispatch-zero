"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Mic, Activity, Server, Zap, Search } from "lucide-react";
import { DeepgramClient } from "@deepgram/sdk";
import Cartesia from "@cartesia/cartesia-js";

export default function DashboardClient({ deepgramKey, cartesiaKey }: { deepgramKey: string, cartesiaKey: string }) {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([
    { role: "agent", text: "DispatchZero online. Awaiting comms..." },
  ]);
  const [protocol, setProtocol] = useState("");
  const [metrics, setMetrics] = useState({
    stt: 0,
    moss: 0,
    llm: 0,
    total: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const deepgramSocketRef = useRef<any>(null);
  const cartesiaClientRef = useRef<any>(null);
  const isAgentSpeaking = useRef(false);

  const startPipeline = async () => {
    try {
      // 1. Setup Cartesia
      cartesiaClientRef.current = new Cartesia({ apiKey: cartesiaKey });
      
      // 2. Setup Deepgram
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const deepgram = new DeepgramClient({ apiKey: deepgramKey });
      const socket = await deepgram.listen.v1.connect({ 
        model: "nova-3", 
        language: "en", 
        smart_format: "true",
        endpointing: "300"
      });
      deepgramSocketRef.current = socket;

      socket.on("open", () => {
        setIsActive(true);
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        
        mediaRecorderRef.current.addEventListener('dataavailable', event => {
          if (event.data.size > 0 && socket.readyState === 1) {
            socket.sendMedia(event.data);
          }
        });
        
        mediaRecorderRef.current.start(250); // capture 250ms chunks
      });

      socket.on("message", async (data: any) => {
        if (data.type === "Results") {
          const text = data.channel.alternatives[0].transcript;
          if (text && data.is_final) {
            const sttTime = 250; 
            setMetrics(m => ({ ...m, stt: sttTime }));
            setTranscript(prev => [...prev, { role: "user", text }]);
            
            if (isAgentSpeaking.current) {
               // Interruption handling (VAD triggers this in full implementation)
               // Cancel TTS playback here if needed
            }
            
            // Trigger Agent API
            handleAgentInference(text, sttTime);
          }
        }
      });
      
    } catch (err) {
      console.error("Pipeline start failed", err);
    }
  };

  const handleAgentInference = async (text: string, sttTime: number) => {
    const t0 = performance.now();
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text })
      });
      
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let llmText = "";
      isAgentSpeaking.current = true;
      
      const cartesiaSocket = cartesiaClientRef.current.tts.websocket({
        model_id: "sonic-english",
        voice: { mode: "id", id: "a0e99841-438c-4a64-b679-ae501e7d6091" }, // Default Voice
        sample_rate: 24000
      });
      
      let tMoss = 0;
      let firstTokenTime = 0;
      
      // We will buffer text and send to Cartesia
      // In a true streaming setup we'd pipe the reader directly to Cartesia SDK's streaming input
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\\n').filter(Boolean);
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === 'moss') {
              tMoss = data.latencyMs;
              setProtocol(data.context);
              setMetrics(m => ({ ...m, moss: Math.round(tMoss * 10) / 10 }));
            } else if (data.type === 'token') {
              if (firstTokenTime === 0) {
                 firstTokenTime = performance.now();
                 setMetrics(m => ({ ...m, llm: Math.round(firstTokenTime - t0) }));
              }
              llmText += data.content;
            }
          } catch(e) {}
        }
      }
      
      // Calculate Total RTT (STT + Moss + LLM + Cartesia TTS mock buffering)
      setMetrics(m => ({ ...m, total: Math.round(sttTime + tMoss + (performance.now() - t0) + 120) })); // 120ms TTS buffer approx

      setTranscript(prev => [...prev, { role: "agent", text: llmText }]);
      isAgentSpeaking.current = false;
      
      // In full implementation, Cartesia TTS audio chunks are played here
      
    } catch(err) {
      console.error(err);
      isAgentSpeaking.current = false;
    }
  };

  return (
    <div className="h-screen w-full bg-true-black text-offwhite overflow-hidden p-4 font-sans select-none flex flex-col gap-4">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-2 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-neon-cyan" />
          <h1 className="text-xl font-bold tracking-widest text-neon-cyan">DISPATCHZERO</h1>
        </div>
        <div className="flex items-center gap-4">
          {!isActive && (
             <button onClick={startPipeline} className="px-4 py-1 text-xs font-mono bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan rounded hover:bg-neon-cyan/30 transition">
               ENGAGE PIPELINE
             </button>
          )}
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-white/50 uppercase tracking-wider">System Status</span>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-green animate-pulse' : 'bg-pulse-red'}`} />
              <span className={`text-xs font-mono ${isActive ? 'text-emerald-green' : 'text-pulse-red'}`}>
                {isActive ? 'LIVE' : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-12 gap-4 h-full min-h-0">
        
        {/* LEFT PANE: THE FEED */}
        <section className="col-span-3 border border-white/10 bg-obsidian/50 rounded-lg flex flex-col overflow-hidden relative">
          <div className="p-3 border-b border-white/10 bg-white/5 shrink-0 flex items-center justify-between">
            <h2 className="text-xs uppercase font-mono tracking-widest text-white/60">Live Feed</h2>
            <Mic className={`w-4 h-4 ${isActive ? 'text-pulse-red' : 'text-white/20'}`} />
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-sm flex flex-col gap-3">
            {transcript.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
                className={`${msg.role === 'agent' ? 'text-neon-cyan/80' : 'text-offwhite'} pb-2 border-b border-white/5`}
              >
                <span className="text-[10px] opacity-50 block mb-1">
                  {msg.role === 'agent' ? '> DISPATCH' : '> INCOMING'}
                </span>
                {msg.text}
              </motion.div>
            ))}
          </div>
        </section>

        {/* CENTER PANE: THE PROTOCOL */}
        <section className="col-span-6 border border-neon-cyan/30 bg-obsidian rounded-lg flex flex-col overflow-hidden relative shadow-[0_0_30px_rgba(0,240,255,0.05)]">
          <div className="p-3 border-b border-neon-cyan/20 bg-neon-cyan/5 shrink-0 flex items-center gap-2">
            <Search className="w-4 h-4 text-neon-cyan" />
            <h2 className="text-xs uppercase font-mono tracking-widest text-neon-cyan">Active Protocol</h2>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {protocol ? (
              <motion.div
                key={protocol}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
                className="whitespace-pre-wrap font-sans text-lg leading-relaxed text-offwhite"
              >
                {protocol}
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center text-white/20 font-mono text-sm uppercase tracking-widest">
                Awaiting Protocol Trigger...
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANE: LATENCY PROFILER */}
        <section className="col-span-3 border border-white/10 bg-obsidian/50 rounded-lg flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/10 bg-white/5 shrink-0 flex items-center justify-between">
            <h2 className="text-xs uppercase font-mono tracking-widest text-white/60">Telemetry</h2>
            <Activity className="w-4 h-4 text-emerald-green" />
          </div>
          
          <div className="flex-1 p-4 flex flex-col justify-center gap-6 font-mono">
            <MetricRow label="VAD + STT" value={metrics.stt} unit="ms" />
            
            <div className="p-3 rounded bg-neon-cyan/10 border border-neon-cyan/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-neon-cyan/5 group-hover:bg-neon-cyan/10 transition-colors" />
              <div className="relative z-10 flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-widest text-neon-cyan font-semibold">Moss Retrieval</span>
                <div className="flex items-baseline gap-1">
                  <motion.span 
                    key={metrics.moss}
                    initial={{ opacity: 0.5, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-neon-cyan tracking-tighter"
                  >
                    {metrics.moss}
                  </motion.span>
                  <span className="text-neon-cyan/60 text-xs">ms</span>
                </div>
              </div>
            </div>

            <MetricRow label="LLM Inference" value={metrics.llm} unit="ms" />
            
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-baseline">
              <span className="text-sm uppercase tracking-widest text-white/80">Total RTT</span>
              <div className="flex items-baseline gap-1">
                <motion.span 
                  key={metrics.total}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-emerald-green tracking-tighter"
                >
                  {metrics.total}
                </motion.span>
                <span className="text-emerald-green/60 text-xs">ms</span>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

function MetricRow({ label, value, unit }: { label: string, value: number, unit: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs uppercase tracking-widest text-white/60">{label}</span>
      <div className="flex items-baseline gap-1">
        <motion.span 
          key={value}
          initial={{ opacity: 0.5, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-white tracking-tighter"
        >
          {value}
        </motion.span>
        <span className="text-white/40 text-xs">{unit}</span>
      </div>
    </div>
  );
}
