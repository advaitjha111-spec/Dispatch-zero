"use client";

export default function StatusTicker() {
  const TICKER_ITEMS = (
    <div className="flex items-center gap-8 shrink-0">
      <span className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#42E0B2]" aria-hidden="true" />
        <span className="text-[#F4F2EA] font-semibold">SYSTEM READY</span>
      </span>
      <span className="text-[#93A9C0]">•</span>
      <span>AIR-GAPPED OPERATION</span>
      <span className="text-[#93A9C0]">•</span>
      <span className="text-[#38c8ff]">MOSS LOCAL INDEX: 25 PROTOCOLS</span>
      <span className="text-[#93A9C0]">•</span>
      <span>ZERO CLOUD VECTOR CALLS</span>
      <span className="text-[#93A9C0]">•</span>
      <span className="text-[#42E0B2]">LATENCY BUDGET: &lt; 900MS TARGET</span>
      <span className="text-[#93A9C0]">•</span>
      <span>LIVEKIT WEBRTC ACTIVE</span>
      <span className="text-[#93A9C0] mr-8">•</span>
    </div>
  );

  return (
    <div
      role="status"
      aria-label="System operational readiness status ticker"
      className="h-9 shrink-0 bg-[#071321] border-t border-[rgba(124,165,216,0.14)] flex items-center overflow-hidden whitespace-nowrap text-xs font-mono text-[#8fa2b8] px-4 select-none"
    >
      <div className="animate-marquee flex items-center">
        {TICKER_ITEMS}
        {TICKER_ITEMS}
      </div>
    </div>
  );
}
