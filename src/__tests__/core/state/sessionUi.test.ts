import { describe, expect, it } from "vitest";
import { isSessionOnlyPatch, stripSessionUi } from "@/core/state/sessionUi";
import { mockAppState } from "@/__tests__/helpers";

describe("session UI", () => {
  it("strips modal and fullscreen flags", () => {
    const stripped = stripSessionUi(
      mockAppState({ isSettingsOpen: true, isFullscreen: true, animate: true }),
    );
    expect("isSettingsOpen" in stripped).toBe(false);
    expect("isFullscreen" in stripped).toBe(false);
    expect(stripped.animate).toBe(true);
  });

  it("detects session-only patches", () => {
    expect(isSessionOnlyPatch({ isSettingsOpen: true })).toBe(true);
    expect(isSessionOnlyPatch({ isSettingsOpen: true, animate: false })).toBe(false);
  });
});
