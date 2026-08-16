/**
 * TSL SDF Primitives & Operations
 */
import { Fn, float, vec3, mat2, sin, cos, abs, mod, min, max, clamp, length, mix } from "three/tsl";

/** Box SDF */
export const sdBox = /*@__PURE__*/ Fn(([p_in, b_in]: [any, any]) => {
  const p = vec3(p_in);
  const b = vec3(b_in);
  const q = abs(p).sub(b);
  return length(max(q, 0)).add(min(max(q.x, max(q.y, q.z)), 0));
});

/** 2D rotation (same as math rotate2d but used in SDF context) */
export const rot2D = (a: any) => {
  const s = sin(a);
  const c = cos(a);
  return mat2(c, s.negate(), s, c);
};

/** Infinite domain repetition */
export const opRep = /*@__PURE__*/ Fn(([p_in, c_in]: [any, any]) => {
  const p = vec3(p_in);
  const c = vec3(c_in);
  return mod(p.add(c.mul(0.5)), c).sub(c.mul(0.5));
});

/** Smooth minimum (organic blending) */
export const smin = /*@__PURE__*/ Fn(([a_in, b_in, k_in]: [any, any, any]) => {
  const a = float(a_in);
  const b = float(b_in);
  const k = float(k_in);
  const h = clamp(float(0.5).add(float(0.5).mul(b.sub(a).div(k))), 0, 1);
  return mix(b, a, h).sub(k.mul(h).mul(float(1).sub(h)));
});

/** Complex rotation matrix from time seed */
export const rotComplex = /*@__PURE__*/ Fn(([t_in]: [any]) => {
  const t = float(t_in);
  const angle = sin(t).mul(0.785);
  return mat2(cos(angle), sin(angle).negate(), sin(angle), cos(angle));
});
