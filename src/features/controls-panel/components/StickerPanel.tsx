import React, { memo, useRef } from "react";
import * as Icons from "lucide-react";
import { AppState, BlendMode } from "../../../core/types/types";
import { ControlSection, Label, Slider, Toggle, ActionButton } from "../../../shared/ui/Elements";
import { ColorPicker } from "../../../shared/ui/ColorPicker";
import { ingestUserFile } from "../../../shared/utils/ingest";

interface StickerPanelProps {
  state: AppState;
  updateStateGroup: <K extends keyof AppState>(key: K, values: Partial<AppState[K]>) => void;
  onCommit: () => void;
  onToast?: (type: "success" | "error" | "info", message: string) => void;
}

const BLEND_MODES = [
  { label: "Normal", value: BlendMode.NORMAL },
  { label: "Add", value: BlendMode.ADD },
  { label: "Multiply", value: BlendMode.MULTIPLY },
  { label: "Screen", value: BlendMode.SCREEN },
  { label: "Overlay", value: BlendMode.OVERLAY },
  { label: "Soft Light", value: BlendMode.SOFT_LIGHT },
  { label: "Difference", value: BlendMode.DIFFERENCE },
];

export const StickerPanel: React.FC<StickerPanelProps> = memo(
  ({ state, updateStateGroup, onCommit, onToast }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const outcome = ingestUserFile(file, state, { target: "sticker" });
        if (outcome.ok && outcome.patch?.sticker) {
          updateStateGroup("sticker", outcome.patch.sticker);
          onCommit();
        }
        onToast?.(outcome.toast.type, outcome.toast.message);
      }
      e.target.value = "";
    };

    return (
      <ControlSection title="Sticker / Overlay" icon={Icons.Sticker} color="#10B981">
        <div className="space-y-4">
          <div className="flex gap-2 items-center bg-black/20 p-2 rounded border border-white/5">
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg"
              onChange={handleUpload}
              className="hidden"
              ref={fileInputRef}
            />
            <ActionButton onClick={() => fileInputRef.current?.click()}>
              <Icons.Upload size={12} />{" "}
              {state.sticker.texture ? "Replace Sticker" : "Upload Sticker"}
            </ActionButton>

            {state.sticker.texture && (
              <button
                type="button"
                aria-label="Replace sticker"
                className="w-8 h-8 rounded border border-gray-600 bg-gray-800 flex items-center justify-center overflow-hidden relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                title="Click to replace"
              >
                <img
                  src={state.sticker.texture}
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  alt="Sticker"
                />
              </button>
            )}
          </div>

          {state.sticker.texture && (
            <div className="space-y-3 animate-in fade-in">
              <Toggle
                label="Enable Sticker"
                checked={state.sticker.enabled}
                onChange={(v) => updateStateGroup("sticker", { enabled: v })}
                onCommit={onCommit}
              />

              {state.sticker.enabled && (
                <>
                  <div className="flex justify-between items-center">
                    <Toggle
                      label="Show Gizmo"
                      checked={state.sticker.gizmoVisible}
                      onChange={(v) => updateStateGroup("sticker", { gizmoVisible: v })}
                      onCommit={onCommit}
                    />
                    <button
                      onClick={() =>
                        updateStateGroup("sticker", { posX: 0, posY: 0, rotation: 0, scale: 0.5 })
                      }
                      className="text-[10px] text-gray-400 hover:text-white px-2 py-1 bg-white/5 rounded border border-white/10"
                      title="Reset Transform"
                    >
                      Center Reset
                    </button>
                  </div>

                  <div className="relative">
                    <Label label="Blend Mode" />
                    <div className="relative group">
                      <select
                        value={state.sticker.blendMode}
                        onChange={(e) =>
                          updateStateGroup("sticker", { blendMode: parseInt(e.target.value) })
                        }
                        className="w-full bg-surface border border-border text-gray-300 text-[10px] py-1.5 px-2 pr-6 rounded appearance-none focus:outline-none focus:border-accent-primary transition-colors cursor-pointer"
                      >
                        {BLEND_MODES.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <Icons.ChevronDown
                        size={12}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <Label label="Tint Color" />
                    <div className="flex items-center gap-2">
                      <Toggle
                        label=""
                        checked={state.sticker.useColor}
                        onChange={(v) => updateStateGroup("sticker", { useColor: v })}
                        onCommit={onCommit}
                      />
                      <div className="flex-1 opacity-100 disabled:opacity-50">
                        <ColorPicker
                          label=""
                          color={state.sticker.color}
                          onChange={(c) => updateStateGroup("sticker", { color: c })}
                          onCommit={onCommit}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <Label label="Transform (Or use Gizmo)" />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label label="Pos X" />
                        <Slider
                          min={-1}
                          max={1}
                          value={state.sticker.posX}
                          onChange={(v) => updateStateGroup("sticker", { posX: v })}
                          onCommit={onCommit}
                        />
                      </div>
                      <div>
                        <Label label="Pos Y" />
                        <Slider
                          min={-1}
                          max={1}
                          value={state.sticker.posY}
                          onChange={(v) => updateStateGroup("sticker", { posY: v })}
                          onCommit={onCommit}
                        />
                      </div>
                    </div>
                    <div>
                      <Label label="Scale" />
                      <Slider
                        min={0.1}
                        max={3.0}
                        step={0.01}
                        value={state.sticker.scale}
                        onChange={(v) => updateStateGroup("sticker", { scale: v })}
                        onCommit={onCommit}
                      />
                    </div>
                    <div>
                      <Label label="Rotation" />
                      <Slider
                        min={0}
                        max={360}
                        step={1}
                        value={state.sticker.rotation}
                        onChange={(v) => updateStateGroup("sticker", { rotation: v })}
                        onCommit={onCommit}
                      />
                    </div>
                  </div>

                  <div>
                    <Label label="Opacity" />
                    <Slider
                      min={0}
                      max={1}
                      value={state.sticker.opacity}
                      onChange={(v) => updateStateGroup("sticker", { opacity: v })}
                      onCommit={onCommit}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </ControlSection>
    );
  },
);
