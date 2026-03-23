
import React, { memo } from 'react';
import * as Icons from 'lucide-react';
import { AppState, AnimationConfig } from '../../../core/types/types';
import { ControlSection, Label, Slider, Toggle } from '../../../shared/ui/Elements';

interface MaterialPanelProps {
    state: AppState;
    updateStateGroup: <K extends keyof AppState>(key: K, values: Partial<AppState[K]>) => void;
    onUpdateAnim?: (key: string, config: AnimationConfig) => void;
    onCommit: () => void;
}

const MATERIAL_PRESETS = [
    { name: 'Matte', roughness: 0.9, metalness: 0.0, lightIntensity: 1.0 },
    { name: 'Plastic', roughness: 0.2, metalness: 0.0, lightIntensity: 1.2 },
    { name: 'Metal', roughness: 0.2, metalness: 1.0, lightIntensity: 1.5 },
    { name: 'Chrome', roughness: 0.0, metalness: 1.0, lightIntensity: 1.8 },
    { name: 'Emissive', roughness: 1.0, metalness: 0.0, lightIntensity: 3.0 },
];

export const MaterialPanel: React.FC<MaterialPanelProps> = memo(({ state, updateStateGroup, onCommit, onUpdateAnim }) => {
    const _update = onUpdateAnim || ((k: string, c: AnimationConfig) => {});

    const applyPreset = (preset: typeof MATERIAL_PRESETS[0]) => {
        updateStateGroup('environment', {
            roughness: preset.roughness,
            metalness: preset.metalness,
            lightIntensity: preset.lightIntensity
        });
        onCommit();
    };

    return (
        <ControlSection title="Material & Depth" icon={Icons.BoxSelect} color="#10B981">
            
            <div className="mb-4">
                <Label label="Material Presets" />
                <div className="grid grid-cols-5 gap-1">
                    {MATERIAL_PRESETS.map((p) => (
                        <button
                            key={p.name}
                            onClick={() => applyPreset(p)}
                            className="bg-black/20 hover:bg-white/10 border border-white/5 rounded py-1.5 text-[9px] font-medium text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
                            title={`Apply ${p.name}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 mb-1">
                     <Icons.Box size={12} className="text-gray-500" />
                     <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Geometry Config</span>
                </div>
                <Toggle label="Enable Bevel (3D Shapes)" checked={state.geometryConfig.bevelEnabled} onChange={(v) => updateStateGroup('geometryConfig', { bevelEnabled: v })} onCommit={onCommit} />
                {state.geometryConfig.bevelEnabled && (
                    <div className="mt-2 pl-2 border-l-2 border-accent-primary/20 space-y-2 animate-in fade-in">
                        <div><Label label="Bevel Thickness" /><Slider min={0.01} max={0.2} step={0.01} value={state.geometryConfig.bevelThickness} onChange={(v) => updateStateGroup('geometryConfig', { bevelThickness: v })} onCommit={onCommit} /></div>
                        <div><Label label="Bevel Size" /><Slider min={0.01} max={0.2} step={0.01} value={state.geometryConfig.bevelSize} onChange={(v) => updateStateGroup('geometryConfig', { bevelSize: v })} onCommit={onCommit} /></div>
                        <div><Label label="Bevel Segments" /><Slider min={1} max={10} step={1} value={state.geometryConfig.bevelSegments} onChange={(v) => updateStateGroup('geometryConfig', { bevelSegments: v })} onCommit={onCommit} /></div>
                    </div>
                )}
                <div className="mt-2 pl-2 space-y-2">
                    <div><Label label="Rounding / Radius" /><Slider min={0.0} max={1.0} step={0.01} value={state.geometryConfig.rounding} onChange={(v) => updateStateGroup('geometryConfig', { rounding: v })} onCommit={onCommit} /></div>
                    <div><Label label="Smoothness (Segments)" /><Slider min={8} max={128} step={1} value={state.geometryConfig.smoothness} onChange={(v) => updateStateGroup('geometryConfig', { smoothness: v })} onCommit={onCommit} /></div>
                </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-white/5">
                <Toggle label="Generate Normal Map" checked={state.normalMap.enabled} onChange={(v) => updateStateGroup('normalMap', { enabled: v })} onCommit={onCommit} />
                {state.normalMap.enabled && (
                    <div className="mt-2 mb-4 pl-2 border-l-2 border-accent-primary/20 space-y-2 animate-in fade-in">
                        <div>
                            <Label label="Strength" description="Controls the intensity/depth of the normal map bumps." />
                            <Slider 
                                min={0.1} 
                                max={5.0} 
                                step={0.1} 
                                value={state.normalMap.strength} 
                                onChange={(v) => updateStateGroup('normalMap', { strength: v })} 
                                onCommit={onCommit} 
                                animConfig={state.paramAnimations['normalMap.strength']}
                                onAnimChange={(c) => _update('normalMap.strength', c)}
                            />
                        </div>
                        <div><Label label="Smoothness" /><Slider min={0.0} max={1.0} step={0.01} value={state.normalMap.smoothness} onChange={(v) => updateStateGroup('normalMap', { smoothness: v })} onCommit={onCommit} /></div>
                        <Toggle label="Invert Y" checked={state.normalMap.invert} onChange={(v) => updateStateGroup('normalMap', { invert: v })} onCommit={onCommit} />
                    </div>
                )}
            </div>
            
            <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 mb-1">
                     <Icons.Rainbow size={12} className="text-gray-500" />
                     <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Holographic Foil</span>
                </div>
                <Toggle label="Enable Holo Effect" checked={state.environment.holographic} onChange={(v) => updateStateGroup('environment', { holographic: v })} onCommit={onCommit} />
                {state.environment.holographic && (
                     <div className="mt-2 pl-2 border-l-2 border-accent-primary/20 animate-in fade-in">
                        <Label label="Foil Strength" /><Slider min={0} max={2.0} step={0.1} value={state.environment.holoStrength} onChange={(v) => updateStateGroup('environment', { holoStrength: v })} onCommit={onCommit} />
                    </div>
                )}
            </div>

            <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 mb-1">
                    <Icons.MoveVertical size={12} className="text-gray-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Height / Displacement</span>
                </div>
                 <div className="space-y-2 pl-2">
                    <div>
                        <Label label="Strength" />
                        <Slider min={0.1} max={2.0} step={0.1} value={state.displacement.strength} onChange={(v) => updateStateGroup('displacement', { strength: v })} onCommit={onCommit} 
                        animConfig={state.paramAnimations['displacement.strength']}
                        onAnimChange={(c) => _update('displacement.strength', c)}
                        />
                    </div>
                    <div><Label label="Bias" /><Slider min={-1.0} max={1.0} step={0.01} value={state.displacement.bias} onChange={(v) => updateStateGroup('displacement', { bias: v })} onCommit={onCommit} /></div>
                </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-white/5">
                 <Toggle label="Ambient Occlusion" checked={state.ao.enabled} onChange={(v) => updateStateGroup('ao', { enabled: v })} onCommit={onCommit} />
                 {state.ao.enabled && (
                    <div className="mt-2 pl-2 border-l-2 border-accent-primary/20 space-y-2 animate-in fade-in">
                        <div>
                            <Label label="Occlusion Power" />
                            <Slider min={0} max={3.0} step={0.1} value={state.ao.strength} onChange={(v) => updateStateGroup('ao', { strength: v })} onCommit={onCommit} 
                            animConfig={state.paramAnimations['ao.strength']}
                            onAnimChange={(c) => _update('ao.strength', c)}
                            />
                        </div>
                        <div>
                            <Label label="Radius" />
                            <Slider min={0.1} max={1.0} step={0.01} value={state.ao.radius} onChange={(v) => updateStateGroup('ao', { radius: v })} onCommit={onCommit} 
                            animConfig={state.paramAnimations['ao.radius']}
                            onAnimChange={(c) => _update('ao.radius', c)}
                            />
                        </div>
                    </div>
                 )}
            </div>

        </ControlSection>
    );
});
