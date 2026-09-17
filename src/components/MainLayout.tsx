"use client";

import { useState } from "react";
import HeroSection from "./HeroSection";
import ProtocolSlider from "./ProtocolSlider";
import ArchitectureComparison from "./ArchitectureComparison";
import DashboardClient from "./DashboardClient";

export default function MainLayout({ deepgramKey, cartesiaKey }: { deepgramKey: string, cartesiaKey: string }) {
  const [showConsole, setShowConsole] = useState(false);

  if (showConsole) {
    return (
      <div className="h-screen w-full">
        <DashboardClient deepgramKey={deepgramKey} cartesiaKey={cartesiaKey} />
      </div>
    );
  }

  return (
    <div className="bg-surface-ground relative min-h-screen">
      {/* Global Background Glow */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-50 z-0"
        style={{
          background: "radial-gradient(circle at top right, rgba(0, 245, 255, 0.15) 0%, rgba(3, 5, 8, 0) 60%)",
        }}
      />
      
      <div className="relative z-10">
        {showConsole ? (
          <div className="h-screen w-full">
            <DashboardClient deepgramKey={deepgramKey} cartesiaKey={cartesiaKey} />
          </div>
        ) : (
          <>
            <HeroSection onLaunchConsole={() => setShowConsole(true)} />
            <ProtocolSlider />
            <ArchitectureComparison />
          </>
        )}
      </div>
    </div>
  );
}
