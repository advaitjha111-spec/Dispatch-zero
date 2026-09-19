"use client";

import { useState, useEffect } from "react";

export default function Footer() {
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer
      role="contentinfo"
      className="py-12 border-t border-[rgba(124,165,216,0.14)] bg-[#071321] text-[#8fa2b8]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left Metadata */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-xs">
            <span className="font-mono font-bold text-[#F4F2EA] tracking-wider">
              DISPATCH_ZERO // v1.7.1
            </span>
            <span className="text-[rgba(124,165,216,0.3)]" aria-hidden="true">|</span>
            <span className="font-mono text-[11px] text-[#42E0B2] font-semibold">
              [NETWORK: AIR-GAPPED READY]
            </span>
            <span className="text-[rgba(124,165,216,0.3)]" aria-hidden="true">|</span>
            <span className="font-mono text-[11px] text-[#38c8ff] tabular-nums">
              SYS_CLOCK: {utcTime || "00:00:00 UTC"}
            </span>
          </div>

          {/* Copyright */}
          <div className="font-mono text-xs text-[#93A9C0]">
            © 2026 DispatchZero. Edge-native dispatch.
          </div>
        </div>

        {/* Mandatory Safety Disclaimer */}
        <div className="pt-4 border-t border-[rgba(124,165,216,0.08)] text-[11px] leading-relaxed text-[#8fa2b8]/80 text-center lg:text-left">
          DISCLAIMER: DispatchZero is a demonstration concept for sub-second edge intelligence. It is not certified medical or public safety equipment and does not substitute for certified emergency dispatch personnel.
        </div>
      </div>
    </footer>
  );
}
