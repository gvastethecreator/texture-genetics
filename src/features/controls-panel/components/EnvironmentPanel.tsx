import React, { memo } from "react";
import * as Icons from "lucide-react";
import { AppState, AnimationConfig } from "../../../core/types/types";
import { ControlSection, Label, Slider, Toggle } from "../../../shared/ui/Elements";
import { ColorPicker } from "../../../shared/ui/ColorPicker";

interface EnvironmentPanelProps {
  state: AppState;
  updateStateGroup: <K extends keyof AppState>(key: K, values: Partial<AppState[K]>) => void;
  onCommit: () => void;
  onUpdateAnim?: (key: string, config: AnimationConfig) => void;
}

export const EnvironmentPanel: React.FC<EnvironmentPanelProps> = memo(
  ({ state, updateStateGroup, onCommit, onUpdateAnim }) => {
    const _update = onUpdateAnim || ((_k: string, _c: AnimationConfig) => {});

    return (
      <ControlSection title="Scene & Light" icon={Icons.Sun} color="#FBBF24" defaultOpen={true}>
        <div className="space-y-4">
          {/* 1. LIGHTING & ENVIRONMENT (CORE) */}
          <div className="p-3 bg-black/20 rounded border border-white/5 space-y-3">
            <div className="flex items-center gap-2 mb-1 text-amber-400">
              <Icons.Lightbulb size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Lighting Studio
              </span>
            </div>

            <div className="relative">
              <Label label="HDRI Skybox" />
              <div className="relative group">
                <select
                  value={state.environment.envType}
                  onChange={(e) =>
                    updateStateGroup("environment", { envType: parseInt(e.target.value) })
                  }
                  className="w-full bg-surface border border-border text-gray-300 text-[10px] py-1.5 px-2 pr-6 rounded appearance-none focus:outline-none focus:border-accent-primary transition-colors cursor-pointer"
                >
                  <option value={0}>Studio (Neutral)</option>
                  <option value={1}>Sunset (Warm)</option>
                  <option value={2}>Night (Cool)</option>
                  <option value={3}>Dawn (Soft)</option>
                </select>
                <Icons.ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <Label label="Light Intensity" />
              <Slider
                min={0}
                max={5}
                step={0.1}
                value={state.environment.lightIntensity}
                onChange={(v) => updateStateGroup("environment", { lightIntensity: v })}
                onCommit={onCommit}
              />
            </div>

            <div>
              <Label
                label="Camera Exposure"
                description="Adjusts global brightness range. Lower this if Bloom is too bright."
              />
              <Slider
                min={0.1}
                max={3.0}
                step={0.1}
                value={state.environment.exposure || 1.0}
                onChange={(v) => updateStateGroup("environment", { exposure: v })}
                onCommit={onCommit}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label label="Light X" />
                <Slider
                  min={-1}
                  max={1}
                  step={0.1}
                  value={state.environment.lightX}
                  onChange={(v) => updateStateGroup("environment", { lightX: v })}
                  onCommit={onCommit}
                />
              </div>
              <div>
                <Label label="Light Y" />
                <Slider
                  min={-1}
                  max={1}
                  step={0.1}
                  value={state.environment.lightY}
                  onChange={(v) => updateStateGroup("environment", { lightY: v })}
                  onCommit={onCommit}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/5">
              <div className="flex-1">
                <ColorPicker
                  label="Key Color"
                  color={state.environment.lightColor || "#ffffff"}
                  onChange={(c) => updateStateGroup("environment", { lightColor: c })}
                  onCommit={onCommit}
                />
              </div>
              <div className="flex-1">
                <ColorPicker
                  label="Ambient"
                  color={state.environment.ambientColor || "#333333"}
                  onChange={(c) => updateStateGroup("environment", { ambientColor: c })}
                  onCommit={onCommit}
                />
              </div>
            </div>
          </div>

          {/* 2. ATMOSPHERE & PARTICLES */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 mb-1 text-blue-400">
              <Icons.CloudFog size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Atmosphere</span>
            </div>

            {/* FOG */}
            <div className="pl-2 border-l-2 border-blue-500/20 space-y-2">
              <div className="flex justify-between items-center">
                <Toggle
                  label="Depth Fog"
                  checked={state.environment.fogEnabled}
                  onChange={(v) => updateStateGroup("environment", { fogEnabled: v })}
                  onCommit={onCommit}
                />
                {state.environment.fogEnabled && (
                  <ColorPicker
                    label=""
                    color={state.environment.fogColor || "#000000"}
                    onChange={(c) => updateStateGroup("environment", { fogColor: c })}
                    onCommit={onCommit}
                  />
                )}
              </div>
              {state.environment.fogEnabled && (
                <div className="animate-in fade-in space-y-2">
                  <div>
                    <Label label="Density" />
                    <Slider
                      min={0.001}
                      max={0.15}
                      step={0.001}
                      value={state.environment.fogDensity}
                      onChange={(v) => updateStateGroup("environment", { fogDensity: v })}
                      onCommit={onCommit}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label label="Near" />
                      <Slider
                        min={0}
                        max={10}
                        value={state.environment.fogNear || 2}
                        onChange={(v) => updateStateGroup("environment", { fogNear: v })}
                        onCommit={onCommit}
                      />
                    </div>
                    <div>
                      <Label label="Far" />
                      <Slider
                        min={5}
                        max={50}
                        value={state.environment.fogFar || 20}
                        onChange={(v) => updateStateGroup("environment", { fogFar: v })}
                        onCommit={onCommit}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PARTICLES */}
            <div className="pl-2 border-l-2 border-indigo-500/20 space-y-2 mt-2">
              <div className="flex justify-between items-center">
                <Toggle
                  label="Particles"
                  checked={state.environment.particlesEnabled}
                  onChange={(v) => updateStateGroup("environment", { particlesEnabled: v })}
                  onCommit={onCommit}
                />
                {state.environment.particlesEnabled && (
                  <ColorPicker
                    label=""
                    color={state.environment.particleColor || "#4f46e5"}
                    onChange={(c) => updateStateGroup("environment", { particleColor: c })}
                    onCommit={onCommit}
                  />
                )}
              </div>
              {state.environment.particlesEnabled && (
                <div className="animate-in fade-in space-y-2">
                  <div>
                    <Label label="Count" />
                    <Slider
                      min={100}
                      max={2000}
                      step={100}
                      value={state.environment.particleCount || 500}
                      onChange={(v) => updateStateGroup("environment", { particleCount: v })}
                      onCommit={onCommit}
                    />
                  </div>
                  <div>
                    <Label label="Speed" />
                    <Slider
                      min={0}
                      max={2.0}
                      step={0.1}
                      value={state.environment.particleSpeed || 0.5}
                      onChange={(v) => updateStateGroup("environment", { particleSpeed: v })}
                      onCommit={onCommit}
                    />
                  </div>
                  <div>
                    <Label label="Size" />
                    <Slider
                      min={0.1}
                      max={2.0}
                      step={0.1}
                      value={state.environment.particleSize || 0.5}
                      onChange={(v) => updateStateGroup("environment", { particleSize: v })}
                      onCommit={onCommit}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label label="Opacity" />
                      <Slider
                        min={0}
                        max={1}
                        value={state.environment.particleOpacity || 0.5}
                        onChange={(v) => updateStateGroup("environment", { particleOpacity: v })}
                        onCommit={onCommit}
                      />
                    </div>
                    <div>
                      <Label label="Spread Y" />
                      <Slider
                        min={1}
                        max={10}
                        value={state.environment.particleSpreadY || 3.0}
                        onChange={(v) => updateStateGroup("environment", { particleSpreadY: v })}
                        onCommit={onCommit}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. POST PROCESSING (VIEWPORT ONLY) */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 mb-1 text-purple-400">
              <Icons.Aperture size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Camera Lens FX</span>
            </div>

            {/* BLOOM */}
            <div className="bg-black/20 p-2 rounded border border-white/5">
              <Toggle
                label="Bloom (Glow)"
                checked={state.environment.sceneBloom}
                onChange={(v) => updateStateGroup("environment", { sceneBloom: v })}
                onCommit={onCommit}
              />
              {state.environment.sceneBloom && (
                <div className="mt-2 space-y-2 animate-in fade-in">
                  <div>
                    <Label label="Intensity" />
                    <Slider
                      min={0}
                      max={3}
                      value={state.environment.sceneBloomIntensity}
                      onChange={(v) => updateStateGroup("environment", { sceneBloomIntensity: v })}
                      onCommit={onCommit}
                    />
                  </div>
                  <div>
                    <Label label="Threshold" />
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={state.environment.sceneBloomThreshold || 0.9}
                      onChange={(v) => updateStateGroup("environment", { sceneBloomThreshold: v })}
                      onCommit={onCommit}
                    />
                  </div>
                  <div>
                    <Label label="Radius" />
                    <Slider
                      min={0}
                      max={1.5}
                      step={0.05}
                      value={state.environment.sceneBloomRadius || 0.6}
                      onChange={(v) => updateStateGroup("environment", { sceneBloomRadius: v })}
                      onCommit={onCommit}
                    />
                  </div>
                  <div>
                    <Label label="Smoothing" />
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={state.environment.sceneBloomSmoothing || 0.02}
                      onChange={(v) => updateStateGroup("environment", { sceneBloomSmoothing: v })}
                      onCommit={onCommit}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* VIGNETTE */}
            <div className="bg-black/20 p-2 rounded border border-white/5">
              <Toggle
                label="Vignette"
                checked={state.environment.sceneVignette}
                onChange={(v) => updateStateGroup("environment", { sceneVignette: v })}
                onCommit={onCommit}
              />
              {state.environment.sceneVignette && (
                <div className="mt-2 space-y-2 animate-in fade-in">
                  <div>
                    <Label label="Offset" />
                    <Slider
                      min={0}
                      max={1}
                      value={state.environment.sceneVignetteOffset || 0.5}
                      onChange={(v) => updateStateGroup("environment", { sceneVignetteOffset: v })}
                      onCommit={onCommit}
                    />
                  </div>
                  <div>
                    <Label label="Darkness" />
                    <Slider
                      min={0}
                      max={1}
                      value={state.environment.sceneVignetteDarkness || 0.5}
                      onChange={(v) =>
                        updateStateGroup("environment", { sceneVignetteDarkness: v })
                      }
                      onCommit={onCommit}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CHROMATIC */}
            <div className="bg-black/20 p-2 rounded border border-white/5">
              <Toggle
                label="Chromatic Aberration"
                checked={state.environment.sceneChromatic}
                onChange={(v) => updateStateGroup("environment", { sceneChromatic: v })}
                onCommit={onCommit}
              />
              {state.environment.sceneChromatic && (
                <div className="mt-2 space-y-2 animate-in fade-in">
                  <div>
                    <Label label="Offset" />
                    <Slider
                      min={0}
                      max={0.02}
                      step={0.001}
                      value={state.environment.sceneChromaticOffset || 0.002}
                      onChange={(v) => updateStateGroup("environment", { sceneChromaticOffset: v })}
                      onCommit={onCommit}
                    />
                  </div>
                  <Toggle
                    label="Radial Modulation"
                    checked={state.environment.sceneChromaticRadial ?? true}
                    onChange={(v) => updateStateGroup("environment", { sceneChromaticRadial: v })}
                    onCommit={onCommit}
                  />
                </div>
              )}
            </div>

            {/* NOISE */}
            <div className="bg-black/20 p-2 rounded border border-white/5">
              <Toggle
                label="Film Grain"
                checked={state.environment.sceneNoise}
                onChange={(v) => updateStateGroup("environment", { sceneNoise: v })}
                onCommit={onCommit}
              />
              {state.environment.sceneNoise && (
                <div className="mt-2 animate-in fade-in">
                  <Label label="Opacity" />
                  <Slider
                    min={0}
                    max={1}
                    value={state.environment.sceneNoiseOpacity || 0.2}
                    onChange={(v) => updateStateGroup("environment", { sceneNoiseOpacity: v })}
                    onCommit={onCommit}
                  />
                </div>
              )}
            </div>

            {/* GLITCH */}
            <div className="bg-black/20 p-2 rounded border border-white/5">
              <Toggle
                label="Digital Glitch"
                checked={state.environment.sceneGlitch}
                onChange={(v) => updateStateGroup("environment", { sceneGlitch: v })}
                onCommit={onCommit}
              />
              {state.environment.sceneGlitch && (
                <div className="mt-2 space-y-2 animate-in fade-in">
                  <div>
                    <Label label="Strength" />
                    <Slider
                      min={0}
                      max={1}
                      value={state.environment.sceneGlitchStrength || 0.5}
                      onChange={(v) => updateStateGroup("environment", { sceneGlitchStrength: v })}
                      onCommit={onCommit}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label label="Delay" />
                      <Slider
                        min={0.1}
                        max={5}
                        value={state.environment.sceneGlitchDelay || 1.5}
                        onChange={(v) => updateStateGroup("environment", { sceneGlitchDelay: v })}
                        onCommit={onCommit}
                      />
                    </div>
                    <div>
                      <Label label="Duration" />
                      <Slider
                        min={0.1}
                        max={2}
                        value={state.environment.sceneGlitchDuration || 0.6}
                        onChange={(v) =>
                          updateStateGroup("environment", { sceneGlitchDuration: v })
                        }
                        onCommit={onCommit}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TILT SHIFT */}
            <div className="bg-black/20 p-2 rounded border border-white/5">
              <Toggle
                label="Tilt Shift (Miniature)"
                checked={state.environment.sceneTiltShift}
                onChange={(v) => updateStateGroup("environment", { sceneTiltShift: v })}
                onCommit={onCommit}
              />
              {state.environment.sceneTiltShift && (
                <div className="mt-2 space-y-2 animate-in fade-in">
                  <div>
                    <Label label="Blur" />
                    <Slider
                      min={0}
                      max={1}
                      value={state.environment.sceneTiltShiftBlur || 0.5}
                      onChange={(v) => updateStateGroup("environment", { sceneTiltShiftBlur: v })}
                      onCommit={onCommit}
                    />
                  </div>
                  <div>
                    <Label label="Focus Area" />
                    <Slider
                      min={0.1}
                      max={0.9}
                      value={state.environment.sceneTiltShiftFocus || 0.5}
                      onChange={(v) => updateStateGroup("environment", { sceneTiltShiftFocus: v })}
                      onCommit={onCommit}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. RETRO & STYLIZED (RESTORED) */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 mb-1 text-cyan-400">
              <Icons.Gamepad2 size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Retro & Stylized
              </span>
            </div>

            <div className="bg-black/20 p-2 rounded border border-white/5 space-y-2">
              {/* Pixelate */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Toggle
                    label="Pixelate (8-bit)"
                    checked={state.environment.scenePixelate}
                    onChange={(v) => updateStateGroup("environment", { scenePixelate: v })}
                    onCommit={onCommit}
                  />
                </div>
              </div>

              {/* CRT / Scanlines */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Toggle
                    label="CRT Monitor"
                    checked={state.environment.sceneScanlines}
                    onChange={(v) => updateStateGroup("environment", { sceneScanlines: v })}
                    onCommit={onCommit}
                  />
                </div>
              </div>

              {/* ASCII */}
              <div className="flex justify-between items-center">
                <Toggle
                  label="ASCII Matrix"
                  checked={state.environment.sceneAscii}
                  onChange={(v) => updateStateGroup("environment", { sceneAscii: v })}
                  onCommit={onCommit}
                />
              </div>

              {/* Dither */}
              <div className="flex justify-between items-center">
                <Toggle
                  label="1-Bit Dither"
                  checked={state.environment.sceneDither}
                  onChange={(v) => updateStateGroup("environment", { sceneDither: v })}
                  onCommit={onCommit}
                />
              </div>

              {/* Outline */}
              <div className="flex justify-between items-center">
                <Toggle
                  label="Edge Outline"
                  checked={state.environment.sceneOutline}
                  onChange={(v) => updateStateGroup("environment", { sceneOutline: v })}
                  onCommit={onCommit}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 space-y-3">
            <div className="flex items-center gap-2 mb-1 text-gray-500">
              <Icons.Projector size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Reflective Stage
              </span>
            </div>
            <div className="pl-2 border-l border-white/10">
              <Toggle
                label="Enable Floor"
                checked={state.environment.stageEnabled}
                onChange={(v) => updateStateGroup("environment", { stageEnabled: v })}
                onCommit={onCommit}
              />
              {state.environment.stageEnabled && (
                <div className="mt-2 animate-in fade-in space-y-2">
                  <ColorPicker
                    label="Floor Color"
                    color={state.environment.stageColor}
                    onChange={(c) => updateStateGroup("environment", { stageColor: c })}
                    onCommit={onCommit}
                  />
                  <div>
                    <Label label="Reflectivity" />
                    <Slider
                      min={0}
                      max={1}
                      value={state.environment.stageOpacity}
                      onChange={(v) => updateStateGroup("environment", { stageOpacity: v })}
                      onCommit={onCommit}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ControlSection>
    );
  },
);
