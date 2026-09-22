"use client";

import { useRouter } from "next/navigation";
import TacticalConsole from "@/components/console/TacticalConsole";

export default function TacticalConsoleClient() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#040914] text-[#F4F2EA]">
      <TacticalConsole onBack={() => router.push("/")} />
    </div>
  );
}
