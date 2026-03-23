
import React, { memo } from 'react';
import * as Icons from 'lucide-react';
import { AppState, AnimationConfig } from '../../../core/types/types';
import { ControlSection, Label, Slider, Toggle } from '../../../shared/ui/Elements';
import { ColorPicker } from '../../../shared/ui/ColorPicker';

interface PostProcessPanelProps {
    state: AppState;
    updateStateGroup: <K extends keyof AppState>(key: K, values: Partial<AppState[K]>) => void;
    onUpdateAnim?: (key: string, config: AnimationConfig) => void;
    onCommit: () => void;
}

export const PostProcessPanel: React.FC<PostProcessPanelProps> = memo(({ state, updateStateGroup, onCommit, onUpdateAnim }) => {
    const _update = onUpdateAnim || ((k: string, c: AnimationConfig) => {});

    return (
        <ControlSection title="Post FX & Distortion" icon={Icons.Fingerprint} color="#8B5CF6">
            <div className="p-2 mb-3 bg-purple-900/20 border border-purple-500/30 rounded">
                <Toggle 
                    label="Bake Effects into Texture?" 
                    checked={state.postProcess.applyToMap} 
                    onChange={(v) => updateStateGroup('postProcess', { applyToMap: v })} 
                    onCommit={onCommit} 
                />
                <p className="text-[9px] text-purple-300 mt-1 leading-tight">
                    If OFF, effects like Glitch, Bloom, and Grading only appear in the 3D Preview (Render Mode), not the exported map.
                </p>
            </div>

            <div className="space-y-3">
                <div>
                    <Label label="Domain Warp" />
                    <Slider min={0} max={2} step={0.01} value={state.params.distortion} onChange={(v) => updateStateGroup('params', { distortion: v })} onCommit={onCommit} 
                    animConfig={state.paramAnimations['distortion']}
                    onAnimChange={(c) => _update('distortion', c)}
                    />
                </div>
                <div>
                    <Label label="Detail (Octaves)" />
                    <Slider min={0} max={1} step={0.01} value={state.params.detail} onChange={(v) => updateStateGroup('params', { detail: v })} onCommit={onCommit} 
                    animConfig={state.paramAnimations['detail']}
                    onAnimChange={(c) => _update('detail', c)}
                    />
                </div>
                <div><Label label="Seed (Offset)" /><Slider min={0} max={100} step={1} value={state.params.seed} onChange={(v) => updateStateGroup('params', { seed: v })} onCommit={onCommit} /></div>
                
                <div className="pt-2 border-t border-white/5">
                    <Toggle label="Normalize Output (0-1)" checked={state.postProcess.normalize} onChange={(v) => updateStateGroup('postProcess', { normalize: v })} onCommit={onCommit} />
                </div>

                {/* --- NEW STYLIZED SECTION --- */}
                <div className="pt-2 border-t border-white/5 mt-2 space-y-3">
                    <div className="flex items-center gap-2 mb-1 text-purple-400">
                        <Icons.Palette size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Stylized Filters</span>
                    </div>
                    
                    {/* Halftone */}
                    <Toggle label="Halftone (Dot Matrix)" checked={state.postProcess.halftone} onChange={(v) => updateStateGroup('postProcess', { halftone: v })} onCommit={onCommit} />
                    {state.postProcess.halftone && (
                        <div className="pl-2 border-l-2 border-accent-primary/20 animate-in fade-in">
                            <Label label="Dot Scale" />
                            <Slider min={10} max={150} step={5} value={state.postProcess.halftoneScale} onChange={(v) => updateStateGroup('postProcess', { halftoneScale: v })} onCommit={onCommit} />
                        </div>
                    )}

                    {/* Edge Detect */}
                    <Toggle label="Neon Edges" checked={state.postProcess.edgeDetect} onChange={(v) => updateStateGroup('postProcess', { edgeDetect: v })} onCommit={onCommit} />
                    {state.postProcess.edgeDetect && (
                        <div className="pl-2 border-l-2 border-accent-primary/20 animate-in fade-in">
                            <ColorPicker label="Edge Color" color={state.postProcess.edgeColor} onChange={(c) => updateStateGroup('postProcess', { edgeColor: c })} onCommit={onCommit} />
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-white/5 space-y-2">
                    <Toggle label="Luma Alpha Mask" checked={state.imageAlpha.enabled} onChange={(v) => updateStateGroup('imageAlpha', { enabled: v })} onCommit={onCommit} />
                    {state.imageAlpha.enabled && (
                            <div className="mt-2 pl-2 border-l-2 border-accent-primary/20 space-y-2 animate-in fade-in">
                                <div><Label label="Threshold" /><Slider min={0} max={1} value={state.imageAlpha.threshold} onChange={(v) => updateStateGroup('imageAlpha', { threshold: v })} onCommit={onCommit} /></div>
                                <div><Label label="Tolerance" /><Slider min={0} max={0.5} value={state.imageAlpha.tolerance} onChange={(v) => updateStateGroup('imageAlpha', { tolerance: v })} onCommit={onCommit} /></div>
                                <div><Label label="Blur Edge" /><Slider min={0} max={0.2} value={state.imageAlpha.blur} onChange={(v) => updateStateGroup('imageAlpha', { blur: v })} onCommit={onCommit} /></div>
                            </div>
                        )}
                </div>
            </div>

            <div className="pt-3 border-t border-white/10 mt-3 space-y-3">
                <Label label="Photographic Effects" />
                
                <Toggle label="Polar Coordinates" checked={state.postProcess.polar} onChange={(v) => updateStateGroup('postProcess', { polar: v })} onCommit={onCommit} />
                
                <div className="pt-2 border-t border-white/5">
                    <Toggle label="Bloom" checked={state.postProcess.bloom} onChange={(v) => updateStateGroup('postProcess', { bloom: v })} onCommit={onCommit} />
                    {state.postProcess.bloom && (
                        <div className="pl-2 border-l-2 border-accent-primary/20 animate-in fade-in mt-1 space-y-2">
                            <div>
                                <Label label="Threshold" />
                                <Slider min={0} max={1} step={0.01} value={state.postProcess.bloomThreshold} onChange={(v) => updateStateGroup('postProcess', { bloomThreshold: v })} onCommit={onCommit} 
                                animConfig={state.paramAnimations['postProcess.bloomThreshold']}
                                onAnimChange={(c) => _update('postProcess.bloomThreshold', c)}
                                />
                            </div>
                            <div>
                                <Label label="Intensity" />
                                <Slider min={0} max={2} step={0.1} value={state.postProcess.bloomStrength} onChange={(v) => updateStateGroup('postProcess', { bloomStrength: v })} onCommit={onCommit} 
                                animConfig={state.paramAnimations['postProcess.bloomStrength']}
                                onAnimChange={(c) => _update('postProcess.bloomStrength', c)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-white/5">
                    <Toggle label="Gaussian Blur" checked={state.postProcess.blur} onChange={(v) => updateStateGroup('postProcess', { blur: v })} onCommit={onCommit} />
                    {state.postProcess.blur && (
                        <div className="pl-2 border-l-2 border-accent-primary/20 animate-in fade-in mt-1">
                            <Label label="Radius" />
                            <Slider min={0} max={5} step={0.1} value={state.postProcess.blurStrength} onChange={(v) => updateStateGroup('postProcess', { blurStrength: v })} onCommit={onCommit} 
                            animConfig={state.paramAnimations['postProcess.blurStrength']}
                            onAnimChange={(c) => _update('postProcess.blurStrength', c)}
                            />
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-white/5">
                    <Toggle label="Toon Shading (Cell)" checked={state.postProcess.toon} onChange={(v) => updateStateGroup('postProcess', { toon: v })} onCommit={onCommit} />
                    {state.postProcess.toon && (
                        <div className="pl-2 border-l-2 border-accent-primary/20 animate-in fade-in mt-1">
                            <Label label="Quantize Levels" /><Slider min={2} max={10} step={1} value={state.postProcess.toonLevels} onChange={(v) => updateStateGroup('postProcess', { toonLevels: v })} onCommit={onCommit} />
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-white/5">
                    <Toggle label="Posterize" checked={state.postProcess.posterize} onChange={(v) => updateStateGroup('postProcess', { posterize: v })} onCommit={onCommit} />
                    {state.postProcess.posterize && (
                        <div className="pl-2 border-l-2 border-accent-primary/20 animate-in fade-in mt-1">
                            <Label label="Color Levels" /><Slider min={2} max={32} step={1} value={state.postProcess.posterizeLevels} onChange={(v) => updateStateGroup('postProcess', { posterizeLevels: v })} onCommit={onCommit} />
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-white/5 space-y-2">
                    <div>
                        <Label label="Chromatic Aberration" />
                        <Slider min={0} max={1} step={0.01} value={state.postProcess.chromaticAberration} onChange={(v) => updateStateGroup('postProcess', { chromaticAberration: v })} onCommit={onCommit} 
                        animConfig={state.paramAnimations['postProcess.chromaticAberration']}
                        onAnimChange={(c) => _update('postProcess.chromaticAberration', c)}
                        />
                    </div>
                    <div>
                        <Label label="Radial Mask" />
                        <Slider min={0} max={1} value={state.postProcess.radialMask} onChange={(v) => updateStateGroup('postProcess', { radialMask: v })} onCommit={onCommit} 
                        animConfig={state.paramAnimations['postProcess.radialMask']}
                        onAnimChange={(c) => _update('postProcess.radialMask', c)}
                        />
                    </div>
                    <div>
                        <Label label="Vignette" />
                        <Slider min={0} max={1} value={state.postProcess.vignette} onChange={(v) => updateStateGroup('postProcess', { vignette: v })} onCommit={onCommit} 
                        animConfig={state.paramAnimations['postProcess.vignette']}
                        onAnimChange={(c) => _update('postProcess.vignette', c)}
                        />
                    </div>
                </div>
            </div>
        </ControlSection>
    );
});
