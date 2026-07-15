import { describe, expect, it } from "vitest";
import { mockAppState } from "../../helpers";
import { createTslUniforms, updateTslUniforms } from "../../../lib/tsl/uniforms";

describe("TSL uniform domains", () => {
  it("updates one renderer domain without rewriting unrelated uniforms", () => {
    const state = mockAppState();
    const uniforms = createTslUniforms(state);
    const originalFogDensity = uniforms.u_fogDensity.value;

    state.params.scale = 2.75;
    state.environment.fogDensity = 0.42;
    updateTslUniforms(uniforms, state, ["pattern"]);

    expect(uniforms.u_scale.value).toBe(2.75);
    expect(uniforms.u_fogDensity.value).toBe(originalFogDensity);

    updateTslUniforms(uniforms, state, ["environment"]);
    expect(uniforms.u_fogDensity.value).toBe(0.42);
  });
});
