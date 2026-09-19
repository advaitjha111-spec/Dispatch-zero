"use client";

import { useEffect } from "react";

interface ManualOverrideModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ManualOverrideModal({
  isOpen,
  onConfirm,
  onCancel,
}: ManualOverrideModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="override-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#081224] border border-[#ff765e]/40 max-w-md w-full p-6 sm:p-8 rounded-[20px] shadow-2xl relative"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3.5 h-3.5 rounded-full bg-[#ff765e] node-pulse-coral shrink-0" aria-hidden="true" />
          <h3
            id="override-modal-title"
            className="text-xl font-bold text-[#F4F2EA] tracking-tight"
          >
            Seize manual control?
          </h3>
        </div>

        <p className="text-sm text-[#8fa2b8] leading-relaxed mb-5">
          AI directives will immediately pause, automated voice synthesis will be halted, and this manual intervention incident will be written to the local audit log.
        </p>

        {/* Local Incident Record Block */}
        <div className="p-4 rounded-[12px] bg-[#071321] border border-[rgba(124,165,216,0.12)] mb-6 text-xs font-mono space-y-1.5">
          <div className="text-[#8fa2b8] font-bold">{"// LOCAL INCIDENT RECORD"}</div>
          <div className="text-[#F4F2EA]">ACTION: MANUAL_OVERRIDE_TRIGGERED</div>
          <div className="text-[#42E0B2]">CHANNEL: PATCH_TO_SUPERVISOR_01</div>
          <div className="text-[#93A9C0] text-[10px]">LOG_FILE: memory://local/audit_session_01</div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-[12px] bg-[#071321] border border-[rgba(124,165,216,0.18)] text-[#F4F2EA] text-xs font-mono font-semibold hover:bg-[#0d1e3a] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#38c8ff]"
          >
            CANCEL / MAINTAIN AI
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-[12px] bg-[#ff765e] text-[#071321] text-xs font-mono font-bold hover:bg-[#ff8974] transition-all cursor-pointer shadow-[0_0_20px_rgba(255,118,94,0.35)] focus-visible:ring-2 focus-visible:ring-[#ff765e]"
          >
            CONFIRM SEIZURE
          </button>
        </div>
      </div>
    </div>
  );
}
