/**
 * TSL Fire Patterns (10 patterns)
 */
import {
  Fn,
  float,
  vec2,
  vec3,
  sin,
  cos,
  abs,
  floor,
  mix,
  max,
  clamp,
  pow,
  length,
  distance,
  smoothstep,
  atan,
  exp,
  If,
} from "three/tsl";
import type { TslPatternFn } from "../tslBuilder";
import type { TslUniforms } from "../uniforms";
import { rotate2d } from "../chunks/math";
import { noise2d as _noise2d, snoise3d, fbm2d } from "../chunks/noise";

// ─── COMPLEX FIRE ───
// Uses snoise3d as noiseStack
export const complexFire: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).mul(2.0).toVar();
    uv.y.addAssign(0.5);
    uv.x.addAssign(uv.y.mul(float(u.u_p1).sub(0.5)).mul(2.0));
    uv.x.addAssign(sin(uv.y.mul(10.0).add(float(u.u_time).mul(5.0))).mul(float(u.u_p9).mul(0.05)));
    const scale = float(u.u_scale).mul(3.0);
    const rise = float(u.u_speed).mul(float(1.0).add(float(u.u_p5).mul(2.0)));
    const p = vec3(uv.mul(scale), float(u.u_time).mul(rise));
    const xfuel = max(float(0.0), float(1.0).sub(abs(uv.x.mul(2.0))));
    const ypart = smoothstep(1.2, 0.0, uv.y);
    const fuel = pow(
      max(float(0.0), xfuel.mul(ypart).mul(float(1.0).add(float(u.u_p10).mul(0.5)))),
      float(1.0).add(float(u.u_factor).mul(2.0)),
    );
    // Simplified noiseStack: 1-3 octaves of snoise3d
    const pAnim = p.add(vec3(0.0, float(u.u_time).mul(-2.0), 0.0));
    const n = snoise3d(pAnim).mul(0.5).add(0.5).toVar();
    // Extra octaves
    If(float(u.u_p6).greaterThan(0.33), () => {
      const n2 = snoise3d(pAnim.mul(2.0));
      n.assign(
        float(0.5)
          .mul(n)
          .add(float(0.5).mul(n2.mul(0.5).add(0.5))),
      );
    });
    If(float(u.u_p6).greaterThan(0.66), () => {
      const n3 = snoise3d(pAnim.mul(4.0));
      n.assign(
        float(0.5)
          .mul(n)
          .add(float(0.5).mul(n3.mul(0.5).add(0.5))),
      );
    });
    const fire = fuel.mul(n).mul(float(1.0).add(u.u_intensity)).toVar();
    const core = smoothstep(0.1, float(0.8).sub(float(u.u_p7).mul(0.4)), fire);
    fire.addAssign(core.mul(u.u_p2));
    If(float(u.u_p8).greaterThan(0.0), () => {
      fire.mulAssign(smoothstep(0.0, float(0.2).add(float(u.u_p8).mul(0.5)), fire));
    });
    If(float(u.u_p4).greaterThan(0.0), () => {
      const smoke = snoise3d(pAnim.mul(0.5).add(vec3(0.0, u.u_time, 0.0)))
        .mul(0.5)
        .add(0.5);
      fire.assign(mix(fire, smoke.mul(0.5), float(u.u_p4).mul(uv.y)));
    });
    return clamp(fire, 0.0, 1.0);
  })();
};

// ─── FLAME ───
export const flame: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).toVar();
    const wind = sin(uv.y.mul(10.0).add(float(u.u_time).mul(5.0)))
      .mul(0.05)
      .mul(u.u_p2);
    uv.x.addAssign(wind);
    const n = fbm2d(
      uv
        .mul(5.0)
        .mul(u.u_scale)
        .sub(vec2(0, float(u.u_time).mul(2.0))),
      u.u_seed,
      u.u_detail,
    );
    const h = float(1.0).sub(float(u.u_p1).mul(0.5));
    const baseW = float(0.5).add(float(u.u_p5).mul(0.5));
    const shape = float(1.0).sub(distance(vec2(uv.x, uv.y.mul(h).add(0.5)), vec2(0.5, 1.0)));
    const shapeSm = smoothstep(0.0, baseW, shape);
    const f = shapeSm.add(n.mul(float(0.2).add(float(u.u_factor).mul(0.5))));
    return pow(clamp(f, 0.0, 1.0), float(4.0).div(max(float(0.01), u.u_intensity)));
  })();
};

// ─── FIRE ───
export const fire: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).mul(u.u_scale).toVar();
    const t = float(u.u_time).mul(2.0).mul(float(1.0).add(u.u_p2));
    const q = vec2(
      fbm2d(uv.add(vec2(0.0, t.mul(0.2))), u.u_seed, u.u_detail),
      fbm2d(uv.add(vec2(5.2, float(1.3).add(t.mul(0.15)))), u.u_seed, u.u_detail),
    );
    const f = fbm2d(uv.add(q.mul(4.0).mul(float(1.0).add(u.u_p1))), u.u_seed, u.u_detail);
    return pow(clamp(f, 0.0, 1.0), u.u_intensity).mul(
      float(1.0).add(pow(clamp(f, 0.0, 1.0), 4.0).mul(u.u_factor)),
    );
  })();
};

// ─── SOLAR ───
export const solar: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5);
    const d = length(uv);
    const a = atan(uv.y, uv.x);
    const flares = float(0.0).toVar();
    If(float(u.u_p1).greaterThan(0.0), () => {
      flares.assign(sin(a.mul(float(10.0).add(float(u.u_p1).mul(20.0)))).mul(0.02));
    });
    const c = fbm2d(vec2(d.mul(5.0).sub(u.u_time), a.mul(5.0)), u.u_seed, u.u_detail);
    const spots = float(1.0).toVar();
    If(float(u.u_p2).greaterThan(0.0), () => {
      spots.assign(smoothstep(0.5, float(0.5).sub(float(u.u_p2).mul(0.2)), c));
    });
    const val = float(0.1)
      .mul(u.u_scale)
      .add(flares)
      .div(max(float(0.01), d.sub(c.mul(0.1).mul(u.u_factor))));
    return pow(clamp(val, 0.0, 1.0), u.u_intensity).mul(spots);
  })();
};

// ─── SPARK ───
export const spark: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).mul(u.u_scale).toVar();
    If(float(u.u_p2).greaterThan(0.0), () => {
      uv.assign(rotate2d(float(u.u_time).mul(u.u_p2)).mul(uv));
    });
    const d = length(uv);
    const rays = float(1.0).toVar();
    If(float(u.u_p1).greaterThan(0.0), () => {
      rays.assign(abs(sin(atan(uv.y, uv.x).mul(float(4.0).add(floor(float(u.u_p1).mul(10.0)))))));
    });
    const s = float(0.02)
      .div(max(float(0.001), d))
      .toVar();
    s.assign(mix(float(1.0), rays, u.u_p1).mul(s));
    s.assign(mix(s, s.add(float(0.005).div(max(float(0.001), abs(uv.x.mul(uv.y))))), u.u_factor));
    return pow(
      clamp(
        s.mul(
          float(0.8).add(_noise2d(uv.mul(10.0).add(float(u.u_time).mul(5.0)), u.u_seed).mul(0.2)),
        ),
        0.0,
        1.0,
      ),
      u.u_intensity,
    );
  })();
};

// ─── FLASH ───
export const flash: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).mul(2.0).mul(u.u_scale);
    const d = length(uv);
    const v = exp(d.mul(d).mul(-5.0)).toVar();
    const a = atan(uv.y, uv.x);
    v.addAssign(
      sin(a.mul(20.0).mul(u.u_factor).add(float(u.u_time).mul(10.0)))
        .mul(0.1)
        .mul(v)
        .mul(u.u_factor),
    );
    return pow(clamp(v, 0.0, 1.0), float(1.0).div(max(float(0.01), u.u_intensity)));
  })();
};

// ─── LIGHTNING ───
export const lightning: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).mul(u.u_scale);
    const l = float(0.0).toVar();
    const t = float(u.u_time).mul(3.0).toVar();
    // Unroll 3 iterations
    const p0x = uv.x.add(sin(uv.y.mul(10.0).add(t)).mul(0.1));
    l.addAssign(float(0.01).div(max(float(0.001), abs(p0x.sub(0.5)))));
    t.addAssign(100.0);
    const p1x = uv.x.add(sin(uv.y.mul(10.0).add(t)).mul(0.1));
    l.addAssign(float(0.01).div(max(float(0.001), abs(p1x.sub(0.5)))));
    t.addAssign(100.0);
    const p2x = uv.x.add(sin(uv.y.mul(10.0).add(t)).mul(0.1));
    l.addAssign(float(0.01).div(max(float(0.001), abs(p2x.sub(0.5)))));
    return clamp(l.mul(u.u_intensity), 0.0, 1.0);
  })();
};

// ─── LASER ───
export const laser: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).mul(u.u_scale).toVar();
    If(float(u.u_p2).greaterThan(0.0), () => {
      uv.x.addAssign(
        sin(uv.y.mul(20.0).add(float(u.u_time).mul(10.0)))
          .mul(0.01)
          .mul(u.u_p2),
      );
    });
    const b = float(0.05).div(max(float(0.001), abs(uv.y.sub(0.5))));
    const c = float(0.02).mul(u.u_factor);
    const cw = float(0.5).sub(float(u.u_p1).mul(0.2));
    const core = smoothstep(cw.sub(c), cw, uv.y).sub(smoothstep(cw, cw.add(c), uv.y));
    return clamp(
      b
        .mul(u.u_intensity)
        .add(core.mul(2.0))
        .mul(float(1.0).add(sin(uv.x.mul(20.0).sub(float(u.u_time).mul(10.0))).mul(0.2))),
      0.0,
      1.0,
    );
  })();
};

// ─── FLARE ───
export const flare: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).mul(u.u_scale);
    const g = float(0.2)
      .div(max(float(0.001), length(uv)))
      .toVar();
    // Unroll 4 lens ghosts
    g.addAssign(
      float(0.05)
        .div(max(float(0.001), distance(uv, uv.mul(-0.5).mul(1.0))))
        .mul(u.u_factor),
    );
    g.addAssign(
      float(0.05)
        .div(max(float(0.001), distance(uv, uv.mul(-0.5).mul(2.0))))
        .mul(u.u_factor),
    );
    g.addAssign(
      float(0.05)
        .div(max(float(0.001), distance(uv, uv.mul(-0.5).mul(3.0))))
        .mul(u.u_factor),
    );
    g.addAssign(
      float(0.05)
        .div(max(float(0.001), distance(uv, uv.mul(-0.5).mul(4.0))))
        .mul(u.u_factor),
    );
    return pow(clamp(g, 0.0, 1.0), u.u_intensity);
  })();
};

// ─── PLASMA ───
export const plasma: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const p = vec2(st).mul(u.u_scale).mul(5.0);
    const v = sin(p.x.add(u.u_time)).toVar();
    v.addAssign(sin(p.y.add(u.u_time)).mul(0.5));
    v.addAssign(sin(p.x.add(p.y).add(u.u_time)).mul(0.5));
    const c = vec2(sin(float(u.u_time).mul(0.5)), cos(float(u.u_time).mul(0.3))).mul(2.0);
    const d = length(p.sub(c));
    v.addAssign(sin(d.mul(u.u_factor).mul(5.0).sub(float(u.u_time).mul(2.0))));
    return pow(clamp(v.mul(0.25).add(0.5), 0.0, 1.0), u.u_intensity);
  })();
};
