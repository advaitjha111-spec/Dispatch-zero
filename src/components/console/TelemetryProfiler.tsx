"use client";

export interface LatencyData {
  stt: number; // ms
  moss: number; // ms
  llm: number; // ms
  tts: number; // ms
}

interface TelemetryProfilerProps {
  latency: LatencyData;
  onTriggerOverride: () => void;
}

export default function TelemetryProfiler({
  latency,
  onTriggerOverride,
}: TelemetryProfilerProps) {
  const totalRtt = latency.stt + latency.moss + latency.llm + latency.tts;

  // Threshold colors: <900ms mint, 900-1200ms amber, >1200ms coral
  const rttColor =
    totalRtt < 900 ? "#42E0B2" : totalRtt <= 1200 ? "#FFE600" : "#ff765e";

  return (
    <div className="bg-[#081224] p-5 sm:p-6 rounded-[20px] border border-[rgba(124,165,216,0.14)] flex flex-col justify-between h-full gap-5 shadow-xl">
      <div>
        {/* Header with Test Mode tag */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(124,165,216,0.12)] text-xs font-mono mb-5">
          <span className="text-[#8fa2b8] tracking-wider uppercase font-semibold">
            RESPONSE PROFILER
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#071321] text-[#93A9C0] border border-[rgba(124,165,216,0.14)]">
            PERF.NOW() BENCHMARK
          </span>
        </div>

        {/* Elevated Total RTT Display */}
        <div className="p-4 sm:p-5 rounded-[16px] bg-[#071321] border border-[rgba(124,165,216,0.12)] mb-5 text-center">
          <span className="font-mono text-[10px] sm:text-[11px] text-[#8fa2b8] tracking-wider uppercase block mb-1">
            TOTAL VOICE-TO-VOICE RTT
          </span>
          <div
            className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight tabular-nums"
            style={{ color: rttColor }}
          >
            {totalRtt > 0 ? `${totalRtt.toFixed(1)}ms` : "--"}
          </div>
          <div
            className="flex items-center justify-center gap-2 mt-1.5 font-mono text-[10px]"
            style={{ color: totalRtt <= 900 ? "#42E0B2" : "#ff765e" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: totalRtt <= 900 ? "#42E0B2" : "#ff765e" }}
              aria-hidden="true"
            />
            <span>{totalRtt <= 900 ? "TARGET ACHIEVED" : "TARGET EXCEEDED"}</span>
            <span className="text-[#93A9C0]">(TARGET &lt; 900MS)</span>
          </div>
        </div>

        {/* Four Milestone Timeline Rows */}
        <div className="space-y-3">
          {/* Milestone 1: STT */}
          <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#071321]/60 border border-[rgba(124,165,216,0.08)]">
            <div>
              <div className="text-xs font-semibold text-[#F4F2EA]">
                Deepgram Nova-2 STT
              </div>
              <div className="text-[10px] font-mono text-[#8fa2b8]">
                Audio frame to text tokens
              </div>
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-[#F4F2EA] tabular-nums">
              {latency.stt > 0 ? `${latency.stt}ms` : "--"}
            </div>
          </div>

          {/* Milestone 2: Moss Spotlight (Highlighted Differentiator) */}
          <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#38c8ff]/10 border border-[#38c8ff]/35 shadow-[0_0_15px_rgba(56,200,255,0.08)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#38c8ff]">
                  Moss Local Retrieval
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#42E0B2]/20 text-[#42E0B2] font-semibold">
                  LOCAL MOAT
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#8fa2b8]">
                In-memory vector query
              </div>
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-[#42E0B2] tabular-nums">
              {latency.moss > 0 ? `${latency.moss}ms` : "< 10ms"}
            </div>
          </div>

          {/* Milestone 3: Groq LLM */}
          <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#071321]/60 border border-[rgba(124,165,216,0.08)]">
            <div>
              <div className="text-xs font-semibold text-[#F4F2EA]">
                Groq LPU Inference
              </div>
              <div className="text-[10px] font-mono text-[#8fa2b8]">
                Directive token streaming
              </div>
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-[#F4F2EA] tabular-nums">
              {latency.llm > 0 ? `${latency.llm}ms` : "--"}
            </div>
          </div>

          {/* Milestone 4: Cartesia TTS */}
          <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#071321]/60 border border-[rgba(124,165,216,0.08)]">
            <div>
              <div className="text-xs font-semibold text-[#F4F2EA]">
                Cartesia Sonic TTS
              </div>
              <div className="text-[10px] font-mono text-[#8fa2b8]">
                First spoken audio chunk
              </div>
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-[#F4F2EA] tabular-nums">
              {latency.tts > 0 ? `${latency.tts}ms` : "--"}
            </div>
          </div>
        </div>
      </div>

      {/* Coral Manual Override Button */}
      <div className="pt-3 border-t border-[rgba(124,165,216,0.12)]">
        <button
          type="button"
          onClick={onTriggerOverride}
          id="btn-seize-manual-control"
          className="w-full py-3 px-4 rounded-[12px] bg-[#ff765e]/15 hover:bg-[#ff765e]/25 border border-[#ff765e]/40 text-[#ff765e] font-bold text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#ff765e]"
        >
          <span aria-hidden="true">⚠</span>
          <span>SEIZE MANUAL CONTROL</span>
        </button>
        <span className="block text-[10px] text-center font-mono text-[#8fa2b8] mt-1.5">
          Escalates automated socket to human supervisor
        </span>
      </div>
    </div>
  );
}
