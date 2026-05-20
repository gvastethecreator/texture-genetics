/**
 * TSL Abstract Patterns (22 patterns)
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
  clamp,
  pow,
  length,
  distance,
  smoothstep,
  atan,
  exp,
  If,
  Loop,
  log,
  normalize,
} from "three/tsl";
import type { TslPatternFn } from "../tslBuilder";
import type { TslUniforms } from "../uniforms";
import { noise2d as _noise2d, snoise2d, random2d } from "../chunks/noise";
import { rot2D } from "../chunks/sdf";

// Helper: noise shorthand
const noiseVal = (p: any, seed?: any) =>
  _noise2d(p, seed ?? float(0))
    .mul(0.5)
    .add(0.5);

// ─── 1. SCANLINES ───
export const scanlines: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14)).toVar();
    // Pixelation
    If(float(u.u_p15).greaterThan(0.001), () => {
      const steps = float(50.0).mul(u.u_p15);
      stv.x.assign(floor(stv.x.mul(steps)).div(steps));
    });
    const c = vec2(u.u_resolution)
      .y.mul(u.u_scale)
      .mul(0.1)
      .mul(float(1.0).add(float(u.u_p1).mul(2.0)));
    const m = float(0.0).toVar();
    If(float(u.u_factor).greaterThan(0.5), () => {
      m.assign(float(u.u_time).mul(5.0));
    });
    const l = sin(float(stv.y).mul(c).add(m)).mul(0.5).add(0.5).toVar();
    const vig = float(1.0).sub(distance(stv, vec2(0.5)).mul(u.u_intensity));
    // Noise jitter
    If(float(u.u_p2).greaterThan(0.0), () => {
      l.addAssign(random2d(stv.mul(u.u_time), u.u_seed).sub(0.5).mul(u.u_p2));
    });
    return clamp(l.mul(vig), 0.0, 1.0);
  })();
};

// ─── 2. MAGIC CIRCLE ───
export const magicCircle: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const stv = vec2(st).add(vec2(u.u_p13, u.u_p14)).toVar();
    // Warp
    If(float(u.u_p15).abs().greaterThan(0.0), () => {
      stv.addAssign(
        vec2(
          sin(stv.y.mul(10.0)).mul(float(u.u_p15).mul(0.05)),
          cos(stv.x.mul(10.0)).mul(float(u.u_p15).mul(0.05)),
        ),
      );
    });
    const uv = stv.sub(0.5).mul(2.0).mul(u.u_scale).toVar();
    const d = length(uv);
    const a = atan(uv.y, uv.x);
    const v = smoothstep(0.02, 0.0, abs(d.sub(0.8))).toVar();
    const k = float(3.0).add(floor(float(u.u_factor).mul(8.0)));
    v.addAssign(
      smoothstep(0.02, 0.0, abs(d.sub(float(0.5).add(cos(a.mul(k).add(u.u_time)).mul(0.1))))),
    );
    // Inner ring noise
    If(d.greaterThan(0.6).and(d.lessThan(0.75)), () => {
      v.addAssign(step(0.5, noiseVal(vec2(a.mul(10.0), 0.0))).mul(0.5));
    });
    return clamp(v.mul(u.u_intensity), 0.0, 1.0);
  })();
};

// ─── 3. MANDALA ───
export const mandala: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).mul(2.0).mul(u.u_scale).toVar();
    const d = length(uv);
    const a = atan(uv.y, uv.x);
    const p = float(4.0).add(floor(float(u.u_factor).mul(12.0)));
    const v = smoothstep(0.0, 1.0, cos(a.mul(p)).mul(0.5).add(0.5).sub(d)).toVar();
    v.addAssign(cos(d.mul(20.0).sub(u.u_time)).mul(0.2));
    return pow(clamp(v, 0.0, 1.0), float(u.u_intensity));
  })();
};

// ─── 4. ELECTRIC ───
export const electric: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const p = vec2(st).mul(2.0).sub(1.0).mul(u.u_scale).toVar();
    const t = float(u.u_time).mul(2.0);
    Loop({ start: int(1), end: int(8), type: "int", condition: "<" }, ({ i }: { i: any }) => {
      const fi = float(i);
      const s = float(0.3).mul(float(1.0).add(u.u_factor));
      p.x.addAssign(s.div(fi).mul(sin(fi.mul(3.0).mul(p.y).add(t))));
      p.y.addAssign(s.div(fi).mul(cos(fi.mul(3.0).mul(p.x).add(t))));
    });
    return pow(clamp(sin(p.x.add(p.y).add(1.0)).mul(0.5).add(0.5), 0.0, 1.0), float(u.u_intensity));
  })();
};

// ─── 5. BINARY MATRIX ───
export const binaryMatrix: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).mul(u.u_scale).mul(20.0).toVar();
    const i = floor(uv);
    const s = random2d(vec2(i.x, 0.0), u.u_seed).mul(5.0).add(2.0);
    const y = mod(uv.y.add(float(u.u_time).mul(s).mul(float(1.0).add(u.u_p2))), 20.0);
    const v = step(10.0, y)
      .mul(random2d(i.add(floor(float(u.u_time).mul(5.0))), u.u_seed))
      .toVar();
    v.mulAssign(smoothstep(20.0, 10.0, y));
    // Highlight glitch
    If(
      random2d(vec2(uv.y, float(u.u_time)), u.u_seed).greaterThan(
        float(1.0).sub(float(u.u_factor).mul(0.2).add(float(u.u_p1).mul(0.5))),
      ),
      () => {
        v.assign(1.0);
      },
    );
    return clamp(v.mul(u.u_intensity).mul(float(1.0).add(u.u_p3)), 0.0, 1.0);
  })();
};

// ─── 6. EXPLOSION ───
export const explosion: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).mul(2.0).mul(u.u_scale).toVar();
    const d = length(uv);
    const r = mod(float(u.u_time), 2.0);
    const val = smoothstep(0.1, 0.0, abs(d.sub(r))).toVar();
    const n = noiseVal(uv.mul(10.0).add(u.u_time));
    val.addAssign(step(float(1.0).sub(float(u.u_factor).mul(0.5)), n).mul(float(1.0).sub(d)));
    return clamp(val.mul(u.u_intensity), 0.0, 1.0);
  })();
};

// ─── 7. RADIAL WAVE ───
export const radialWave: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).toVar();
    const w = sin(length(uv).mul(40.0).mul(u.u_scale).sub(float(u.u_time).mul(5.0))).toVar();
    If(float(u.u_factor).greaterThan(0.0), () => {
      w.addAssign(sin(atan(uv.y, uv.x).mul(10.0).mul(u.u_factor)));
    });
    return pow(clamp(w.mul(0.5).add(0.5), 0.0, 1.0), float(u.u_intensity));
  })();
};

// ─── 8. CIRCUIT ───
export const circuit: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).mul(u.u_scale).mul(10.0).toVar();
    const i = floor(uv);
    const f = fract(uv);
    const r = random2d(i, u.u_seed);
    const v = float(0.0).toVar();
    const thick = float(0.05).add(float(0.1).mul(u.u_factor));
    // Horizontal or vertical line based on random
    If(r.lessThan(0.5), () => {
      v.assign(step(abs(f.x.sub(0.5)), thick));
    });
    If(r.greaterThanEqual(0.5), () => {
      v.assign(step(abs(f.y.sub(0.5)), thick));
    });
    // Junction dots
    If(random2d(i.add(1.0), u.u_seed).greaterThan(0.8), () => {
      v.addAssign(step(length(f.sub(0.5)), float(0.2).add(float(u.u_p10).mul(0.2))));
    });
    // Flicker
    If(float(u.u_p6).greaterThan(0.0).and(v.greaterThan(0.5)), () => {
      const flicker = step(
        float(1.0).sub(u.u_p6),
        random2d(i.add(floor(float(u.u_time).mul(5.0))), u.u_seed),
      );
      v.mulAssign(flicker);
    });
    return pow(clamp(v, 0.0, 1.0), float(u.u_intensity));
  })();
};

// ─── 9. MANDELBROT ───
export const mandelbrot: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const c = vec2(st).sub(0.5).mul(3.0).div(u.u_scale).sub(vec2(0.5, 0.0)).add(u.u_offset).toVar();
    const z = vec2(0.0).toVar();
    const iter = float(0.0).toVar();
    const maxIter = float(20.0).add(float(u.u_detail).mul(80.0));
    Loop({ start: int(0), end: int(100), type: "int", condition: "<" }, ({ i }: { i: any }) => {
      If(float(i).greaterThan(maxIter), () => {
        return;
      });
      z.assign(vec2(z.x.mul(z.x).sub(z.y.mul(z.y)), float(2.0).mul(z.x).mul(z.y)).add(c));
      If(dot(z, z).greaterThan(4.0), () => {
        return;
      });
      iter.addAssign(1.0);
    });
    return pow(clamp(iter.div(maxIter), 0.0, 1.0), float(u.u_intensity)).mul(
      float(1.0).add(float(u.u_factor).mul(sin(iter))),
    );
  })();
};

// ─── 10. JULIA ───
export const julia: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const z = vec2(st).sub(0.5).mul(3.0).div(u.u_scale).toVar();
    const c = vec2(-0.8, 0.156)
      .add(
        vec2(sin(float(u.u_time).mul(0.5)), cos(float(u.u_time).mul(0.5)))
          .mul(0.1)
          .mul(u.u_factor),
      )
      .toVar();
    const iter = float(0.0).toVar();
    const maxIter = float(20.0).add(float(u.u_detail).mul(80.0));
    Loop({ start: int(0), end: int(100), type: "int", condition: "<" }, ({ i }: { i: any }) => {
      If(float(i).greaterThan(maxIter), () => {
        return;
      });
      z.assign(vec2(z.x.mul(z.x).sub(z.y.mul(z.y)), float(2.0).mul(z.x).mul(z.y)).add(c));
      If(dot(z, z).greaterThan(4.0), () => {
        return;
      });
      iter.addAssign(1.0);
    });
    return pow(clamp(iter.div(maxIter), 0.0, 1.0), float(u.u_intensity));
  })();
};

// ─── 11. FLOW FIELD ───
export const flowField: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const p = vec2(st).sub(0.5).mul(2.0).mul(u.u_scale).toVar();
    const f = sin(atan(p.y, p.x).add(length(p).mul(float(2.0).add(float(u.u_factor).mul(10.0)))));
    const l = abs(mod(p.y, 0.1).sub(0.05)).add(p.x);
    const move = float(u.u_time).mul(float(u.u_speed)).toVar();
    // sign(f) approximation: step(0, f)*2-1
    const sgnF = step(0.0, f).mul(2.0).sub(1.0);
    move.mulAssign(sgnF);
    const x = mod(l.add(move), float(0.05).add(float(u.u_p2).mul(0.1))).mul(20.0);
    const w = float(0.1).add(float(1.0).sub(u.u_detail).mul(0.2));
    const lines = smoothstep(0.0, w, x).mul(smoothstep(0.5, float(0.5).add(w), float(1.0).sub(x)));
    const gap = float(u.u_intensity).mul(0.5);
    return clamp(lines.mul(smoothstep(0.0, max(0.001, gap), abs(f))), 0.0, 1.0);
  })();
};

// ─── 12. INFINITE FALL ───
export const infiniteFall: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).mul(2.0).toVar();
    const t = float(u.u_time).mul(2.0);
    const ang = float(u.u_time).mul(float(u.u_factor).sub(0.5));
    // Rotate uv
    const s = sin(ang);
    const c = cos(ang);
    const rotUv = vec2(uv.x.mul(c).sub(uv.y.mul(s)), uv.x.mul(s).add(uv.y.mul(c)));
    uv.assign(rotUv.mul(u.u_scale));
    // Rotation matrix for fractal layers
    const mc = cos(1.7);
    const ms = sin(1.7);
    const v = float(0.0).toVar();
    const tot = float(0.0).toVar();
    Loop({ start: int(0), end: int(20), type: "int", condition: "<" }, ({ i }: { i: any }) => {
      const fi = float(i);
      const k = fi.sub(t);
      const a = float(1.0).sub(
        cos(
          float(Math.PI * 2)
            .mul(k)
            .div(20.0),
        ),
      );
      const sc = exp(mod(k, 20.0).mul(Math.LN2)); // exp2 = exp(x * ln2)
      const n = noiseVal(uv.mul(sc).mul(0.2));
      v.addAssign(a.div(sc).mul(float(1.0).sub(abs(float(2.0).mul(n).sub(1.0)))));
      tot.addAssign(a.div(sc));
      // Apply rotation: uv = M * uv
      const newX = uv.x.mul(mc).add(uv.y.mul(ms));
      const newY = uv.x.mul(ms).negate().add(uv.y.mul(mc));
      uv.assign(vec2(newX, newY));
    });
    return pow(clamp(float(1.5).mul(v).div(max(tot, 0.001)), 0.0, 1.0), float(u.u_intensity));
  })();
};

// ─── 13. VOXEL TUNNEL ───
export const voxelTunnel: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const p = vec2(st).sub(0.5).mul(2.0).toVar();
    const t = float(u.u_time).mul(u.u_speed);
    // Tunnel effect via polar inversion
    const tunnel = float(1.0).div(max(length(p), 0.001));
    const checkers = sin(tunnel.mul(10.0).add(u.u_time)).mul(sin(atan(p.y, p.x).mul(5.0)));
    // Accumulate noise layers along virtual depth
    const accum = float(0.0).toVar();
    Loop({ start: int(0), end: int(10), type: "int", condition: "<" }, ({ i }: { i: any }) => {
      const fi = float(i);
      // Approximate hit point using depth projection
      const hitXZ = vec2(
        p.x.mul(float(10.0).div(max(fi.add(1.0), 0.1))).add(t.mul(15.0)),
        p.y.mul(float(10.0).div(max(fi.add(1.0), 0.1))),
      );
      const n = noiseVal(hitXZ.mul(0.1).mul(u.u_scale));
      accum.addAssign(n.mul(0.1));
    });
    return clamp(accum.add(checkers.mul(u.u_factor).mul(0.2)), 0.0, 1.0).mul(u.u_intensity);
  })();
};

// ─── 14. HYPNOTIC RINGS ───
export const hypnoticRings: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).mul(2.0).toVar();
    const dist = length(uv);
    const angle = atan(uv.y, uv.x);
    const s = float(10.0).mul(u.u_scale);
    const t = float(u.u_time).mul(float(u.u_speed).mul(2.0).add(0.5));
    const val = sin(
      dist
        .mul(s)
        .add(angle)
        .add(cos(dist.mul(s).mul(u.u_factor)))
        .sub(t),
    ).toVar();
    val.subAssign(dist.mul(float(1.0).add(sin(t.mul(1.3)).mul(0.5))));
    return clamp(val.mul(0.5).add(0.5), 0.0, 1.0).mul(u.u_intensity);
  })();
};

// ─── 15. METABALL SPIRAL ───
export const metaballSpiral: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).mul(2.0).toVar();
    const t = float(u.u_time).mul(u.u_speed);
    const phase = float(1.1);
    const tho = length(uv).mul(phase).add(sin(t));
    uv.addAssign(
      vec2(
        tho.mul(cos(tho.sub(float(1.25).mul(t).mul(2.0)))),
        tho.mul(sin(tho.sub(float(1.15).mul(t).mul(2.0)))),
      ),
    );
    const mbr = float(0.5).add(float(u.u_factor).mul(2.0));
    const mb = mbr.div(max(dot(uv, uv), 0.001));
    const d = smoothstep(mb.sub(2.0), mb.add(1.2), 1.0);
    return clamp(float(1.0).sub(d), 0.0, 1.0).mul(u.u_intensity);
  })();
};

// ─── 16. INVERSE MOBIUS ───
export const inverseMobius: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const z = vec2(st).sub(0.5).mul(2.0).toVar();
    const a = vec2(float(u.u_factor).sub(0.5), 0.0).mul(1.5);
    const b = vec2(float(0.5).sub(u.u_factor), 0.2);
    // Complex division: (z-a)/(z-b)
    const num = z.sub(a);
    const den = z.sub(b);
    const dotDen = max(dot(den, den), 0.001);
    z.assign(
      vec2(
        num.x.mul(den.x).add(num.y.mul(den.y)).div(dotDen),
        num.y.mul(den.x).sub(num.x.mul(den.y)).div(dotDen),
      ),
    );
    const r = length(z);
    const angle = atan(z.y, z.x);
    const gridUV = vec2(angle.div(Math.PI * 2), log(max(0.001, r))).toVar();
    gridUV.x.addAssign(float(u.u_time).mul(0.1));
    gridUV.y.subAssign(float(u.u_time).mul(0.5));
    gridUV.mulAssign(float(u.u_scale).mul(5.0));
    const f = fract(gridUV);
    const thresh = float(0.9).sub(float(u.u_intensity).mul(0.2));
    const line = max(step(thresh, f.x), step(thresh, f.y)).toVar();
    // Detail noise blend
    If(float(u.u_detail).greaterThan(0.0), () => {
      const n = noiseVal(gridUV.mul(5.0));
      line.assign(mix(line, n, float(u.u_detail).mul(0.5)));
    });
    return clamp(line, 0.0, 1.0);
  })();
};

// ─── 17. STEREO FLOW ───
export const stereoFlow: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).mul(2.0).toVar();
    const t = float(u.u_time).mul(u.u_speed);
    const n = noiseVal(uv.mul(u.u_scale).mul(2.0).add(t)).toVar();
    Loop({ start: int(0), end: int(10), type: "int", condition: "<" }, ({ i }: { i: any }) => {
      const fi = float(i);
      const px = sin(t.mul(2.0).add(fi)).mul(0.5);
      const py = cos(t.mul(1.5).sub(fi)).mul(0.5);
      const dist = distance(uv, vec2(px, py));
      const r = float(0.1).add(sin(fi).mul(0.05).mul(u.u_factor));
      If(dist.lessThan(r), () => {
        n.assign(noiseVal(uv.mul(10.0).add(fi)));
      });
    });
    return clamp(n, 0.0, 1.0).mul(u.u_intensity);
  })();
};

// ─── 18. SMOOTH SWIRL ───
export const smoothSwirl: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    // Inner swirl function
    const getSwirl = (uvin: any, scaleMul: any) => {
      const sv = vec2(uvin).sub(0.5).mul(2.0).toVar();
      sv.mulAssign(scaleMul);
      const r = length(sv);
      const a = atan(sv.y, sv.x).add(r.mul(u.u_factor).mul(5.0)).sub(u.u_time);
      sv.assign(vec2(cos(a), sin(a)).mul(r));
      sv.assign(sv.mul(0.5).add(0.5));
      return smoothstep(0.2, 0.8, sv.x.mul(sv.y));
    };
    const s = getSwirl(st, float(u.u_scale)).toVar();
    // Layer 2
    If(float(u.u_detail).greaterThan(0.0), () => {
      const s2 = getSwirl(vec2(st).mul(1.0).add(vec2(0.2)), float(u.u_scale).mul(1.5));
      s.assign(mix(s, s2, float(u.u_detail)));
    });
    return pow(clamp(s, 0.0, 1.0), float(u.u_intensity));
  })();
};

// ─── 19. NEON RIPPLES ───
export const neonRipples: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).mul(2.0).sub(1.0).mul(u.u_scale).toVar();
    const t = float(u.u_time).mul(0.5).mul(u.u_speed);
    const layers = float(2.0).add(floor(float(u.u_factor).mul(6.0)));
    Loop({ start: int(1), end: int(8), type: "int", condition: "<" }, ({ i }: { i: any }) => {
      const fi = float(i);
      If(fi.greaterThan(layers), () => {
        return;
      });
      uv.y.addAssign(
        fi
          .mul(0.1)
          .div(fi)
          .mul(sin(uv.x.mul(fi).mul(fi).add(t)))
          .mul(sin(uv.y.mul(fi).mul(fi).add(t))),
      );
    });
    const r = uv.y.sub(0.1);
    const g = uv.y.add(0.3);
    const b = uv.y.add(0.95);
    const combined = r.add(g).add(b).div(3.0);
    return clamp(combined, 0.0, 1.0).mul(u.u_intensity);
  })();
};

// ─── 20. BLACK HOLE ───
export const blackHole: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).mul(2.0).sub(1.0).mul(u.u_scale).toVar();
    const len = length(uv);
    const n0 = snoise2d(uv.mul(0.65).add(float(u.u_time).mul(0.5)))
      .mul(0.5)
      .add(0.5);
    const r0 = mix(mix(0.6, 1.0, 0.4), mix(0.6, 1.0, 0.6), n0);
    const d0 = distance(uv, vec2(uv).mul(r0).div(max(len, 0.001)));
    // light1: intensity / (1 + dist * attenuation)
    const v0 = float(1.0)
      .div(float(1.0).add(d0.mul(10.0)))
      .toVar();
    v0.mulAssign(smoothstep(r0.mul(1.05), r0, len));
    // Orbiting light
    const a = float(u.u_time).mul(-1.0);
    const pos = vec2(cos(a), sin(a)).mul(r0);
    const d = distance(uv, pos);
    // light2: intensity / (1 + dist^2 * attenuation)
    const v1 = float(1.5).div(float(1.0).add(d.mul(d).mul(5.0)));
    const v1mod = v1.mul(float(1.0).div(float(1.0).add(d0.mul(50.0))));
    const v2 = smoothstep(1.0, mix(0.6, 1.0, n0.mul(0.5)), len);
    const v3 = smoothstep(0.6, mix(0.6, 1.0, 0.5), len);
    const col = v0.add(v1mod).mul(v2).mul(v3).toVar();
    col.addAssign(float(1.0).div(len.mul(2.0).add(0.1)).mul(u.u_factor).mul(0.1));
    return clamp(col, 0.0, 1.0).mul(u.u_intensity);
  })();
};

// ─── 21. SPACE DUST ───
export const spaceDust: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).mul(2.0).toVar();
    const d = normalize(vec3(uv, float(1.0).sub(float(u.u_distortion).mul(0.5)))).toVar();
    const p = vec3(0.0, 0.0, -3.0).toVar();
    const t = float(u.u_time).mul(u.u_speed);
    // Apply rotation
    const rMat = rot2D(t.mul(0.2));
    // Rotate d.xz and p.xz
    const dxz = vec2(d.x, d.z).mul(rMat).toVar();
    d.x.assign(dxz.x);
    d.z.assign(dxz.y);
    const pxz = vec2(p.x, p.z).mul(rMat).toVar();
    p.x.assign(pxz.x);
    p.z.assign(pxz.y);

    const accum = float(0.0).toVar();
    Loop({ start: int(0), end: int(60), type: "int", condition: "<" }, () => {
      const v = vec3(p).toVar();
      const s = float(1.0).toVar();
      Loop({ start: int(0), end: int(5), type: "int", condition: "<" }, () => {
        v.assign(abs(v).sub(vec3(float(1.0).add(float(u.u_scale).mul(0.2)))));
        const vxz = vec2(v.x, v.z)
          .mul(rot2D(float(1.0).add(u.u_factor)))
          .toVar();
        v.x.assign(vxz.x);
        v.z.assign(vxz.y);
        const vyz = vec2(v.y, v.z).mul(rot2D(1.0)).toVar();
        v.y.assign(vyz.x);
        v.z.assign(vyz.y);
        s.mulAssign(0.5);
      });
      const dist = length(v).mul(s).sub(0.02);
      If(dist.lessThan(0.01), () => {
        accum.addAssign(0.1);
      });
      p.addAssign(d.mul(max(0.05, dist)));
      If(length(p).greaterThan(20.0), () => {
        return;
      });
    });
    return clamp(accum.mul(u.u_intensity), 0.0, 1.0);
  })();
};

// ─── 22. GABOR NOISE ───
export const gaborNoise: TslPatternFn = (st: any, u: TslUniforms) => {
  return Fn(() => {
    const uv = vec2(st).sub(0.5).mul(4.0).mul(u.u_scale).toVar();
    const v = float(0.0).toVar();
    const freq = float(6.0).add(float(u.u_factor).mul(10.0));
    Loop({ start: int(-2), end: int(3), type: "int", condition: "<" }, ({ i }: { i: any }) => {
      Loop({ start: int(-2), end: int(3), type: "int", condition: "<" }, ({ i: j }: { i: any }) => {
        const offset = vec2(float(i), float(j)).mul(0.7);
        const p = uv.sub(offset);
        const len = dot(p, p);
        const wave = sin(freq.mul(dot(p, vec2(cos(u.u_time), sin(u.u_time)))));
        v.addAssign(exp(float(-2.0).mul(len)).mul(wave));
      });
    });
    return clamp(float(0.5).add(v.mul(0.5)), 0.0, 1.0).mul(u.u_intensity);
  })();
};
