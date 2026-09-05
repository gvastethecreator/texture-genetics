import { useState, useCallback, useMemo, useRef } from "react";
import { AppState } from "../types/types";
import {
  collectStateObjectUrls,
  releaseObjectUrls,
  retainObjectUrls,
} from "../../shared/utils/objectUrls";
import { cloneHistorySnapshot } from "./historySnapshot";

const MAX_HISTORY_SIZE = 30;

const cloneState = (state: AppState): AppState => cloneHistorySnapshot(state);

type HistoryStack = { entries: AppState[]; index: number };

const emptyStack = (): HistoryStack => ({ entries: [], index: -1 });

export const useHistoryStack = () => {
  const [stack, setStack] = useState<HistoryStack>(emptyStack);
  const stackRef = useRef<HistoryStack>(stack);
  stackRef.current = stack;

  const pushToHistory = useCallback((newState: AppState) => {
    const snapshot = cloneState(newState);
    const prev = stackRef.current;
    const discarded: AppState[] =
      prev.index < prev.entries.length - 1 ? prev.entries.slice(prev.index + 1) : [];
    const truncated = prev.entries.slice(0, prev.index + 1);
    truncated.push(snapshot);
    if (truncated.length > MAX_HISTORY_SIZE) {
      const oldest = truncated.shift();
      if (oldest) discarded.push(oldest);
    }
    retainObjectUrls(collectStateObjectUrls(snapshot));
    for (const entry of discarded) {
      releaseObjectUrls(collectStateObjectUrls(entry));
    }
    const next = { entries: truncated, index: truncated.length - 1 };
    stackRef.current = next;
    setStack(next);
  }, []);

  const undo = useCallback(() => {
    const prev = stackRef.current;
    if (prev.index <= 0) return;
    const next = { entries: prev.entries, index: prev.index - 1 };
    stackRef.current = next;
    setStack(next);
  }, []);

  const redo = useCallback(() => {
    const prev = stackRef.current;
    if (prev.index < 0 || prev.index >= prev.entries.length - 1) return;
    const next = { entries: prev.entries, index: prev.index + 1 };
    stackRef.current = next;
    setStack(next);
  }, []);

  const getPrevious = useCallback(() => {
    const { entries, index } = stackRef.current;
    return index > 0 ? cloneState(entries[index - 1]) : null;
  }, []);

  const getNext = useCallback(() => {
    const { entries, index } = stackRef.current;
    return index >= 0 && index < entries.length - 1 ? cloneState(entries[index + 1]) : null;
  }, []);

  const history = useMemo(
    () => ({
      canUndo: stack.index > 0,
      canRedo: stack.index >= 0 && stack.index < stack.entries.length - 1,
      undo,
      redo,
    }),
    [stack.index, stack.entries.length, undo, redo],
  );

  const historyControl = useMemo(
    () => ({
      undo,
      redo,
      getPrevious,
      getNext,
    }),
    [undo, redo, getPrevious, getNext],
  );

  return {
    history,
    pushToHistory,
    historyControl,
  };
};
