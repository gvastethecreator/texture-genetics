/**
 * TSL Noise Functions
 * Converted from GLSL chunks. All functions are pure TSL Fn nodes.
 * Seed/detail params are passed explicitly (no globals).
 */
import {
  Fn,
  float,
  int,
  vec2,
  vec3,
  vec4,
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
  pow,
  sqrt,
  length,
  exp,
  Loop,
  If,
  select,
} from "three/tsl";

const stepVector = step as (edge: any, value: any) => any;

// ========================
// BASE RANDOM
// ========================

/** Pseudo-random float from vec2 + seed */
export const random2d = /*@__PURE__*/ Fn(([st_in, seed_in]: [any, any]) => {
  const st = vec2(st_in);
  const seed = float(seed_in);
  return fract(sin(dot(st.add(vec2(seed, seed)), vec2(12.9898, 78.233))).mul(43758.5453123));
});

/** Pseudo-random float from vec3 + seed */
const random3d = /*@__PURE__*/ Fn(([p_in, seed_in]: [any, any]) => {
  const p = vec3(p_in);
  const seed = float(seed_in);
  return fract(
    sin(dot(p.add(vec3(seed, seed, seed)), vec3(12.9898, 78.233, 45.5432))).mul(43758.5453),
  );
});

// ========================
// HASH FUNCTIONS
// ========================

/** vec2 → vec2 hash */
export const hash22 = /*@__PURE__*/ Fn(([p_in]: [any]) => {
  const p = vec2(p_in);
  const p3 = fract(vec3(p.x, p.y, p.x).mul(vec3(0.1031, 0.103, 0.0973))).toVar();
  p3.addAssign(dot(p3, p3.yzx.add(19.19)));
  return fract(p3.xx.add(p3.yz).mul(p3.zy));
});

/** vec3 → vec3 hash */
const hash33 = /*@__PURE__*/ Fn(([p_in]: [any]) => {
  const p = fract(vec3(p_in).mul(vec3(0.1031, 0.103, 0.0973))).toVar();
  p.addAssign(dot(p, p.yxz.add(33.33)));
  return fract(p.xxy.add(p.yxx).mul(p.zyx));
});

// ========================
// PERMUTATION HELPERS (for Simplex)
// ========================

const mod289_v3 = /*@__PURE__*/ Fn(([x_in]: [any]) => {
  const x = vec3(x_in);
  return x.sub(floor(x.mul(1.0 / 289.0)).mul(289.0));
});

const permute_v3 = /*@__PURE__*/ Fn(([x_in]: [any]) => {
  const x = vec3(x_in);
  return mod(x.mul(34.0).add(1.0).mul(x), 289.0);
});

const permute_v4 = /*@__PURE__*/ Fn(([x_in]: [any]) => {
  const x = vec4(x_in);
  return mod(x.mul(34.0).add(1.0).mul(x), 289.0);
});

const taylorInvSqrt_v4 = /*@__PURE__*/ Fn(([r_in]: [any]) => {
  const r = vec4(r_in);
  return float(1.79284291400159).sub(r.mul(0.85373472095314));
});

// ========================
// SIMPLEX NOISE
// ========================

/** 2D Simplex Noise → [-1, 1] */
export const snoise2d = /*@__PURE__*/ Fn(([v_in]: [any]) => {
  const v = vec2(v_in);
  const C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);

  const i = floor(v.add(dot(v, C.yy))).toVar();
  const x0 = v.sub(i).add(dot(i, C.xx));

  const i1 = select(x0.x.greaterThan(x0.y), vec2(1, 0), vec2(0, 1));

  const x12 = x0.xyxy.add(C.xxzz).toVar();
  x12.xy.subAssign(i1);

  i.assign(mod(i, 289.0));

  const p = permute_v3(
    permute_v3(i.y.add(vec3(0.0, i1.y, 1.0)))
      .add(i.x)
      .add(vec3(0.0, i1.x, 1.0)),
  );

  const m = max(
    float(0.5).sub(vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw))),
    0.0,
  ).toVar();
  m.assign(m.mul(m));
  m.assign(m.mul(m));

  const x = fract(p.mul(C.www)).mul(2.0).sub(1.0);
  const h = abs(x).sub(0.5);
  const ox = floor(x.add(0.5));
  const a0 = x.sub(ox);

  m.mulAssign(float(1.79284291400159).sub(a0.mul(a0).add(h.mul(h)).mul(0.85373472095314)));

  const gx = a0.x.mul(x0.x).add(h.x.mul(x0.y));
  const gyz = a0.yz.mul(x12.xz).add(h.yz.mul(x12.yw));
  const g = vec3(gx, gyz.x, gyz.y);

  return dot(m, g).mul(130.0);
});

/** 3D Simplex Noise → [-1, 1] */
export const snoise3d = /*@__PURE__*/ Fn(([v_in]: [any]) => {
  const v = vec3(v_in);
  const C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const D = vec4(0.0, 0.5, 1.0, 2.0);

  const i = floor(v.add(dot(v, C.yyy))).toVar();
  const x0 = v.sub(i).add(dot(i, C.xxx));

  const g = vec3(stepVector(x0.yzx, x0.xyz));
  const l = vec3(1).sub(g);
  const i1 = min(g.xyz, l.zxy);
  const i2 = max(g.xyz, l.zxy);

  const x1 = x0.sub(i1).add(C.xxx);
  const x2 = x0.sub(i2).add(C.yyy);
  const x3 = x0.sub(D.yyy);

  i.assign(mod289_v3(i));

  const p = permute_v4(
    permute_v4(
      permute_v4(i.z.add(vec4(0.0, i1.z, i2.z, 1.0)))
        .add(i.y)
        .add(vec4(0.0, i1.y, i2.y, 1.0)),
    )
      .add(i.x)
      .add(vec4(0.0, i1.x, i2.x, 1.0)),
  );

  const simplexScale = float(0.142857142857);
  const ns = D.wyz.mul(simplexScale).sub(D.xzx);

  const j = p.sub(floor(p.mul(ns.z).mul(ns.z)).mul(49.0));

  const xCells = floor(j.mul(ns.z));
  const yCells = floor(j.sub(xCells.mul(7.0)));

  const xv = xCells.mul(ns.x).add(ns.yyyy);
  const yv = yCells.mul(ns.x).add(ns.yyyy);
  const hv = vec4(1).sub(abs(xv)).sub(abs(yv));

  const b0 = vec4(xv.xy, yv.xy);
  const b1 = vec4(xv.zw, yv.zw);

  const s0 = floor(b0).mul(2.0).add(1.0);
  const s1 = floor(b1).mul(2.0).add(1.0);
  const sh = vec4(stepVector(hv, vec4(0))).negate();

  const a0 = b0.xzyw.add(s0.xzyw.mul(sh.xxyy));
  const a1 = b1.xzyw.add(s1.xzyw.mul(sh.zzww));

  const p0 = vec3(a0.xy, hv.x);
  const p1 = vec3(a0.zw, hv.y);
  const p2 = vec3(a1.xy, hv.z);
  const p3 = vec3(a1.zw, hv.w);

  const norm = taylorInvSqrt_v4(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  const p0n = p0.mul(norm.x);
  const p1n = p1.mul(norm.y);
  const p2n = p2.mul(norm.z);
  const p3n = p3.mul(norm.w);

  const m = max(
    vec4(0.6).sub(vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3))),
    0.0,
  ).toVar();
  m.assign(m.mul(m));

  return dot(m.mul(m), vec4(dot(p0n, x0), dot(p1n, x1), dot(p2n, x2), dot(p3n, x3))).mul(42.0);
});

// ========================
// VALUE NOISE
// ========================

/** 2D Value noise */
export const valueNoise = /*@__PURE__*/ Fn(([st_in, seed_in]: [any, any]) => {
  const st = vec2(st_in);
  const seed = float(seed_in);
  const i = floor(st);
  const f = fract(st);
  const u = f.mul(f).mul(float(3).sub(f.mul(2)));

  const a = random2d(i, seed);
  const b = random2d(i.add(vec2(1, 0)), seed);
  const c = random2d(i.add(vec2(0, 1)), seed);
  const d = random2d(i.add(vec2(1, 1)), seed);

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
});

// ========================
// CLASSIC NOISE (Value-based)
// ========================

/** 2D Classic noise [0,1] */
export const noise2d = /*@__PURE__*/ Fn(([st_in, seed_in]: [any, any]) => {
  const st = vec2(st_in);
  const seed = float(seed_in);
  const i = floor(st);
  const f = fract(st);

  const a = random2d(i, seed);
  const b = random2d(i.add(vec2(1, 0)), seed);
  const c = random2d(i.add(vec2(0, 1)), seed);
  const d = random2d(i.add(vec2(1, 1)), seed);

  const u = f.mul(f).mul(float(3).sub(f.mul(2)));

  return mix(a, b, u.x)
    .add(c.sub(a).mul(u.y).mul(float(1).sub(u.x)))
    .add(d.sub(b).mul(u.x).mul(u.y));
});

/** 3D Value noise */
export const noise3d = /*@__PURE__*/ Fn(([p_in, seed_in]: [any, any]) => {
  const p = vec3(p_in);
  const seed = float(seed_in);
  const i = floor(p);
  const f = fract(p);
  const u = f.mul(f).mul(float(3).sub(f.mul(2)));

  const a = random3d(i.add(vec3(0, 0, 0)), seed);
  const b = random3d(i.add(vec3(1, 0, 0)), seed);
  const c = random3d(i.add(vec3(0, 1, 0)), seed);
  const d = random3d(i.add(vec3(1, 1, 0)), seed);
  const e = random3d(i.add(vec3(0, 0, 1)), seed);
  const g = random3d(i.add(vec3(1, 0, 1)), seed);
  const h = random3d(i.add(vec3(0, 1, 1)), seed);
  const k = random3d(i.add(vec3(1, 1, 1)), seed);

  return mix(
    mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
    mix(mix(e, g, u.x), mix(h, k, u.x), u.y),
    u.z,
  );
});

// ========================
// FBM (Fractional Brownian Motion)
// ========================

/** 2D FBM with detail control */
export const fbm2d = /*@__PURE__*/ Fn(([st_in, seed_in, detail_in]: [any, any, any]) => {
  const st = vec2(st_in).toVar();
  const seed = float(seed_in);
  const detail = float(detail_in);

  // Rotation matrix for domain rotation between octaves
  const rotC = float(0.87758);
  const rotS = float(0.47942);

  const value = float(0).toVar();
  const amplitude = float(0.5).toVar();

  // Octave 1 (always)
  value.addAssign(amplitude.mul(noise2d(st, seed)));
  st.assign(
    vec2(st.x.mul(rotC).sub(st.y.mul(rotS)), st.x.mul(rotS).add(st.y.mul(rotC)))
      .mul(2)
      .add(100),
  );
  amplitude.mulAssign(0.5);

  // Octave 2
  If(detail.greaterThan(0), () => {
    value.addAssign(amplitude.mul(noise2d(st, seed)).mul(detail));
    st.assign(
      vec2(st.x.mul(rotC).sub(st.y.mul(rotS)), st.x.mul(rotS).add(st.y.mul(rotC)))
        .mul(2)
        .add(100),
    );
    amplitude.mulAssign(0.5);
  });

  // Octave 3
  If(detail.greaterThan(0.2), () => {
    value.addAssign(amplitude.mul(noise2d(st, seed)).mul(min(float(1), detail.mul(1.5))));
    st.assign(
      vec2(st.x.mul(rotC).sub(st.y.mul(rotS)), st.x.mul(rotS).add(st.y.mul(rotC)))
        .mul(2)
        .add(100),
    );
    amplitude.mulAssign(0.5);
  });

  // Octave 4
  If(detail.greaterThan(0.5), () => {
    value.addAssign(amplitude.mul(noise2d(st, seed)).mul(min(float(1), detail.mul(2))));
    st.assign(
      vec2(st.x.mul(rotC).sub(st.y.mul(rotS)), st.x.mul(rotS).add(st.y.mul(rotC)))
        .mul(2)
        .add(100),
    );
    amplitude.mulAssign(0.5);
  });

  // Octave 5
  If(detail.greaterThan(0.8), () => {
    value.addAssign(amplitude.mul(noise2d(st, seed)));
  });

  return value;
});

/** 3D FBM */
export const fbm3d = /*@__PURE__*/ Fn(([p_in, seed_in]: [any, any]) => {
  const p = vec3(p_in).toVar();
  const seed = float(seed_in);
  const value = float(0).toVar();
  const amplitude = float(0.5).toVar();

  Loop(5, () => {
    value.addAssign(amplitude.mul(noise3d(p, seed)));
    p.assign(p.mul(2).add(100));
    amplitude.mulAssign(0.5);
  });

  return value;
});

/** Ridged FBM */
export const ridgedFBM = /*@__PURE__*/ Fn(([st_in, seed_in, factor_in]: [any, any, any]) => {
  const st = vec2(st_in).toVar();
  const seed = float(seed_in);
  const factor = float(factor_in);
  const value = float(0).toVar();
  const amplitude = float(0.5).toVar();

  Loop(5, () => {
    const n = float(1)
      .sub(abs(noise2d(st, seed).mul(2).sub(1)))
      .toVar();
    n.assign(pow(n, float(1).add(factor)));
    value.addAssign(n.mul(amplitude));
    st.assign(st.mul(2));
    amplitude.mulAssign(0.5);
  });

  return value;
});

// ========================
// CURL NOISE
// ========================

/** 2D Curl noise (requires simplex) */
export const curlNoise = /*@__PURE__*/ Fn(([p_in]: [any]) => {
  const p = vec2(p_in);
  const e = float(0.1);
  const n1 = snoise2d(p.add(vec2(e, 0)));
  const n2 = snoise2d(p.sub(vec2(e, 0)));
  const n3 = snoise2d(p.add(vec2(0, e)));
  const n4 = snoise2d(p.sub(vec2(0, e)));
  return vec2(n3.sub(n4), n2.sub(n1)).mul(5);
});

// ========================
// VORONOI
// ========================

/** 2D Voronoi — returns vec3(minDist, cellOffset.xy) */
export const voronoi2d = /*@__PURE__*/ Fn(([x_in, time_in]: [any, any]) => {
  const x = vec2(x_in);
  const t = float(time_in);
  const n = floor(x);
  const f = fract(x);

  const mr = vec2(0).toVar();
  const md = float(8).toVar();

  Loop({ start: int(-1), end: int(2), type: "int", condition: "<" }, ({ i: j }) => {
    Loop({ start: int(-1), end: int(2), type: "int", condition: "<" }, ({ i }) => {
      const g = vec2(float(i), float(j));
      const o = hash22(n.add(g)).toVar();
      o.assign(
        sin(t.add(o.mul(6.2831)))
          .mul(0.5)
          .add(0.5),
      );
      const r = g.add(o).sub(f);
      const d = dot(r, r);
      If(d.lessThan(md), () => {
        md.assign(d);
        mr.assign(r);
      });
    });
  });

  return vec3(md, mr.x, mr.y);
});

/** Smooth voronoi */
export const voronoiSmooth = /*@__PURE__*/ Fn(([uv_in, _time_in, factor_in]: [any, any, any]) => {
  const uv = vec2(uv_in);
  const factor = float(factor_in);
  const n = floor(uv);
  const f = fract(uv);
  const smoothness = float(0.1).add(factor.mul(2));
  const res = float(0).toVar();

  Loop({ start: int(-1), end: int(2), type: "int", condition: "<" }, ({ i: j }) => {
    Loop({ start: int(-1), end: int(2), type: "int", condition: "<" }, ({ i }) => {
      const b = vec2(float(i), float(j));
      const r = b.sub(f).add(hash22(n.add(b)));
      const d = length(r);
      res.addAssign(exp(smoothness.negate().mul(d)));
    });
  });

  return smoothness.negate().mul(float(1)).mul(res.log()).negate();
});

/** 3D Worley noise → returns vec3(closest, second, third distances) */
export const worley3d = /*@__PURE__*/ Fn(([p_in]: [any]) => {
  const p = vec3(p_in);
  const ip = floor(p);
  const d = vec4(1e15).toVar();

  Loop({ start: int(-1), end: int(2), type: "int", condition: "<" }, ({ i }) => {
    Loop({ start: int(-1), end: int(2), type: "int", condition: "<" }, ({ i: j }) => {
      Loop({ start: int(-1), end: int(2), type: "int", condition: "<" }, ({ i: k }) => {
        const p0 = ip.add(vec3(float(i), float(j), float(k)));
        const c = hash33(p0).add(p0).sub(p);
        const d0 = dot(c, c);

        If(d0.lessThan(d.x), () => {
          d.w.assign(d.z);
          d.z.assign(d.y);
          d.y.assign(d.x);
          d.x.assign(d0);
        })
          .ElseIf(d0.lessThan(d.y), () => {
            d.w.assign(d.z);
            d.z.assign(d.y);
            d.y.assign(d0);
          })
          .ElseIf(d0.lessThan(d.z), () => {
            d.w.assign(d.z);
            d.z.assign(d0);
          })
          .ElseIf(d0.lessThan(d.w), () => {
            d.w.assign(d0);
          });
      });
    });
  });

  return vec3(sqrt(d.x), sqrt(d.y), sqrt(d.z));
});

// ========================
// GYROID
// ========================

/** Gyroid surface evaluation */
export const gyroid = /*@__PURE__*/ Fn(([p_in, scale_in]: [any, any]) => {
  const p = vec3(p_in).mul(float(scale_in));
  return dot(sin(p), cos(p.yzx));
});
