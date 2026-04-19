/**
 * TSL Gradient Patterns
 */
import { Fn, float, vec2, sin, cos, pow, max, clamp } from "three/tsl";
import type { TslPatternFn } from "../tslBuilder";
import type { TslUniforms } from "../uniforms";

const PI = float(3.14159265359);

export const gradientLinear: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const a = float(u.u_factor).mul(PI);
    const s = sin(a);
    const c = cos(a);
    // Rotation matrix: [c, -s, s, c]
    const centered = vec2(st).sub(0.5);
    const rotX = centered.x.mul(c).sub(centered.y.mul(s));
    const uX = rotX.add(0.5).add(u.u_p13);
    const grad = clamp(uX, 0.0, 1.0).toVar();
    // Gamma (p15)
    grad.assign(pow(max(float(0.0), grad), float(1.0).add(float(u.u_p15).mul(2.0))));
    return pow(clamp(grad, 0.0, 1.0), u.u_intensity);
  })();
};

export const gradientRadial: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const centered = vec2(st).sub(0.5).add(vec2(u.u_p13, u.u_p14)).toVar();
    centered.x.mulAssign(float(1.0).add(float(u.u_factor).sub(0.5).mul(2.0)));
    const val = clamp(float(1.0).sub(centered.length().mul(u.u_scale).mul(2.0)), 0.0, 1.0).toVar();
    // Gamma (p15)
    val.assign(pow(max(float(0.0), val), float(1.0).add(float(u.u_p15).mul(2.0))));
    return pow(clamp(val, 0.0, 1.0), u.u_intensity);
  })();
};

export const gradientStripes: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const a = float(u.u_factor).mul(PI);
    const s = sin(a);
    const c = cos(a);
    const centered = vec2(st).sub(0.5);
    const rotX = centered.x.mul(c).sub(centered.y.mul(s));
    const uX = rotX.add(0.5).add(u.u_p13);
    const val = clamp(
      float(0.5).add(sin(uX.mul(u.u_scale).mul(50.0).add(u.u_time)).mul(0.5)),
      0.0,
      1.0,
    ).toVar();
    // Gamma (p15)
    val.assign(pow(max(float(0.0), val), float(1.0).add(float(u.u_p15).mul(2.0))));
    return pow(clamp(val, 0.0, 1.0), u.u_intensity);
  })();
};
