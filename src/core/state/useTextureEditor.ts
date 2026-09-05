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

  const historyCallbackRef = useRef<(s: AppState) => void>(() => {});
  const handleStorageWarning = useCallback(
    (message: string) => addToast("error", message),
    [addToast],
  );
  const onStateChangeForHistory = useCallback((s: AppState) => {
    historyCallbackRef.current(s);
  }, []);

  const { state, actions: stateActions } = useAppState({
    onStateChangeForHistory,
    onStorageWarning: handleStorageWarning,
  });

  const { history, pushToHistory, historyControl } = useHistoryStack();

  historyCallbackRef.current = pushToHistory;
  const stateRef = useRef(state);
  stateRef.current = state;

  const handleUndo = useCallback(() => {
    const prevState = historyControl.getPrevious();
    if (prevState) {
      historyControl.undo();
      stateActions.replaceState(prevState);
    }
  }, [historyControl, stateActions]);

  const handleRedo = useCallback(() => {
    const nextState = historyControl.getNext();
    if (nextState) {
      historyControl.redo();
      stateActions.replaceState(nextState);
    }
  }, [historyControl, stateActions]);

  const commit = useCallback(() => {
    pushToHistory(stateRef.current);
  }, [pushToHistory]);

  const enhancedHistory = useMemo(
    () => ({
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      undo: handleUndo,
      redo: handleRedo,
      commit,
    }),
    [history.canUndo, history.canRedo, handleUndo, handleRedo, commit],
  );

  const onLoadPreset = useCallback(
    (newState: Partial<AppState>) => {
      stateActions.loadPreset(newState);
      addToast("success", "Preset loaded successfully");
    },
    [stateActions, addToast],
  );

  const { userPresets, actions: presetActions } = usePresetManager({
    initialState: state,
    onLoadPreset,
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
