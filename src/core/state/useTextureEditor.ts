import { useMemo, useCallback, useRef } from "react";
import { AppState } from "../types/types";
import { useAppState } from "./useAppState";
import { useHistoryStack } from "./useHistoryStack";
import { usePresetManager } from "./usePresetManager";
import { useToastManager } from "./useToastManager";

/**
 * The main orchestrator hook for the texture editor.
 * It composes other modular hooks to provide a complete state and actions object
 * to the application, without containing the implementation details itself.
 */
export const useTextureEditor = () => {
  const { toasts, addToast, removeToast } = useToastManager();

  // Ref-based callback registration to avoid mutable action objects
  const historyCallbackRef = useRef<(s: AppState) => void>(() => {});
  const handleStorageWarning = useCallback(
    (message: string) => addToast("error", message),
    [addToast],
  );

  const { state, actions: stateActions } = useAppState({
    onStateChangeForHistory: (s: AppState) => historyCallbackRef.current(s),
    onStorageWarning: handleStorageWarning,
  });

  const { history, pushToHistory, historyControl } = useHistoryStack();

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

  const enhancedHistory = useMemo(
    () => ({
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      undo: handleUndo,
      redo: handleRedo,
      commit: () => pushToHistory(state),
    }),
    [history.canUndo, history.canRedo, handleUndo, handleRedo, pushToHistory, state],
  );

  const { userPresets, actions: presetActions } = usePresetManager({
    initialState: state,
    onLoadPreset: (newState) => {
      stateActions.loadPreset(newState);
      addToast("success", "Preset loaded successfully");
    },
    addToast,
  });

  // Combine actions from all hooks into a single object
  const actions = useMemo(
    () => ({
      ...stateActions,
      ...presetActions,
      addToast,
      removeToast,
    }),
    [stateActions, presetActions, addToast, removeToast],
  );

  return {
    state,
    history: enhancedHistory,
    actions,
    userPresets,
    toasts,
  };
};
