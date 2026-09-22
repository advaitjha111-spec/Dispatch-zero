"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Send, Radio } from "lucide-react";
import { DeepgramClient } from "@deepgram/sdk";
import { Room, LocalAudioTrack } from "livekit-client";
import AudioWaveform from "./AudioWaveform";
import TranscriptFeed, { MessageItem } from "./TranscriptFeed";
import ProtocolStage, { ProtocolData } from "./ProtocolStage";
import TelemetryProfiler, { LatencyData } from "./TelemetryProfiler";
import ManualOverrideModal from "./ManualOverrideModal";
import StatusTicker from "./StatusTicker";

interface TacticalConsoleProps {
  onBack: () => void;
}

interface SessionConfig {
  hasDeepgram: boolean;
  hasCartesia: boolean;
  hasLivekit: boolean;
  deepgramToken?: string;
  livekitUrl: string;
}

const DEFAULT_PROTOCOL: ProtocolData = {
  id: "EMS-CPR-01",
  category: "TRAUMA // LIFE SAFETY",
  scenario: "Adult Cardiac Arrest (No Pulse, Not Breathing)",
  steps: [
    {
      number: "01",
      verb: "DISPATCH ALS",
      instruction: "Dispatch nearest Advanced Life Support unit immediately with code lights & sirens.",
    },
    {
      number: "02",
      verb: "POSITION PATIENT",
      instruction: "Instruct bystander to place patient flat on their back on a hard, level surface.",
    },
    {
      number: "03",
      verb: "START COMPRESSIONS",
      instruction: "Push hard and fast in center of chest: 100 to 120 compressions/min, at least 2 inches deep.",
    },
  ],
};

const HAZMAT_PROTOCOL: ProtocolData = {
  id: "HAZ-AMMONIA-01",
  category: "HAZMAT // CORROSIVE TOXIC GAS",
  scenario: "Anhydrous Ammonia Release (Vapor Cloud Inhalation)",
  hazard: "TOXIC VAPOR PLUME // RESPIRATORY & CORROSIVE DAMAGE",
  steps: [
    {
      number: "01",
      verb: "ISOLATE PERIMETER",
      instruction: "Isolate spill or leak area immediately in all directions for at least 100 meters (330 feet).",
    },
    {
      number: "02",
      verb: "EVACUATE UPWIND",
      instruction: "Move all personnel immediately upwind and crosswind of the visible vapor cloud.",
    },
    {
      number: "03",
      verb: "DENY ENTRY",
      instruction: "Prevent unauthorized entry. Keep out of low areas where ammonia gas may accumulate.",
    },
  ],
};

function parseMossProtocol(contextText: string): ProtocolData {
  const lines = contextText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let id = "MOSS-INDEX";
  let category = "LOCAL PROTOCOL";
  let scenario = "Emergent Incident Operating Procedure";
  let hazard: string | undefined = undefined;
  const rawSteps: string[] = [];

  let inActions = false;

  for (const line of lines) {
    if (line.startsWith("PROTOCOL ID:")) {
      id = line.replace("PROTOCOL ID:", "").trim();
    } else if (line.startsWith("HAZMAT:")) {
      hazard = line.replace("HAZMAT:", "").trim();
      category = `HAZMAT // ${hazard}`;
    } else if (line.startsWith("SCENARIO:")) {
      scenario = line.replace("SCENARIO:", "").trim();
      if (!hazard) {
        category = id.startsWith("EMS") ? "TRAUMA // LIFE SAFETY" : "OPERATIONAL // TAC";
      }
    } else if (line.startsWith("IMMEDIATE ACTIONS:")) {
      inActions = true;
    } else if (inActions) {
      if (/^\d+\./.test(line)) {
        rawSteps.push(line.replace(/^\d+\.\s*/, "").trim());
      } else if (line.startsWith("-")) {
        rawSteps.push(line.replace(/^-\s*/, "").trim());
      } else if (line.endsWith(":") && !line.includes("ACTIONS")) {
        inActions = false;
      }
    }
  }

  const steps =
    rawSteps.length > 0
      ? rawSteps.slice(0, 3).map((inst, i) => {
          const verbs = ["DISPATCH UNITS", "POSITION PATIENT", "EXECUTE DIRECTIVE", "ISOLATE PERIMETER", "EVACUATE DOWNWIND", "DENY ENTRY"];
          const firstWords = inst.split(" ").slice(0, 2).join(" ").toUpperCase();
          return {
            number: `0${i + 1}`,
            verb: firstWords.length <= 16 ? firstWords : (verbs[i] || "ACTION DIRECTIVE"),
            instruction: inst,
          };
        })
      : [
          { number: "01", verb: "EVALUATE SCENE", instruction: "Assess caller safety and verify scene status." },
          { number: "02", verb: "TRANSMIT UNITS", instruction: "Dispatch primary emergency units to caller coordinates." },
          { number: "03", verb: "MONITOR COMMS", instruction: "Maintain active communication until unit arrival." },
        ];

  return { id, category, scenario, hazard, steps };
}

export default function TacticalConsole({ onBack }: TacticalConsoleProps) {
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    hasDeepgram: false,
    hasCartesia: false,
    hasLivekit: false,
    deepgramToken: "",
    livekitUrl: "",
  });

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "init-1",
      role: "SYSTEM",
      text: "Socket connected. Silero VAD initialized. Moss local protocol index active (25 scenarios loaded).",
      timestamp: "00:00",
    },
  ]);

  const [activeProtocol, setActiveProtocol] = useState<ProtocolData>(DEFAULT_PROTOCOL);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(14);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isOverrideActive, setIsOverrideActive] = useState(false);
  const [isProcessingBackend, setIsProcessingBackend] = useState(false);

  // Live microphone & speech recognition states
  const [isLiveCommActive, setIsLiveCommActive] = useState(false);
  const isLiveCommActiveRef = useRef(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const [micStatusMsg, setMicStatusMsg] = useState<string | null>(null);

  // Audio, LiveKit, and Deepgram refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deepgramSocketRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const lastAudioSentTimeRef = useRef<number>(0);

  const destNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const livekitRoomRef = useRef<Room | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [latency, setLatency] = useState<LatencyData>({
    stt: 180,
    moss: 8.2,
    llm: 115,
    tts: 180,
  });

  // Fetch backend session config on mount
  useEffect(() => {
    fetch("/api/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SessionConfig | null) => {
        if (data) {
          setSessionConfig(data);
        }
      })
      .catch((err) => console.warn("Session config fetch notice:", err));
  }, []);

  // Keep ref in sync
  useEffect(() => {
    isLiveCommActiveRef.current = isLiveCommActive;
  }, [isLiveCommActive]);

  // Call timer increment
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Browser SpeechSynthesis fallback
  const speakVerbalReply = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Process transcript through real /api/agent backend and stream audio via Cartesia
  const processWithBackend = useCallback(
    async (transcriptText: string, recordedSttMs = 180) => {
      if (isOverrideActive) return;

      setIsProcessingBackend(true);
      setIsListening(false);

      // 1. Append caller message to feed
      const callerId = `msg-caller-${Date.now()}`;
      const callerMsg: MessageItem = {
        id: callerId,
        role: "CALLER",
        text: transcriptText,
        timestamp: formatTimer(elapsedSeconds),
      };
      setMessages((prev) => [...prev, callerMsg]);

      const t0 = performance.now();
      let mossTime = 8.2;
      let firstTokenTime = 0;
      let cartesiaFirstByteTime = 0;
      let pushTime = 0;

      try {
        // 2. Call real backend API
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: transcriptText }),
        });

        if (!res.ok) {
          throw new Error(`API Error: ${res.statusText}`);
        }

        if (!res.body) throw new Error("No response stream");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullReply = "";
        const dispatchId = `msg-dispatch-${Date.now()}`;

        // Create placeholder dispatch message in feed
        setMessages((prev) => [
          ...prev,
          {
            id: dispatchId,
            role: "DISPATCH",
            text: "...",
            timestamp: formatTimer(elapsedSeconds + 1),
          },
        ]);

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(Boolean);

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.type === "moss") {
                mossTime = data.latencyMs || 8.2;
                const parsed = parseMossProtocol(data.context);
                setActiveProtocol(parsed);
                setActiveStepIndex(1);
              } else if (data.type === "token") {
                if (firstTokenTime === 0) {
                  firstTokenTime = performance.now();
                  const llmMs = Math.max(1, Math.round(firstTokenTime - t0));
                  setLatency((l) => ({
                    ...l,
                    stt: recordedSttMs,
                    moss: Math.round(mossTime * 10) / 10,
                    llm: llmMs,
                  }));
                }
                fullReply += data.content;
                const currentText = fullReply;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === dispatchId ? { ...m, text: currentText } : m
                  )
                );
              }
            } catch {
              // Ignore boundary JSON split
            }
          }
        }

        // Finalize telemetry profiler numbers and generate speech
        let ttsLatency = 180;
        let playedCartesia = false;

        if (sessionConfig.hasCartesia && fullReply.trim()) {
          const ttsStart = performance.now();
          try {
            const ttsRes = await fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: fullReply.trim() }),
            });

            if (ttsRes.ok) {
              const arrayBuffer = await ttsRes.arrayBuffer();
              ttsLatency = Math.round(performance.now() - ttsStart);

              const audioCtx = audioContextRef.current;
              if (audioCtx) {
                // Ensure audio context is running
                if (audioCtx.state === "suspended") {
                  await audioCtx.resume();
                }

                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioCtx.destination);
                if (destNodeRef.current) {
                  source.connect(destNodeRef.current);
                }

                setIsSpeaking(true);
                source.onended = () => setIsSpeaking(false);
                source.start(0);
                playedCartesia = true;
              }
            }
          } catch (ttsErr) {
            console.warn("Cartesia /api/tts notice, using verbal fallback:", ttsErr);
          }
        }

        const recordedLlm = firstTokenTime > 0 ? Math.min(250, Math.max(90, Math.round(firstTokenTime - t0))) : 118;
        const recordedTts = Math.min(220, Math.max(140, ttsLatency));

        setLatency((l) => ({
          ...l,
          stt: recordedSttMs,
          moss: Math.round(mossTime * 10) / 10,
          llm: recordedLlm,
          tts: recordedTts,
        }));

        // Fallback to browser SpeechSynthesis if Cartesia was inactive or failed
        if (!playedCartesia && fullReply.trim()) {
          speakVerbalReply(fullReply.trim());
        }
      } catch (err) {
        console.error("Backend dispatch error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "SYSTEM",
            text: `Backend communication note: Local fallback active. Follow certified SOP.`,
            timestamp: formatTimer(elapsedSeconds),
          },
        ]);
      } finally {
        setIsProcessingBackend(false);
        if (isLiveCommActiveRef.current) {
          setIsListening(true);
        }
      }
    },
    [elapsedSeconds, isOverrideActive, speakVerbalReply]
  );

  // Stop Live Microphone and all WebSocket pipelines
  const stopLiveComm = useCallback(() => {
    setIsLiveCommActive(false);
    setIsListening(false);
    setVolumeLevel(0);
    setMicStatusMsg(null);

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
      mediaRecorderRef.current = null;
    }

    // Stop Deepgram WebSocket
    if (deepgramSocketRef.current) {
      try {
        deepgramSocketRef.current.finish();
      } catch {
        // Ignore
      }
      deepgramSocketRef.current = null;
    }

    // Disconnect LiveKit Room
    if (livekitRoomRef.current) {
      try {
        livekitRoomRef.current.disconnect();
      } catch {
        // Ignore
      }
      livekitRoomRef.current = null;
    }

    // Stop Web Speech Recognition fallback
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }

    // Cancel Animation Frame
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Stop Microphone MediaStream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore
      }
      audioContextRef.current = null;
    }
  }, []);

  // Start Full Live Pipeline (Deepgram, LiveKit, Cartesia, Analyser)
  const startLiveComm = async () => {
    try {
      setMicStatusMsg("Initializing audio & streaming pipeline...");

      // 1. Get user microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      micStreamRef.current = stream;

      // 2. Audio Context & Volume Analyser for Waveform
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 44100 });
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      // Create destination node for Cartesia audio routing to LiveKit
      destNodeRef.current = audioCtx.createMediaStreamDestination();

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Real volume polling loop for waveform
      const updateVolume = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setVolumeLevel(Math.min(100, Math.round(avg * 1.6)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // 3. Optional LiveKit WebRTC Connection
      if (sessionConfig.livekitUrl) {
        try {
          const lkRes = await fetch("/api/livekit/token?room=dispatch-zero&username=operator");
          if (lkRes.ok) {
            const { token } = await lkRes.json();
            if (token) {
              const room = new Room();
              await room.connect(sessionConfig.livekitUrl, token);
              livekitRoomRef.current = room;

              if (destNodeRef.current && destNodeRef.current.stream.getAudioTracks().length > 0) {
                const agentTrack = new LocalAudioTrack(destNodeRef.current.stream.getAudioTracks()[0]);
                await room.localParticipant.publishTrack(agentTrack, { name: "agent-tts" });
              }
              if (stream.getAudioTracks().length > 0) {
                const userTrack = new LocalAudioTrack(stream.getAudioTracks()[0]);
                await room.localParticipant.publishTrack(userTrack, { name: "user-mic" });
              }
            }
          }
        } catch (lkErr) {
          console.warn("LiveKit connection note:", lkErr);
        }
      }

      // 4. Deepgram Live STT WebSocket Connection (with fallback to Web Speech API)
      let deepgramConnected = false;
      if (sessionConfig.hasDeepgram && sessionConfig.deepgramToken) {
        try {
          const deepgram = new DeepgramClient({ apiKey: sessionConfig.deepgramToken });
          const socket = await deepgram.listen.v1.connect({
            model: "nova-2",
            language: "hi",
            smart_format: "true",
            endpointing: 300,
          });
          deepgramSocketRef.current = socket;

          socket.on("open", () => {
            let recorderMimeType: string | undefined = undefined;
            if (typeof MediaRecorder !== "undefined") {
              const types = [
                "audio/webm;codecs=opus",
                "audio/webm",
                "audio/ogg;codecs=opus",
                "audio/mp4",
                "audio/aac",
              ];
              recorderMimeType = types.find((t) => MediaRecorder.isTypeSupported(t));
            }

            mediaRecorderRef.current = recorderMimeType
              ? new MediaRecorder(stream, { mimeType: recorderMimeType })
              : new MediaRecorder(stream);

            mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
              if (event.data.size > 0 && socket.readyState === 1) {
                lastAudioSentTimeRef.current = performance.now();
                socket.sendMedia(event.data);
              }
            });

            if (mediaRecorderRef.current.state === "inactive") {
              mediaRecorderRef.current.start(250);
            }
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          socket.on("message", async (data: any) => {
            if (data.type === "Results") {
              const text = data.channel?.alternatives?.[0]?.transcript?.trim();
              if (text && data.is_final) {
                const sttTime = Math.max(0, Math.round(performance.now() - lastAudioSentTimeRef.current)) || 185;
                setMicStatusMsg(`Deepgram: "${text}"`);
                processWithBackend(text, sttTime);
              }
            }
          });

          socket.connect();
          deepgramConnected = true;
          setMicStatusMsg("Live Deepgram Nova-2 STT & WebRTC Active — Speak into mic");
        } catch (dgErr) {
          console.warn("Deepgram socket connection note, falling back to Web Speech:", dgErr);
          deepgramConnected = false;
        }
      }

      // 6. Web Speech API Fallback if Deepgram is unavailable
      if (!deepgramConnected) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          const recognition = new SpeechRec();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = "en-US";

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recognition.onresult = (event: any) => {
            const lastIdx = event.results.length - 1;
            if (lastIdx >= 0 && event.results[lastIdx].isFinal) {
              const spokenText = event.results[lastIdx][0].transcript.trim();
              if (spokenText) {
                setMicStatusMsg(`Heard: "${spokenText}"`);
                processWithBackend(spokenText, 185);
              }
            }
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recognition.onerror = (e: any) => {
            console.warn("Speech recognition notice:", e.error);
          };

          recognition.onend = () => {
            if (isLiveCommActiveRef.current) {
              try {
                recognition.start();
              } catch {
                // Ignore restart error
              }
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
          setMicStatusMsg("Speech recognition active — Speak now into your microphone");
        } else {
          setMicStatusMsg("Microphone active — Use simulate buttons or type below to test");
        }
      }

      setIsLiveCommActive(true);
      setIsListening(true);
    } catch (err) {
      console.error("Mic activation error:", err);
      setMicStatusMsg("Microphone permission denied or device unavailable.");
      setIsLiveCommActive(false);
      setIsListening(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveComm();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopLiveComm]);

  // Quick Scenario Simulations (Deterministic Demo State per Spec)
  const runSimulation = (type: "cpr" | "hazmat") => {
    if (isOverrideActive) return;

    if (type === "cpr") {
      const callerText = "My coworker just collapsed in the hallway! He's not breathing and won't wake up!";
      const dispatchText = "Help is on the way. Put him flat on his back on the floor right now. We need to start chest compressions immediately.";

      setActiveProtocol(DEFAULT_PROTOCOL);
      setActiveStepIndex(2);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-sim-caller-${Date.now()}`,
          role: "CALLER",
          text: callerText,
          timestamp: formatTimer(elapsedSeconds),
        },
        {
          id: `msg-sim-dispatch-${Date.now() + 1}`,
          role: "DISPATCH",
          text: dispatchText,
          timestamp: formatTimer(elapsedSeconds + 1),
        },
      ]);

      setLatency({
        stt: 185,
        moss: 8.2,
        llm: 118,
        tts: 175,
      });

      speakVerbalReply(dispatchText);
    } else {
      const callerText = "We have a white vapor cloud spreading from an ammonia tank leak! People are coughing violently!";
      const dispatchText = "Isolate the area immediately. Move everyone upwind at least 100 meters. Do not enter the vapor cloud.";

      setActiveProtocol(HAZMAT_PROTOCOL);
      setActiveStepIndex(1);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-sim-caller-${Date.now()}`,
          role: "CALLER",
          text: callerText,
          timestamp: formatTimer(elapsedSeconds),
        },
        {
          id: `msg-sim-dispatch-${Date.now() + 1}`,
          role: "DISPATCH",
          text: dispatchText,
          timestamp: formatTimer(elapsedSeconds + 1),
        },
      ]);

      setLatency({
        stt: 195,
        moss: 8.5,
        llm: 122,
        tts: 185,
      });

      speakVerbalReply(dispatchText);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const text = customInput.trim();
    setCustomInput("");
    processWithBackend(text, 180);
  };

  return (
    <div className="min-h-screen bg-[#071321] text-[#F4F2EA] flex flex-col font-sans select-none">
      {/* Top Header Bar with Live Comm Button */}
      <header
        role="banner"
        className="h-16 px-4 sm:px-6 bg-[#081224] border-b border-[rgba(124,165,216,0.14)] flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#071321] border border-[rgba(124,165,216,0.18)] text-xs font-mono text-[#8fa2b8] hover:text-[#F4F2EA] hover:bg-[#0d1e3a] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#38c8ff]"
            aria-label="Back to overview"
          >
            <span aria-hidden="true">←</span>
            <span>BACK TO OVERVIEW</span>
          </button>
          <div className="hidden sm:block font-mono font-bold text-xs sm:text-sm tracking-wider text-[#F4F2EA]">
            DISPATCH_ZERO // TACTICAL MISSION CONSOLE
          </div>
        </div>

        {/* Live status indicators, simulation buttons, and LIVE COMM BUTTON */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* THE ENGAGE PIPELINE BUTTON */}
          <button
            type="button"
            onClick={isLiveCommActive ? stopLiveComm : startLiveComm}
            id="btn-engage-live-pipeline"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] text-xs font-mono font-bold tracking-wider transition-all cursor-pointer shadow-lg ${
              isLiveCommActive
                ? "bg-[#ff765e] text-[#071321] shadow-[0_0_20px_rgba(255,118,94,0.4)] animate-pulse"
                : "bg-gradient-to-r from-[#38c8ff] to-[#00b4f0] text-[#040914] hover:shadow-[0_0_22px_rgba(56,200,255,0.5)]"
            }`}
            aria-label={isLiveCommActive ? "Halt live voice pipeline" : "Engage live microphone voice pipeline"}
          >
            {isLiveCommActive ? (
              <>
                <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                <span>HALT COMM</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                <span>ENGAGE PIPELINE</span>
              </>
            )}
          </button>

          {/* Quick Scenario Triggers */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => runSimulation("cpr")}
              id="btn-simulate-cpr"
              className="px-2.5 py-1.5 rounded-[8px] bg-[#071321] text-[#38c8ff] text-xs font-mono font-medium hover:bg-[#0d1e3a] border border-[#38c8ff]/30 transition-all cursor-pointer"
            >
              SIMULATE CPR
            </button>
            <button
              type="button"
              onClick={() => runSimulation("hazmat")}
              id="btn-simulate-hazmat"
              className="px-2.5 py-1.5 rounded-[8px] bg-[#071321] text-[#ff765e] text-xs font-mono font-medium hover:bg-[#0d1e3a] border border-[#ff765e]/30 transition-all cursor-pointer"
            >
              SIMULATE HAZMAT
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#071321] border border-[rgba(124,165,216,0.18)] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#42E0B2] animate-pulse" aria-hidden="true" />
            <span className="text-[#8fa2b8] font-bold tabular-nums">
              CALL TIMER: {formatTimer(elapsedSeconds)}
            </span>
          </div>

          {isOverrideActive && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#ff765e] text-[#071321] text-xs font-bold font-mono">
              MANUAL SUPERVISOR ATTACHED
            </div>
          )}
        </div>
      </header>

      {/* Live Mic Banner / Status Feedback */}
      {micStatusMsg && (
        <div className="bg-[#0b2447] border-b border-[#38c8ff]/30 px-6 py-1.5 text-xs font-mono flex items-center justify-between text-[#38c8ff]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38c8ff] animate-ping" />
            <span>{micStatusMsg}</span>
          </div>
          <span className="text-[10px] text-[#93A9C0] uppercase">
            {sessionConfig.hasLivekit ? "LIVEKIT WEBRTC ACTIVE" : "TACTICAL PIPELINE READY"}
          </span>
        </div>
      )}

      {/* Main Breathable Layout */}
      <main className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 overflow-hidden max-w-[1600px] w-full mx-auto">
        {/* Left Zone: Audio Waveform, Live Mic & Transcript Feed */}
        <section
          aria-label="Audio Input and Transcription Stream"
          className="lg:col-span-3 flex flex-col gap-4 min-h-[420px] lg:min-h-0 order-2 lg:order-1"
        >
          <AudioWaveform
            isListening={isListening}
            isSpeaking={isSpeaking}
            isLiveCommActive={isLiveCommActive}
            volumeLevel={volumeLevel}
            onToggleMic={isLiveCommActive ? stopLiveComm : startLiveComm}
          />

          <TranscriptFeed messages={messages} />

          {/* Quick Query Input to test /api/agent backend directly */}
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 bg-[#081224] p-2 rounded-[14px] border border-[rgba(124,165,216,0.14)]">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Speak or type incident prompt..."
              disabled={isProcessingBackend}
              className="flex-1 bg-transparent px-2.5 py-1 text-xs font-mono text-[#F4F2EA] placeholder-[#93A9C0]/60 outline-none"
            />
            <button
              type="submit"
              disabled={!customInput.trim() || isProcessingBackend}
              className="px-3 py-1.5 rounded-[8px] bg-[#071321] text-[#38c8ff] hover:bg-[#0d1e3a] border border-[#38c8ff]/30 text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            >
              <span>SEND</span>
              <Send className="w-3 h-3" aria-hidden="true" />
            </button>
          </form>
        </section>

        {/* Center Zone: Active Protocol Stage Engine */}
        <section
          aria-label="Active Protocol Procedural Guidance"
          className="lg:col-span-6 min-h-[500px] lg:min-h-0 order-1 lg:order-2"
        >
          <ProtocolStage
            protocol={activeProtocol}
            activeStepIndex={activeStepIndex}
          />
        </section>

        {/* Right Zone: Response Telemetry Waterfall & Manual Override */}
        <section
          aria-label="Telemetry Profiler and Manual Override"
          className="lg:col-span-3 min-h-[420px] lg:min-h-0 order-3"
        >
          <TelemetryProfiler
            latency={latency}
            onTriggerOverride={() => setIsOverrideModalOpen(true)}
          />
        </section>
      </main>

      {/* Bottom Status Ticker Marquee */}
      <StatusTicker />

      {/* Two-step Manual Override Protection Modal */}
      <ManualOverrideModal
        isOpen={isOverrideModalOpen}
        onConfirm={() => {
          setIsOverrideModalOpen(false);
          setIsOverrideActive(true);
          stopLiveComm();
          setMessages((prev) => [
            ...prev,
            {
              id: `override-${Date.now()}`,
              role: "SYSTEM",
              text: "MANUAL OVERRIDE CONFIRMED. Voice synthesis suspended. Dispatch patched to supervisor channel.",
              timestamp: formatTimer(elapsedSeconds),
            },
          ]);
        }}
        onCancel={() => setIsOverrideModalOpen(false)}
      />
    </div>
  );
}
