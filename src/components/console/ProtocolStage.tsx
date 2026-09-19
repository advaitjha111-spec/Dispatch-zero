"use client";

export interface ProtocolData {
  id: string;
  category: string;
  scenario: string;
  hazard?: string;
  steps: {
    number: string;
    verb: string;
    instruction: string;
  }[];
}

interface ProtocolStageProps {
  protocol: ProtocolData;
  activeStepIndex?: number;
}

export default function ProtocolStage({
  protocol,
  activeStepIndex = 0,
}: ProtocolStageProps) {
  return (
    <div className="bg-[#081224] p-5 sm:p-7 rounded-[20px] border border-[rgba(124,165,216,0.14)] flex flex-col justify-between h-full shadow-xl">
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-3 py-1 rounded-full bg-[#071321] text-[#38c8ff] border border-[#38c8ff]/30 font-bold tracking-wider">
              {protocol.id}
            </span>
            <span className="font-mono text-[11px] text-[#8fa2b8] tracking-wider uppercase font-semibold">
              {protocol.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 rounded-full bg-[#040914] text-[#ff765e] border border-[#ff765e]/30 uppercase font-semibold">
              DEMO CONTENT
            </span>
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-[#42E0B2]/15 text-[#42E0B2] border border-[#42E0B2]/30 font-semibold">
              MOSS LOCAL MATCH
            </span>
          </div>
        </div>

        {/* Scenario Headline */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F4F2EA] tracking-tight mb-4">
          {protocol.scenario}
        </h2>

        {/* Coral Hazard Banner if present */}
        {protocol.hazard && (
          <div className="p-3.5 rounded-[12px] bg-[#ff765e]/15 border border-[#ff765e]/30 mb-5 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff765e] shrink-0" aria-hidden="true" />
            <span className="font-mono text-xs font-bold text-[#ff765e] tracking-wider">
              CRITICAL HAZARD: {protocol.hazard}
            </span>
          </div>
        )}

        {/* Three Sequential Action Cards */}
        <div className="space-y-3.5 mb-6">
          {protocol.steps.map((s, index) => {
            const isCurrent = index === activeStepIndex;

            return (
              <div
                key={s.number}
                className={`p-4 sm:p-5 rounded-[16px] transition-all duration-200 border ${
                  isCurrent
                    ? "bg-[#071321] border-[#38c8ff] shadow-[0_0_20px_rgba(56,200,255,0.15)]"
                    : "bg-[#071321]/50 border-[rgba(124,165,216,0.08)] opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Large Step Number */}
                  <span
                    className={`font-mono text-xl sm:text-2xl font-black tabular-nums ${
                      isCurrent ? "text-[#38c8ff]" : "text-[#93A9C0]"
                    }`}
                  >
                    {s.number}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Action Verb */}
                    <div
                      className={`text-xs font-mono font-bold tracking-widest uppercase mb-1 ${
                        isCurrent ? "text-[#42E0B2]" : "text-[#8fa2b8]"
                      }`}
                    >
                      {s.verb}
                    </div>
                    {/* Concise Instruction */}
                    <p className="text-sm sm:text-base font-semibold text-[#F4F2EA] leading-snug">
                      {s.instruction}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Safety Notice Footer */}
      <div className="pt-4 border-t border-[rgba(124,165,216,0.12)] text-[11px] text-[#8fa2b8] leading-relaxed">
        DEMO CONTENT — Follow certified emergency dispatch procedures and local authority guidance.
      </div>
    </div>
  );
}
