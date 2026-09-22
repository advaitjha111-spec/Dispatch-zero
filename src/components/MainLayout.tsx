"use client";

import { useRouter } from "next/navigation";
import Navbar from "./landing/Navbar";
import HeroSection from "./landing/HeroSection";
import MetricsBanner from "./landing/MetricsBanner";
import FeaturePillars from "./landing/FeaturePillars";
import ProtocolGrid from "./landing/ProtocolGrid";
import ArchitectureComparison from "./landing/ArchitectureComparison";
import PipelineSection from "./landing/PipelineSection";
import CTASection from "./landing/CTASection";
import Footer from "./landing/Footer";

export default function MainLayout() {
  const router = useRouter();

  const handleLaunchConsole = () => {
    router.push("/console");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#040914] text-[#F4F2EA]">
      {/* Top Fixed Navigation */}
      <Navbar onLaunchConsole={handleLaunchConsole} />

      {/* Main Landing Flow */}
      <main className="flex-1 flex flex-col">
        {/* 1. Hero & Signal Route */}
        <HeroSection onLaunchConsole={handleLaunchConsole} />
        
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
        <CTASection onLaunchConsole={handleLaunchConsole} />
      </main>

      {/* Technical Footer */}
      <Footer />
    </div>
  );
}
