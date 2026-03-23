
import React, { memo } from 'react';
import * as Icons from 'lucide-react';
import { AppState, MouseInteractionType } from '../../../core/types/types';
import { ControlSection, Label, Slider, Toggle } from '../../../shared/ui/Elements';

interface InteractivePanelProps {
    state: AppState;
    updateStateGroup: <K extends keyof AppState>(key: K, values: Partial<AppState[K]>) => void;
    onCommit: () => void;
}

export const InteractivePanel: React.FC<InteractivePanelProps> = memo(({ state, updateStateGroup, onCommit }) => {
    return (
        <ControlSection title="Interactive" icon={Icons.MousePointer2} color="#F59E0B">
            <div className="space-y-3">
                <Toggle label="Mouse Influence" checked={state.mouse.enabled} onChange={(v) => updateStateGroup('mouse', { enabled: v })} onCommit={onCommit} />
                
                {state.mouse.enabled && (
                    <div className="mt-2 pl-2 border-l-2 border-accent-primary/20 space-y-3 animate-in fade-in">
                        <div className="relative">
                            <Label label="Interaction Type" />
                            <select 
                                value={state.mouse.type}
                                onChange={(e) => updateStateGroup('mouse', { type: parseInt(e.target.value) })}
                                className="w-full bg-black/20 border border-white/5 text-gray-300 text-[10px] py-1.5 px-2 rounded appearance-none focus:outline-none focus:border-accent-primary transition-colors cursor-pointer"
                            >
                                <option value={MouseInteractionType.DISTORT}>Distort (Push/Pull)</option>
                                <option value={MouseInteractionType.MAGNIFY}>Magnify (Zoom)</option>
                                <option value={MouseInteractionType.SPOTLIGHT}>Spotlight (Reveal)</option>
                                <option value={MouseInteractionType.COLOR_SHIFT}>Color Shift (Hue)</option>
                            </select>
                            <Icons.ChevronDown size={12} className="absolute right-2 top-[22px] text-gray-500 pointer-events-none" />
                        </div>
                        <div><Label label="Strength" /><Slider min={-2.0} max={2.0} step={0.1} value={state.mouse.strength} onChange={(v) => updateStateGroup('mouse', { strength: v })} onCommit={onCommit} /></div>
                        <div><Label label="Radius" /><Slider min={0.05} max={0.5} step={0.01} value={state.mouse.radius} onChange={(v) => updateStateGroup('mouse', { radius: v })} onCommit={onCommit} /></div>
                    </div>
                )}
            </div>
        </ControlSection>
    );
});
