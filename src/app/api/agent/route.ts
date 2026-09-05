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

const HINDI_KEYWORD_MAP = [
  { keywords: ["aag", "jala", "dhua", "fire", "burn", "shola"], english: "fire burn smoke flame hazmat combustible flammable" },
  { keywords: ["saans", "gala", "choking", "breath", "dam", "asthma", "cough"], english: "breathing airway choking asthma oxygen bronchospasm" },
  { keywords: ["dil", "daura", "chest", "cpr", "heart", "chhati", "pulse", "beat"], english: "cardiac arrest heart CPR chest compressions ALS" },
  { keywords: ["khoon", "bleeding", "chot", "zakhmi", "trauma", "cut", "wound"], english: "hemorrhage bleeding pressure tourniquet trauma severe bleeding" },
  { keywords: ["zehar", "chemical", "leak", "gas", "poison", "acid", "toxic"], english: "hazmat chemical spill poison toxic ammonia explosive" },
  { keywords: ["baccha", "delivery", "paida", "pregnant", "mother", "birth"], english: "childbirth delivery umbilical cord infant baby pregnancy" },
  { keywords: ["stroke", "lakwa", "behoosh", "faint", "unconscious", "head"], english: "stroke FAST assessment cervical spine injury unconsciousness" },
  { keywords: ["allergy", "anaphylaxis", "sujan", "reaction"], english: "anaphylactic shock allergic epinephrine" },
  { keywords: ["sugar", "glucose", "diabetic", "meetha"], english: "diabetic hypoglycemia blood glucose" }
];

function expandQueryForMoss(query: string): string {
  let expanded = query;
  const qLower = query.toLowerCase();
  for (const item of HINDI_KEYWORD_MAP) {
    if (item.keywords.some(k => qLower.includes(k))) {
      expanded += " " + item.english;
    }
  }
  return expanded;
}

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

  const expandedQuery = expandQueryForMoss(query);
  const start = performance.now();
  const results = await localSession.query(expandedQuery, { topK: 1 });
  const end = performance.now();
  
  const context = results.docs && results.docs.length > 0 
    ? results.docs[0].text 
    : "PROTOCOL ID: UNKNOWN\nFollow standard emergency dispatch procedures.";

  return { context, latencyMs: end - start };
}

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    // 1. Moss Retrieval (Real implementation)
    const { context, latencyMs } = await getMossContext(transcript);

    // 2. Groq LLM Inference (Streaming inside ReadableStream)
    const systemPrompt = `You are DispatchZero AI, an elite emergency voice dispatch assistant.
You guide emergency callers using the following emergency protocol retrieved from Moss:

${context}

CRITICAL LANGUAGE REQUIREMENT:
1. Automatically detect the language of the user's input ("${transcript}").
2. IF THE USER SPEAKS HINDI OR HINGLISH (e.g. 'aag lag gayi', 'saans nahi aa rahi', 'dil ka daura', 'accident ho gaya'):
   - You MUST respond ENTIRELY in clear, natural Hindi.
   - Provide direct, calm, step-by-step life-saving emergency instructions based strictly on the protocol.
3. IF THE USER SPEAKS ENGLISH:
   - Respond in concise, authoritative English.
4. Keep response under 35 words so it can be spoken rapidly over emergency audio dispatch. Do not use markdown, formatting, or bullet points.`;

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'moss', context, latencyMs }) + '\n'));
        
        try {
          const stream = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: transcript }
            ],
            model: 'openai/gpt-oss-20b',
            stream: true,
            max_tokens: 400,
            temperature: 0.1,
          });

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'token', content }) + '\n'));
            }
          }
          controller.close();
        } catch (e) {
          console.error("Groq stream error:", e);
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
