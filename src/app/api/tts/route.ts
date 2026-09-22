import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Cartesia API key not configured on server" },
      { status: 500 }
    );
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing 'text' in request body" }, { status: 400 });
    }

    const cartesiaRes = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "Cartesia-Version": "2024-06-10",
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_id: "sonic-2",
        transcript: text.trim(),
        voice: {
          mode: "id",
          id: "a0e99841-438c-4a64-b679-ae501e7d6091",
        },
        output_format: {
          container: "wav",
          sample_rate: 44100,
          encoding: "pcm_s16le",
        },
      }),
    });

    if (!cartesiaRes.ok) {
      const errText = await cartesiaRes.text();
      console.warn("Cartesia API error response:", errText);
      return NextResponse.json(
        { error: `Cartesia TTS failure: ${cartesiaRes.statusText}`, details: errText },
        { status: cartesiaRes.status }
      );
    }

    const audioBuffer = await cartesiaRes.arrayBuffer();
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Cartesia TTS Route Exception:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
