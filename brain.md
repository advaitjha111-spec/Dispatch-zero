# DISPATCHZERO: IMMUTABLE ARCHITECTURE & EXECUTION BOUNDARIES (BRAIN)

## ⚠️ DIRECTIVE TO AI AGENT (ANTIGRAVITY / CLAUDE / CURSOR)
You are the Lead Architect for this project. You must strictly adhere to the technical boundaries defined in this document. Do not suggest alternative tech stacks. Do not hallucinate bloated state management. Your primary and only objective is to build a real-time voice pipeline that achieves sub-600ms total round-trip latency using Moss for semantic search.

## 0. PRE-FLIGHT INITIALIZATION (CRITICAL FIRST STEPS)
Before writing any application code, you must execute the following sequence:
1.  **Generate `.gitignore`:** Immediately create a `.gitignore` file in the root directory. It must explicitly ignore `.env`, `.env.local`, `node_modules/`, and `.next/` to ensure the user's API keys are never exposed. 
2.  **Install Dependencies:** Scaffold the Next.js project and install the exact dependencies required: `livekit-client`, `@livekit/components-react`, `@deepgram/sdk`, `framer-motion`, `@supabase/supabase-js`, and the Moss SDK (`@moss-dev/moss` or `moss` in Python/Node depending on your backend choice).
3.  **Confirm Readiness:** Output a terminal log confirming the `.gitignore` is active and dependencies are installed before proceeding to the Golden Pipeline.

## 1. THE MANDATORY TECH STACK
You must exclusively use the following providers. No exceptions.
*   **Audio Transport & Orchestration:** LiveKit (WebRTC) and the LiveKit Agents Framework. 
*   **VAD (Voice Activity Detection):** Silero VAD (via LiveKit) to handle turn-taking. 
*   **STT (Speech-to-Text):** Deepgram Nova-2 (Streaming). 
*   **Retrieval Layer:** Moss SDK. **CRITICAL RULE:** Do NOT use traditional vector databases (Pinecone, Milvus). You must use Moss for sub-10ms local semantic search.
*   **LLM (Brain):** Groq API (Llama-3-8B). Must stream tokens. 
*   **TTS (Text-to-Speech):** Cartesia (Streaming). 

## 2. THE GOLDEN PIPELINE (DATA FLOW)
The system must follow this exact sequential pipeline architecture:
1.  **VAD Trigger:** User speaks -> Silero VAD detects speech -> Audio sent via LiveKit.
2.  **Streaming STT:** Deepgram converts audio stream to text -> Emits final transcript.
3.  **Moss Intercept (The Moat):** The transcript string is passed to the Moss SDK -> Moss queries local emergency `.txt`/`.md` files -> Returns context block in under 10ms.
4.  **Prompt Assembly:** System prompt + Moss Context + User Transcript = Final Prompt.
5.  **Streaming LLM:** Groq processes the prompt -> Streams output tokens.
6.  **Streaming TTS:** Tokens hit Cartesia -> Audio chunks synthesized -> Streamed back to client via LiveKit WebRTC.

## 3. STRICT ANTI-HALLUCINATION & SCOPE RULES
*   **No Heavy Frontend State:** Do NOT use Redux, MobX, or Zustand. Use standard React Context or local state for the UI.
*   **Interruption Handling:** When the user speaks while the agent is talking, the VAD must fire an interruption event, immediately cancel the active TTS playback, and trigger a new STT pass.
*   **Database Restriction:** The only database permitted is a Supabase PostgreSQL instance strictly used for logging event timestamps and latency metrics for the UI dashboard. Do not use it for user auth or vector storage. 

## 4. FAILURE CONDITIONS
If your proposed architecture or generated code violates any of the following, the build is considered a failure:
*   Total time from the user stopping speech to the first byte of agent audio exceeds 1,000ms.
*   The system relies on cloud-based vector indexing instead of local Moss indexing.
*   The LLM waits for the entire response to generate before passing text to the TTS engine.

Acknowledge these constraints before generating any code.