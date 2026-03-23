
import React, { useMemo } from 'react';
import * as Icons from 'lucide-react';
import { AppState, TextureType } from '../../core/types/types';
import { TEXTURE_CATEGORIES } from '../../data/textureData';
import { PortalTooltip } from '../../shared/ui/Elements';

interface StatusBarProps {
    state: AppState;
}

const Node: React.FC<{ icon: Icons.LucideIcon; label: string; color?: string; subLabel?: string; tooltip?: string }> = ({ icon: Icon, label, color = "gray", subLabel, tooltip }) => {
    const nodeContent = (
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#151515] border border-white/5 rounded-lg shadow-tactile min-w-fit group hover:bg-[#202020] hover:border-white/10 transition-all cursor-default relative overflow-hidden">
            {/* Color accent line */}
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
            
            <div className={`p-1 rounded bg-black/40 text-gray-200 shadow-inner border border-white/5`}>
                <Icon size={12} style={{ color: color }} />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-200 leading-tight whitespace-nowrap tracking-wide">{label}</span>
                {subLabel && <span className="text-[8px] text-gray-500 leading-tight font-mono uppercase">{subLabel}</span>}
            </div>
        </div>
    );

    if (tooltip) {
        return (
            <PortalTooltip label={tooltip}>
                {nodeContent}
            </PortalTooltip>
        );
    }
    return nodeContent;
};

const Arrow = () => (
    <div className="text-gray-700 px-1 opacity-50">
        <Icons.ChevronRight size={14} strokeWidth={3} />
    </div>
);

export const StatusBar: React.FC<StatusBarProps> = ({ state }) => {
    
    const categoryInfo = useMemo(() => {
        const entry = Object.values(TEXTURE_CATEGORIES).find(cat => cat.types.includes(state.textureType));
        return entry ? { color: entry.color, icon: entry.icon } : { color: '#E0E0E0', icon: Icons.Box };
    }, [state.textureType]);

    const recipeNodes = useMemo(() => {
        const nodes = [];

        nodes.push(
            <Node 
                key="gen" 
                icon={categoryInfo.icon} 
                label={state.textureType} 
                subLabel="GENERATOR"
                color={categoryInfo.color}
                tooltip={`Algorithm: ${state.textureType}`}
            />
        );

        if (state.baseTexture?.enabled && state.baseTexture.texture) {
            nodes.push(<Arrow key="a1" />);
            nodes.push(
                <Node 
                    key="base" 
                    icon={Icons.Image} 
                    label="Image Base" 
                    subLabel={`OP: ${state.baseTexture.opacity.toFixed(1)}`}
                    color="#F59E0B"
                    tooltip="Custom Image Background"
                />
            );
        }

        if (state.blending.enabled) {
            nodes.push(<Arrow key="a2" />);
            nodes.push(
                <Node 
                    key="blend" 
                    icon={Icons.Layers} 
                    label={state.blending.type} 
                    subLabel="LAYER 2"
                    color="#F59E0B"
                    tooltip={`Blended with Layer 1`} 
                />
            );
        }

        if (state.tiling.enabled) {
            nodes.push(<Arrow key="a3" />);
            nodes.push(
                <Node 
                    key="tile" 
                    icon={Icons.Grid} 
                    label={`Tiled ${state.tiling.repeatX}x${state.tiling.repeatY}`}
                    color="#10B981" 
                    tooltip="Seamless Tiling Active"
                />
            );
        }
        
        const activeEffects = [];
        if (state.normalMap.enabled) activeEffects.push({ l: 'Normal', c: '#10B981' });
        if (state.postProcess.glitch) activeEffects.push({ l: 'Glitch', c: '#EC4899' });
        if (state.postProcess.bloom) activeEffects.push({ l: 'Bloom', c: '#8B5CF6' });
        
        if (activeEffects.length > 0) {
            nodes.push(<Arrow key="a4" />);
            nodes.push(
                <div key="fx" className="flex -space-x-2 pl-1">
                    {activeEffects.map((fx, i) => (
                        <PortalTooltip key={i} label={fx.l}>
                            <div className="w-7 h-7 rounded-full bg-[#151515] border-2 border-[#2a2a2a] flex items-center justify-center text-[8px] font-bold text-gray-300 z-10 hover:z-20 hover:scale-110 hover:border-white transition-all shadow-lg cursor-help" style={{ color: fx.c }}>
                                {fx.l[0]}
                            </div>
                        </PortalTooltip>
                    ))}
                </div>
            );
        }

        return nodes;
    }, [state, categoryInfo]);

    return (
        <div className="h-12 border-t border-white/5 bg-[#080808] flex items-center justify-between px-6 select-none relative z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <div 
                className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[75%]"
                style={{ 
                    maskImage: 'linear-gradient(to right, black 95%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, black 95%, transparent 100%)' 
                }}
            >
                <span className="text-[9px] font-black text-gray-700 mr-3 uppercase tracking-[0.2em] hidden md:block">Signal Flow</span>
                {recipeNodes}
            </div>

            <div className="flex items-center gap-6 text-[10px] font-mono font-bold text-gray-500">
                <div className="flex items-center gap-2 bg-[#121212] px-2 py-1 rounded border border-white/5 shadow-inner">
                    <Icons.Monitor size={12} className="text-blue-500" />
                    <span>{state.resolution}px</span>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-[#121212] px-2 py-1 rounded border border-white/5 shadow-inner">
                    <Icons.FileImage size={12} className="text-amber-500" />
                    <span className="uppercase">{state.settings.exportFormat}</span>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-[#121212] px-2 py-1 rounded border border-white/5 shadow-inner">
                    <div className={`w-2 h-2 rounded-full ${state.animate ? 'bg-green-500 animate-pulse shadow-glow-sm' : 'bg-red-500'}`} />
                    <span>{state.animate ? 'LIVE' : 'STOP'}</span>
                </div>
            </div>
        </div>
    );
};
