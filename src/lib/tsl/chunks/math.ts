/**
 * TSL Math Utilities
 * rotate2d, toPolar, aastep, color conversion, blending, palette.
 */
import {
  Fn,
  float,
  vec2,
  vec3,
  vec4,
  mat2,
  sin,
  cos,
  abs,
  floor,
  fract,
  atan,
  mix,
  step,
  clamp,
  smoothstep,
  sqrt,
  min,
  fwidth,
  If,
  select,
  int,
} from "three/tsl";

const stepVector = step as (edge: any, value: any) => any;
const mixVector = mix as (a: any, b: any, t: any) => any;

/** 2D rotation matrix from angle */
export const rotate2d = (angle: any) => {
  const s = sin(angle);
  const c = cos(angle);
  return mat2(c, s.negate(), s, c);
};

/** Cartesian → Polar (returns vec2(angle01, radius)) */
export const toPolar = /*@__PURE__*/ Fn(([st_in]: [any]) => {
  const st = vec2(st_in);
  const pos = st.sub(0.5);
  const r = pos.length().mul(2);
  const a = atan(pos.y, pos.x);
  return vec2(a.div(Math.PI * 2).add(0.5), r);
});

/** Anti-aliased step using fwidth */
export const aastep = (threshold: any, value: any) => {
  const fw = fwidth(value).mul(0.5);
  return smoothstep(float(threshold).sub(fw), float(threshold).add(fw), value);
};

// ========================
// COLOR SPACE
// ========================

/** RGB → HSV */
export const rgb2hsv = /*@__PURE__*/ Fn(([c_in]: [any]) => {
  const c = vec3(c_in);
  const K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  const p = mix(vec4(c.b, c.g, K.w, K.z), vec4(c.g, c.b, K.x, K.y), step(c.b, c.g));
  const q = mix(vec4(p.x, p.y, p.w, c.r), vec4(c.r, p.y, p.z, p.x), step(p.x, c.r));
  const d = q.x.sub(min(q.w, q.y));
  const e = float(1e-10);
  return vec3(abs(q.z.add(q.w.sub(q.y).div(d.mul(6).add(e)))), d.div(q.x.add(e)), q.x);
});

/** HSV → RGB */
export const hsv2rgb = /*@__PURE__*/ Fn(([c_in]: [any]) => {
  const c = vec3(c_in);
  const K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  const p = abs(fract(c.xxx.add(K.xyz)).mul(6).sub(K.www));
  return c.z.mul(mix(K.xxx, clamp(p.sub(K.xxx), 0, 1), c.y));
});

// ========================
// BLEND MODES
// ========================

/** Scalar blend: mode 0=normal, 1=add, 2=multiply, 3=screen, 4=overlay, 5=soft-light, 6=difference */
export const blendApply = /*@__PURE__*/ Fn(([base_in, blend_in, mode_in]: [any, any, any]) => {
  const base = float(base_in);
  const blend = float(blend_in);
  const mode = int(mode_in);
  const result = float(blend).toVar();

  // Add
  If(mode.equal(1), () => {
    result.assign(min(base.add(blend), 1.0));
  });
  // Multiply
  If(mode.equal(2), () => {
    result.assign(base.mul(blend));
  });
  // Screen
  If(mode.equal(3), () => {
    result.assign(float(1).sub(float(1).sub(base).mul(float(1).sub(blend))));
  });
  // Overlay
  If(mode.equal(4), () => {
    result.assign(
      select(
        base.lessThan(0.5),
        base.mul(blend).mul(2),
        float(1).sub(float(1).sub(base).mul(float(1).sub(blend)).mul(2)),
      ),
    );
  });
  // Soft Light
  If(mode.equal(5), () => {
    result.assign(
      select(
        blend.lessThan(0.5),
        base
          .mul(blend)
          .mul(2)
          .add(base.mul(base).mul(float(1).sub(blend.mul(2)))),
        sqrt(base)
          .mul(blend.mul(2).sub(1))
          .add(base.mul(2).mul(float(1).sub(blend))),
      ),
    );
  });
  // Difference
  If(mode.equal(6), () => {
    result.assign(abs(base.sub(blend)));
  });

  return result;
});

/** Vec3 blend modes */
export const applyBlendModeVec3 = /*@__PURE__*/ Fn(
  ([base_in, blend_in, mode_in]: [any, any, any]) => {
    const base = vec3(base_in);
    const blend = vec3(blend_in);
    const mode = int(mode_in);
    const result = vec3(blend).toVar();

    If(mode.equal(1), () => {
      result.assign(clamp(base.add(blend), 0.0, 1.0));
    });
    If(mode.equal(2), () => {
      result.assign(base.mul(blend));
    });
    If(mode.equal(3), () => {
      result.assign(vec3(1).sub(vec3(1).sub(base).mul(vec3(1).sub(blend))));
    });
    If(mode.equal(4), () => {
      result.assign(
        vec3(
          mixVector(
            base.mul(blend).mul(2),
            vec3(1).sub(vec3(1).sub(base).mul(vec3(1).sub(blend)).mul(2)),
            vec3(stepVector(vec3(0.5), base)),
          ),
        ),
      );
    });
    If(mode.equal(5), () => {
      const sqrtBase = vec3(sqrt(base.x), sqrt(base.y), sqrt(base.z));
      result.assign(
        vec3(
          mixVector(
            base.sub(vec3(1).sub(blend.mul(2)).mul(base).mul(vec3(1).sub(base))),
            base.add(blend.mul(2).sub(vec3(1)).mul(sqrtBase.sub(base))),
            vec3(stepVector(vec3(0.5), blend)),
          ),
        ),
      );
    });
    If(mode.equal(6), () => {
      result.assign(abs(base.sub(blend)));
    });

    return result;
  },
);

// ========================
// PALETTE COLOR
// ========================

/** Map float [0,1] → RGB through an 8-color palette */
export const getPaletteColor = /*@__PURE__*/ Fn(([t_in, palette_in, count_in]: [any, any, any]) => {
  const t = clamp(float(t_in), 0, 1);
  const count = int(count_in);

  const scaledT = t.mul(float(count).sub(1));
  const index = int(floor(scaledT));
  const f = fract(scaledT);

  const c1 = vec3(0).toVar();
  const c2 = vec3(0).toVar();

  // Manual unroll for 8-element palette (safe driver compat)
  If(index.equal(0), () => {
    c1.assign(palette_in.element(0));
    c2.assign(palette_in.element(1));
  });
  If(index.equal(1), () => {
    c1.assign(palette_in.element(1));
    c2.assign(palette_in.element(2));
  });
  If(index.equal(2), () => {
    c1.assign(palette_in.element(2));
    c2.assign(palette_in.element(3));
  });
  If(index.equal(3), () => {
    c1.assign(palette_in.element(3));
    c2.assign(palette_in.element(4));
  });
  If(index.equal(4), () => {
    c1.assign(palette_in.element(4));
    c2.assign(palette_in.element(5));
  });
  If(index.equal(5), () => {
    c1.assign(palette_in.element(5));
    c2.assign(palette_in.element(6));
  });
  If(index.equal(6), () => {
    c1.assign(palette_in.element(6));
    c2.assign(palette_in.element(7));
  });
  If(index.greaterThanEqual(7), () => {
    const last = palette_in.element(count.sub(1));
    c1.assign(last);
    c2.assign(last);
  });

  return mix(c1, c2, f);
});
