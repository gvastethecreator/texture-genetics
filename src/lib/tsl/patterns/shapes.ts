/**
 * TSL Shape Patterns (25 patterns)
 */
import {
  Fn,
  float,
  vec2,
  vec3,
  int,
  sin,
  cos,
  abs,
  floor,
  fract,
  mod,
  dot,
  mix,
  step,
  max,
  min,
  clamp,
  pow,
  length,
  smoothstep,
  atan,
  normalize,
  cross,
  If,
  Loop,
} from "three/tsl";
import type { TslPatternFn } from "../tslBuilder";
import type { TslUniforms } from "../uniforms";
import { rotate2d } from "../chunks/math";
import { random2d, noise2d as _noise2d } from "../chunks/noise";

const PI = float(Math.PI);

// Helper: short alias that remaps noise from [-1,1] to [0,1]
const noiseVal = (p: any, seed: any) => _noise2d(p, seed).mul(0.5).add(0.5);

// ─── CHECKER ───
export const checker: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).toVar();
    stv.addAssign(vec2(u.u_p12, u.u_p13));
    If(float(u.u_p14).notEqual(0.0), () => {
      stv.assign(rotate2d(float(u.u_p14).mul(6.28)).mul(stv.sub(0.5)).add(0.5));
    });
    const uv = stv.mul(u.u_scale).mul(10.0).toVar();
    uv.addAssign(float(u.u_p6).mul(2.0));
    uv.addAssign(vec2(sin(uv.y.mul(u.u_p10)), cos(uv.x.mul(u.u_p10))).mul(u.u_p10));
    If(float(u.u_factor).greaterThan(0.0), () => {
      const s = sin(u.u_factor);
      const c = cos(u.u_factor);
      uv.assign(vec2(uv.x.mul(c).sub(uv.y.mul(s)), uv.x.mul(s).add(uv.y.mul(c))));
    });
    uv.addAssign(
      vec2(
        sin(uv.y.mul(2.0).add(float(u.u_p11).mul(10.0))),
        sin(uv.x.mul(2.0).add(float(u.u_p11).mul(10.0))),
      ).mul(float(u.u_p2).mul(0.5)),
    );
    const id = floor(uv);
    const check = mod(id.x.add(id.y), 2.0).toVar();

    const softness = float(u.u_p1).mul(0.5);
    const result = smoothstep(float(0.5).sub(softness), float(0.5).add(softness), check).toVar();
    If(float(u.u_p9).greaterThan(0.0), () => {
      const n = random2d(id, u.u_seed);
      result.assign(mix(result, n, float(u.u_p9).mul(0.5)));
    });
    If(float(u.u_p15).greaterThan(0.0), () => {
      const noiseVal2 = random2d(vec2(st).mul(100.0).add(u.u_time), u.u_seed);
      result.assign(mix(result, noiseVal2, float(u.u_p15).mul(0.2)));
    });
    return pow(max(float(0.0), result), u.u_intensity);
  })();
};

// ─── CIRCLE ───
export const circle: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14)).toVar();
    const uv = stv.sub(0.5).mul(2.0).toVar();
    const angle = atan(uv.y, uv.x);
    const deform = sin(angle.mul(5.0).add(float(u.u_time).mul(u.u_p8)))
      .mul(float(u.u_p4).mul(0.1))
      .toVar();
    const d = length(uv).add(deform).toVar();
    const w = float(0.01).add(float(u.u_p2).mul(0.5));
    const soft = float(u.u_p3).mul(0.5);
    const v = float(1.0)
      .sub(smoothstep(float(u.u_scale).sub(w).sub(soft), float(u.u_scale).sub(w), d))
      .toVar();
    If(float(u.u_factor).greaterThan(0.0), () => {
      const outer = smoothstep(float(u.u_scale).add(w), float(u.u_scale).add(w).add(soft), d);
      v.subAssign(outer);
    });
    If(float(u.u_p5).greaterThan(0.0), () => {
      v.addAssign(float(1.0).sub(d).mul(u.u_p5));
    });
    return pow(clamp(v, 0.0, 1.0), u.u_intensity);
  })();
};

// ─── RING ───
export const ring: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14));
    const uv = stv.sub(0.5).mul(2.0).toVar();
    const d = length(uv).mul(u.u_scale).toVar();
    If(float(u.u_p1).greaterThan(0.0), () => {
      d.addAssign(sin(atan(uv.y, uv.x).mul(10.0)).mul(0.1).mul(u.u_p1));
    });
    const t = float(1.0).sub(float(u.u_factor).mul(0.8));
    const wave = sin(
      d
        .mul(10.0)
        .sub(float(u.u_time).mul(float(1.0).add(float(u.u_p2).mul(2.0))))
        .add(u.u_p12),
    ).toVar();
    If(float(u.u_p3).greaterThan(0.0), () => {
      wave.assign(smoothstep(float(u.u_p3).negate(), u.u_p3, wave));
    });
    If(float(u.u_p11).greaterThan(0.0), () => {
      wave.addAssign(sin(d.mul(20.0)).mul(0.5).mul(u.u_p11));
    });
    return pow(clamp(smoothstep(t.sub(0.1), t, wave.mul(0.5).add(0.5)), 0.0, 1.0), u.u_intensity);
  })();
};

// ─── CONE ───
export const cone: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14)).toVar();
    If(float(u.u_p15).notEqual(0.0), () => {
      stv.assign(rotate2d(u.u_p15).mul(stv.sub(0.5)).add(0.5));
    });
    const uv = stv.sub(0.5);
    const a = atan(uv.y, uv.x).add(float(u.u_time).mul(u.u_factor));
    const val = a.div(PI).mul(0.5).add(0.5).toVar();
    If(float(u.u_p1).greaterThan(0.0), () => {
      val.assign(mod(val.mul(float(1.0).add(float(u.u_p1).mul(10.0))), 1.0));
    });
    If(float(u.u_p2).greaterThan(0.0), () => {
      val.assign(pow(max(float(0.0), val), float(1.0).add(float(u.u_p2).mul(4.0))));
    });
    If(float(u.u_p12).greaterThan(0.0), () => {
      val.addAssign(sin(length(uv).mul(10.0)).mul(float(u.u_p12).mul(0.2)));
    });
    return pow(clamp(val, 0.0, 1.0), u.u_intensity);
  })();
};

// ─── CROSS ───
export const crossPattern: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14));
    const uv = stv.sub(0.5).mul(u.u_scale).toVar();
    If(float(u.u_p3).greaterThan(0.0), () => {
      uv.assign(
        vec2(
          uv.x.mul(cos(u.u_p3)).sub(uv.y.mul(sin(u.u_p3))),
          uv.x.mul(sin(u.u_p3)).add(uv.y.mul(cos(u.u_p3))),
        ),
      );
    });
    const t = float(0.05).add(float(u.u_factor).mul(0.2));
    const shape = step(abs(uv.x), t)
      .add(step(abs(uv.y), t))
      .toVar();
    If(float(u.u_p1).greaterThan(0.0), () => {
      shape.assign(smoothstep(0.0, u.u_p1, shape));
    });
    return pow(clamp(shape, 0.0, 1.0), u.u_intensity);
  })();
};

// ─── HEXAGON GRID ───
export const hexagonGrid: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).toVar();
    stv.addAssign(vec2(u.u_p13, u.u_p14));
    If(float(u.u_p15).notEqual(0.0), () => {
      stv.assign(rotate2d(float(u.u_p15).mul(3.14)).mul(stv.sub(0.5)).add(0.5));
    });
    const uv = stv.mul(u.u_scale).mul(10.0).toVar();
    uv.x.addAssign(floor(uv.y).mul(u.u_p10));
    If(float(u.u_p6).greaterThan(0.0), () => {
      uv.addAssign(
        vec2(sin(uv.y.mul(2.0).add(u.u_time)), sin(uv.x.mul(2.0).add(u.u_time))).mul(
          float(u.u_p6).mul(0.2),
        ),
      );
    });
    const hr = float(1.73).mul(float(0.5).add(u.u_p12));
    const r = vec2(1.0, hr);
    const h = r.mul(0.5);
    const a = mod(uv, r).sub(h);
    const b = mod(uv.sub(h), r).sub(h);
    const gv = vec2(0.0).toVar();
    If(dot(a, a).lessThan(dot(b, b)), () => {
      gv.assign(a);
    }).Else(() => {
      gv.assign(b);
    });
    const p = abs(gv);
    const c = max(dot(p, normalize(vec2(1.0, 1.73))), p.x);
    const thickness = float(0.02).add(float(u.u_factor).mul(0.4));
    const roundness = float(u.u_p3).mul(0.2);
    const d = smoothstep(thickness.add(roundness).add(0.01), thickness, float(0.5).sub(c)).toVar();
    return pow(clamp(d, 0.0, 1.0), u.u_intensity);
  })();
};

// ─── ISOMETRIC ───
export const isometric: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14)).toVar();
    If(float(u.u_p15).notEqual(0.0), () => {
      stv.assign(rotate2d(u.u_p15).mul(stv.sub(0.5)).add(0.5));
    });
    const uv = stv.mul(u.u_scale).mul(10.0);
    const uvX = uv.x.mul(1.155);
    const grid = floor(vec2(uvX, uv.y));
    const f = fract(vec2(uvX, uv.y));
    const v = mod(grid.x.add(grid.y), 3.0).div(2.0);
    const edge = step(float(0.05).mul(float(1.0).sub(u.u_factor)), min(f.x, f.y));
    return pow(
      clamp(mix(v, float(1.0), float(1.0).sub(edge.mul(u.u_detail))), 0.0, 1.0),
      u.u_intensity,
    );
  })();
};

// ─── FLOWER ───
export const flower: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14)).toVar();
    const uv = stv.sub(0.5).mul(2.0).mul(u.u_scale);
    const r = length(uv);
    const a = atan(uv.y, uv.x).add(float(u.u_time).mul(u.u_speed)).add(u.u_p12).toVar();
    If(float(u.u_p7).greaterThan(0.0), () => {
      a.addAssign(r.mul(float(u.u_p7).mul(5.0)));
    });
    const petals = float(u.u_p3);
    const curve = float(0.5).add(float(u.u_p6).mul(1.5));
    const f = pow(abs(cos(a.mul(petals).mul(0.5))), curve);
    const inner = float(0.2).add(float(u.u_p5).mul(0.5));
    const radius = inner.add(f.mul(float(1.0).sub(inner)));
    const softness = float(u.u_p2).mul(0.5).add(0.01);
    const flowerVal = float(1.0).sub(smoothstep(radius.sub(softness), radius.add(softness), r));
    const stamen = float(1.0).sub(
      smoothstep(float(u.u_p10).mul(0.3), float(u.u_p10).mul(0.3).add(0.05), r),
    );
    const result = max(flowerVal, stamen).toVar();
    If(float(u.u_p11).greaterThan(0.0), () => {
      result.assign(
        abs(result.sub(0.5))
          .mul(2.0)
          .mul(u.u_p11)
          .add(result.mul(float(1.0).sub(u.u_p11))),
      );
    });
    return pow(clamp(result, 0.0, 1.0), u.u_intensity);
  })();
};

// ─── BRICKS ───
export const bricks: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14)).toVar();
    If(float(u.u_p15).notEqual(0.0), () => {
      stv.assign(rotate2d(float(u.u_p15).mul(0.5)).mul(stv.sub(0.5)).add(0.5));
    });
    const uv = stv.mul(u.u_scale).mul(10.0);
    const row = floor(uv.y);
    const ux = uv.x.add(mod(row, 2.0).mul(float(0.5).add(float(u.u_p2).sub(0.5)))).toVar();
    const f = fract(vec2(ux, uv.y));
    const mortar = float(0.05).add(float(1.0).sub(u.u_factor).mul(0.1)).add(float(u.u_p1).mul(0.1));
    const v = smoothstep(mortar, mortar.add(0.02), f.x)
      .mul(smoothstep(float(1.0).sub(mortar), float(1.0).sub(mortar).sub(0.02), f.y))
      .toVar();
    If(float(u.u_p12).greaterThan(0.0), () => {
      v.mulAssign(float(0.5).add(f.x.mul(f.y).mul(0.5)));
    });
    return pow(clamp(v, 0.0, 1.0), u.u_intensity);
  })();
};

// ─── ZIGZAG ───
export const zigzag: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14)).toVar();
    If(float(u.u_p15).notEqual(0.0), () => {
      stv.assign(rotate2d(u.u_p15).mul(stv.sub(0.5)).add(0.5));
    });
    const uv = stv.mul(u.u_scale).mul(10.0);
    const z = abs(fract(uv.x.add(uv.y)).sub(0.5))
      .mul(2.0)
      .toVar();
    If(float(u.u_factor).greaterThan(0.5), () => {
      z.assign(abs(fract(uv.x.sub(uv.y)).sub(0.5)).mul(2.0));
    });
    const thickness = float(0.2).add(u.u_p1);
    const blur = float(u.u_p2).mul(0.5);
    return pow(
      clamp(smoothstep(thickness.add(blur), thickness.sub(blur), z), 0.0, 1.0),
      u.u_intensity,
    );
  })();
};

// ─── WAVE PATTERN ───
export const wavePattern: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14)).toVar();
    If(float(u.u_p15).notEqual(0.0), () => {
      stv.assign(rotate2d(u.u_p15).mul(stv.sub(0.5)).add(0.5));
    });
    const uv = stv.mul(u.u_scale).mul(20.0);
    const w = sin(
      uv.x.add(sin(uv.y.mul(u.u_factor).add(u.u_time)).mul(2.0).mul(float(1.0).add(u.u_p1))),
    ).toVar();
    If(float(u.u_p2).greaterThan(0.0), () => {
      w.assign(smoothstep(float(u.u_p2).negate(), u.u_p2, w));
    });
    If(float(u.u_p12).greaterThan(0.0), () => {
      w.addAssign(noiseVal(stv.mul(5.0), u.u_seed).mul(u.u_p12));
    });
    return pow(clamp(w.mul(0.5).add(0.5), 0.0, 1.0), u.u_intensity);
  })();
};

// ─── WAVEFORM ───
export const waveform: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14)).toVar();
    If(float(u.u_p15).notEqual(0.0), () => {
      stv.assign(rotate2d(u.u_p15).mul(stv.sub(0.5)).add(0.5));
    });
    const uv = stv.mul(u.u_scale).mul(10.0);
    const w = sin(uv.x.add(float(u.u_time).mul(u.u_factor).mul(5.0))).toVar();
    w.addAssign(sin(uv.x.mul(2.0).add(u.u_time)).mul(u.u_p1));
    If(float(u.u_p12).greaterThan(0.0), () => {
      w.mulAssign(float(1.0).add(sin(float(u.u_time).mul(10.0)).mul(float(u.u_p12).mul(0.5))));
    });
    return pow(clamp(w.mul(0.5).add(0.5), 0.0, 1.0), u.u_intensity);
  })();
};

// ─── TRUCHET ───
export const truchet: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14)).toVar();
    If(float(u.u_p15).notEqual(0.0), () => {
      stv.assign(rotate2d(u.u_p15).mul(stv.sub(0.5)).add(0.5));
    });
    const uv = stv.mul(u.u_scale).mul(10.0);
    const i = floor(uv);
    const f = fract(uv).toVar();
    const r = random2d(i, u.u_p12);
    If(r.greaterThan(0.5), () => {
      f.x.assign(float(1.0).sub(f.x));
    });
    const d = min(length(f), length(f.sub(1.0))).toVar();
    If(float(u.u_factor).greaterThan(0.5), () => {
      d.assign(min(d, min(length(f.sub(vec2(1.0, 0.0))), length(f.sub(vec2(0.0, 1.0))))));
    });
    const w = float(0.1).add(float(u.u_detail).mul(0.2));
    const v = smoothstep(float(0.5).sub(w), float(0.5).sub(w).add(0.02), d).sub(
      smoothstep(float(0.5).add(w), float(0.5).add(w).add(0.02), d),
    );
    return pow(clamp(v, 0.0, 1.0), u.u_intensity);
  })();
};

// ─── SPIRAL ───
export const spiral: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14));
    const uv = stv.sub(0.5).toVar();
    If(float(u.u_p15).greaterThan(0.0), () => {
      uv.addAssign(
        vec2(noiseVal(stv.mul(5.0), u.u_seed), noiseVal(stv.mul(5.0).add(10.0), u.u_seed)).mul(
          float(u.u_p15).mul(0.1),
        ),
      );
    });
    const r = length(uv);
    const a = atan(uv.y, uv.x);
    const s = sin(
      r
        .mul(20.0)
        .mul(u.u_scale)
        .sub(a.mul(float(5.0).add(float(u.u_factor).mul(10.0))))
        .add(float(u.u_time).mul(2.0)),
    );
    return pow(clamp(s.mul(0.5).add(0.5), 0.0, 1.0), u.u_intensity);
  })();
};

// ─── STARBURST ───
export const starburst: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14));
    const p = stv.sub(0.5).toVar();
    If(float(u.u_p15).greaterThan(0.0), () => {
      p.addAssign(
        vec2(noiseVal(stv.mul(5.0), u.u_seed), noiseVal(stv.mul(5.0).add(10.0), u.u_seed)).mul(
          float(u.u_p15).mul(0.1),
        ),
      );
    });
    const a = atan(p.y, p.x);
    const rays = float(8.0).add(floor(float(u.u_scale).mul(20.0)));
    const w = float(0.5).add(cos(a.mul(rays).add(u.u_time)).mul(0.5));
    const s = float(1.0).add(float(u.u_factor).mul(50.0));
    const wp = pow(clamp(w, 0.0, 1.0), s);
    return pow(clamp(wp, 0.0, 1.0), u.u_intensity);
  })();
};

// ─── UV DEBUG ───
export const uvDebug: TslPatternFn = () => {
  return float(0.0);
};

// ─── MAZE ───
export const maze: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14));
    const uv = stv.mul(u.u_scale).mul(10.0).add(u.u_seed);
    const i = floor(uv);
    const f = fract(uv);
    const r = random2d(i, u.u_seed);
    const d = vec2(0.0).toVar();
    If(r.greaterThan(0.5), () => {
      d.assign(vec2(1.0, -1.0));
    }).Else(() => {
      d.assign(vec2(1.0, 1.0));
    });
    const p = f.sub(0.5);
    const line = abs(dot(p, normalize(d)));
    const w = float(0.1).add(float(u.u_p1).mul(0.3));
    const v = float(1.0).sub(smoothstep(w.sub(0.01), w.add(0.01), line));
    return pow(clamp(v, 0.0, 1.0), u.u_intensity);
  })();
};

// ─── WARP GRID ───
export const warpGrid: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14)).toVar();
    If(float(u.u_p15).notEqual(0.0), () => {
      stv.assign(rotate2d(u.u_p15).mul(stv.sub(0.5)).add(0.5));
    });
    const n = noiseVal(
      stv.mul(u.u_scale).mul(4.0).add(float(u.u_time).mul(u.u_speed).mul(0.2)),
      u.u_seed,
    ).toVar();
    n.addAssign(
      noiseVal(stv.mul(u.u_scale).mul(8.0).sub(float(u.u_time).mul(0.1)), u.u_seed).mul(0.5),
    );
    const freq = float(5.0).add(float(u.u_p3).mul(20.0));
    const val = fract(n.mul(freq));
    const thick = float(0.1).add(float(u.u_factor).mul(0.4));
    const line = smoothstep(thick, thick.sub(0.05), abs(val.sub(0.5)));
    return clamp(line.mul(u.u_intensity), 0.0, 1.0);
  })();
};

// ─── ISO LINES ───
export const isoLines: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14));
    const uv = stv.mul(u.u_scale).mul(10.0).add(u.u_seed);
    const i = floor(uv);
    const f = fract(uv);
    const r = random2d(i, u.u_seed);
    const d = vec2(0.0).toVar();
    If(r.greaterThan(0.5), () => {
      d.assign(vec2(1.0, -1.0));
    }).Else(() => {
      d.assign(vec2(1.0, 1.0));
    });
    const p = f.sub(0.5);
    const line = abs(dot(p, normalize(d)));
    const w = float(0.1).add(float(u.u_p1).mul(0.3));
    const v = float(1.0).sub(smoothstep(w.sub(0.01), w.add(0.01), line));
    return pow(clamp(v, 0.0, 1.0), u.u_intensity);
  })();
};

// ─── CROSS STITCH ───
export const crossStitch: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14)).toVar();
    If(float(u.u_p15).notEqual(0.0), () => {
      stv.assign(rotate2d(u.u_p15).mul(stv.sub(0.5)).add(0.5));
    });
    const uv = stv.mul(u.u_scale).mul(10.0);
    const f = fract(uv);
    const c = mod(floor(uv.x).add(floor(uv.y)), 2.0);
    const uvCross = f.sub(0.5).mul(2.0).toVar();
    If(float(u.u_p10).greaterThan(0.0), () => {
      uvCross.assign(rotate2d(float(u.u_p10).mul(0.5)).mul(uvCross));
    });
    const thick = float(0.5).sub(float(u.u_p3).mul(0.4));
    const crossShape = float(1.0)
      .sub(
        clamp(
          smoothstep(thick, thick.add(0.1), abs(uvCross.x)).add(
            smoothstep(thick, thick.add(0.1), abs(uvCross.y)),
          ),
          0.0,
          1.0,
        ),
      )
      .toVar();
    If(float(u.u_p4).greaterThan(0.0), () => {
      crossShape.mulAssign(float(1.0).sub(smoothstep(0.4, 0.5, length(uvCross)).mul(u.u_p4)));
    });
    const stitch = c.mul(crossShape).toVar();
    If(float(u.u_p1).greaterThan(0.0), () => {
      stitch.assign(mix(c, stitch, u.u_p1));
    });
    If(float(u.u_p6).greaterThan(0.0), () => {
      stitch.addAssign(random2d(uv, u.u_seed).sub(0.5).mul(u.u_p6));
    });
    return pow(clamp(stitch, 0.0, 1.0), u.u_intensity);
  })();
};

// ─── WEAVE KNIT ───
export const weaveKnit: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14)).toVar();
    If(float(u.u_p15).notEqual(0.0), () => {
      stv.assign(rotate2d(u.u_p15).mul(stv.sub(0.5)).add(0.5));
    });
    const uv = stv.mul(6.0).mul(u.u_scale).toVar();
    const t = float(u.u_time).mul(u.u_speed);
    If(float(u.u_p8).greaterThan(0.0), () => {
      uv.assign(rotate2d(u.u_p8).mul(uv));
    });
    uv.y.addAssign(sin(uv.x.mul(u.u_p10).add(t)).mul(u.u_p1));
    const sq = floor(fract(uv.y).mul(2.0).sub(1.0).mul(fract(uv.x).mul(2.0).sub(1.0)))
      .add(1.0)
      .toVar();
    const tension = float(0.075).sub(float(u.u_p9).mul(0.05));
    const diff = uv.x.sub(uv.y).toVar();
    const sum = uv.x.add(uv.y).toVar();
    const sq2A = floor(fract(diff.sub(tension)).add(0.15)).mul(
      floor(fract(sum.sub(tension)).add(0.15)),
    );
    const sq2B = floor(fract(diff.sub(tension).add(0.5)).add(0.15)).mul(
      floor(fract(sum.add(0.5).sub(tension)).add(0.15)),
    );
    const sq2 = sq2A.add(sq2B);
    const pattern = mix(sq, sq2, u.u_p2).toVar();
    If(float(u.u_p4).greaterThan(0.0), () => {
      pattern.subAssign(noiseVal(uv.mul(10.0), u.u_seed).mul(u.u_p4));
    });
    return pow(clamp(pattern, 0.0, 1.0), u.u_intensity);
  })();
};

// ─── RGB RINGS ───
export const rgbRings: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).mul(2.0);
    const d = length(uv).toVar();
    If(float(u.u_p9).greaterThan(0.0), () => {
      d.assign(pow(max(float(0.001), d), float(1.0).add(u.u_p9)));
    });
    const t = float(u.u_time).mul(u.u_speed).mul(6.28);
    const spacing = float(10.0).add(float(u.u_p1).mul(40.0)).div(u.u_scale);
    const ringPhase = d.mul(spacing).sub(t);
    const offR = float(u.u_p4).mul(PI);
    const offG = float(u.u_p5).mul(PI);
    const offB = float(u.u_p6).mul(PI);
    const rr = smoothstep(u.u_p7, float(u.u_p7).add(0.1), sin(ringPhase.add(offR)));
    const gg = smoothstep(u.u_p7, float(u.u_p7).add(0.1), cos(ringPhase.add(offG)));
    const bb = smoothstep(u.u_p7, float(u.u_p7).add(0.1), cos(ringPhase.add(offB).add(2.0)));
    const combined = rr.add(gg).add(bb).div(3.0).toVar();
    If(float(u.u_p2).greaterThan(0.0), () => {
      combined.addAssign(noiseVal(uv.mul(10.0).add(t), u.u_seed).mul(u.u_p2));
    });
    return clamp(combined, 0.0, 1.0).mul(u.u_intensity);
  })();
};

// ─── ROTATING GRID ───
export const rotatingGrid: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).mul(8.0).mul(u.u_scale);
    const index = floor(uv);
    const f = fract(uv).toVar();
    const check = mod(index.x.add(index.y), 2.0);
    const angle = float(u.u_time).mul(u.u_speed).toVar();
    If(check.greaterThan(0.5), () => {
      angle.mulAssign(-1.0);
    });
    f.subAssign(0.5);
    const c = cos(angle);
    const s = sin(angle);
    f.assign(vec2(f.x.mul(c).sub(f.y.mul(s)), f.x.mul(s).add(f.y.mul(c))));
    f.addAssign(0.5);
    // Circle shape
    const dist = f.sub(0.5);
    const dd = dot(dist, dist).mul(4.0);
    const radius = float(0.8).mul(u.u_detail);
    const circleVal = float(1.0).sub(smoothstep(radius.sub(0.01), radius.add(0.01), dd));
    return pow(clamp(circleVal, 0.0, 1.0), u.u_intensity);
  })();
};

// ─── RIPPLE GRID ───
export const rippleGrid: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).mul(u.u_scale).mul(10.0);
    const p0 = floor(uv);
    const circles = float(0.0).toVar();
    const freq = float(10.0).add(float(u.u_p10).mul(20.0));

    Loop({ start: int(-2), end: int(3), type: "int", condition: "<" }, ({ i: j }: any) => {
      Loop({ start: int(-2), end: int(3), type: "int", condition: "<" }, ({ i }: any) => {
        const pi = p0.add(vec2(float(i), float(j)));
        const hsh = pi;
        // Simple hash for center position
        const px = fract(sin(dot(hsh, vec2(127.1, 311.7))).mul(43758.5453));
        const py = fract(sin(dot(hsh, vec2(269.5, 183.3))).mul(43758.5453));
        const p = pi.add(vec2(px, py));
        const h12 = fract(sin(dot(hsh, vec2(12.9898, 78.233))).mul(43758.5453));
        const t = fract(float(0.3).mul(u.u_time).mul(u.u_speed).add(h12.mul(u.u_p5)));
        const v = p.sub(uv);
        const d = length(v);
        const radius = float(3.0).mul(t).mul(float(1.0).add(u.u_p3));
        const wave = sin(freq.mul(d.sub(radius)));
        const env1 = smoothstep(0.0, -0.3, d.sub(radius));
        const env2 = smoothstep(-0.6, -0.3, d.sub(radius));
        const envelope = env1.mul(env2);
        const fade = float(1.0).sub(t.mul(float(1.0).add(u.u_p2)));
        circles.addAssign(wave.mul(envelope).mul(fade));
      });
    });

    return clamp(circles.mul(0.5).add(0.5), 0.0, 1.0).mul(u.u_intensity);
  })();
};

// ─── PYRAMID SCENE ───
export const pyramidScene: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).mul(2.0);
    const t = float(u.u_time).mul(u.u_speed);
    const camPos = vec3(
      sin(t.mul(0.5)).mul(1.5),
      float(0.5).add(float(u.u_p1).sub(0.5)),
      cos(t.mul(0.5)).mul(1.5),
    );
    const lookAt = vec3(0.0, -0.08, 0.0);
    const fwd = lookAt.sub(camPos).normalize();
    const right = cross(vec3(0, 1, 0), fwd).normalize();
    const up = cross(fwd, right);
    const fov = float(0.4).add(float(u.u_factor).mul(0.5));
    const rd = fwd.add(right.mul(uv.x).mul(fov)).add(up.mul(uv.y).mul(fov)).normalize();
    const delta = float(0.2).mul(u.u_scale);
    const p1 = vec3(0, delta, 0);
    const center = vec3(0.0);
    // Simplified: point glow + wireframe interference
    const d = length(cross(p1.sub(camPos), rd)).div(length(rd));
    const pointGlow = smoothstep(0.02, 0.0, d);
    const distToCenter = length(cross(center.sub(camPos), rd));
    const wireframe = float(0.05).div(distToCenter.add(0.01)).mul(u.u_intensity);
    const interference = sin(d.mul(100.0).sub(float(u.u_time).mul(5.0)))
      .mul(0.5)
      .add(0.5);
    return clamp(pointGlow.add(wireframe.mul(interference)), 0.0, 1.0);
  })();
};
