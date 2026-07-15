import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { mockAppState } from "../../helpers";
import { projectRendererUniforms } from "../../../lib/rendering/stateProjection";
import { createUniformsFromState, updateUniformsFromState } from "../../../lib/three/uniforms";
import { createTslUniforms, updateTslUniforms } from "../../../lib/tsl/uniforms";

interface ReadableUniform {
  value?: unknown;
  array?: unknown;
}

const normalizeValue = (value: unknown): unknown => {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof THREE.Color) return value.toArray();
  if (value instanceof THREE.Vector2 || value instanceof THREE.Vector3) return value.toArray();
  if (Array.isArray(value)) return value.map(normalizeValue);
  return value;
};

const readUniform = (uniform: ReadableUniform): unknown =>
  normalizeValue(uniform.array ?? uniform.value);

describe("renderer-neutral state projection", () => {
  it("binds the same projected values to GLSL and TSL, including manual fog color", () => {
    const state = mockAppState();
    state.params.scale = 2.25;
    state.blending.enabled = true;
    state.transform.angle = 37;
    state.postProcess.posterize = true;
    state.normalMap.strength = 0.73;
    state.colorBalance.shadows = { r: 0.1, g: 0.25, b: 0.8 };
    state.imageAlpha.threshold = 0.41;
    state.environment.fogColor = "#123456";

    const glsl = createUniformsFromState(state);
    const tsl = createTslUniforms(state);
    updateUniformsFromState(glsl, state);
    updateTslUniforms(tsl, state);
    const readableGlsl = glsl as Record<string, ReadableUniform>;
    const readableTsl = tsl as unknown as Record<string, ReadableUniform>;

    const projection = projectRendererUniforms(state);
    for (const domain of Object.values(projection)) {
      for (const name of Object.keys(domain)) {
        expect(readableGlsl[name], `GLSL missing ${name}`).toBeDefined();
        expect(readableTsl[name], `TSL missing ${name}`).toBeDefined();
        const glslValue = readUniform(readableGlsl[name]);
        const tslValue = readUniform(readableTsl[name]);
        expect(tslValue, `${name} differs between renderers`).toEqual(glslValue);
      }
    }

    expect(readUniform(glsl.u_fogColor)).toEqual(new THREE.Color("#123456").toArray());
  });
});
