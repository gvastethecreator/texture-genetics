
import React, { memo, useCallback } from 'react';
import { AppState, TextureType, AnimationConfig } from '../../core/types/types';
import { PatternPanel } from './components/PatternPanel';
import { ColorPanel } from './components/ColorPanel';
import { LayersPanel } from './components/LayersPanel';
import { StickerPanel } from './components/StickerPanel';
import { PatternLibrary } from './components/PatternLibrary';
import { GeometryPanel } from './components/GeometryPanel';

interface LeftControlsProps {
  state: AppState;
  actions: {
      updateState: (s: Partial<AppState>) => void;
      updateParams: (p: Partial<AppState['params']>) => void;
      updateParamAnimation: (key: string, config: AnimationConfig) => void;
      selectTexture: (t: TextureType) => void;
      randomizeParams: () => void;
      randomizePalette: () => void;
      randomizePatternSelection: () => void;
  };
  history: {
      commit: () => void;
  }
}

export const Controls: React.FC<LeftControlsProps> = memo(({ 
  state, actions, history
}) => {
  
  // Wrapper for group updates
  const updateStateGroup = useCallback(<K extends keyof AppState>(key: K, values: Partial<AppState[K]>) => {
      actions.updateState({ [key]: { ...(state[key] as object), ...values } } as Partial<AppState>);
  }, [actions, state]);

  // FIX: Memoize updateBalance to prevent color panel jitter
  const updateBalance = useCallback((key: keyof AppState['colorBalance'], val: number | object, channel?: 'r'|'g'|'b') => {
      if (channel && typeof val === 'number') {
        const groupKey = key as 'shadows' | 'midtones' | 'highlights';
        const currentGroup = state.colorBalance[groupKey] as { r: number, g: number, b: number };
        actions.updateState({
            colorBalance: {
                ...state.colorBalance,
                [groupKey]: { ...currentGroup, [channel]: val }
            }
        });
      } else {
          actions.updateState({
              colorBalance: {
                  ...state.colorBalance,
                  [key]: val
              }
          });
      }
  }, [actions, state.colorBalance]);

  return (
    // FIX: Removed double flex container, improved scroll handling with overscroll-contain
    // Added specific padding for mobile vs desktop
    <div className="h-full bg-panel overflow-y-auto overflow-x-hidden p-3 space-y-1 scrollbar-thin pb-24 md:pb-6 border-r border-border" style={{ overscrollBehavior: 'contain' }}>
        
        {/* INPUT SECTION: Pattern Library */}
        <PatternLibrary 
            currentType={state.textureType} 
            onSelect={actions.selectTexture}
            onRandom={actions.randomizePatternSelection} 
        />

        <GeometryPanel 
            state={state}
            updateStateGroup={updateStateGroup}
            onCommit={history.commit}
        />

        {/* INPUT: Parameters */}
        <PatternPanel 
            state={state} 
            onChangeParams={actions.updateParams} 
            onChangeState={actions.updateState} 
            onUpdateAnim={actions.updateParamAnimation}
            onCommit={history.commit}
            onRandom={actions.randomizeParams}
        />
        
        {/* INPUT: Color */}
        <ColorPanel 
            state={state}
            onChangeParams={actions.updateParams}
            updateStateGroup={updateStateGroup}
            updateBalance={updateBalance}
            onCommit={history.commit}
            onUpdateAnim={actions.updateParamAnimation}
            onRandom={actions.randomizePalette}
        />
        
        {/* INPUT: Layers */}
        <LayersPanel 
            state={state}
            updateStateGroup={updateStateGroup}
            onCommit={history.commit}
            onUpdateAnim={actions.updateParamAnimation}
        />
        
        {/* INPUT: Sticker */}
        <StickerPanel 
            state={state}
            updateStateGroup={updateStateGroup}
            onCommit={history.commit}
        />

      </div>
  );
});
