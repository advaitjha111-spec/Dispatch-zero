import DashboardClient from "@/components/DashboardClient";

export default function Page() {
  const deepgramKey = process.env.DEEPGRAM_API_KEY || "";
  const cartesiaKey = process.env.CARTESIA_API_KEY || "";

  return (
    <DashboardClient 
      deepgramKey={deepgramKey} 
      cartesiaKey={cartesiaKey} 
    />
  );
}
