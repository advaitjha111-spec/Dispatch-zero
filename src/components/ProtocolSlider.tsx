"use client";

import { Zap, ShieldAlert, HeartPulse, Flame } from "lucide-react";
import CardSwap, { Card } from "./CardSwap";

const PROTOCOLS = [
  {
    tag: "HAZMAT",
    id: "DOT-ERG-119",
    icon: ShieldAlert,
    title: "Anhydrous Ammonia Leak",
    steps: [
      { verb: "ISOLATE", text: "spill or leak area immediately for at least 100 meters in all directions." },
      { verb: "EVACUATE", text: "downwind area up to 0.8 km (1/2 mile) during the day." },
      { verb: "PROTECT", text: "responders with positive pressure self-contained breathing apparatus (SCBA)." }
    ]
  },
  {
    tag: "TRAUMA",
    id: "EMS-BLS-04",
    icon: HeartPulse,
    title: "Cardiac Arrest / CPR",
    steps: [
      { verb: "ASSESS", text: "responsiveness and absence of normal breathing." },
      { verb: "COMPRESS", text: "chest at a rate of 100-120 per minute, depth of at least 2 inches." },
      { verb: "DEFIBRILLATE", text: "apply AED immediately as soon as it becomes available." }
    ]
  },
  {
    tag: "FIRE",
    id: "NFPA-SOP-21",
    icon: Flame,
    title: "Structural Collapse Risk",
    steps: [
      { verb: "ESTABLISH", text: "collapse zone equal to 1.5 times the height of the structure." },
      { verb: "WITHDRAW", text: "all interior operating units via emergency traffic signal." },
      { verb: "TRANSITION", text: "to exterior defensive operations and utilize master streams." }
    ]
  },
  {
    tag: "HAZMAT",
    id: "DOT-ERG-128",
    icon: ShieldAlert,
    title: "Flammable Liquid Spill",
    steps: [
      { verb: "ELIMINATE", text: "all ignition sources (no smoking, flares, sparks, or flames)." },
      { verb: "CONTAIN", text: "spill using dirt, sand, or other non-combustible material." },
      { verb: "SUPPRESS", text: "vapors using specialized foam if available." }
    ]
  }
];

export default function ProtocolSlider() {
  return (
    <section className="relative h-[800px] w-full overflow-hidden flex items-center">

      <div className="flex w-full max-w-7xl mx-auto px-12 z-10 items-center justify-between">
        
        {/* Left Text */}
        <div className="w-1/3">
          <h2 className="text-[2.25rem] font-[700] leading-[1.15] tracking-[-0.02em] text-text-primary" style={{ fontFamily: "var(--font-sans)" }}>
            Protocol Engine
          </h2>
          <p className="text-text-secondary font-mono text-sm mt-4">
            LOCAL VECTOR SEARCH<br />
            <span className="text-accent-cyan">{"//"} PARSING: data/ems_protocols.txt</span>
          </p>
          <p className="text-text-secondary mt-8 leading-relaxed">
            Our embedded protocol engine instantly indexes critical operating procedures the moment a call begins, presenting actionable steps to dispatchers faster than any human could search a database.
          </p>
        </div>

        {/* Right 3D Stack */}
        <div className="w-1/2 h-[600px] relative">
          <CardSwap
            width={600}
            height={520}
            cardDistance={80}
            verticalDistance={30}
            delay={4000}
            pauseOnHover={true}
          >
            {PROTOCOLS.map((protocol, index) => (
              <Card key={index} className="bg-surface-panel/80 backdrop-blur-xl border border-border-subtle hover:border-accent-cyan transition-colors duration-150 ease-out flex flex-col p-8 font-sans rounded-3xl shadow-2xl">
                {/* Card Header */}
                <div className="flex justify-between items-center border-b border-border-subtle pb-6 mb-6">
                  <div className="flex items-center gap-3">
                    <protocol.icon className="w-5 h-5 text-accent-cyan" />
                    <span className="font-mono text-xs font-semibold tracking-widest uppercase text-text-primary">{protocol.tag}</span>
                  </div>
                  <span className="font-mono text-xs text-text-tertiary">{protocol.id}</span>
                </div>

                {/* Card Body */}
                <div className="flex-1">
                  <h3 className="font-mono text-[1.125rem] font-[600] leading-[1.3] tracking-[-0.01em] text-text-primary mb-6">
                    {protocol.title}
                  </h3>
                  
                  <div className="flex flex-col gap-5">
                    {protocol.steps.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="font-mono text-xs text-text-tertiary pt-1">0{i + 1}</span>
                        <p className="text-[15px] leading-relaxed text-text-secondary">
                          <span className="font-semibold text-text-primary uppercase mr-2">{step.verb}</span>{" "}
                          {step.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-6 pt-6 border-t border-border-subtle flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent-cyan" />
                    <span className="font-mono text-xs uppercase text-text-secondary tracking-widest">Local Moss Memory</span>
                  </div>
                  <span className="font-mono text-xs bg-accent-cyan/10 text-accent-cyan px-2 py-1 rounded-md border border-accent-cyan/30">
                    &lt; 10ms
                  </span>
                </div>
              </Card>
            ))}
          </CardSwap>
        </div>

      </div>
    </section>
  );
}
