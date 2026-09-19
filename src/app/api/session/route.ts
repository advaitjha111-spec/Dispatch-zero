import { NextResponse } from 'next/server';

export async function GET() {
  const deepgramKey = process.env.DEEPGRAM_API_KEY || "";
  const cartesiaKey = process.env.CARTESIA_API_KEY || "";
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

  return NextResponse.json({
    hasDeepgram: Boolean(deepgramKey),
    hasCartesia: Boolean(cartesiaKey),
    hasLivekit: Boolean(livekitUrl),
    deepgramKey,
    cartesiaKey,
    livekitUrl,
  });
}
