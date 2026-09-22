import type { Metadata } from "next";
import TacticalConsoleClient from "./TacticalConsoleClient";

export const metadata: Metadata = {
  title: "Tactical Console — DispatchZero",
  description: "Mission-critical air-gapped emergency voice intelligence console.",
};

export default function ConsolePage() {
  return <TacticalConsoleClient />;
}
