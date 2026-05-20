import React, { memo } from "react";
import * as Icons from "lucide-react";
import { AppState, AnimationConfig } from "../../../core/types/types";
import { ControlSection, Label, Slider, Toggle } from "../../../shared/ui/Elements";

interface RetroEffectsPanelProps {
  state: AppState;
  updateStateGroup: <K extends keyof AppState>(key: K, values: Partial<AppState[K]>) => void;
  onUpdateAnim?: (key: string, config: AnimationConfig) => void;
  onCommit: () => void;
}

export const RetroEffectsPanel: React.FC<RetroEffectsPanelProps> = memo(
  ({ state, updateStateGroup, onCommit, onUpdateAnim }) => {
    const updateAnimation = onUpdateAnim ?? (() => {});

    return (
      <ControlSection title="Retro & Glitch" icon={Icons.Gamepad2} color="#06B6D4">
        <div className="space-y-3">
          {/* Retro Pixelation */}
          <Toggle
            label="Pixelation (8-bit)"
            checked={state.postProcess.pixelate}
            onChange={(v) => updateStateGroup("postProcess", { pixelate: v })}
            onCommit={onCommit}
          />
          {state.postProcess.pixelate && (
            <div className="pl-2 border-l-2 border-accent-primary/20 animate-in fade-in">
              <Label label="Pixel Density" />
              <Slider
                min={8}
                max={256}
                step={8}
                value={state.postProcess.pixelDensity}
                onChange={(v) => updateStateGroup("postProcess", { pixelDensity: v })}
                onCommit={onCommit}
              />
            </div>
          )}

          {/* CRT */}
          <div className="pt-2 border-t border-white/5">
            <Toggle
              label="CRT Scanlines"
              checked={state.postProcess.scanlines}
              onChange={(v) => updateStateGroup("postProcess", { scanlines: v })}
              onCommit={onCommit}
            />
            {state.postProcess.scanlines && (
              <div className="pl-2 border-l-2 border-accent-primary/20 space-y-2 animate-in fade-in">
                <div>
                  <Label label="Line Intensity" />
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={state.postProcess.scanlineIntensity}
                    onChange={(v) => updateStateGroup("postProcess", { scanlineIntensity: v })}
                    onCommit={onCommit}
                  />
                </div>
                <div>
                  <Label label="Screen Curvature" />
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={state.postProcess.crtDistortion}
                    onChange={(v) => updateStateGroup("postProcess", { crtDistortion: v })}
                    onCommit={onCommit}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/5">
            <Toggle
              label="Digital Glitch"
              checked={state.postProcess.glitch}
              onChange={(v) => updateStateGroup("postProcess", { glitch: v })}
              onCommit={onCommit}
            />
            {state.postProcess.glitch && (
              <div className="pl-2 border-l-2 border-accent-primary/20 space-y-2 animate-in fade-in">
                <div>
                  <Label label="Glitch Intensity" />
                  <Slider
                    min={0}
                    max={2.0}
                    step={0.1}
                    value={state.postProcess.glitchStrength}
                    onChange={(v) => updateStateGroup("postProcess", { glitchStrength: v })}
                    onCommit={onCommit}
                    animConfig={state.paramAnimations["postProcess.glitchStrength"]}
                    onAnimChange={(c) => updateAnimation("postProcess.glitchStrength", c)}
                  />
                </div>
                <div>
                  <Label label="Speed" />
                  <Slider
                    min={0}
                    max={3.0}
                    step={0.1}
                    value={state.postProcess.glitchSpeed}
                    onChange={(v) => updateStateGroup("postProcess", { glitchSpeed: v })}
                    onCommit={onCommit}
                    animConfig={state.paramAnimations["postProcess.glitchSpeed"]}
                    onAnimChange={(c) => updateAnimation("postProcess.glitchSpeed", c)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </ControlSection>
    );
  },
);
