import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAppState } from "@/core/state/useAppState";

vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

describe("useAppState", () => {
  it("commits the current document before randomize", () => {
    const onStateChangeForHistory = vi.fn();
    const { result } = renderHook(() => useAppState({ onStateChangeForHistory }));

    act(() => {
      result.current.actions.updateState({ animate: false });
    });
    onStateChangeForHistory.mockClear();

    act(() => {
      result.current.actions.randomize();
    });

    expect(onStateChangeForHistory).toHaveBeenCalledOnce();
    expect(onStateChangeForHistory.mock.calls[0][0].animate).toBe(false);
  });

  it("keeps the actions bag identity across param-only edits", () => {
    const { result } = renderHook(() => useAppState({ onStateChangeForHistory: vi.fn() }));
    const actions = result.current.actions;

    act(() => {
      result.current.actions.updateParams({ scale: 2.25 });
    });

    expect(result.current.actions).toBe(actions);
    expect(result.current.state.params.scale).toBe(2.25);
  });
});
