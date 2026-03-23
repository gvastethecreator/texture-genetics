
import React, { memo, useState } from 'react';
import * as Icons from 'lucide-react';
import { AppState, ViewMode, AnimationConfig } from '../../core/types/types';
import { TransformPanel } from './components/TransformPanel';
import { PostProcessPanel } from './components/PostProcessPanel';
import { RetroEffectsPanel } from './components/RetroEffectsPanel';
import { InteractivePanel } from './components/InteractivePanel';
import { ExportPanel } from './components/ExportPanel';
import { EnvironmentPanel } from './components/EnvironmentPanel';
import { MaterialPanel } from './components/MaterialPanel';

interface RightControlsProps {
  state: AppState;
  actions: {
      updateState: (s: Partial<AppState>) => void;
      updateParams: (p: Partial<AppState['params']>) => void;
      updateParamAnimation: (key: string, config: AnimationConfig) => void;
      exportPresets: () => void;
      importPresets: (file: File) => void;
  };
  history: {
      commit: () => void;
  }
  onDownload: (overrideViewMode?: ViewMode) => void;
  onSpriteSheet: () => void;
  onGifExport: () => void;
  onVideoRecord?: () => void;
  onHtmlExport: () => void;
  onGlbExport: () => void;
  isGenerating?: boolean;
  onDownloadZip: () => void;
}

export const RightControls: React.FC<RightControlsProps> = memo(({ 
  state, actions, history, onDownload, onSpriteSheet, onGifExport, onVideoRecord, onHtmlExport, onGlbExport, isGenerating, onDownloadZip
}) => {
  
  const [activeTab, setActiveTab] = useState<'texture' | 'scene'>('texture');

  const updateStateGroup = React.useCallback(<K extends keyof AppState>(key: K, values: Partial<AppState[K]>) => {
      actions.updateState({ [key]: { ...(state[key] as object), ...values } } as Partial<AppState>);
  }, [actions, state]);

  return (
    <div className="h-full bg-panel flex flex-col border-l border-border">
        
        {/* TAB HEADER */}
        <div className="flex border-b border-border bg-[#0a0a0a]">
            <button 
                onClick={() => setActiveTab('texture')}
                className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'texture' ? 'text-white bg-[#151515]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
            >
                <Icons.Layers size={14} className={activeTab === 'texture' ? 'text-purple-400' : ''} />
                Texture & Export
                {activeTab === 'texture' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />}
            </button>
            <div className="w-px bg-border" />
            <button 
                onClick={() => setActiveTab('scene')}
                className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'scene' ? 'text-white bg-[#151515]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
            >
                <Icons.Box size={14} className={activeTab === 'scene' ? 'text-amber-400' : ''} />
                Scene & Light
                {activeTab === 'scene' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
            </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 scrollbar-thin pb-24 md:pb-6" style={{ overscrollBehavior: 'contain' }}>
            
            {/* --- TEXTURE TAB --- */}
            {activeTab === 'texture' && (
                <div className="animate-in fade-in slide-in-from-right-2 duration-200 space-y-1">
                    <TransformPanel 
                        state={state}
                        onChangeState={actions.updateState}
                        updateStateGroup={updateStateGroup}
                        onCommit={history.commit}
                        onUpdateAnim={actions.updateParamAnimation}
                    />

                    <MaterialPanel 
                        state={state}
                        updateStateGroup={updateStateGroup}
                        onCommit={history.commit}
                        onUpdateAnim={actions.updateParamAnimation}
                    />

                    <PostProcessPanel 
                        state={state} 
                        updateStateGroup={updateStateGroup} 
                        onCommit={history.commit} 
                        onUpdateAnim={actions.updateParamAnimation}
                    />

                    <RetroEffectsPanel 
                        state={state} 
                        updateStateGroup={updateStateGroup} 
                        onCommit={history.commit} 
                        onUpdateAnim={actions.updateParamAnimation}
                    />

                    <ExportPanel 
                        state={state}
                        updateStateGroup={updateStateGroup}
                        onSpriteSheet={onSpriteSheet}
                        onGifExport={onGifExport}
                        onVideoRecord={onVideoRecord}
                        onHtmlExport={onHtmlExport}
                        onGlbExport={onGlbExport}
                        isGenerating={isGenerating}
                        onCommit={history.commit}
                        onDownload={onDownload}
                        onChangeState={actions.updateState}
                        exportPresets={actions.exportPresets}
                        importPresets={actions.importPresets}
                        onDownloadZip={onDownloadZip}
                    />
                </div>
            )}

            {/* --- SCENE TAB --- */}
            {activeTab === 'scene' && (
                <div className="animate-in fade-in slide-in-from-right-2 duration-200 space-y-1">
                    <EnvironmentPanel 
                        state={state} 
                        updateStateGroup={updateStateGroup} 
                        onCommit={history.commit} 
                        onUpdateAnim={actions.updateParamAnimation}
                    />

                    <InteractivePanel 
                        state={state}
                        updateStateGroup={updateStateGroup}
                        onCommit={history.commit}
                    />
                    
                    <div className="mt-4 p-4 border border-dashed border-white/10 rounded-lg text-center">
                        <Icons.Info size={16} className="mx-auto mb-2 text-gray-500" />
                        <p className="text-[10px] text-gray-500">
                            Scene settings affect the 3D preview viewport but are not applied to the exported texture maps (except Video/GIF/Screenshot).
                        </p>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
});
