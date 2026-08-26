import { useState, useCallback } from "react";
import { AppState } from "../types/types";

const MAX_HISTORY_SIZE = 30;

const cloneState = (state: AppState): AppState => JSON.parse(JSON.stringify(state)) as AppState;

export const useHistoryStack = () => {
  const [stack, setStack] = useState<{ entries: AppState[]; index: number }>({
    entries: [],
    index: -1,
  });

  const pushToHistory = useCallback((newState: AppState) => {
    const snapshot = cloneState(newState);
    setStack((prev) => {
      const truncated = prev.entries.slice(0, prev.index + 1);
      truncated.push(snapshot);
      if (truncated.length > MAX_HISTORY_SIZE) truncated.shift();
      return { entries: truncated, index: truncated.length - 1 };
    });
  }, []);

  const undo = useCallback(() => {
    setStack((prev) => ({
      ...prev,
      index: prev.index > 0 ? prev.index - 1 : prev.index,
    }));
  }, []);

  const redo = useCallback(() => {
    setStack((prev) => ({
      ...prev,
      index: prev.index < prev.entries.length - 1 ? prev.index + 1 : prev.index,
    }));
  }, []);

  return {
    history: {
      canUndo: stack.index > 0,
      canRedo: stack.index >= 0 && stack.index < stack.entries.length - 1,
      undo,
      redo,
    },
    pushToHistory,
    historyControl: {
      undo,
      redo,
      getPrevious: () => (stack.index > 0 ? cloneState(stack.entries[stack.index - 1]) : null),
      getNext: () =>
        stack.index >= 0 && stack.index < stack.entries.length - 1
          ? cloneState(stack.entries[stack.index + 1])
          : null,
    },
  };
};
