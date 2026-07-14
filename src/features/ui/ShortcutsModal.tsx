import React, { useRef } from "react";
import * as Icons from "lucide-react";
import { useModalFocus } from "../../shared/hooks/useModalFocus";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  useModalFocus({ isOpen, containerRef: contentRef, onClose });

  if (!isOpen) return null;

  const shortcuts = [
    { key: "Space", desc: "Pause / Play Animation" },
    { key: "R", desc: "Smart Randomize Parameters" },
    { key: "Ctrl + Z", desc: "Undo" },
    { key: "Ctrl + Y", desc: "Redo" },
    { key: "H", desc: "Toggle Panels (Hide UI)" },
    { key: "Drag & Drop", desc: "Import Preset (.json) or Texture (.png/.jpg)" },
    { key: "Double Click Slider", desc: "Reset Value to Default" },
    { key: "Click Value Input", desc: "Type Precise Number" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close keyboard shortcuts"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm motion-reduce:backdrop-blur-none"
      />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
        tabIndex={-1}
        className="relative z-10 bg-[#0D0D0D] border border-border w-full max-w-md max-h-[calc(100dvh-2rem)] rounded-xl shadow-2xl flex flex-col overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
      >
        <div className="flex items-center justify-between p-5 border-b border-border bg-[#151515]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Icons.Keyboard size={18} />
            </div>
            <h2
              id="shortcuts-modal-title"
              className="text-sm font-black text-gray-100 uppercase tracking-widest"
            >
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close keyboard shortcuts"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
          >
            <Icons.X size={18} />
          </button>
        </div>
        <div className="p-2 overflow-y-auto custom-scrollbar">
          <div className="grid divide-y divide-white/5">
            {shortcuts.map((s, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-3 hover:bg-white/5 transition-colors rounded-lg group"
              >
                <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">
                  {s.desc}
                </span>
                <span className="text-[10px] font-mono font-bold bg-white/10 text-accent-primary px-2 py-1 rounded border border-white/5 min-w-[30px] text-center">
                  {s.key}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-black/30 border-t border-border text-[10px] text-gray-500 text-center">
          EffectTextureGen v3.5 &bull; Professional Edition
        </div>
      </div>
    </div>
  );
};
