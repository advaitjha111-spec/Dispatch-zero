"use client";

import { useRef, useEffect, useState, UIEvent } from "react";

export interface MessageItem {
  id: string;
  role: "CALLER" | "DISPATCH" | "SYSTEM";
  text: string;
  timestamp: string;
}

interface TranscriptFeedProps {
  messages: MessageItem[];
}

export default function TranscriptFeed({ messages }: TranscriptFeedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Handle user manual scroll up/down
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 40;
    setAutoScroll(isAtBottom);
  };

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#081224] p-4 rounded-[16px] border border-[rgba(124,165,216,0.14)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[rgba(124,165,216,0.12)] text-xs font-mono">
        <span className="text-[#8fa2b8] tracking-wider uppercase font-semibold text-[11px]">
          LIVE TRANSCRIPTION STREAM
        </span>
        {!autoScroll && (
          <button
            type="button"
            onClick={() => {
              setAutoScroll(true);
              if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
              }
            }}
            className="text-[10px] font-mono text-[#38c8ff] hover:underline cursor-pointer focus-visible:ring-1 focus-visible:ring-[#38c8ff]"
          >
            RESUME AUTO-SCROLL ↓
          </button>
        )}
      </div>

      {/* Message List with aria-live="polite" */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        aria-live="polite"
        aria-relevant="additions text"
        className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-[#8fa2b8] font-mono text-xs py-10">
            Waiting for audio input or scenario trigger...
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`p-3 rounded-[12px] leading-relaxed transition-all ${
                m.role === "CALLER"
                  ? "bg-[#071321] border-l-2 border-[#38c8ff]"
                  : m.role === "DISPATCH"
                  ? "bg-[#0d1e3a] border-l-2 border-[#42E0B2]"
                  : "bg-[#071321]/60 border-l-2 border-[#8fa2b8] text-[11px]"
              }`}
            >
              <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
                <span
                  className={`font-bold tracking-wider ${
                    m.role === "CALLER"
                      ? "text-[#38c8ff]"
                      : m.role === "DISPATCH"
                      ? "text-[#42E0B2]"
                      : "text-[#8fa2b8]"
                  }`}
                >
                  {m.role}
                </span>
                <span className="text-[#93A9C0] tabular-nums">{m.timestamp}</span>
              </div>
              <p className="text-[#F4F2EA]">{m.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
