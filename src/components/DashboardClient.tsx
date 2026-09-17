"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Mic, Activity, Zap, Search } from "lucide-react";
import { DeepgramClient } from "@deepgram/sdk";
import Cartesia from "@cartesia/cartesia-js";
import { Room, LocalAudioTrack } from "livekit-client";

export default function DashboardClient({ deepgramKey, cartesiaKey }: { deepgramKey: string, cartesiaKey: string }) {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
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

  const [isEdgeMode, setIsEdgeMode] = useState(false);
  const isEdgeModeRef = useRef(false);
  useEffect(() => {
    isEdgeModeRef.current = isEdgeMode;
  }, [isEdgeMode]);

  const lastAudioSentTimeRef = useRef<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const [volLevel, setVolLevel] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deepgramSocketRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cartesiaClientRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cartesiaWsRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const destNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const livekitRoomRef = useRef<Room | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const isAgentSpeaking = useRef(false);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const startPipeline = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      if (isEdgeModeRef.current) {
        // Edge Mode bypasses all external APIs for the "Cut Network" demo
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
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
        setIsActive(true);

        // Auto-trigger the demo protocol after 3 seconds of "listening"
        setTimeout(() => {
          const demoText = "There is a leak of anhydrous ammonia here!";
          setTranscript(prev => [...prev, { role: "user", text: demoText }]);
          handleAgentInference("leak of anhydrous ammonia", 250);
        }, 3000);
        return;
      }

      // 1. Setup Cartesia
      cartesiaClientRef.current = new Cartesia({ apiKey: cartesiaKey });
      cartesiaWsRef.current = await cartesiaClientRef.current.tts.websocket();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
      
      // 2. Setup LiveKit WebRTC
      // Use a timestamp/random combo to prevent cross-tab conflicts kicking each other out
      const randomId = Date.now().toString().slice(-4);
      const lkRes = await fetch(`/api/livekit/token?room=dispatch-zero&username=agent-${randomId}`);
      const { token } = await lkRes.json();
      const room = new Room();
      await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);
      livekitRoomRef.current = room;

      // Create WebAudio Destination for Cartesia TTS
      destNodeRef.current = audioContextRef.current.createMediaStreamDestination();
      const agentTrack = new LocalAudioTrack(destNodeRef.current.stream.getAudioTracks()[0]);
      await room.localParticipant.publishTrack(agentTrack, { name: 'agent-tts' });

      // 3. Setup Deepgram & Mic
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      
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
        interim_results: false,
        endpointing: 300
      });
      deepgramSocketRef.current = socket;

      socket.on("open", () => {
        setIsActive(true);
        setIsConnecting(false);
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on("message", async (data: any) => {
        if (data.type === "Results") {
          const text = data.channel.alternatives[0].transcript;
          if (text && data.is_final) {
            const sttTime = Math.max(0, Math.round(performance.now() - lastAudioSentTimeRef.current)); 
            setMetrics(m => ({ ...m, stt: sttTime }));
            setTranscript(prev => [...prev, { role: "user", text }]);
            
            if (isAgentSpeaking.current) {
               // Interruption handling (VAD triggers this in full implementation)
               if (cartesiaWsRef.current) {
                 try {
                   cartesiaWsRef.current.disconnect();
                   cartesiaWsRef.current = await cartesiaClientRef.current.tts.websocket();
                 } catch (e) {
                   console.error("Cartesia disconnect error", e);
                 }
               }
               // Stop active audio sources
               activeSourcesRef.current.forEach(source => {
                 try { source.stop(); } catch (e) {
                   console.error("Source stop error", e);
                 }
               });
               activeSourcesRef.current = [];
               isAgentSpeaking.current = false;
               
               // Stop browser native TTS if running
               window.speechSynthesis.cancel();
            }
            
            // Trigger Agent API
            handleAgentInference(text, sttTime);
          }
        }
      });
      
      
      socket.connect();
      
    } catch (err: unknown) {
      setIsConnecting(false);
      console.error("Pipeline start failed", err);
      alert(`Pipeline connection failed: ${err instanceof Error ? err.message : String(err)}\nCheck browser console for more details.`);
    }
  };

  const handleAgentInference = async (text: string, sttTime: number) => {
    if (isEdgeModeRef.current) {
      // Mock fallback for "cut network" demo
      setMetrics(m => ({ ...m, stt: sttTime || 250, moss: 8.5, llm: 120, cartesia: 150, total: 528 }));
      setProtocol("PROTOCOL ID: DOT-ERG-119\nHAZMAT: ANHYDROUS AMMONIA (UN 1005)\nSCENARIO: CHEMICAL SPILL OR LEAK\nIMMEDIATE ACTIONS:\n1. Isolate spill or leak area immediately for at least 100 meters (330 feet) in all directions.");
      const fallbackText = "I am dispatching hazmat units for an anhydrous ammonia leak. Isolate the area for 100 meters immediately. Keep everyone upwind.";
      setTranscript(prev => [...prev, { role: "agent", text: fallbackText }]);
      isAgentSpeaking.current = true;
      
      // Native browser TTS for offline mode fallback
      const utterance = new SpeechSynthesisUtterance(fallbackText);
      utterance.onend = () => { isAgentSpeaking.current = false; };
      window.speechSynthesis.speak(utterance);
      return;
    }

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
        model_id: "sonic-latest",
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
            activeSourcesRef.current.push(source);
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            if (destNodeRef.current) {
              source.connect(destNodeRef.current);
            }
            
            source.onended = () => {
              activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
            };
            
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
          } catch(e) {
            console.error("JSON parse error", e);
          }
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

  return (
    <div className="h-screen w-full text-text-primary overflow-hidden p-4 font-sans select-none flex flex-col gap-4 relative">

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-4 py-2 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-accent-cyan" />
          <h1 className="text-xl font-bold tracking-widest text-accent-cyan">DISPATCHZERO</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsEdgeMode(!isEdgeMode)}
            className={`px-3 py-1 text-xs font-mono rounded-full border transition ${isEdgeMode ? 'bg-accent-crimson/20 border-accent-crimson/50 text-accent-crimson' : 'bg-surface-elevated border-border-subtle text-text-secondary hover:text-text-primary'}`}
          >
            {isEdgeMode ? 'EDGE MODE ON' : 'EDGE MODE OFF'}
          </button>
          {!isActive && (
             <button disabled={isConnecting} onClick={startPipeline} className={`px-4 py-1 text-xs font-mono border rounded-full transition ${isConnecting ? 'bg-surface-elevated border-border-subtle text-text-secondary cursor-not-allowed' : 'bg-accent-cyan/20 border-accent-cyan/50 text-accent-cyan hover:bg-accent-cyan/30'}`}>
               {isConnecting ? 'CONNECTING...' : 'ENGAGE PIPELINE'}
             </button>
          )}
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">System Status</span>
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-elevated rounded-full border border-border-subtle">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-accent-emerald animate-pulse' : 'bg-accent-crimson'}`} />
              <span className={`text-xs font-mono ${isActive ? 'text-accent-emerald' : 'text-accent-crimson'}`}>
                {isActive ? 'LIVE' : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="relative z-10 grid grid-cols-12 gap-4 h-full min-h-0">
        
        {/* LEFT PANE: THE FEED */}
        <section className="col-span-3 border border-border-subtle bg-surface-panel/50 backdrop-blur-md rounded-2xl flex flex-col overflow-hidden relative">
          <div className="p-3 border-b border-border-subtle bg-surface-elevated shrink-0 flex items-center justify-between">
            <h2 className="text-xs uppercase font-mono tracking-widest text-text-secondary">Live Feed</h2>
            <div className="flex items-center gap-2">
              {isActive && (
                <div className="flex items-end gap-[2px] h-4 w-12 mr-2">
                  {[...Array(8)].map((_, i) => (
                    <motion.div 
                      key={i}
                      className="w-1 bg-accent-crimson rounded-t-sm"
                      animate={{ height: `${Math.max(10, (volLevel / 255) * 100 * (0.5 + (i % 5) * 0.1))}%` }}
                      transition={{ type: 'tween', duration: 0.1 }}
                    />
                  ))}
                </div>
              )}
              <Mic className={`w-4 h-4 ${isActive ? 'text-accent-crimson' : 'text-text-tertiary'}`} />
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-sm flex flex-col gap-3">
            {transcript.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
                className={`${msg.role === 'agent' ? 'text-accent-cyan/80' : 'text-text-primary'} pb-2 border-b border-border-subtle`}
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
        <section className="col-span-6 border border-accent-cyan/30 bg-surface-panel backdrop-blur-md rounded-2xl flex flex-col overflow-hidden relative shadow-[0_0_30px_rgba(0,245,255,0.05)]">
          <div className="p-3 border-b border-accent-cyan/20 bg-accent-cyan/5 shrink-0 flex items-center gap-2">
            <Search className="w-4 h-4 text-accent-cyan" />
            <h2 className="text-xs uppercase font-mono tracking-widest text-accent-cyan">Active Protocol</h2>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {protocol ? (
              <motion.div
                key={protocol}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
                className="whitespace-pre-wrap font-sans text-lg leading-relaxed text-text-primary"
              >
                {protocol}
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center text-text-tertiary font-mono text-sm uppercase tracking-widest">
                Awaiting Protocol Trigger...
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANE: LATENCY PROFILER */}
        <section className="col-span-3 border border-border-subtle bg-surface-panel/50 backdrop-blur-md rounded-2xl flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border-subtle bg-surface-elevated shrink-0 flex items-center justify-between">
            <h2 className="text-xs uppercase font-mono tracking-widest text-text-secondary">Telemetry</h2>
            <Activity className="w-4 h-4 text-accent-emerald" />
          </div>
          
          <div className="flex-1 p-4 flex flex-col justify-center gap-6 font-mono">
            <MetricRow label="VAD + STT" value={metrics.stt} unit="ms" />
            
            <div className="p-3 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-accent-cyan/5 group-hover:bg-accent-cyan/10 transition-colors" />
              <div className="relative z-10 flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-widest text-accent-cyan font-semibold">Moss Retrieval</span>
                <div className="flex items-baseline gap-1">
                  <motion.span 
                    layout
                    key={metrics.moss}
                    initial={{ opacity: 0.5, y: -5, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    className="text-3xl font-bold text-accent-cyan tracking-tighter tabular-nums"
                  >
                    {metrics.moss}
                  </motion.span>
                  <span className="text-accent-cyan/60 text-xs">ms</span>
                </div>
              </div>
            </div>

            <MetricRow label="LLM Inference" value={metrics.llm} unit="ms" />
            <MetricRow label="Cartesia TTS" value={metrics.cartesia} unit="ms" />
            
            <div className="mt-4 pt-4 border-t border-border-subtle flex justify-between items-baseline">
              <span className="text-sm uppercase tracking-widest text-text-primary">Total RTT</span>
              <div className="flex items-baseline gap-1">
                <motion.span 
                  layout
                  key={metrics.total}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-accent-emerald tracking-tighter tabular-nums"
                >
                  {metrics.total}
                </motion.span>
                <span className="text-accent-emerald/60 text-xs">ms</span>
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
      <span className="text-xs uppercase tracking-widest text-text-secondary">{label}</span>
      <div className="flex items-baseline gap-1">
        <motion.span 
          layout
          key={value}
          initial={{ opacity: 0.5, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-text-primary tracking-tighter tabular-nums"
        >
          {value}
        </motion.span>
        <span className="text-text-secondary text-xs">{unit}</span>
      </div>
    </div>
  );
}
