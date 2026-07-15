import { describe, expect, it } from "vitest";
import { PreviewAnimation } from "../../../core/types/types";
import { requiresContinuousRendering } from "../../../features/texture-canvas/renderPolicy";
import { mockAppState } from "../../helpers";

describe("requiresContinuousRendering", () => {
  it("lets an idle editor use demand rendering", () => {
    const state = mockAppState();
    state.animate = false;
    state.environment.animation = PreviewAnimation.NONE;
    state.environment.particlesEnabled = false;
    state.environment.smokeEnabled = false;

    expect(requiresContinuousRendering(state)).toBe(false);
  });

  it.each([
    ["timeline animation", (state: ReturnType<typeof mockAppState>) => (state.animate = true)],
    [
      "preview animation",
      (state: ReturnType<typeof mockAppState>) =>
        (state.environment.animation = PreviewAnimation.TURNTABLE),
    ],
    [
      "particles",
      (state: ReturnType<typeof mockAppState>) => (state.environment.particlesEnabled = true),
    ],
    ["smoke", (state: ReturnType<typeof mockAppState>) => (state.environment.smokeEnabled = true)],
    [
      "scene effects",
      (state: ReturnType<typeof mockAppState>) => (state.environment.sceneBloom = true),
    ],
  ])("keeps continuous rendering for %s", (_label, enable) => {
    const state = mockAppState();
    state.animate = false;
    state.environment.animation = PreviewAnimation.NONE;
    state.environment.particlesEnabled = false;
    state.environment.smokeEnabled = false;
    enable(state);

    expect(requiresContinuousRendering(state)).toBe(true);
  });
});
