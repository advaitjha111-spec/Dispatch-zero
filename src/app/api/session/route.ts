import { NextResponse } from "next/server";
import { DeepgramClient } from "@deepgram/sdk";

export async function GET() {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY || "";
  const cartesiaApiKey = process.env.CARTESIA_API_KEY || "";
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

  let deepgramToken = "";

  // Securely issue a short-lived ephemeral token for client-side audio streaming
  if (deepgramApiKey) {
    try {
      const deepgram = new DeepgramClient({ apiKey: deepgramApiKey });
      const grantRes = await deepgram.auth.v1.tokens.grant();
      if (grantRes && grantRes.access_token) {
        deepgramToken = grantRes.access_token;
      }
    } catch (tokenErr) {
      console.warn("Notice: Deepgram ephemeral token grant unavailable, client will use Web Speech STT:", tokenErr);
    }
  }

  // Under NO circumstances send raw master API keys to the browser!
  return NextResponse.json({
    hasDeepgram: Boolean(deepgramApiKey),
    hasCartesia: Boolean(cartesiaApiKey),
    hasLivekit: Boolean(livekitUrl),
    deepgramToken,
    livekitUrl,
  });
}
