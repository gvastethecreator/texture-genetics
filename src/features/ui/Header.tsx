import React, { memo } from "react";
import * as Icons from "lucide-react";
import { AppState, UserPreset, TextureType } from "../../core/types/types";
import { APP_NAME } from "../../core/constants";
import { PRESETS, Preset } from "../../presets";

interface HeaderProps {
  state: AppState;
  userPresets: UserPreset[];
  actions: {
    updateState: (s: Partial<AppState>) => void;
    randomize: () => void;
    loadPreset: (s: Partial<AppState>) => void;
    selectTexture: (t: TextureType) => void;
    saveUserPreset: (name: string) => void | Promise<string | undefined>;
    deleteUserPreset: (id: string) => void;
    resetState: () => void;
    addToast: (type: "success" | "error" | "info", message: string) => void;
  };
  history: {
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
  };
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
}

export const Header: React.FC<HeaderProps> = memo(
  ({
    state,
    userPresets,
    actions,
    history,
    toggleLeftPanel,
    toggleRightPanel,
    leftPanelOpen,
    rightPanelOpen,
  }) => {
    const [selectedPresetId, setSelectedPresetId] = React.useState<string>("");

    const groupedPresets = React.useMemo(() => {
      const groups: Record<string, Preset[]> = {};
      PRESETS.forEach((p) => {
        if (!groups[p.category]) groups[p.category] = [];
        groups[p.category].push(p);
      });
      return groups;
    }, []);

    const allPresets = React.useMemo(() => {
      const users = userPresets.map((p) => ({ id: p.id, name: p.name, state: p.state }));
      const factory = PRESETS.map((p) => ({ id: p.name, name: p.name, state: p.state }));
      return [...users, ...factory];
    }, [userPresets]);

    const handleApplyPreset = (val: string) => {
      if (!val) return;
      setSelectedPresetId(val);
      const userPreset = userPresets.find((p) => p.id === val);
      if (userPreset) {
        actions.loadPreset(userPreset.state);
        return;
      }
      const factoryPreset = PRESETS.find((p) => p.name === val);
      if (factoryPreset) {
        actions.loadPreset(factoryPreset.state);
        return;
      }
    };

    const handleDeletePreset = () => {
      if (selectedPresetId) {
        if (window.confirm("Delete this preset?")) {
          actions.deleteUserPreset(selectedPresetId);
          setSelectedPresetId("");
        }
      }
    };

    const navigatePreset = (dir: "next" | "prev") => {
      let currentIndex = allPresets.findIndex((p) => p.id === selectedPresetId);
      if (currentIndex === -1) {
        currentIndex = allPresets.findIndex((p) => p.state.textureType === state.textureType);
      }
      if (currentIndex === -1) currentIndex = 0;

      let newIndex = dir === "next" ? currentIndex + 1 : currentIndex - 1;
      if (newIndex >= allPresets.length) newIndex = 0;
      if (newIndex < 0) newIndex = allPresets.length - 1;

      const preset = allPresets[newIndex];
      setSelectedPresetId(preset.id);
      actions.loadPreset(preset.state);
    };

    const isUserPresetSelected = userPresets.some((p) => p.id === selectedPresetId);

    const btnClass =
      "h-8 w-8 flex items-center justify-center rounded-lg bg-[#151515] border border-white/5 text-gray-400 shadow-tactile hover:bg-[#202020] hover:text-white hover:shadow-tactile-hover active:shadow-tactile-active active:translate-y-px transition-[color,background-color,box-shadow,transform] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 disabled:cursor-not-allowed disabled:opacity-35";

    return (
      <header className="relative z-50 grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center border-b border-white/5 bg-bg/95 px-2 shadow-lg select-none sm:px-4 supports-[backdrop-filter]:bg-bg/80 supports-[backdrop-filter]:backdrop-blur-md">
        {/* LEFT: Branding & History */}
        <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <button
            type="button"
            onClick={toggleLeftPanel}
            aria-label={leftPanelOpen ? "Close texture tools" : "Open texture tools"}
            aria-controls="texture-tools-panel"
            aria-expanded={leftPanelOpen}
            className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-gray-300 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 xl:hidden"
          >
            <Icons.Menu size={20} />
            <span className="hidden text-[10px] font-bold uppercase tracking-wider md:inline">
              Tools
            </span>
          </button>

          <div className="mr-1 hidden items-center gap-3 sm:flex sm:mr-2 group cursor-default">
            <div className="w-8 h-8 bg-linear-to-br from-white to-gray-400 rounded-lg flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow">
              <Icons.Layers size={18} className="text-black" />
            </div>
            <div className="flex flex-col">
              <span className="hidden md:block text-sm font-black text-transparent bg-clip-text bg-linear-to-r from-white to-gray-400 tracking-widest uppercase">
                {APP_NAME}
              </span>
              <span className="text-[9px] font-mono text-gray-500 tracking-wide">
                v{__APP_VERSION__}
              </span>
            </div>
          </div>

          <div className="mx-1 hidden h-8 w-px bg-white/10 lg:block" />

          <div className="flex gap-1 sm:gap-2">
            <button
              type="button"
              onClick={history.undo}
              disabled={!history.canUndo}
              className={btnClass}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Icons.Undo2 size={16} />
            </button>
            <button
              type="button"
              onClick={history.redo}
              disabled={!history.canRedo}
              className={btnClass}
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              <Icons.Redo2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm("Reset all settings to defaults?")) return;
                actions.resetState();
                actions.addToast("info", "Reset to defaults — Undo with Ctrl/⌘+Z");
              }}
              className={`${btnClass} hidden hover:text-red-400 sm:flex`}
              title="Reset All"
              aria-label="Reset all settings"
            >
              <Icons.RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* CENTER: Presets & Randomizer */}
        <div className="mx-1 flex min-w-0 items-center gap-1 rounded-xl border border-white/5 bg-[#0a0a0a] p-1 shadow-inner sm:mx-3 sm:gap-2 sm:p-1.5 lg:mx-6">
          <button
            type="button"
            onClick={() => navigatePreset("prev")}
            className="hidden rounded-md p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-white sm:block"
            aria-label="Previous preset"
          >
            <Icons.ChevronLeft size={16} />
          </button>

          <div className="relative flex-1 group">
            <select
              aria-label="Preset"
              onChange={(e) => handleApplyPreset(e.target.value)}
              className="w-full bg-[#121212] border border-black text-gray-300 text-[11px] font-bold h-8 pl-3 pr-8 rounded-lg appearance-none focus:outline-none focus:border-white/20 transition-all cursor-pointer hover:bg-[#181818] shadow-inner"
              value={selectedPresetId || ""}
            >
              <option value="" disabled>
                Select a Preset...
              </option>
              {userPresets.length > 0 && (
                <optgroup label="MY PRESETS">
                  {userPresets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {Object.entries(groupedPresets).map(([category, presets]) => (
                <optgroup key={category} label={category.toUpperCase()}>
                  {(presets as Preset[]).map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <Icons.ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>

          {isUserPresetSelected && (
            <button
              type="button"
              onClick={handleDeletePreset}
              className="h-8 w-8 flex items-center justify-center text-red-500 hover:bg-red-900/20 rounded-lg transition-colors"
              aria-label="Delete selected preset"
            >
              <Icons.Trash2 size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={() => navigatePreset("next")}
            className="hidden rounded-md p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-white sm:block"
            aria-label="Next preset"
          >
            <Icons.ChevronRight size={16} />
          </button>

          <div className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />

          <button
            type="button"
            onClick={actions.randomize}
            className="group hidden h-8 items-center gap-2 rounded-lg border border-black/60 bg-metal-gradient px-2 text-gray-200 shadow-tactile transition-[color,box-shadow,transform] hover:text-white hover:shadow-tactile-hover active:translate-y-px active:shadow-tactile-active sm:flex lg:px-4"
            title="Smart Randomize (R)"
            aria-label="Randomize texture"
          >
            <Icons.Shuffle
              size={14}
              className="group-hover:rotate-180 transition-transform duration-500 text-purple-400"
            />
            <span className="text-[10px] font-bold hidden sm:inline tracking-wider">RANDOM</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const entered = window.prompt("Name this preset", "New Preset");
              if (entered == null) return;
              const trimmed = entered.trim();
              if (!trimmed) return;
              const used = new Set(userPresets.map((preset) => preset.name));
              let uniqueName = trimmed;
              let suffix = 2;
              while (used.has(uniqueName)) {
                uniqueName = `${trimmed} ${suffix}`;
                suffix += 1;
              }
              void Promise.resolve(actions.saveUserPreset(uniqueName)).then((id) => {
                if (id) setSelectedPresetId(id);
              });
            }}
            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-[#151515] text-gray-400 shadow-tactile transition-[color,box-shadow,transform] hover:text-green-400 hover:shadow-tactile-hover active:translate-y-px sm:flex"
            title="Save Preset"
            aria-label="Save preset"
          >
            <Icons.Save size={14} />
          </button>
        </div>

        {/* RIGHT: Global Settings */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
          <button
            type="button"
            onClick={() => actions.updateState({ gridOverlay: !state.gridOverlay })}
            className={`hidden h-9 items-center gap-2 rounded-lg border px-3 transition-[color,background-color,box-shadow,transform] active:translate-y-px xl:flex ${state.gridOverlay ? "bg-linear-to-b from-gray-200 to-gray-400 text-black border-white shadow-glow-sm" : "bg-[#151515] border-white/5 text-gray-500 hover:text-gray-200 shadow-tactile"}`}
            aria-pressed={state.gridOverlay}
          >
            <Icons.Grid3X3 size={14} />
            <span className="text-[10px] font-bold">GRID</span>
          </button>

          <div className="mx-1 hidden h-8 w-px bg-white/10 lg:block" />

          <button
            type="button"
            onClick={() => actions.updateState({ isShortcutsOpen: true })}
            className={btnClass}
            title="Keyboard Shortcuts"
            aria-label="Keyboard shortcuts"
          >
            <Icons.Keyboard size={16} />
          </button>

          <button
            type="button"
            onClick={() => actions.updateState({ isCodeOpen: true })}
            className={`${btnClass} hidden lg:flex`}
            title="Legacy HTML Export Preview"
            aria-label="Legacy HTML export preview"
          >
            <Icons.FileCode2 size={16} />
          </button>

          <button
            type="button"
            onClick={() => actions.updateState({ isSettingsOpen: true })}
            className={btnClass}
            title="Global Settings"
            aria-label="Global settings"
          >
            <Icons.Settings2 size={16} />
          </button>

          <button
            type="button"
            onClick={toggleRightPanel}
            aria-label={rightPanelOpen ? "Close output inspector" : "Open output inspector"}
            aria-controls="output-inspector-panel"
            aria-expanded={rightPanelOpen}
            className="ml-1 flex h-9 items-center gap-1.5 rounded-lg px-2 text-gray-300 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 xl:hidden"
          >
            <Icons.PanelRight size={20} />
            <span className="hidden text-[10px] font-bold uppercase tracking-wider md:inline">
              Output
            </span>
          </button>
        </div>
      </header>
    );
  },
);
