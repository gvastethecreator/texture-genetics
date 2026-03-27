
import { useMemo, useCallback, useRef } from 'react';
import { AppState } from '../types/types';
import { useAppState } from './useAppState';
import { useHistoryStack } from './useHistoryStack';
import { usePresetManager } from './usePresetManager';
import { useToastManager } from './useToastManager';

/**
 * The main orchestrator hook for the texture editor.
 * It composes other modular hooks to provide a complete state and actions object
 * to the application, without containing the implementation details itself.
 */
export const useTextureEditor = () => {
    const { toasts, addToast, removeToast } = useToastManager();

    // Ref-based callback registration to avoid mutable action objects
    const historyCallbackRef = useRef<(s: AppState) => void>(() => {});
    
    const { 
        state, 
        actions: stateActions,
        isBusy 
    } = useAppState({ onStateChangeForHistory: (s: AppState) => historyCallbackRef.current(s) });

    // History stack tracks the AppState
    const { 
        history, 
        currentState,
        updateCurrentState,
        pushToHistory,
        resetHistory,
        historyControl 
    } = useHistoryStack(state);

    // During initialization/history synchronization, currentState can be
    // temporarily undefined. Fall back to the source app state to avoid
    // runtime crashes in render paths that access state fields directly.
    const stableState = currentState ?? state;
    
    // Wire up callback via ref (safe with StrictMode)
    historyCallbackRef.current = pushToHistory;

    // --- HISTORY SYNCHRONIZATION ---
    // When Undo/Redo happens, the 'currentState' (from history) updates.
    // We must forcibly sync this back to 'useAppState' so that subsequent edits
    // branch off the UNDONE state, not the old FUTURE state.
    
    const handleUndo = useCallback(() => {
        const prevState = historyControl.getPrevious();
        if (prevState) {
            historyControl.undo();
            stateActions.replaceState(prevState); // CRITICAL FIX
        }
    }, [historyControl, stateActions]);

    const handleRedo = useCallback(() => {
        const nextState = historyControl.getNext();
        if (nextState) {
            historyControl.redo();
            stateActions.replaceState(nextState); // CRITICAL FIX
        }
    }, [historyControl, stateActions]);

    const enhancedHistory = useMemo(() => ({
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        undo: handleUndo,
        redo: handleRedo,
        commit: history.commit
    }), [history.canUndo, history.canRedo, handleUndo, handleRedo, history.commit]);


    const { userPresets, actions: presetActions } = usePresetManager({
        initialState: currentState,
        onLoadPreset: (newState) => {
            stateActions.loadPreset(newState);
            addToast('success', 'Preset loaded successfully');
        },
        addToast
    });
    
    // Combine actions from all hooks into a single object
    const actions = useMemo(() => ({
        ...stateActions,
        ...presetActions,
        addToast,
        removeToast,
    }), [stateActions, presetActions, addToast, removeToast]);

    return {
        state: stableState,
        history: enhancedHistory,
        actions,
        userPresets,
        isBusy,
        toasts
    };
};
