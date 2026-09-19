"use client";

import { useState } from "react";
import Navbar from "./landing/Navbar";
import HeroSection from "./landing/HeroSection";
import MetricsBanner from "./landing/MetricsBanner";
import FeaturePillars from "./landing/FeaturePillars";
import ProtocolGrid from "./landing/ProtocolGrid";
import ArchitectureComparison from "./landing/ArchitectureComparison";
import PipelineSection from "./landing/PipelineSection";
import CTASection from "./landing/CTASection";
import Footer from "./landing/Footer";
import TacticalConsole from "./console/TacticalConsole";

export default function MainLayout() {
  const [showConsole, setShowConsole] = useState(false);

  if (showConsole) {
    return (
      <TacticalConsole
        onBack={() => setShowConsole(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#040914] text-[#F4F2EA]">
      {/* Top Fixed Navigation */}
      <Navbar onLaunchConsole={() => setShowConsole(true)} />

      {/* Main Landing Flow */}
      <main className="flex-1 flex flex-col">
        {/* 1. Hero & Signal Route */}
        <HeroSection onLaunchConsole={() => setShowConsole(true)} />
        
        {/* 2. Four Proof Metrics */}
        <MetricsBanner />
        
        {/* 3. Feature Pillars */}
        <FeaturePillars />
        
        {/* 4. Expandable Protocol Grid */}
        <ProtocolGrid />
        
        {/* 5. Cloud vs Tactical-Edge Architecture Comparison */}
        <ArchitectureComparison />
        
        {/* 6. Three-Stage Pipeline */}
        <PipelineSection />
        
        {/* 7. CTA Section */}
        <CTASection onLaunchConsole={() => setShowConsole(true)} />
      </main>

      {/* Technical Footer */}
      <Footer />
    </div>
  );
}
