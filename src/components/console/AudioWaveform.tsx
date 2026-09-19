"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

interface AudioWaveformProps {
  isListening: boolean;
  isSpeaking: boolean;
  isLiveCommActive?: boolean;
  volumeLevel?: number;
  onToggleMic?: () => void;
}

export default function AudioWaveform({
  isListening,
  isSpeaking,
  isLiveCommActive = false,
  volumeLevel = 0,
  onToggleMic,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const barCount = 28;
      const barWidth = 3;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      phase += 0.08;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        let amplitude = 4;

        if (isSpeaking) {
          // Animated synthesized speech waveform
          const wave = Math.sin(phase + i * 0.4) * Math.cos(phase * 0.6 + i * 0.25);
          amplitude = Math.max(4, Math.abs(wave) * (height * 0.45));
        } else if (isListening) {
          if (volumeLevel > 0) {
            // Real microphone volume responsive scaling
            const variance = 0.5 + Math.sin(phase + i * 0.5) * 0.5;
            amplitude = Math.max(4, (volumeLevel / 100) * (height * 0.45) * variance);
          } else {
            // Ambient listening waveform
            const wave = Math.sin(phase + i * 0.35) * Math.cos(phase * 0.5 + i * 0.2);
            amplitude = Math.max(4, Math.abs(wave) * (height * 0.38));
          }
        }

        const color = isSpeaking
          ? "#42E0B2"
          : isListening
          ? "#38c8ff"
          : "#1e3a5f";

        ctx.fillStyle = color;
        ctx.beginPath();
        // Rounded bars
        ctx.roundRect(x, centerY - amplitude / 2, barWidth, amplitude, 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isListening, isSpeaking, volumeLevel]);

  return (
    <div className="bg-[#081224] p-4 rounded-[16px] border border-[rgba(124,165,216,0.14)] flex flex-col gap-3 shadow-lg">
      {/* Top Status and Mic Control */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isSpeaking
                ? "bg-[#42E0B2] node-pulse-cyan"
                : isListening
                ? "bg-[#38c8ff] node-pulse-cyan"
                : "bg-[#1e3a5f]"
            }`}
            aria-hidden="true"
          />
          <span className="text-[#F4F2EA] font-semibold tracking-wider">
            {isSpeaking
              ? "DISPATCH TRANSMITTING"
              : isListening
              ? "VAD: LISTENING"
              : "STANDBY"}
          </span>
        </div>

        {onToggleMic && (
          <button
            type="button"
            onClick={onToggleMic}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider transition-all cursor-pointer ${
              isLiveCommActive
                ? "bg-[#ff765e]/20 border border-[#ff765e]/50 text-[#ff765e] hover:bg-[#ff765e]/30"
                : "bg-[#38c8ff]/15 border border-[#38c8ff]/40 text-[#38c8ff] hover:bg-[#38c8ff]/25"
            }`}
            aria-label={isLiveCommActive ? "Mute live microphone" : "Unmute live microphone"}
          >
            {isLiveCommActive ? (
              <>
                <Mic className="w-3 h-3 text-[#ff765e]" aria-hidden="true" />
                <span>MIC ON</span>
              </>
            ) : (
              <>
                <MicOff className="w-3 h-3 text-[#38c8ff]" aria-hidden="true" />
                <span>ENABLE MIC</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Visualizer Canvas */}
      <div
        className="h-14 w-full flex items-center justify-center bg-[#071321] rounded-[12px] overflow-hidden px-2 border border-[rgba(124,165,216,0.1)]"
        aria-label="28-bar audio waveform visualizer"
      >
        <canvas
          ref={canvasRef}
          width={280}
          height={56}
          className="w-full h-full"
        />
      </div>

      {/* Bottom Engine Metadata */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#8fa2b8] pt-1">
        <div className="flex items-center gap-2">
          <span>SILERO VAD</span>
          <span className="text-[#93A9C0]">•</span>
          <span>16KHZ PCM</span>
        </div>
        <span className={isLiveCommActive ? "text-[#42E0B2] font-semibold" : "text-[#8fa2b8]"}>
          {isLiveCommActive ? "LIVE COMM CONNECTED" : "LIVEKIT / P2P"}
        </span>
      </div>
    </div>
  );
}
