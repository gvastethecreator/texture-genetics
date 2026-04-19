import { useState, useCallback, useEffect } from "react";
import { AppState } from "../types/types";

const MAX_HISTORY_SIZE = 30;

export const useHistoryStack = (initialState: AppState) => {
  const [history, setHistory] = useState<AppState[]>([initialState]);
  const [index, setIndex] = useState(0);

  const updateCurrentState = useCallback(
    (newState: AppState) => {
      setHistory((prev) => {
        if (index >= prev.length) return prev;
        const newHistory = [...prev];
        newHistory[index] = newState;
        return newHistory;
      });
    },
    [index],
  );

  // Sync external state changes into our current history view
  useEffect(() => {
    updateCurrentState(initialState);
  }, [initialState, updateCurrentState]);

  const pushToHistory = useCallback(
    (newState: AppState) => {
      setHistory((prev) => {
        const currentIndex = index;
        const newHistory = prev.slice(0, currentIndex + 1);
        if (newHistory.length >= MAX_HISTORY_SIZE) {
          newHistory.shift();
        }
        newHistory.push(newState);
        return newHistory;
      });
      setIndex((prev) => {
        const newIndex = prev + 1;
        return Math.min(newIndex, MAX_HISTORY_SIZE - 1);
      });
    },
    [index],
  );

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex((prev) => prev - 1);
    }
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex((prev) => prev + 1);
    }
  }, [index, history.length]);

  const resetHistory = useCallback((state: AppState) => {
    setHistory([state]);
    setIndex(0);
  }, []);

  return {
    history: {
      canUndo: index > 0,
      canRedo: index < history.length - 1,
      undo,
      redo,
      commit: () => pushToHistory(history[index]),
    },
    currentState: history[index],
    updateCurrentState,
    pushToHistory,
    resetHistory,
    // Exposed for Orchestrator to peek at state during sync
    // Return frozen copies to prevent external mutation
    historyControl: {
      undo,
      redo,
      getPrevious: () => {
        if (index > 0) {
          const prev = history[index - 1];
          return JSON.parse(JSON.stringify(prev));
        }
        return null;
      },
      getNext: () => {
        if (index < history.length - 1) {
          const next = history[index + 1];
          return JSON.parse(JSON.stringify(next));
        }
        return null;
      },
    },
  };
};
