
import React, { memo } from 'react';
import * as Icons from 'lucide-react';
import { AppState, UserPreset, TextureType } from '../../core/types/types';
import { PRESETS, Preset } from '../../presets';

interface HeaderProps {
    state: AppState;
    userPresets: UserPreset[];
    actions: {
        updateState: (s: Partial<AppState>) => void;
        randomize: () => void;
        loadPreset: (s: Partial<AppState>) => void;
        selectTexture: (t: TextureType) => void;
        saveUserPreset: (name: string) => void;
        deleteUserPreset: (id: string) => void;
        resetState: () => void;
    };
    history: {
        canUndo: boolean;
        canRedo: boolean;
        undo: () => void;
        redo: () => void;
    };
    onShowCode: () => void;
    toggleLeftPanel: () => void;
    toggleRightPanel: () => void;
}

export const Header: React.FC<HeaderProps> = memo(({ 
    state, userPresets, actions, history, onShowCode, toggleLeftPanel, toggleRightPanel 
}) => {
    
    const [selectedPresetId, setSelectedPresetId] = React.useState<string>("");

    const groupedPresets = React.useMemo(() => {
        const groups: Record<string, Preset[]> = {};
        PRESETS.forEach(p => {
          if (!groups[p.category]) groups[p.category] = [];
          groups[p.category].push(p);
        });
        return groups;
    }, []);

    const allPresets = React.useMemo(() => {
        const users = userPresets.map(p => ({ id: p.id, name: p.name, state: p.state }));
        const factory = PRESETS.map(p => ({ id: p.name, name: p.name, state: p.state }));
        return [...users, ...factory];
    }, [userPresets]);

    const handleApplyPreset = (val: string) => {
        if (!val) return;
        setSelectedPresetId(val);
        const userPreset = userPresets.find(p => p.id === val);
        if (userPreset) {
            actions.loadPreset(userPreset.state);
            return;
        }
        const factoryPreset = PRESETS.find(p => p.name === val);
        if (factoryPreset) {
          actions.loadPreset(factoryPreset.state);
          return;
        }
    };

    const handleDeletePreset = () => {
        if (selectedPresetId) {
            if(window.confirm("Delete this preset?")) {
                actions.deleteUserPreset(selectedPresetId);
                setSelectedPresetId("");
            }
        }
    };

    const navigatePreset = (dir: 'next' | 'prev') => {
        let currentIndex = allPresets.findIndex(p => p.id === selectedPresetId);
        if (currentIndex === -1) {
            currentIndex = allPresets.findIndex(p => p.state.textureType === state.textureType);
        }
        if (currentIndex === -1) currentIndex = 0;
        
        let newIndex = dir === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex >= allPresets.length) newIndex = 0;
        if (newIndex < 0) newIndex = allPresets.length - 1;
        
        const preset = allPresets[newIndex];
        setSelectedPresetId(preset.id);
        actions.loadPreset(preset.state);
    };

    const isUserPresetSelected = userPresets.some(p => p.id === selectedPresetId);

    const btnClass = "h-8 w-8 flex items-center justify-center rounded-lg bg-[#151515] border border-white/5 text-gray-400 shadow-tactile hover:bg-[#202020] hover:text-white hover:shadow-tactile-hover active:shadow-tactile-active active:translate-y-px transition-all";

    return (
        <div className="h-14 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 select-none relative z-30 shadow-lg">
            {/* LEFT: Branding & History */}
            <div className="flex items-center gap-4">
                <button onClick={toggleLeftPanel} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 md:hidden">
                    <Icons.Menu size={20} />
                </button>
                
                <div className="flex items-center gap-3 mr-2 group cursor-default">
                    <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-400 rounded-lg flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow">
                        <Icons.Layers size={18} className="text-black" />
                    </div>
                    <div className="flex flex-col">
                        <span className="hidden md:block text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-widest uppercase">
                            EffectGen
                        </span>
                        <span className="text-[9px] font-mono text-gray-500 tracking-wide">v3.6 PRO</span>
                    </div>
                </div>

                <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />

                <div className="flex gap-2">
                    <button onClick={history.undo} disabled={!history.canUndo} className={btnClass} title="Undo (Ctrl+Z)">
                        <Icons.Undo2 size={16} />
                    </button>
                    <button onClick={history.redo} disabled={!history.canRedo} className={btnClass} title="Redo (Ctrl+Y)">
                        <Icons.Redo2 size={16} />
                    </button>
                    <button onClick={actions.resetState} className={`${btnClass} hover:text-red-400`} title="Reset All">
                        <Icons.RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* CENTER: Presets & Randomizer */}
            <div className="flex items-center gap-2 flex-1 max-w-lg mx-6 bg-[#0a0a0a] p-1.5 rounded-xl border border-white/5 shadow-inner">
                <button onClick={() => navigatePreset('prev')} className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                    <Icons.ChevronLeft size={16} />
                </button>
                
                <div className="relative flex-1 group">
                    <select 
                        onChange={(e) => handleApplyPreset(e.target.value)}
                        className="w-full bg-[#121212] border border-black text-gray-300 text-[11px] font-bold h-8 pl-3 pr-8 rounded-lg appearance-none focus:outline-none focus:border-white/20 transition-all cursor-pointer hover:bg-[#181818] shadow-inner"
                        value={selectedPresetId || ""} 
                    >
                        <option value="" disabled>Select a Preset...</option>
                        {userPresets.length > 0 && (
                            <optgroup label="MY PRESETS">
                                 {userPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </optgroup>
                        )}
                        {Object.entries(groupedPresets).map(([category, presets]) => (
                        <optgroup key={category} label={category.toUpperCase()}>
                            {(presets as Preset[]).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </optgroup>
                        ))}
                    </select>
                    <Icons.ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
                
                {isUserPresetSelected && (
                    <button onClick={handleDeletePreset} className="h-8 w-8 flex items-center justify-center text-red-500 hover:bg-red-900/20 rounded-lg transition-colors">
                        <Icons.Trash2 size={14} />
                    </button>
                )}

                <button onClick={() => navigatePreset('next')} className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                    <Icons.ChevronRight size={16} />
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                <button 
                    onClick={actions.randomize}
                    className="h-8 px-4 bg-metal-gradient border-t border-white/10 border-b border-black rounded-lg flex items-center gap-2 text-gray-200 hover:text-white hover:shadow-tactile-hover shadow-tactile active:shadow-tactile-active active:translate-y-px transition-all group"
                    title="Smart Randomize (R)"
                >
                    <Icons.Shuffle size={14} className="group-hover:rotate-180 transition-transform duration-500 text-purple-400" />
                    <span className="text-[10px] font-bold hidden sm:inline tracking-wider">RANDOM</span>
                </button>
                
                <button 
                    onClick={() => actions.saveUserPreset('New Preset')}
                    className="h-8 w-8 flex items-center justify-center bg-[#151515] border border-white/5 rounded-lg text-gray-400 hover:text-green-400 shadow-tactile hover:shadow-tactile-hover active:translate-y-px transition-all"
                    title="Save Preset"
                >
                    <Icons.Save size={14} />
                </button>
            </div>

            {/* RIGHT: Global Settings */}
            <div className="flex items-center gap-3">
                <button 
                     onClick={() => actions.updateState({ gridOverlay: !state.gridOverlay })}
                     className={`hidden md:flex h-9 px-3 rounded-lg items-center gap-2 border transition-all active:translate-y-px ${state.gridOverlay ? 'bg-gradient-to-b from-gray-200 to-gray-400 text-black border-white shadow-glow-sm' : 'bg-[#151515] border-white/5 text-gray-500 hover:text-gray-200 shadow-tactile'}`}
                 >
                     <Icons.Grid3X3 size={14} />
                     <span className="text-[10px] font-bold">GRID</span>
                 </button>

                <div className="h-8 w-px bg-white/10 mx-1 hidden md:block" />

                <button onClick={() => actions.updateState({ isShortcutsOpen: true })} className={btnClass} title="Keyboard Shortcuts">
                    <Icons.Keyboard size={16} />
                </button>

                <button onClick={() => actions.updateState({ isCodeOpen: true })} className={btnClass} title="View GLSL Code">
                    <Icons.Code2 size={16} />
                </button>

                <button onClick={() => actions.updateState({ isSettingsOpen: true })} className={btnClass} title="Global Settings">
                    <Icons.Settings2 size={16} />
                </button>
                
                <button onClick={toggleRightPanel} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 md:hidden ml-1">
                    <Icons.PanelRight size={20} />
                </button>
            </div>
        </div>
    );
});
