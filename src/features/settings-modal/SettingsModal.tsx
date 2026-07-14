import React, { useRef } from "react";
import * as Icons from "lucide-react";
import { AppState } from "../../core/types/types";
import { useModalFocus } from "../../shared/hooks/useModalFocus";
import { Label, Toggle } from "../../shared/ui/Elements";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  updateState: (s: Partial<AppState>) => void;
  updateSettings: (s: Partial<AppState["settings"]>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  state,
  updateState,
  updateSettings,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  useModalFocus({ isOpen, containerRef: contentRef, onClose });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm motion-reduce:backdrop-blur-none"
      />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        tabIndex={-1}
        className="relative z-10 bg-[#0D0D0D] border border-border w-full max-w-lg max-h-[calc(100dvh-2rem)] rounded-xl shadow-2xl flex flex-col overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-[#151515]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <Icons.Settings2 size={18} />
            </div>
            <div>
              <h2
                id="settings-modal-title"
                className="text-sm font-black text-gray-100 uppercase tracking-widest"
              >
                Global Settings
              </h2>
              <p className="text-[10px] text-gray-500">Performance, Export & Quality</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
          >
            <Icons.X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {/* Performance Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2 text-accent-primary">
              <Icons.Cpu size={14} />
              <span className="text-xs font-bold uppercase tracking-wide">
                Renderer Performance
              </span>
            </div>
            <div className="p-4 bg-black/30 rounded-lg border border-white/5 space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <Label label="Resolution" description="Size of the generated texture." />
                  <span className="text-[10px] font-mono text-gray-400">{state.resolution}px</span>
                </div>
                <div role="group" aria-label="Texture resolution" className="flex gap-2 mb-2">
                  {[256, 512, 1024, 2048, 4096].map((res) => (
                    <button
                      type="button"
                      aria-pressed={state.resolution === res}
                      key={res}
                      onClick={() => updateState({ resolution: res })}
                      className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${state.resolution === res ? "bg-accent-primary text-black shadow-lg" : "bg-surface border border-white/10 text-gray-400 hover:bg-white/5"}`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
                {state.resolution > 2048 && (
                  <p className="text-[10px] text-yellow-500 flex items-center gap-1 mt-1">
                    <Icons.AlertTriangle size={10} /> High memory usage. May crash on mobile.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-white/5">
                <Label
                  label="Pixel Ratio (DPR)"
                  description="Screen pixel density. Native = Sharpest."
                />
                <div role="group" aria-label="Renderer pixel ratio" className="flex gap-2 mb-2">
                  {[0, 1, 1.5, 2].map((dpr) => (
                    <button
                      type="button"
                      aria-pressed={state.settings.renderDpr === dpr}
                      key={dpr}
                      onClick={() => updateSettings({ renderDpr: dpr })}
                      className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${state.settings.renderDpr === dpr ? "bg-blue-500 text-white shadow-lg" : "bg-surface border border-white/10 text-gray-400 hover:bg-white/5"}`}
                    >
                      {dpr === 0 ? "Native" : `${dpr}x`}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500">
                  Controls visual sharpness. 'Native' uses your screen's full density (Retina/4K).
                </p>
              </div>

              <div className="pt-3 border-t border-white/5">
                <Toggle
                  label="Anti-Aliasing (MSAA)"
                  checked={state.settings.antialias}
                  onChange={(v) => updateSettings({ antialias: v })}
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Smoothes 3D geometry edges. Requires canvas reload.
                </p>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2 text-purple-400">
              <Icons.Download size={14} />
              <span className="text-xs font-bold uppercase tracking-wide">Export Defaults</span>
            </div>
            <div className="p-4 bg-black/30 rounded-lg border border-white/5 space-y-4">
              <div>
                <Label label="File Format" />
                <div
                  role="group"
                  aria-label="Default export format"
                  className="grid grid-cols-3 gap-2"
                >
                  {(["png", "jpeg", "webp"] as const).map((fmt) => (
                    <button
                      type="button"
                      aria-pressed={state.settings.exportFormat === fmt}
                      key={fmt}
                      onClick={() => updateSettings({ exportFormat: fmt })}
                      className={`py-1.5 rounded text-[10px] font-bold uppercase transition-all ${state.settings.exportFormat === fmt ? "bg-purple-500 text-white shadow-lg" : "bg-surface border border-white/10 text-gray-400 hover:bg-white/5"}`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-border bg-[#151515] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-white text-black font-bold text-xs uppercase rounded hover:bg-gray-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
