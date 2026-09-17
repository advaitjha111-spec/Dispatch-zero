import MainLayout from "@/components/MainLayout";

export default function Page() {
  const deepgramKey = process.env.DEEPGRAM_API_KEY || "";
  const cartesiaKey = process.env.CARTESIA_API_KEY || "";

  return (
    <MainLayout 
      deepgramKey={deepgramKey} 
      cartesiaKey={cartesiaKey} 
    />
  );
}
