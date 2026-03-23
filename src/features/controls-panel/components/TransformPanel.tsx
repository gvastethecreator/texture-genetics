
import React, { memo } from 'react';
import * as Icons from 'lucide-react';
import { AppState, AnimationConfig } from '../../../core/types/types';
import { ControlSection, Label, Slider, Toggle } from '../../../shared/ui/Elements';

interface TransformPanelProps {
    state: AppState;
    onChangeState: (s: Partial<AppState>) => void;
    updateStateGroup: <K extends keyof AppState>(key: K, values: Partial<AppState[K]>) => void;
    onUpdateAnim?: (key: string, config: AnimationConfig) => void;
    onCommit: () => void;
}

const TILING_PRESETS = [
    { label: '2x2 Wrap', settings: { repeatX: 2, repeatY: 2, mirror: false, scale: 1, rotation: 0, offsetX: 0, offsetY: 0 } },
    { label: '2x2 Mirror', settings: { repeatX: 2, repeatY: 2, mirror: true, scale: 1, rotation: 0, offsetX: 0, offsetY: 0 } },
    { label: '3x3 Dense', settings: { repeatX: 3, repeatY: 3, mirror: false, scale: 1, rotation: 0, offsetX: 0, offsetY: 0 } },
    { label: 'Reset', settings: { repeatX: 1, repeatY: 1, mirror: false, scale: 1, rotation: 0, offsetX: 0, offsetY: 0 } },
];

export const TransformPanel: React.FC<TransformPanelProps> = memo(({ state, onChangeState, updateStateGroup, onCommit, onUpdateAnim }) => {
    // Helper to safely call update anim if available (it should be prop drilled)
    const _update = onUpdateAnim || ((k: string, c: AnimationConfig) => {});

    const applyTilingPreset = (settings: Partial<AppState['tiling']>) => {
        updateStateGroup('tiling', settings);
        onCommit();
    };

    return (
        <ControlSection title="Transform & Tile" icon={Icons.Move} color="#10B981">
             <div className="space-y-3">
                 <div>
                    <Label label="Global Rotation" />
                    <Slider 
                        min={0} max={360} step={1} 
                        value={state.transform.angle} 
                        onChange={(v) => updateStateGroup('transform', { angle: v })} 
                        onCommit={onCommit}
                        animConfig={state.paramAnimations['transform.angle']}
                        onAnimChange={(c) => _update('transform.angle', c)} 
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label label="Global X" />
                        <Slider 
                            min={-1} max={1} 
                            value={state.transform.offsetX} 
                            onChange={(v) => updateStateGroup('transform', { offsetX: v })} 
                            onCommit={onCommit} 
                            animConfig={state.paramAnimations['transform.offsetX']}
                            onAnimChange={(c) => _update('transform.offsetX', c)} 
                        />
                    </div>
                    <div>
                        <Label label="Global Y" />
                        <Slider 
                            min={-1} max={1} 
                            value={state.transform.offsetY} 
                            onChange={(v) => updateStateGroup('transform', { offsetY: v })} 
                            onCommit={onCommit} 
                            animConfig={state.paramAnimations['transform.offsetY']}
                            onAnimChange={(c) => _update('transform.offsetY', c)} 
                        />
                    </div>
                 </div>
             </div>
             
             <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
                 <div className="flex items-center gap-2 mb-1 text-accent-primary">
                     <Icons.Snowflake size={12} />
                     <span className="text-[10px] font-bold uppercase tracking-wider">Symmetry</span>
                 </div>
                 <Toggle label="Enable Kaleidoscope" checked={state.symmetry.enabled} onChange={(v) => updateStateGroup('symmetry', { enabled: v })} onCommit={onCommit} />
                 
                 {state.symmetry.enabled && (
                     <div className="pl-2 border-l-2 border-accent-primary/20 space-y-2 animate-in fade-in">
                        <div><Label label="Segments" /><Slider min={2} max={16} step={1} value={state.symmetry.segments} onChange={(v) => updateStateGroup('symmetry', { segments: v })} onCommit={onCommit} /></div>
                        <div><Label label="Zoom" /><Slider min={0.1} max={3.0} step={0.1} value={state.symmetry.zoom} onChange={(v) => updateStateGroup('symmetry', { zoom: v })} onCommit={onCommit} /></div>
                        <div><Label label="Rotation" /><Slider min={0} max={360} step={1} value={state.symmetry.rotation} onChange={(v) => updateStateGroup('symmetry', { rotation: v })} onCommit={onCommit} /></div>
                     </div>
                 )}
             </div>
             
             <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                    <Toggle label="Seamless Tiling" checked={state.tiling.enabled} onChange={(v) => updateStateGroup('tiling', { enabled: v })} onCommit={onCommit} />
                    <button 
                        onClick={() => onChangeState({ tileMode: !state.tileMode })}
                        className={`text-[10px] px-2 py-1 rounded border transition-colors ${state.tileMode ? 'bg-accent-primary text-black border-transparent font-bold' : 'text-gray-400 border-gray-700 hover:text-white'}`}
                        title="Zoom out to check tiling continuity"
                    >
                        {state.tileMode ? 'Exit Test' : 'Tile Test'}
                    </button>
                </div>

                {state.tiling.enabled && (
                    <div className="space-y-3 mt-2 animate-in fade-in zoom-in-95 bg-black/20 p-2 rounded">
                        
                        <div className="grid grid-cols-4 gap-1 mb-2">
                            {TILING_PRESETS.map(p => (
                                <button
                                    key={p.label}
                                    onClick={() => applyTilingPreset(p.settings)}
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded py-1.5 text-[9px] font-medium text-gray-300 hover:text-white transition-colors"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between items-center mb-2">
                             <Toggle label="Show Grid" checked={state.tilingPreview} onChange={(v) => onChangeState({ tilingPreview: v })} />
                             <Toggle label="Mirror" checked={state.tiling.mirror} onChange={(v) => updateStateGroup('tiling', { mirror: v })} onCommit={onCommit} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pb-2 border-b border-white/5">
                            <div><Label label="Repeat X" /><Slider min={1} max={10} step={1} value={state.tiling.repeatX} onChange={(v) => updateStateGroup('tiling', { repeatX: v })} onCommit={onCommit} /></div>
                            <div><Label label="Repeat Y" /><Slider min={1} max={10} step={1} value={state.tiling.repeatY} onChange={(v) => updateStateGroup('tiling', { repeatY: v })} onCommit={onCommit} /></div>
                        </div>

                        <div className="pt-1">
                            <div className="flex justify-between items-center mb-1">
                                <Label label="Tile Transform (Advanced)" />
                                <button 
                                    onClick={() => {
                                        updateStateGroup('tiling', { scale: 1.0, rotation: 0, offsetX: 0, offsetY: 0 });
                                        onCommit();
                                    }}
                                    className="text-gray-500 hover:text-white transition-colors"
                                    title="Reset Tile Transforms"
                                >
                                    <Icons.RotateCcw size={10} />
                                </button>
                            </div>
                            <div className="space-y-2 pl-1">
                                <div><Label label="Scale" /><Slider min={0.1} max={3.0} value={state.tiling.scale} onChange={(v) => updateStateGroup('tiling', { scale: v })} onCommit={onCommit} /></div>
                                <div><Label label="Rotation" /><Slider min={0} max={360} step={1} value={state.tiling.rotation} onChange={(v) => updateStateGroup('tiling', { rotation: v })} onCommit={onCommit} /></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><Label label="Offset X" /><Slider min={-1} max={1} value={state.tiling.offsetX} onChange={(v) => updateStateGroup('tiling', { offsetX: v })} onCommit={onCommit} /></div>
                                    <div><Label label="Offset Y" /><Slider min={-1} max={1} value={state.tiling.offsetY} onChange={(v) => updateStateGroup('tiling', { offsetY: v })} onCommit={onCommit} /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
             </div>
        </ControlSection>
    );
});
