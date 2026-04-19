import React, { memo } from "react";
import { AppState, GeometryType } from "../../../core/types/types";
import { ControlSection, Label, Slider, Select, Toggle } from "../../../shared/ui/Elements";
import { Type, PenTool } from "lucide-react";

interface GeometryPanelProps {
  state: AppState;
  updateStateGroup: <K extends keyof AppState>(key: K, values: Partial<AppState[K]>) => void;
  onCommit: () => void;
}

export const GeometryPanel: React.FC<GeometryPanelProps> = memo(
  ({ state, updateStateGroup, onCommit }) => {
    if (state.geometry !== GeometryType.SVG && state.geometry !== GeometryType.TEXT) {
      return null;
    }

    return (
      <ControlSection
        title="Geometry Settings"
        icon={state.geometry === GeometryType.SVG ? PenTool : Type}
        color="#F59E0B"
        defaultOpen={true}
      >
        {state.geometry === GeometryType.SVG && (
          <div className="space-y-3">
            <Select
              label="Preset Shape"
              value={state.svg.preset}
              options={[
                { label: "Star", value: "star" },
                { label: "Heart", value: "heart" },
                { label: "Circle", value: "circle" },
              ]}
              onChange={(v) => {
                updateStateGroup("svg", { preset: v, url: null });
                onCommit();
              }}
            />

            <div className="space-y-1">
              <Label label="Custom SVG URL" />
              <input
                type="text"
                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-accent-primary"
                placeholder="https://..."
                value={state.svg.url || ""}
                onChange={(e) => updateStateGroup("svg", { url: e.target.value })}
                onBlur={onCommit}
              />
            </div>

            <Slider
              label="Extrude Depth"
              value={state.svg.extrude}
              min={0.01}
              max={2.0}
              step={0.01}
              onChange={(v) => updateStateGroup("svg", { extrude: v })}
              onCommit={onCommit}
            />

            <Slider
              label="Scale"
              value={state.svg.scale}
              min={0.1}
              max={5.0}
              step={0.1}
              onChange={(v) => updateStateGroup("svg", { scale: v })}
              onCommit={onCommit}
            />
          </div>
        )}

        {state.geometry === GeometryType.TEXT && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label label="Text Content" />
              <input
                type="text"
                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-accent-primary"
                value={state.text.text}
                onChange={(e) => updateStateGroup("text", { text: e.target.value })}
                onBlur={onCommit}
              />
            </div>

            <Select
              label="Font"
              value={state.text.font}
              options={[
                { label: "Helvetiker", value: "helvetiker" },
                { label: "Optimer", value: "optimer" },
                { label: "Gentilis", value: "gentilis" },
                { label: "Droid Sans", value: "droid/droid_sans" },
                { label: "Droid Serif", value: "droid/droid_serif" },
              ]}
              onChange={(v) => {
                updateStateGroup("text", { font: v });
                onCommit();
              }}
            />

            <Slider
              label="Size"
              value={state.text.size}
              min={0.1}
              max={5.0}
              step={0.1}
              onChange={(v) => updateStateGroup("text", { size: v })}
              onCommit={onCommit}
            />

            <Slider
              label="Extrude Depth"
              value={state.text.extrude}
              min={0.01}
              max={2.0}
              step={0.01}
              onChange={(v) => updateStateGroup("text", { extrude: v })}
              onCommit={onCommit}
            />

            <Toggle
              label="Bevel"
              checked={state.text.bevelEnabled}
              onChange={(v) => {
                updateStateGroup("text", { bevelEnabled: v });
                onCommit();
              }}
            />

            {state.text.bevelEnabled && (
              <>
                <Slider
                  label="Bevel Thickness"
                  value={state.text.bevelThickness}
                  min={0.01}
                  max={0.2}
                  step={0.01}
                  onChange={(v) => updateStateGroup("text", { bevelThickness: v })}
                  onCommit={onCommit}
                />
                <Slider
                  label="Bevel Size"
                  value={state.text.bevelSize}
                  min={0.01}
                  max={0.2}
                  step={0.01}
                  onChange={(v) => updateStateGroup("text", { bevelSize: v })}
                  onCommit={onCommit}
                />
              </>
            )}
          </div>
        )}
      </ControlSection>
    );
  },
);
