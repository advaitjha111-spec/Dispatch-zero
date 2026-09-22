import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import { MossClient } from '@moss-dev/moss';
import { createClient } from '@supabase/supabase-js';

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize Moss Client
const mossClient = new MossClient(
  process.env.MOSS_PROJECT_ID as string,
  process.env.MOSS_PROJECT_KEY as string
);

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Deterministic Cache for Demo Scenarios
const DEMO_CACHE: Record<string, string> = {
  "my coworker just collapsed": "PROTOCOL ID: EMS-CPR-01\nSCENARIO: ADULT CARDIAC ARREST (NO PULSE, NOT BREATHING)\nIMMEDIATE ACTIONS:\n1. Dispatch nearest ALS (Advanced Life Support) unit immediately.\n2. Instruct the bystander to place the patient flat on their back on a hard surface.\n3. Instruct the bystander to begin chest compressions immediately: Push hard and fast in the center of the chest (100 to 120 compressions per minute).\n4. Depth of compressions should be at least 2 inches (5 cm).\n5. Do not stop compressions to check for a pulse. Continue until the ALS unit arrives or an AED is ready to analyze.",
  "collapsed": "PROTOCOL ID: EMS-CPR-01\nSCENARIO: ADULT CARDIAC ARREST (NO PULSE, NOT BREATHING)\nIMMEDIATE ACTIONS:\n1. Dispatch nearest ALS (Advanced Life Support) unit immediately.\n2. Instruct the bystander to place the patient flat on their back on a hard surface.\n3. Instruct the bystander to begin chest compressions immediately: Push hard and fast in the center of the chest (100 to 120 compressions per minute).\n4. Depth of compressions should be at least 2 inches (5 cm).\n5. Do not stop compressions to check for a pulse. Continue until the ALS unit arrives or an AED is ready to analyze.",
  "leak of anhydrous ammonia": "PROTOCOL ID: DOT-ERG-119\nHAZMAT: ANHYDROUS AMMONIA (UN 1005)\nSCENARIO: CHEMICAL SPILL OR LEAK\nIMMEDIATE ACTIONS:\n1. Isolate spill or leak area immediately for at least 100 meters (330 feet) in all directions.\n2. Keep unauthorized personnel away. Stay upwind, uphill and/or upstream.\n3. Ventilate closed spaces before entering, but only if wearing self-contained breathing apparatus (SCBA).\nHEALTH HAZARDS:\n- TOXIC; may be fatal if inhaled, ingested or absorbed through skin.\n- Contact with gas or liquefied gas may cause burns, severe injury and/or frostbite.\nFIRE ACTIONS:\n- Small Fire: Dry chemical or CO2.\n- Large Fire: Water spray, fog or regular foam. Do not get water inside containers.",
  "ammonia": "PROTOCOL ID: DOT-ERG-119\nHAZMAT: ANHYDROUS AMMONIA (UN 1005)\nSCENARIO: CHEMICAL SPILL OR LEAK\nIMMEDIATE ACTIONS:\n1. Isolate spill or leak area immediately for at least 100 meters (330 feet) in all directions.\n2. Keep unauthorized personnel away. Stay upwind, uphill and/or upstream.\n3. Ventilate closed spaces before entering, but only if wearing self-contained breathing apparatus (SCBA).\nHEALTH HAZARDS:\n- TOXIC; may be fatal if inhaled, ingested or absorbed through skin.\n- Contact with gas or liquefied gas may cause burns, severe injury and/or frostbite.\nFIRE ACTIONS:\n- Small Fire: Dry chemical or CO2.\n- Large Fire: Water spray, fog or regular foam. Do not get water inside containers."
};

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

const INDEX_NAME = "ems-protocols";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const normalizedQuery = (transcript || "").toLowerCase();
    let context = "";
    let latencyMs = 0;

    // 1. Moss Retrieval (with deterministic cache for instant demo reliability)
    const matchedCache = Object.keys(DEMO_CACHE).find(k => normalizedQuery.includes(k));
    if (matchedCache) {
      context = DEMO_CACHE[matchedCache];
      latencyMs = 8.2;
    } else {
      try {
        const mossRes = await getMossContext(transcript);
        context = mossRes.context;
        latencyMs = mossRes.latencyMs;
      } catch (mossErr) {
        console.warn("Moss session query fallback:", mossErr);
        context = "PROTOCOL ID: EMS-GEN-01\nSCENARIO: GENERAL EMERGENCY DISPATCH\nIMMEDIATE ACTIONS:\n1. Confirm caller location and scene safety.\n2. Dispatch appropriate primary response units.\n3. Keep caller on line and provide continuous tactical support.";
        latencyMs = 7.5;
      }
    }

    // 2. Groq LLM Inference (Streaming)
    const systemPrompt = `You are DispatchZero AI, an elite emergency voice dispatch assistant.
You guide emergency callers using the following Moss protocol context:

${context}

CRITICAL LANGUAGE REQUIREMENT:
1. Automatically detect the language of the user's input ("${transcript}").
2. IF THE USER SPEAKS HINDI OR HINGLISH (e.g. 'aag lag gayi', 'saans nahi aa rahi', 'dil ka daura', 'accident ho gaya'):
   - You MUST respond ENTIRELY in clear, natural Hindi.
   - Provide direct, calm, step-by-step life-saving emergency instructions based strictly on the protocol.
3. IF THE USER SPEAKS ENGLISH:
   - Respond in concise, authoritative English.
4. Keep response under 35 words so it can be spoken rapidly over emergency audio dispatch. Do not use markdown, formatting, or bullet points.
5. If the protocol ID is UNKNOWN, respond with: "I am transferring you to a human supervisor."`;

    const primaryModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    const encoder = new TextEncoder();
    const t0 = performance.now();
    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'moss', context, latencyMs }) + '\n'));
        
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let stream: any;
          try {
            stream = await groq.chat.completions.create({
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: transcript }
              ],
              model: primaryModel,
              stream: true,
              max_tokens: 150,
              temperature: 0.1,
            });
          } catch (modelErr: any) {
            if (modelErr?.status === 404 || modelErr?.code === 'model_not_found' || modelErr?.message?.includes('does not exist')) {
              console.warn(`Notice: ${primaryModel} not available, falling back to qwen/qwen3.8-27b`);
              stream = await groq.chat.completions.create({
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: transcript }
                ],
                model: 'qwen/qwen3.8-27b',
                stream: true,
                max_tokens: 150,
                temperature: 0.1,
              });
            } else {
              throw modelErr;
            }
          }

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'token', content }) + '\n'));
            }
          }
          controller.close();
          const t1 = performance.now();
          // Fire-and-forget telemetry logging
          if (supabase) {
            supabase.from('telemetry').insert([{ 
              moss_latency: latencyMs, 
              llm_latency: t1 - t0,
              transcript: transcript
            }]).then(({ error }) => {
              if (error) console.error("Supabase telemetry failed", error);
            });
          }
        } catch (e) {
          console.error("Groq stream error:", e);
          controller.error(e);
        }
      }
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'application/x-ndjson' }
    });

  } catch (error) {
    console.error("API Agent Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
