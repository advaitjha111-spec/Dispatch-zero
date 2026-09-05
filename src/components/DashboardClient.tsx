"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Mic, Activity, Server, Zap, Search } from "lucide-react";
import { DeepgramClient } from "@deepgram/sdk";
import Cartesia from "@cartesia/cartesia-js";
import { Room, LocalAudioTrack } from "livekit-client";

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
    cartesia: 0,
    total: 0,
  });

  const lastAudioSentTimeRef = useRef<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const [volLevel, setVolLevel] = useState(0);

  const deepgramSocketRef = useRef<any>(null);
  const cartesiaClientRef = useRef<any>(null);
  const cartesiaWsRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const destNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const livekitRoomRef = useRef<Room | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const isAgentSpeaking = useRef(false);

  const startPipeline = async () => {
    try {
      // Disconnect any existing sessions
      if (livekitRoomRef.current) {
        try { livekitRoomRef.current.disconnect(); } catch (e) {}
      }
      if (deepgramSocketRef.current) {
        try { deepgramSocketRef.current.finish(); } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }

      // 1. Setup Cartesia
      cartesiaClientRef.current = new Cartesia({ apiKey: cartesiaKey });
      cartesiaWsRef.current = await cartesiaClientRef.current.tts.websocket();
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
      
      // 2. Setup LiveKit WebRTC
      const lkRes = await fetch("/api/livekit/token?room=dispatch-zero&username=agent");
      const { token } = await lkRes.json();
      const room = new Room();
      await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);
      livekitRoomRef.current = room;

      // Create WebAudio Destination for Cartesia TTS
      destNodeRef.current = audioContextRef.current.createMediaStreamDestination();
      const agentTrack = new LocalAudioTrack(destNodeRef.current.stream.getAudioTracks()[0]);
      await room.localParticipant.publishTrack(agentTrack, { name: 'agent-tts' });

      // 3. Setup Deepgram & Mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Analyser for Visualizer
      const sourceNode = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      sourceNode.connect(analyser);
      audioAnalyserRef.current = analyser;

      const updateVol = () => {
        if (!audioAnalyserRef.current) return;
        const dataArray = new Uint8Array(audioAnalyserRef.current.frequencyBinCount);
        audioAnalyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolLevel(avg);
        animationFrameRef.current = requestAnimationFrame(updateVol);
      };
      updateVol();

      // Publish User Mic to LiveKit
      const userTrack = new LocalAudioTrack(stream.getAudioTracks()[0]);
      await room.localParticipant.publishTrack(userTrack, { name: 'user-mic' });

      const deepgram = new DeepgramClient({ apiKey: deepgramKey });
      const socket = await deepgram.listen.v1.connect({ 
        model: "nova-2", 
        language: "hi", 
        smart_format: true,
        endpointing: 300
      });
      deepgramSocketRef.current = socket;

      socket.on("open", () => {
        setIsActive(true);
        
        let recorderMimeType: string | undefined = undefined;
        if (typeof MediaRecorder !== 'undefined') {
          const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
            'audio/aac'
          ];
          recorderMimeType = types.find(t => MediaRecorder.isTypeSupported(t));
        }

        mediaRecorderRef.current = recorderMimeType 
          ? new MediaRecorder(stream, { mimeType: recorderMimeType })
          : new MediaRecorder(stream);
        
        mediaRecorderRef.current.addEventListener('dataavailable', event => {
          if (event.data.size > 0 && socket.readyState === 1) {
            lastAudioSentTimeRef.current = performance.now();
            socket.sendMedia(event.data);
          }
        });
        
        if (mediaRecorderRef.current.state === "inactive") {
          mediaRecorderRef.current.start(250); // capture 250ms chunks
        }
      });

      socket.on("message", async (data: any) => {
        if (data.type === "Results") {
          const text = data.channel.alternatives[0].transcript;
          if (text && data.is_final) {
            const sttTime = Math.max(0, Math.round(performance.now() - lastAudioSentTimeRef.current)); 
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
      
      socket.connect();
      
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
      if (!res.ok) {
        console.error("Agent API failed:", await res.text());
        return;
      }
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let llmText = "";
      isAgentSpeaking.current = true;
      
      const ctx = cartesiaWsRef.current.context({
        model_id: "sonic-multilingual",
        voice: { mode: "id", id: "a0e99841-438c-4a64-b679-ae501e7d6091" },
        output_format: { container: "raw", encoding: "pcm_f32le", sample_rate: 44100 }
      });
      
      let tMoss = 0;
      let firstTokenTime = 0;
      let cartesiaFirstByteTime = 0;
      let pushTime = 0;
      
      const receiveAudio = async () => {
        for await (const event of ctx.receive()) {
          if (event.type === 'chunk' && event.audio) {
            if (cartesiaFirstByteTime === 0 && pushTime > 0) {
              cartesiaFirstByteTime = performance.now();
              const cartesiaLatency = Math.round(cartesiaFirstByteTime - pushTime);
              setMetrics(m => ({ ...m, cartesia: cartesiaLatency, total: Math.round(sttTime + tMoss + (firstTokenTime - t0) + cartesiaLatency) }));
            }
            const audioCtx = audioContextRef.current;
            if (!audioCtx) continue;
            
            // event.audio is a Uint8Array of pcm_f32le bytes. Convert it to Float32Array.
            const floats = new Float32Array(
              event.audio.buffer,
              event.audio.byteOffset,
              event.audio.byteLength / 4
            );

            const buffer = audioCtx.createBuffer(1, floats.length, 44100);
            buffer.getChannelData(0).set(floats);
            
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            if (destNodeRef.current) {
              source.connect(destNodeRef.current);
            }
            
            const playTime = Math.max(audioCtx.currentTime, nextPlayTimeRef.current);
            source.start(playTime);
            nextPlayTimeRef.current = playTime + buffer.duration;
          }
        }
      };
      
      receiveAudio(); // run in background
      
      let hasPushedTokens = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          if (hasPushedTokens) {
            await ctx.no_more_inputs();
          }
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);
        
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
              const contentToPush = data.content;
              if (contentToPush.trim().length > 0) {
                if (!hasPushedTokens) {
                  pushTime = performance.now();
                  hasPushedTokens = true;
                }
                await ctx.push({ transcript: contentToPush });
              }
            }
          } catch(e) {}
        }
      }

      setTranscript(prev => [...prev, { role: "agent", text: llmText }]);
      isAgentSpeaking.current = false;
      
    } catch(err) {
      console.error(err);
      isAgentSpeaking.current = false;
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Glow Cursor Logic
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="h-screen w-full bg-true-black text-offwhite overflow-hidden p-4 font-sans select-none flex flex-col gap-4 cursor-none relative">
      {/* Glow Cursor */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-50 flex items-center justify-center mix-blend-screen w-8 h-8"
        animate={{ x: mousePos.x - 16, y: mousePos.y - 16 }}
        transition={{ type: "tween", ease: "linear", duration: 0 }}
      >
        <div className="absolute inset-0 rounded-full border border-neon-cyan/50 shadow-[0_0_15px_rgba(0,240,255,0.8)]" />
        <div className="absolute w-1 h-1 bg-neon-cyan rounded-full shadow-[0_0_5px_rgba(0,240,255,1)]" />
      </motion.div>

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
            <div className="flex items-center gap-2">
              {isActive && (
                <div className="flex items-end gap-[2px] h-4 w-12 mr-2">
                  {[...Array(8)].map((_, i) => (
                    <motion.div 
                      key={i}
                      className="w-1 bg-pulse-red rounded-t-sm"
                      animate={{ height: `${Math.max(10, (volLevel / 255) * 100 * (Math.random() * 0.5 + 0.5))}%` }}
                      transition={{ type: 'tween', duration: 0.1 }}
                    />
                  ))}
                </div>
              )}
              <Mic className={`w-4 h-4 ${isActive ? 'text-pulse-red' : 'text-white/20'}`} />
            </div>
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
                    layout
                    key={metrics.moss}
                    initial={{ opacity: 0.5, y: -5, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    className="text-3xl font-bold text-neon-cyan tracking-tighter tabular-nums"
                  >
                    {metrics.moss}
                  </motion.span>
                  <span className="text-neon-cyan/60 text-xs">ms</span>
                </div>
              </div>
            </div>

            <MetricRow label="LLM Inference" value={metrics.llm} unit="ms" />
            <MetricRow label="Cartesia TTS" value={metrics.cartesia} unit="ms" />
            
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-baseline">
              <span className="text-sm uppercase tracking-widest text-white/80">Total RTT</span>
              <div className="flex items-baseline gap-1">
                <motion.span 
                  layout
                  key={metrics.total}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-emerald-green tracking-tighter tabular-nums"
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
          layout
          key={value}
          initial={{ opacity: 0.5, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-white tracking-tighter tabular-nums"
        >
          {value}
        </motion.span>
        <span className="text-white/40 text-xs">{unit}</span>
      </div>
    </div>
  );
}
