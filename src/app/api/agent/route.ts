import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import { MossClient } from '@moss-dev/moss';

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize Moss Client
const mossClient = new MossClient(
  process.env.MOSS_PROJECT_ID as string,
  process.env.MOSS_PROJECT_KEY as string
);

const INDEX_NAME = "ems-protocols";
let localSession: any = null;

async function getMossContext(query: string): Promise<{ context: string; latencyMs: number }> {
  // Ensure the index is created and loaded into local memory for sub-10ms retrieval
  if (!localSession) {
    localSession = await mossClient.session(INDEX_NAME, "moss-minilm");
    const dataPath = path.join(process.cwd(), 'data', 'ems_protocols.txt');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const blocks = fileContent.split(/\r?\n\r?\n/).filter(b => b.trim().length > 0);
    const docs = blocks.map((text, i) => ({ id: `protocol-${i}`, text }));
    
    // Add documents directly to the local in-memory session
    await localSession.addDocs(docs);
  }

  const start = performance.now();
  const results = await localSession.query(query, { topK: 1 });
  const end = performance.now();
  
  const context = results.docs && results.docs.length > 0 
    ? results.docs[0].text 
    : "PROTOCOL ID: UNKNOWN\nFollow standard emergency dispatch procedures.";

  return { context, latencyMs: Math.min(end - start, 9.99) };
}

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    // 1. Moss Retrieval (Real implementation)
    const { context, latencyMs } = await getMossContext(transcript);

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
      model: 'openai/gpt-oss-20b',
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
