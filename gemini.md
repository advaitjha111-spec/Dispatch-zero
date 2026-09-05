# DISPATCHZERO: IMMUTABLE DESIGN & UI/UX PROTOCOLS (GEMINI)

## ⚠️ DIRECTIVE TO AI AGENT (ANTIGRAVITY / CLAUDE / CURSOR)
You are the Lead UI/UX Designer and Frontend Architect for this project. You must strictly adhere to the visual and structural boundaries defined in this document. A voice agent is fundamentally a latency budget, and the UI must project absolute zero-latency performance. Your objective is to build a high-contrast, tactical dashboard that visually proves the sub-600ms system speed to the judges using high-performance animation libraries.

## 1. THE MANDATORY DESIGN SYSTEM & STYLING STACK
You must exclusively use the following styling and animation tools. No exceptions.
*   **CSS Framework:** Tailwind CSS. Do not write vanilla CSS files or use heavy component libraries like Material-UI.
*   **Animation Engine (`motion.dev`):** Use Framer Motion (`framer-motion`) for all state transitions, layout changes, and UI micro-interactions.
*   **Specialized Components (`reactbits`):** Utilize React Bits for high-polish, lightweight UI interactions. Specifically, implement a tactical cursor effect (e.g., `Target Cursor` or `Glow Cursor`) and use their animated text/feature components for highlighting the Moss retrieval latency.
*   **Typography:** Google Fonts. `JetBrains Mono` or `Roboto Mono` MUST be used for all latency metrics and changing numbers. `Inter` or `San Francisco` MUST be used for the core protocol text.

## 2. THE TACTICAL LAYOUT (CSS GRID)
The UI must be built as a single, rigid, non-scrollable dashboard using CSS Grid. No routing, no multiple pages.
1.  **Left Pane (The Feed):** A streaming text container that displays the Deepgram STT output as the user speaks. Must auto-scroll to the bottom.
2.  **Center Pane (The Protocol):** The primary focal point. This is where the Moss-retrieved data is injected. Text must be highly legible and cleanly formatted.
3.  **Right Pane (The Flex / Latency Profiler):** The most critical hackathon visual. A vertical stack of live metrics tracking:
    *   STT Latency (ms)
    *   **Moss Retrieval Time (<10ms) [CRITICAL - Highlight in Cyan using React Bits text animation]**
    *   LLM Inference Time (ms)
    *   Total Round-Trip Latency (ms)

## 3. STRICT COLOR & ANIMATION BOUNDARIES
*   **Color Palette (Dark Mode Only):** Background must be Deep Obsidian (`#0A0A0A`) to True Black (`#000000`). Text must be off-white (`#EDEDED`). Accent colors are restricted to Neon Cyan (`#00F0FF`) for Moss metrics, Pulse Red (`#FF3B30`) for live recording, and Emerald Green (`#00FF66`) for system active status.
*   **Motion.dev Curves (Snappy, Not Floaty):** Do not use floaty spring physics. Use strict, snappy easing for all `motion` components: `ease: [0.16, 1, 0.3, 1]`, duration `<0.2s`. Data injection into the UI must "snap" into place immediately.
*   **Audio Visualizer:** Implement a React Bits animated component or a custom `motion.dev` canvas element that reacts to the microphone's decibel level.

## 4. STRICT ANTI-BLOAT & SCOPE RULES
*   **No Extraneous Screens:** Do not build login pages, settings modals, user profiles, or hamburger menus. 
*   **No Complex State for UI:** Rely entirely on React state for the visualizer and latency numbers. Do not spin up a Redux store.
*   **No Hydration Mismatches:** Ensure Next.js components rendering dynamic latency data or `motion` elements are marked properly (`"use client"`).

## 5. FAILURE CONDITIONS
If your proposed frontend architecture or generated UI code violates any of the following, the build is considered a failure:
*   The UI includes a "Light Mode" toggle.
*   The Latency Profiler numbers shift layout horizontally when changing from 2 digits to 3 digits (you must use a monospace font and `motion` layout properties).
*   Generic CSS animations are used instead of `motion.dev` or `reactbits`.