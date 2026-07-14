import React, { memo, useRef } from "react";
import * as Icons from "lucide-react";
import {
  AppState,
  BlendMode,
  TextureType,
  BaseEffectType,
  AnimationConfig,
} from "../../../core/types/types";
import { TEXTURE_CATEGORIES } from "../../../data/textureData";
import { ControlSection, Label, Slider, Toggle, ActionButton } from "../../../shared/ui/Elements";
import { loadImageFromSource, readFileAsDataUrl } from "../../../shared/utils/fileLoaders";

interface LayersPanelProps {
  state: AppState;
  updateStateGroup: <K extends keyof AppState>(key: K, values: Partial<AppState[K]>) => void;
  onCommit: () => void;
  onUpdateAnim?: (key: string, config: AnimationConfig) => void;
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

const BASE_EFFECTS = [
  { label: "None", value: BaseEffectType.NONE },
  { label: "Displacement", value: BaseEffectType.DISPLACEMENT },
  { label: "Pixel Sort", value: BaseEffectType.PIXEL_SORT },
  { label: "Datamosh", value: BaseEffectType.DATAMOSH },
  { label: "Ripple", value: BaseEffectType.RIPPLE },
  { label: "Chromatic", value: BaseEffectType.CHROMATIC },
];

// ELITE FIX: Image Compression Pipeline
// Prevents App Crash due to LocalStorage Quota Exceeded while maintaining PRO quality.
const processImageUpload = async (file: File): Promise<string> => {
  const img = await loadImageFromSource(await readFileAsDataUrl(file));
  const canvas = document.createElement("canvas");
  // 1024px keeps source images usable for texture work while staying friendly to local persistence.
  const MAX_SIZE = 1024;
  let width = img.width;
  let height = img.height;

  if (width > height) {
    if (width > MAX_SIZE) {
      height *= MAX_SIZE / width;
      width = MAX_SIZE;
    }
  } else {
    if (height > MAX_SIZE) {
      width *= MAX_SIZE / height;
      height = MAX_SIZE;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas 2D context is not available for image upload.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.85);
};

export const LayersPanel: React.FC<LayersPanelProps> = memo(
  ({ state, updateStateGroup, onCommit, onUpdateAnim }) => {
    const allTextures = Object.values(TEXTURE_CATEGORIES)
      .flatMap((c) => c.types)
      .toSorted();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const updateAnimation = onUpdateAnim ?? (() => {});

    const handleBaseTextureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const resizedDataUrl = await processImageUpload(file);
          // Initialize with enabled: true and safe blended defaults
          updateStateGroup("baseTexture", {
            texture: resizedDataUrl,
            enabled: true,
            opacity: 0.8,
            blendMode: BlendMode.MULTIPLY,
          });
          onCommit();
        } catch (error) {
          console.error("Failed to load base texture", error);
        }
      }
    };

    return (
      <ControlSection title="Layer 2 & Blending" icon={Icons.Layers} color="#F59E0B">
        <div className="space-y-4">
          {/* --- Base Texture Section --- */}
          <div className="space-y-2 bg-black/20 p-2 rounded border border-white/5">
            <div className="flex items-center gap-2 mb-1 text-gray-400">
              <Icons.ImagePlus size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Base Image / Backplate
              </span>
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleBaseTextureUpload}
                className="hidden"
                ref={fileInputRef}
              />
              <ActionButton onClick={() => fileInputRef.current?.click()}>
                <Icons.Upload size={12} />{" "}
                {state.baseTexture?.texture ? "Replace Image" : "Upload Image"}
              </ActionButton>

              {state.baseTexture?.texture && (
                <button
                  type="button"
                  aria-label="Replace base image"
                  className="w-8 h-8 rounded border border-gray-600 bg-gray-800 flex items-center justify-center overflow-hidden relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to replace"
                >
                  <img
                    src={state.baseTexture.texture}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    alt="Base"
                  />
                </button>
              )}
            </div>

            {state.baseTexture?.texture && (
              <div className="space-y-2 pt-2 animate-in fade-in">
                <Toggle
                  label="Enable Base Layer"
                  checked={state.baseTexture.enabled}
                  onChange={(v) => updateStateGroup("baseTexture", { enabled: v })}
                  onCommit={onCommit}
                />

                {state.baseTexture.enabled && (
                  <>
                    <div className="relative">
                      <Label label="Blend Mode (Procedural over Base)" />
                      <div className="relative group">
                        <select
                          value={state.baseTexture.blendMode}
                          onChange={(e) =>
                            updateStateGroup("baseTexture", { blendMode: parseInt(e.target.value) })
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

                    <div className="pt-2 border-t border-white/5">
                      <div className="relative">
                        <Label label="Effect Mode (Distorted by Pattern)" />
                        <div className="relative group">
                          <select
                            value={state.baseTexture.effectType || 0}
                            onChange={(e) =>
                              updateStateGroup("baseTexture", {
                                effectType: parseInt(e.target.value),
                              })
                            }
                            className="w-full bg-surface border border-border text-gray-300 text-[10px] py-1.5 px-2 pr-6 rounded appearance-none focus:outline-none focus:border-accent-primary transition-colors cursor-pointer"
                          >
                            {BASE_EFFECTS.map((m) => (
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
                      {state.baseTexture.effectType !== BaseEffectType.NONE ? (
                        <div className="mt-1 animate-in fade-in">
                          <Label label="Effect Strength" />
                          <Slider
                            min={0}
                            max={1}
                            value={state.baseTexture.effectStrength || 0.5}
                            onChange={(v) => updateStateGroup("baseTexture", { effectStrength: v })}
                            onCommit={onCommit}
                            animConfig={state.paramAnimations["baseTexture.effectStrength"]}
                            onAnimChange={(c) => updateAnimation("baseTexture.effectStrength", c)}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="pt-2">
                      <Label
                        label="Procedural Opacity"
                        description="Mix between base image and generated pattern"
                      />
                      <Slider
                        min={0}
                        max={1}
                        value={state.baseTexture.opacity}
                        onChange={(v) => updateStateGroup("baseTexture", { opacity: v })}
                        onCommit={onCommit}
                        animConfig={state.paramAnimations["baseTexture.opacity"]}
                        onAnimChange={(c) => updateAnimation("baseTexture.opacity", c)}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* --- Procedural Layer 2 Section --- */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <Toggle
              label="Enable Procedural Layer 2"
              checked={state.blending.enabled}
              onChange={(v) => updateStateGroup("blending", { enabled: v })}
              onCommit={onCommit}
            />

            {state.blending.enabled && (
              <div className="animate-in fade-in space-y-3 pt-2">
                <div className="relative">
                  <Label label="Layer 2 Pattern" />
                  <div className="relative group">
                    <select
                      value={state.blending.type}
                      onChange={(e) =>
                        updateStateGroup("blending", { type: e.target.value as TextureType })
                      }
                      className="w-full bg-surface border border-border text-gray-300 text-[10px] py-1.5 px-2 pr-6 rounded appearance-none focus:outline-none focus:border-accent-primary transition-colors cursor-pointer"
                    >
                      {allTextures.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <Icons.ChevronDown
                      size={12}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                  </div>
                </div>

                <div className="relative">
                  <Label label="Layer 2 Blend Mode" />
                  <div className="relative group">
                    <select
                      value={state.blending.mode}
                      onChange={(e) =>
                        updateStateGroup("blending", { mode: parseInt(e.target.value) })
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

                <div>
                  <Label label="Opacity" />
                  <Slider
                    min={0}
                    max={1}
                    value={state.blending.opacity}
                    onChange={(v) => updateStateGroup("blending", { opacity: v })}
                    onCommit={onCommit}
                    animConfig={state.paramAnimations["blending.opacity"]}
                    onAnimChange={(c) => updateAnimation("blending.opacity", c)}
                  />
                </div>

                <div className="pt-2 border-t border-white/5 space-y-3">
                  <div>
                    <Label label="Layer Scale" />
                    <Slider
                      min={0.1}
                      max={10}
                      value={state.blending.scale}
                      onChange={(v) => updateStateGroup("blending", { scale: v })}
                      onCommit={onCommit}
                      animConfig={state.paramAnimations["blending.scale"]}
                      onAnimChange={(c) => updateAnimation("blending.scale", c)}
                    />
                  </div>
                  <div>
                    <Label label="Layer Intensity" />
                    <Slider
                      min={0}
                      max={3}
                      value={state.blending.intensity}
                      onChange={(v) => updateStateGroup("blending", { intensity: v })}
                      onCommit={onCommit}
                      animConfig={state.paramAnimations["blending.intensity"]}
                      onAnimChange={(c) => updateAnimation("blending.intensity", c)}
                    />
                  </div>
                  <div>
                    <Label label="Layer Factor" />
                    <Slider
                      min={0}
                      max={1}
                      value={state.blending.factor}
                      onChange={(v) => updateStateGroup("blending", { factor: v })}
                      onCommit={onCommit}
                      animConfig={state.paramAnimations["blending.factor"]}
                      onAnimChange={(c) => updateAnimation("blending.factor", c)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ControlSection>
    );
  },
);
