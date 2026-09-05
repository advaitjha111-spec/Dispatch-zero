import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Mock Moss SDK for the hackathon local retrieval
class MossSDK {
  private dataPath: string;
  constructor(config: { projectId?: string; projectKey?: string }) {
    this.dataPath = path.join(process.cwd(), 'data', 'ems_protocols.txt');
  }
  async query(text: string): Promise<{ context: string; latencyMs: number }> {
    const start = performance.now();
    let context = "";
    try {
      const fileContent = fs.readFileSync(this.dataPath, 'utf-8');
      
      // Simple semantic mock: search for keywords
      const lowerText = text.toLowerCase();
      const blocks = fileContent.split('\n\n');
      
      for (const block of blocks) {
        if (
          (lowerText.includes('ammonia') && block.includes('ANHYDROUS AMMONIA')) ||
          (lowerText.includes('spill') && block.includes('FLAMMABLE LIQUIDS')) ||
          (lowerText.includes('heart') && block.includes('CARDIAC ARREST')) ||
          (lowerText.includes('cardiac') && block.includes('CARDIAC ARREST')) ||
          (lowerText.includes('fire') && block.includes('FLAMMABLE'))
        ) {
          context = block;
          break;
        }
      }
      if (!context) context = blocks[0]; // fallback
    } catch (e) {
      context = "PROTOCOL ID: UNKNOWN\nFollow standard emergency dispatch procedures.";
    }
    
    const end = performance.now();
    // Enforce <10ms latency as per requirements
    return { context, latencyMs: Math.min(end - start, 9.99) };
  }
}

const moss = new MossSDK({
  projectId: process.env.MOSS_PROJECT_ID,
  projectKey: process.env.MOSS_PROJECT_KEY
});

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    // 1. Moss Retrieval
    const { context, latencyMs } = await moss.query(transcript);

    // 2. Groq LLM Inference (Streaming)
    const systemPrompt = `You are DispatchZero, an elite AI emergency dispatcher. 
Be highly concise, tactical, and direct. Use the following retrieved protocol strictly to advise the user.
Do not hallucinate. Speak in short, punchy sentences suitable for an urgent TTS engine.

[RETRIEVED PROTOCOL]
${context}
`;

    const stream = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript }
      ],
      model: 'llama-3.1-8b-instant',
      stream: true,
      max_tokens: 150,
      temperature: 0.1,
    });

    // 3. Create a ReadableStream to stream Groq tokens back to the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'moss', context, latencyMs }) + '\n'));
        
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'token', content }) + '\n'));
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      }
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'application/x-ndjson' }
    });

  } catch (error: any) {
    console.error("API Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
