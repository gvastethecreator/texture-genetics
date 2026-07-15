import React, { memo, useMemo } from "react";
import * as Icons from "lucide-react";
import { AppState, AnimationConfig } from "../../../core/types/types";
import { PATTERN_MANIFEST_BY_TYPE } from "../../../data/patternManifest";
import { ControlSection, Label, Slider } from "../../../shared/ui/Elements";
import { DEFAULTS } from "../../../core/constants";

interface PatternPanelProps {
  state: AppState;
  onChangeParams: (p: Partial<AppState["params"]>) => void;
  onChangeState: (s: Partial<AppState>) => void;
  onUpdateAnim: (key: string, config: AnimationConfig) => void;
  onCommit: () => void;
  onRandom: () => void;
}

const DYNAMIC_PARAMETER_KEYS = [
  "p1",
  "p2",
  "p3",
  "p4",
  "p5",
  "p6",
  "p7",
  "p8",
  "p9",
  "p10",
  "p11",
  "p12",
  "p13",
  "p14",
  "p15",
] as const;

export const PatternPanel: React.FC<PatternPanelProps> = memo(
  ({ state, onChangeParams, onChangeState, onCommit, onUpdateAnim, onRandom }) => {
    const definitions = PATTERN_MANIFEST_BY_TYPE[state.textureType].definition;
    const labels = definitions.labels;
    const ranges = definitions.ranges || {};

    const handleResetParams = () => {
      onChangeParams(DEFAULTS.PARAMS);
      onCommit();
    };

    // Helper to render dynamic params loop
    const dynamicParams = useMemo(() => {
      const params: React.ReactNode[] = [];
      for (const key of DYNAMIC_PARAMETER_KEYS) {
        const label = labels[key];
        if (label) {
          const range = ranges[key];
          const description = `Controls the ${label.toLowerCase()} of the pattern.`;

          params.push(
            <div key={key} className="animate-in fade-in">
              <Label label={label} description={description} />
              <Slider
                min={range?.min ?? 0}
                max={range?.max ?? 1}
                step={range?.step ?? 0.01}
                value={state.params[key]}
                onChange={(v) => onChangeParams({ [key]: v })}
                onCommit={onCommit}
                animConfig={state.paramAnimations[key]}
                onAnimChange={(c) => onUpdateAnim(key, c)}
              />
            </div>,
          );
        }
      }
      return params;
    }, [
      labels,
      ranges,
      state.params,
      state.paramAnimations,
      onChangeParams,
      onCommit,
      onUpdateAnim,
    ]);

    return (
      <ControlSection
        title="Pattern Settings"
        icon={Icons.Sliders}
        color="#3B82F6"
        defaultOpen={true}
      >
        <div className="flex justify-end gap-1 mb-2">
          <button
            onClick={onRandom}
            className="text-[9px] text-gray-500 hover:text-white px-2 py-1 bg-white/5 rounded border border-white/10 transition-colors"
            title="Randomize Parameters"
          >
            <div className="flex items-center gap-1">
              <Icons.Dice5 size={12} />
              <span>RANDOM</span>
            </div>
          </button>
          <button
            onClick={handleResetParams}
            className="text-[9px] text-gray-500 hover:text-white px-2 py-1 bg-white/5 rounded border border-white/10 transition-colors"
            title="Reset parameters to default"
          >
            <div className="flex items-center gap-1">
              <Icons.RotateCcw size={10} />
              <span>RESET</span>
            </div>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label
                label={labels.scale || "Scale"}
                description="Global scale / frequency of the pattern."
              />
              <Slider
                min={0.1}
                max={10}
                value={state.params.scale}
                onChange={(v) => onChangeParams({ scale: v })}
                onCommit={onCommit}
                animConfig={state.paramAnimations["scale"]}
                onAnimChange={(c) => onUpdateAnim("scale", c)}
              />
            </div>
            <div>
              <Label
                label={labels.intensity || "Intensity"}
                description="Overall brightness or alpha contrast."
              />
              <Slider
                min={0}
                max={3}
                value={state.params.intensity}
                onChange={(v) => onChangeParams({ intensity: v })}
                onCommit={onCommit}
                animConfig={state.paramAnimations["intensity"]}
                onAnimChange={(c) => onUpdateAnim("intensity", c)}
              />
            </div>
            <div>
              <Label
                label={labels.factor || "Factor"}
                description="A primary modifier (e.g. thickness, threshold)."
              />
              <Slider
                min={0}
                max={1}
                value={state.params.factor}
                onChange={(v) => onChangeParams({ factor: v })}
                onCommit={onCommit}
                animConfig={state.paramAnimations["factor"]}
                onAnimChange={(c) => onUpdateAnim("factor", c)}
              />
            </div>

            {/* Extra Params Dynamic Grid */}
            {dynamicParams}
          </div>

          <div className="flex items-end gap-2 p-2 bg-black/20 rounded border border-white/5 relative overflow-hidden">
            <div className="flex-1">
              {state.animate ? (
                <div className="animate-in fade-in duration-300">
                  <Label label="Animation Speed" />
                  <Slider
                    min={0}
                    max={5}
                    value={state.params.speed}
                    onChange={(v) => onChangeParams({ speed: v })}
                    onCommit={onCommit}
                    animConfig={state.paramAnimations["speed"]}
                    onAnimChange={(c) => onUpdateAnim("speed", c)}
                  />
                </div>
              ) : (
                <div className="animate-in fade-in duration-300">
                  <Label label="Time Scrubber (Paused)" />
                  <Slider
                    min={0}
                    max={100}
                    step={0.01}
                    value={state.time % 100}
                    onChange={(v) => onChangeState({ time: v })}
                  />
                </div>
              )}
            </div>
            <button
              onClick={() => onChangeState({ animate: !state.animate })}
              className={`w-8 h-6 mb-0.5 rounded flex items-center justify-center transition-all active:scale-95 ${state.animate ? "bg-accent-primary text-black shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "bg-red-900/50 border border-red-500/50 text-red-200"}`}
              title={state.animate ? "Pause Animation" : "Play Animation"}
            >
              {state.animate ? (
                <Icons.Pause size={12} fill="currentColor" />
              ) : (
                <Icons.Play size={12} fill="currentColor" />
              )}
            </button>
          </div>
        </div>
      </ControlSection>
    );
  },
);
