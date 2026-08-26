import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useHistoryStack } from "@/core/state/useHistoryStack";
import { mockAppState } from "@/__tests__/helpers";

describe("useHistoryStack", () => {
  it("does not create undo entries until a snapshot is pushed", () => {
    const { result } = renderHook(() => useHistoryStack());
    expect(result.current.history.canUndo).toBe(false);
    expect(result.current.historyControl.getPrevious()).toBeNull();
  });

  it("restores the previous snapshot after two commits and undo", () => {
    const { result } = renderHook(() => useHistoryStack());
    const first = mockAppState({ animate: false });
    const second = mockAppState({ animate: true });

    act(() => {
      result.current.pushToHistory(first);
      result.current.pushToHistory(second);
    });

    expect(result.current.history.canUndo).toBe(true);
    const previous = result.current.historyControl.getPrevious();
    expect(previous?.animate).toBe(false);

    act(() => {
      result.current.historyControl.undo();
    });
    expect(result.current.historyControl.getNext()?.animate).toBe(true);
  });
});
