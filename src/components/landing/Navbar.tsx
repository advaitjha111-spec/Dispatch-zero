"use client";

import { useState, useEffect } from "react";

interface NavbarProps {
  onLaunchConsole: () => void;
}

export default function Navbar({ onLaunchConsole }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      role="banner"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#071321]/90 backdrop-blur-md py-3.5 border-b border-[rgba(124,165,216,0.14)] shadow-xl shadow-black/50"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
        {/* Brand + Status Indicator */}
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-[#38c8ff] rounded-lg p-1"
            aria-label="DispatchZero Home"
          >
            {/* Crescent-moon SVG mark */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 relative flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-[0_0_10px_rgba(56,200,255,0.7)]"
                aria-hidden="true"
              >
                <circle
                  cx="14"
                  cy="14"
                  r="12"
                  stroke="url(#crescent_grad)"
                  strokeWidth="2.5"
                  strokeDasharray="60 20"
                />
                <path
                  d="M14 4C8.48 4 4 8.48 4 14C4 19.52 8.48 24 14 24C12 21 11 17.5 11 14C11 10.5 12 7 14 4Z"
                  fill="url(#crescent_grad)"
                />
                <defs>
                  <linearGradient
                    id="crescent_grad"
                    x1="4"
                    y1="4"
                    x2="24"
                    y2="24"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#38c8ff" />
                    <stop offset="1" stopColor="#0077b6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="font-mono font-bold text-lg sm:text-xl tracking-tight text-[#F4F2EA] group-hover:text-[#38c8ff] transition-colors">
              DISPATCHZERO
            </span>
          </a>

          {/* Status Badges */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[rgba(124,165,216,0.14)]">
            <span className="font-mono text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#081224] border border-[rgba(124,165,216,0.14)] text-[#93A9C0]">
              100% OFFLINE CAPABLE
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-[#42E0B2] px-2 py-0.5 rounded-full bg-[#42E0B2]/10 border border-[#42E0B2]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#42E0B2] animate-pulse" aria-hidden="true" />
              ONLINE
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8fa2b8]"
        >
          <a
            href="#protocols"
            className="hover:text-[#F4F2EA] transition-colors tracking-wide py-1 border-b border-transparent hover:border-[#38c8ff]"
          >
            Protocols
          </a>
          <a
            href="#architecture"
            className="hover:text-[#F4F2EA] transition-colors tracking-wide py-1 border-b border-transparent hover:border-[#38c8ff]"
          >
            Architecture
          </a>
          <a
            href="#pipeline"
            className="hover:text-[#F4F2EA] transition-colors tracking-wide py-1 border-b border-transparent hover:border-[#38c8ff]"
          >
            Pipeline
          </a>
        </nav>

        {/* Right CTA Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLaunchConsole}
            id="nav-launch-console-btn"
            className="btn-glow-cyan px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-mono tracking-wider gap-2 group cursor-pointer"
            aria-label="Launch Tactical Mission Console"
          >
            <span>Launch Console</span>
            <span className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </header>
  );
}
