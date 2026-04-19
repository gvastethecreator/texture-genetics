import React, { memo, useState, useRef, useEffect } from "react";
import * as Icons from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { AppState, AnimationConfig, PaletteColor } from "../../../core/types/types";
import { ControlSection, Label, Slider, ActionButton, Toggle } from "../../../shared/ui/Elements";
import { ColorPicker } from "../../../shared/ui/ColorPicker";

interface ColorPanelProps {
  state: AppState;
  onChangeParams: (p: Partial<AppState["params"]>) => void;
  updateStateGroup: <K extends keyof AppState>(key: K, values: Partial<AppState[K]>) => void;
  updateBalance: (
    key: keyof AppState["colorBalance"],
    val: number | object,
    channel?: "r" | "g" | "b",
  ) => void;
  onUpdateAnim?: (key: string, config: AnimationConfig) => void;
  onCommit: () => void;
  onRandom: () => void;
}

const PRESET_PALETTES = [
  { name: "Cyberpunk", colors: ["#2b213a", "#ff0055", "#00ffff", "#ffffff"] },
  { name: "Sunset", colors: ["#2d112a", "#530031", "#ff4e50", "#f9d423"] },
  { name: "Forest", colors: ["#051405", "#134e5e", "#71b280", "#cbf078"] },
  { name: "Deep Sea", colors: ["#000000", "#020024", "#090979", "#00d4ff"] },
  { name: "Magma", colors: ["#0f0000", "#330000", "#ff0000", "#ffcc00", "#ffffff"] },
  { name: "Vaporwave", colors: ["#240046", "#7b2cbf", "#ff006e", "#3a86ff", "#8338ec"] },
  { name: "Toxic", colors: ["#0d1f0d", "#1a4a1a", "#a8ff78", "#78ffd6"] },
  { name: "Cotton Candy", colors: ["#cdb4db", "#ffc8dd", "#ffafcc", "#bde0fe", "#a2d2ff"] },
  { name: "Matrix", colors: ["#000000", "#003300", "#008f11", "#00ff41", "#ccffcc"] },
  { name: "Blueprint", colors: ["#001133", "#002266", "#0044cc", "#4488ff", "#ffffff"] },
  { name: "Golden Hour", colors: ["#5e320f", "#8c4b18", "#d68c45", "#f4a261", "#e9c46a"] },
  { name: "Grayscale", colors: ["#000000", "#333333", "#666666", "#999999", "#cccccc", "#ffffff"] },
];

export const ColorPanel: React.FC<ColorPanelProps> = memo(
  ({
    state,
    onChangeParams,
    updateStateGroup,
    updateBalance,
    onCommit,
    onUpdateAnim,
    onRandom,
  }) => {
    const [activeTonePicker, setActiveTonePicker] = useState<keyof AppState["colorBalance"] | null>(
      null,
    );
    const pickerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const _update = onUpdateAnim || ((_k: string, _c: AnimationConfig) => {});

    // Fallback if palette doesn't exist yet (Legacy state)
    const palette = state.params.palette || [
      { color: state.params.color1 || "#ffffff", enabled: true },
      { color: state.params.color2 || "#000000", enabled: true },
      { color: "#888888", enabled: false },
      { color: "#888888", enabled: false },
      { color: "#888888", enabled: false },
      { color: "#888888", enabled: false },
      { color: "#888888", enabled: false },
      { color: "#888888", enabled: false },
    ];

    const updatePalette = (index: number, updates: Partial<PaletteColor>) => {
      const newPalette = [...palette];
      newPalette[index] = { ...newPalette[index], ...updates };
      onChangeParams({ palette: newPalette });
      // Don't commit on every keystroke/drag, let the child component handle commit if needed
    };

    const handlePaletteCommit = () => {
      onCommit();
    };

    const applyPresetPalette = (colors: string[]) => {
      const newPalette = palette.map((p, i) => {
        if (i < colors.length) {
          return { color: colors[i], enabled: true };
        }
        return { ...p, enabled: false };
      });
      onChangeParams({ palette: newPalette });
      onCommit();
    };

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
          setActiveTonePicker(null);
        }
      }
      if (activeTonePicker) document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activeTonePicker]);

    const handleMaskUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            updateStateGroup("imageAlpha", {
              maskTexture: event.target.result as string,
              maskEnabled: true,
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };

    const tones: Array<"shadows" | "midtones" | "highlights"> = [
      "shadows",
      "midtones",
      "highlights",
    ];

    return (
      <ControlSection title="Color Palette" icon={Icons.Palette} color="#F59E0B">
        {/* --- PALETTE EDITOR --- */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <Label label="Active Colors" />
            <div className="flex gap-2 items-center">
              <span className="text-[9px] text-gray-500 font-mono">
                {palette.filter((p) => p.enabled).length} Active
              </span>
              <button
                onClick={onRandom}
                className="text-[9px] text-gray-500 hover:text-white px-2 py-0.5 bg-white/5 rounded border border-white/10 transition-colors flex items-center gap-1"
                title="Random Palette"
              >
                <Icons.Dice5 size={10} /> Random
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-2">
            {palette.map((p, i) => (
              <div
                key={i}
                className={`relative group p-1 rounded border transition-all duration-200 ${p.enabled ? "bg-white/5 border-white/20" : "bg-black/20 border-white/5 opacity-60"}`}
              >
                <div className="mb-1">
                  <ColorPicker
                    label=""
                    color={p.color}
                    onChange={(c) => updatePalette(i, { color: c })}
                    onCommit={handlePaletteCommit}
                  />
                </div>
                <button
                  onClick={() => {
                    updatePalette(i, { enabled: !p.enabled });
                    handlePaletteCommit();
                  }}
                  className={`w-full h-4 flex items-center justify-center rounded text-[8px] font-bold uppercase tracking-wider transition-colors ${p.enabled ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-red-500/10 text-red-500 hover:bg-red-500/20"}`}
                >
                  {p.enabled ? "ON" : "OFF"}
                </button>

                {/* Index Badge */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#111] border border-[#333] rounded-full flex items-center justify-center text-[7px] text-gray-500 pointer-events-none">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Gradient Preview Bar */}
          <div className="h-3 w-full rounded border border-white/10 mt-2 overflow-hidden relative">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, ${palette
                  .filter((p) => p.enabled)
                  .map((p) => p.color)
                  .join(", ")})`,
              }}
            />
            {palette.filter((p) => p.enabled).length < 2 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[8px] text-red-400 font-mono">
                Need 2+ Colors
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 pt-2 border-t border-white/5">
          <Label label="Quick Presets" />
          <div className="grid grid-cols-4 gap-1.5 mt-1">
            {PRESET_PALETTES.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPresetPalette(p.colors)}
                className="h-6 w-full rounded overflow-hidden relative group shadow-sm border border-white/5 hover:border-white/20 transition-all active:scale-95"
                title={`Apply ${p.name}`}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(to right, ${p.colors.join(", ")})` }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-white/5 mb-4">
          <div>
            <Label label="Hue Shift" />
            <Slider
              min={-0.5}
              max={0.5}
              step={0.01}
              value={state.colorBalance.hue}
              onChange={(v) => updateBalance("hue", v)}
              onCommit={onCommit}
              animConfig={state.paramAnimations["colorBalance.hue"]}
              onAnimChange={(c) => _update("colorBalance.hue", c)}
            />
          </div>
          <div>
            <Label label="Saturation" />
            <Slider
              min={-1}
              max={1}
              step={0.01}
              value={state.colorBalance.saturation}
              onChange={(v) => updateBalance("saturation", v)}
              onCommit={onCommit}
              animConfig={state.paramAnimations["colorBalance.saturation"]}
              onAnimChange={(c) => _update("colorBalance.saturation", c)}
            />
          </div>
          <div>
            <Label label="Brightness" />
            <Slider
              min={-1}
              max={1}
              step={0.01}
              value={state.colorBalance.brightness}
              onChange={(v) => updateBalance("brightness", v)}
              onCommit={onCommit}
              animConfig={state.paramAnimations["colorBalance.brightness"]}
              onAnimChange={(c) => _update("colorBalance.brightness", c)}
            />
          </div>
          <div>
            <Label label="Contrast" />
            <Slider
              min={-1}
              max={2}
              step={0.01}
              value={state.colorBalance.contrast}
              onChange={(v) => updateBalance("contrast", v)}
              onCommit={onCommit}
              animConfig={state.paramAnimations["colorBalance.contrast"]}
              onAnimChange={(c) => _update("colorBalance.contrast", c)}
            />
          </div>
          <div>
            <Label label="Cycle Speed" />
            <Slider
              min={0}
              max={2.0}
              step={0.1}
              value={state.colorBalance.cycleSpeed}
              onChange={(v) => updateBalance("cycleSpeed", v)}
              onCommit={onCommit}
              animConfig={state.paramAnimations["colorBalance.cycleSpeed"]}
              onAnimChange={(c) => _update("colorBalance.cycleSpeed", c)}
            />
          </div>
        </div>

        <div className="space-y-4 pt-3 border-t border-white/5">
          {tones.map((tone) => {
            const currentVal = state.colorBalance[tone] as { r: number; g: number; b: number };
            const r = Math.round((currentVal.r + 0.5) * 255);
            const g = Math.round((currentVal.g + 0.5) * 255);
            const b = Math.round((currentVal.b + 0.5) * 255);
            const isNeutral = currentVal.r === 0 && currentVal.g === 0 && currentVal.b === 0;

            return (
              <div key={tone}>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">
                    {tone} Tint
                  </div>
                  <div className="flex gap-2">
                    {!isNeutral && (
                      <button
                        onClick={() => {
                          updateBalance(tone, { r: 0, g: 0, b: 0 });
                          onCommit();
                        }}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="Reset to Neutral"
                      >
                        <Icons.RotateCcw size={10} />
                      </button>
                    )}
                    <div className="relative">
                      <button
                        onClick={() => setActiveTonePicker(activeTonePicker === tone ? null : tone)}
                        className="w-20 h-6 rounded border border-border shadow-sm flex items-center justify-center gap-2 hover:border-gray-500 transition-colors"
                        style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                        title={`Edit ${tone} color`}
                      >
                        <span className="text-[9px] font-mono mix-blend-difference text-white">
                          {isNeutral ? "NEUTRAL" : `RGB(${r},${g},${b})`}
                        </span>
                      </button>
                      {activeTonePicker === tone && (
                        <div className="absolute right-0 bottom-full mb-2 z-50" ref={pickerRef}>
                          <HexColorPicker
                            color={`#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`}
                            onChange={(hex) => {
                              const pr = parseInt(hex.slice(1, 3), 16);
                              const pg = parseInt(hex.slice(3, 5), 16);
                              const pb = parseInt(hex.slice(5, 7), 16);
                              updateBalance(tone, {
                                r: pr / 255 - 0.5,
                                g: pg / 255 - 0.5,
                                b: pb / 255 - 0.5,
                              });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-white/5 mt-2">
          <Label label="Custom Mask (Texture)" />
          <div className="flex gap-2 items-center">
            <input
              type="file"
              accept=".svg,.png,.jpg"
              onChange={handleMaskUpload}
              className="hidden"
              ref={fileInputRef}
            />
            <ActionButton onClick={() => fileInputRef.current?.click()}>
              <Icons.Upload size={12} /> {state.imageAlpha.maskTexture ? "Replace" : "Upload"}
            </ActionButton>
            {state.imageAlpha.maskTexture && (
              <div
                className="w-8 h-8 rounded border border-gray-600 bg-gray-800 flex items-center justify-center overflow-hidden relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <img
                  src={state.imageAlpha.maskTexture}
                  className="w-full h-full object-contain"
                  alt="Mask"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
          {state.imageAlpha.maskTexture && (
            <div className="mt-2">
              <Toggle
                label="Enable Custom Mask"
                checked={state.imageAlpha.maskEnabled}
                onChange={(v) => updateStateGroup("imageAlpha", { maskEnabled: v })}
                onCommit={onCommit}
              />
            </div>
          )}
        </div>
      </ControlSection>
    );
  },
);
