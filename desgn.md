Markdown
# DESIGN SYSTEM & ARCHITECTURE SPECIFICATION: DISPATCHZERO

This document defines the complete technical, visual, motion, and architectural design specifications for the **DispatchZero** emergency dispatch interface. It covers design tokens, typography, component layouts, vertical-to-horizontal animation mechanics, and the mission-control dashboard.

---

## 1. Design Tokens & Visual Hierarchy

### 1.1 Color Palette
The interface uses a tactical dark theme with a high-contrast dark foundation and phosphorescent accents.

| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| `surface-ground` | `#060A0C` | Root canvas background, tactical void black. |
| `surface-panel` | `#0D1418` | Card backgrounds, tactical module containers. |
| `surface-elevated` | `#131D23` | Active inputs, selected protocol containers, hover states. |
| `border-subtle` | `#1B2B34` | Default 1px card and grid borders. |
| `border-active` | `#00F5FF` | 1px border on focused cards or active telemetry streams. |
| `accent-cyan` | `#00F5FF` | Primary action color, status beacons, sub-10ms Moss tags. |
| `accent-crimson` | `#FF334B` | Hazard warnings, manual override actions, critical RTT alerts. |
| `accent-emerald` | `#10B981` | Online state indicators, healthy network metrics. |
| `text-primary` | `#F1F5F9` | Headings, primary live transcript text, critical callouts. |
| `text-secondary` | `#94A3B8` | Protocol descriptions, secondary technical metadata. |
| `text-tertiary` | `#475569` | Protocol IDs, inactive labels, measurement units (`ms`). |

### 1.2 Typography Hierarchy
All typography relies on two typefaces: **Inter** (or **Geist Sans**) for narrative copy and **JetBrains Mono** for numerical values and technical displays.

* **Display 1 (Hero Title):** `Geist Sans`, 72px / 4.5rem, Font Weight 800, Line Height 1.05, Letter Spacing -0.04em.
* **Display 2 (Section Headers):** `Geist Sans`, 36px / 2.25rem, Font Weight 700, Line Height 1.15, Letter Spacing -0.02em.
* **Component Titles:** `JetBrains Mono`, 18px / 1.125rem, Font Weight 600, Line Height 1.3, Letter Spacing -0.01em.
* **Body Primary:** `Inter`, 15px / 0.9375rem, Font Weight 400, Line Height 1.5, Letter Spacing normal.
* **Data / Metrics Display:** `JetBrains Mono`, 24px / 1.5rem, Font Weight 700, Tabular Figures (`tnum`), Letter Spacing -0.03em.
* **Micro Labels:** `JetBrains Mono`, 11px / 0.6875rem, Font Weight 500, All Caps, Letter Spacing +0.08em.

---

## 2. Global Page Layout & Viewport Transitions

The user journey transitions seamlessly from the product landing page directly into the mission-control dashboard:

`Viewport 1: Tactical Hero` → `Viewport 2: Horizontal Protocol Showcase` → `Viewport 3: Edge Comparison` → `Viewport 4: Live Dispatch Console`

```text
+-------------------------------------------------------------+
| SECTION 1: TACTICAL HERO (100vh)                            |
| TopNav: Brand, System Status Beacon, Audio Simulator CTA     |
| Split Layout: Value Prop & Pitch + Embedded Telemetry Box    |
+-------------------------------------------------------------+
| SECTION 2: PROTOCOL ENGINE (Pin Height: 300vh, View: 100vh) |
| Scroll Jacking: Vertical page scroll moves cards horizontally|
| [Card 1: Hazmat]  [Card 2: CPR]  [Card 3: Fire]  [Card 4...] |
+-------------------------------------------------------------+
| SECTION 3: ARCHITECTURE COMPARISON (80vh)                   |
| Side-by-Side: Cloud Stack (2200ms) vs Edge Dispatch (836ms) |
+-------------------------------------------------------------+
| SECTION 4: PRODUCTION MISSION DASHBOARD (100vh)             |
| [Left 25%: STT Feed] [Center 50%: Protocol] [Right 25%: RTT]|
+-------------------------------------------------------------+
3. Landing Page Architecture
3.1 Hero Section
Height: Fixed 100vh, display: flex, vertical centering.

Background: Solid #060A0C with a radial gradient at 50% 0% (rgba(0, 245, 255, 0.05), 800px diameter).

Navigation Bar: Fixed height 56px, 1px solid #1B2B34 border bottom, sticky top blur (backdrop-filter: blur(12px)).

Left: ⚡ DISPATCHZERO monospace logo.

Center: Dynamic Badge: REGION: EDGE-AP-SOUTH // LATENCY: OPTIMAL.

Right: Launch Tactical Console action button.

Left Column: Headline emphasizing sub-second emergency response and verified protocol indexing. Includes dual call-to-action buttons: [ Connect Voice Socket ] and [ Review Protocol Set ].

Right Column: Floating glassmorphic terminal showing live telemetry tickers with glowing cyan accent borders.

3.2 Horizontal Protocol Slider
Container: position: relative, height 300vh.

Inner Viewport: position: sticky, top: 0, height 100vh, overflow: hidden.

Scroll-Linked Motion:

Framer Motion hook useScroll monitors vertical progression between 0 and 1.

The vertical scroll value maps via useTransform to a horizontal shift on the X-axis from 0% to -65%.

Wrapped in useSpring with parameters: stiffness: 300, damping: 40, mass: 0.2 to ensure smooth inertia across various scroll wheels.

Cards Structure:

Width: 42vw, Height: 520px, Flex shrink 0, Margins: gap-8.

Background: #0D1418, Border: 1px #1B2B34.

Card Header: Protocol classification tag (HAZMAT, TRAUMA, AIRWAY), DOT/EMS ID code.

Card Body: Scenario title, 3 sequential action steps with highlighted lead verbs.

Card Footer: Local Moss memory verification badge with live retrieval time indicator (< 10ms).

3.3 Comparative Architecture Section
Structured table highlighting latency, reliability, and network requirements.

Contrasts DispatchZero's local edge architecture against standard cloud-hosted vector search and multi-turn LLM pipelines.

4. Production Dashboard: Tactical Console
When scrolling into the dashboard or clicking Launch Console, the view transitions into a fixed, full-height command grid (h-screen, overflow: hidden).

4.1 Grid Geometry
The dashboard uses a strict 12-column grid layout with 1px border separations:

Column A: Live Stream & Input (Cols 1–3, 25% width)

Header: Audio Input status, incoming sampling rate (16kHz PCM), VAD activity waveform.

Transcript Container: Scrollable list with auto-scroll lock.

Message Format: Monospace timestamp, speaker role tag (CALLER / DISPATCH), and transcript payload.

Language Switcher: Automatic indicator showing detected input language (Hindi, Marathi, English) with on-the-fly translation tags.

Column B: Protocol Action Engine (Cols 4–9, 50% width)

Header: Current matched protocol ID with search score metrics.

Main Stage: Displays active procedural cards parsed from local memory.

Step Cards: Distinct step numbers (01, 02, 03) with high-contrast tactical guidance for immediate dispatch execution.

Hazard Flags: High-visibility indicators for chemical containment, PPE requirements, or immediate physical safety hazards.

Column C: Real-Time Telemetry & System Controls (Cols 10–12, 25% width)

Telemetry Metric Stack:

VAD + STT: Real-time Deepgram speech transcription latency.

MOSS RETRIEVAL: High-precision performance.now() measurement of local vector search.

LLM INFERENCE: Groq LPU response and token-generation speed.

CARTESIA TTS: Streamed audio generation latency.

TOTAL RTT: Combined round-trip time with color thresholds (Cyan for <900ms, Amber for 900–1200ms, Crimson for >1200ms).

Emergency Manual Controls: Emergency override trigger to escalate the automated channel directly to a human dispatcher.

5. Animation Physics & Implementation Logic
5.1 CSS & Framer Motion Definitions
TypeScript
// Shared motion physics configurations
export const tacticalSpring = {
  type: "spring",
  stiffness: 380,
  damping: 30,
  mass: 0.5
};

export const scrollPhysics = {
  stiffness: 400,
  damping: 90,
  mass: 0.1
};

// Keyframe transitions for glowing indicators
export const beaconPulse = {
  scale: [1, 1.08, 1],
  opacity: [0.8, 1, 0.8],
  transition: {
    duration: 1.8,
    repeat: Infinity,
    ease: "easeInOut"
  }
};
5.2 Micro-Interactions
Card Hover States: 1px border transition from #1B2B34 to #00F5FF over 150ms with ease-out curve.

Telemetry Value Change: When new telemetry metrics arrive, target numbers flash with an opacity: 0.4 to opacity: 1 transition over 100ms to emphasize live data updates.

Audio Waveform: 12-bar dynamic equalizer reflecting client audio volume via Web Audio API AnalyserNode, rendered on an HTML5 canvas.

6. Implementation Checklist & Production Integrity
Zero Simulated Clamps: All latency readouts derive strictly from actual execution offsets using the browser's high-precision performance.now() API.

Deterministic File Retrieval: The protocol view parses active scenarios directly from data/ems_protocols.txt via local semantic search without relying on external cloud vector databases.

Zero CSS Layout Shifts: All metric tags and card dimensions utilize fixed monospace tabular figures (font-variant-numeric: tabular-nums) and explicit pixel widths to prevent jitter during streaming updates.