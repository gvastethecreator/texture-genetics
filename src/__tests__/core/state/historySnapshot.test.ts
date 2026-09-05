import { describe, expect, it } from "vitest";
import { cloneHistorySnapshot } from "@/core/state/historySnapshot";
import { mockAppState } from "@/__tests__/helpers";

describe("cloneHistorySnapshot", () => {
  it("keeps heavy asset strings by identity", () => {
    const texture = `data:image/png;base64,${"A".repeat(32)}`;
    const state = mockAppState({ sticker: { ...mockAppState().sticker, texture } });
    const snapshot = cloneHistorySnapshot(state);
    expect(snapshot.sticker.texture).toBe(texture);
  });

  it("omits session UI flags", () => {
    const snapshot = cloneHistorySnapshot(mockAppState({ isSettingsOpen: true }));
    expect("isSettingsOpen" in snapshot).toBe(false);
  });
});
