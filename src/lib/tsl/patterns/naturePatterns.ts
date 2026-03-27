/**
 * TSL Nature Patterns (13 patterns)
 */
import {
    Fn, float, vec2, vec3, int,
    sin, cos, abs, floor, fract, mod, dot,
    mix, step, max, min, clamp, pow, length, distance,
    smoothstep, atan, normalize, sqrt, If, Loop,
} from 'three/tsl';
import type { TslPatternFn } from '../tslBuilder';
import type { TslUniforms } from '../uniforms';
import { rotate2d } from '../chunks/math';
import { noise2d as _noise2d, random2d, fbm2d, voronoi2d } from '../chunks/noise';
import { rot2D } from '../chunks/sdf';

// ─── CLOUD ───
export const cloud: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const uv = vec2(st).mul(u.u_scale);
        const n = fbm2d(uv.add(float(u.u_time).mul(0.1)), u.u_seed, u.u_detail);
        const n2 = fbm2d(uv.mul(2.0).sub(float(u.u_time).mul(0.05)), u.u_seed, u.u_detail);
        const coverage = float(0.2).add(float(u.u_factor).sub(0.5)).add(float(u.u_p1).mul(0.5));
        const softness = float(0.6).add(float(u.u_factor).sub(0.5)).add(float(u.u_p2).mul(0.5));
        const f = smoothstep(coverage, softness, mix(n, n2, 0.5));
        return pow(clamp(f, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── REALISTIC CLOUDS ───
export const realisticClouds: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const uv = vec2(st).mul(u.u_scale);
        const time = float(u.u_time).mul(u.u_speed).mul(0.1);
        const q = fbm2d(uv.mul(1.1).mul(0.5), u.u_seed, u.u_detail);
        // m = mat2(1.6, 1.2, -1.2, 1.6) → rotate + scale
        const mAngle = float(0.6435); // atan(1.2, 1.6)
        const mScale = float(2.0);

        const r = float(0.0).toVar();
        const uvR = uv.mul(1.1).sub(q).sub(time).toVar();
        const wR = float(0.8).toVar();
        Loop(5, () => {
            r.addAssign(abs(wR.mul(_noise2d(uvR, u.u_seed))));
            uvR.assign(rotate2d(mAngle).mul(uvR).mul(mScale).add(time));
            wR.mulAssign(0.7);
        });

        const f = float(0.0).toVar();
        const uvF = uv.mul(1.1).sub(q).sub(time).toVar();
        const wF = float(0.7).toVar();
        Loop(5, () => {
            f.addAssign(wF.mul(_noise2d(uvF, u.u_seed)));
            uvF.assign(rotate2d(mAngle).mul(uvF).mul(mScale).add(time));
            wF.mulAssign(0.6);
        });
        f.mulAssign(r.add(f));
        const cloudVal = float(0.2).add(float(u.u_factor).mul(0.5)).add(f.mul(r).mul(8.0));
        return clamp(cloudVal.mul(u.u_intensity).mul(0.1), 0.0, 1.0);
    })();
};

// ─── SMOKE ───
export const smoke: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const uv = vec2(st).mul(u.u_scale);
        const q = vec2(
            fbm2d(uv, u.u_seed, u.u_detail),
            fbm2d(uv.add(5.2), u.u_seed, u.u_detail),
        );
        const f = fbm2d(uv.add(q.mul(u.u_factor).mul(2.0)).add(float(u.u_time).mul(0.2)), u.u_seed, u.u_detail)
            .mul(0.5).add(0.5);
        return pow(clamp(f, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── WATER ───
export const water: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p = vec2(st).mul(u.u_scale).mul(3.0).toVar();
        const d = float(0.3).mul(u.u_factor);
        const spd = float(u.u_speed);
        // Unrolled 4 iterations
        p.x.addAssign(d.div(1.0).mul(sin(float(1.0).mul(3.0).mul(p.y).add(float(u.u_time).mul(spd).mul(u.u_p4)))));
        p.y.addAssign(d.div(1.0).mul(cos(float(1.0).mul(3.0).mul(p.x).add(float(u.u_time).mul(spd).mul(u.u_p5)))));
        p.x.addAssign(d.div(2.0).mul(sin(float(2.0).mul(3.0).mul(p.y).add(float(u.u_time).mul(spd).mul(u.u_p4)))));
        p.y.addAssign(d.div(2.0).mul(cos(float(2.0).mul(3.0).mul(p.x).add(float(u.u_time).mul(spd).mul(u.u_p5)))));
        p.x.addAssign(d.div(3.0).mul(sin(float(3.0).mul(3.0).mul(p.y).add(float(u.u_time).mul(spd).mul(u.u_p4)))));
        p.y.addAssign(d.div(3.0).mul(cos(float(3.0).mul(3.0).mul(p.x).add(float(u.u_time).mul(spd).mul(u.u_p5)))));
        p.x.addAssign(d.div(4.0).mul(sin(float(4.0).mul(3.0).mul(p.y).add(float(u.u_time).mul(spd).mul(u.u_p4)))));
        p.y.addAssign(d.div(4.0).mul(cos(float(4.0).mul(3.0).mul(p.x).add(float(u.u_time).mul(spd).mul(u.u_p5)))));
        const v = sin(p.x.add(p.y)).mul(0.5).add(0.5).toVar();
        If(float(u.u_p7).greaterThan(0.0), () => {
            v.assign(mix(v, step(float(0.8).sub(float(u.u_p7).mul(0.3)), v), 0.5));
        });
        If(float(u.u_p2).greaterThan(0.0), () => {
            v.assign(pow(max(float(0.0), v), float(1.0).add(u.u_p2)));
        });
        return pow(clamp(v, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── SNOW ───
export const snow: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const uv = vec2(st).mul(u.u_scale);
        const s = float(0.0).toVar();
        const windX = float(u.u_p1).mul(2.0);
        const windY = float(0.5).add(u.u_p2);
        // Unroll 4 layers
        Loop({ start: int(1), end: int(5), type: 'int', condition: '<' }, ({ i }) => {
            const fi = float(i);
            const q = uv.mul(fi).toVar();
            q.y.addAssign(float(u.u_time).mul(windY.add(float(0.5).div(fi))));
            q.x.addAssign(float(u.u_time).mul(windX).add(sin(float(u.u_time).add(q.y)).mul(0.5)));
            const f = fract(q);
            const floorQ = floor(q);
            If(random2d(floorQ, u.u_seed).greaterThan(float(0.98).sub(float(u.u_factor).mul(0.1))), () => {
                s.addAssign(smoothstep(0.5, 0.0, length(f.sub(0.5))).div(fi));
            });
        });
        return clamp(s.mul(u.u_intensity), 0.0, 1.0);
    })();
};

// ─── RAIN ───
export const rain: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const uv = vec2(st).mul(u.u_scale).mul(vec2(20.0, 1.0)).toVar();
        const wind = float(u.u_p5).mul(2.0);
        uv.x.addAssign(uv.y.mul(wind));
        uv.y.addAssign(float(u.u_time).mul(float(5.0).add(float(u.u_speed).mul(5.0))));
        const r = float(0.0).toVar();
        const floorU = floor(uv);
        If(random2d(floorU, u.u_seed).greaterThan(float(0.95).sub(float(u.u_factor).mul(0.2))), () => {
            const f = fract(uv);
            const streak = float(1.0).sub(f.y).mul(
                smoothstep(0.0, 0.2, f.x).sub(smoothstep(0.8, 1.0, f.x)),
            ).toVar();
            If(float(u.u_p6).greaterThan(0.0), () => {
                streak.mulAssign(float(1.0).add(float(u.u_p6).mul(sin(float(u.u_time).mul(10.0).add(f.y.mul(10.0))))));
            });
            r.assign(streak);
        });
        return clamp(r.mul(u.u_intensity), 0.0, 1.0);
    })();
};

// ─── BUBBLES ───
export const bubbles: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const uv = vec2(st).mul(u.u_scale).mul(5.0).toVar();
        uv.y.addAssign(float(u.u_time).mul(float(1.0).add(u.u_p4)));
        If(float(u.u_p5).greaterThan(0.0), () => {
            uv.x.addAssign(sin(uv.y.mul(2.0).add(u.u_time)).mul(float(u.u_p5).mul(0.2)));
        });
        const f = fract(uv);
        const b = float(0.0).toVar();
        const floorU = floor(uv);
        If(random2d(floorU, u.u_seed).greaterThan(float(0.9).sub(float(u.u_factor).mul(0.3))), () => {
            const c = vec2(0.5).add(vec2(sin(float(u.u_time).mul(5.0).add(random2d(floorU, u.u_seed).mul(10.0))).mul(0.2), 0.0));
            const dd = length(f.sub(c));
            const sharp = float(0.35).sub(float(u.u_p2).mul(0.1));
            b.assign(smoothstep(0.4, sharp, dd).sub(smoothstep(0.3, 0.25, dd)));
            If(float(u.u_p6).greaterThan(0.0), () => {
                b.addAssign(smoothstep(0.1, 0.0, distance(f, c.sub(0.1))).mul(u.u_p6));
            });
        });
        return clamp(b.mul(u.u_intensity), 0.0, 1.0);
    })();
};

// ─── CAUSTICS ───
export const caustics: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const uv = vec2(st).mul(u.u_scale).mul(5.0);
        const t = float(u.u_time).mul(0.5).mul(u.u_speed);
        const iv = vec2(uv).toVar();
        const c = float(1.0).toVar();
        const k = float(0.05).add(float(u.u_p3).mul(0.1));
        // Unrolled 4 iterations
        Loop({ start: int(0), end: int(4), type: 'int', condition: '<' }, ({ i }) => {
            const t2 = t.mul(float(1.0).sub(float(3.0).div(float(i).add(1.0))));
            iv.assign(uv.add(vec2(
                cos(t2.sub(iv.x)).add(sin(t2.add(iv.y))),
                sin(t2.sub(iv.y)).add(cos(t2.add(iv.x))),
            )));
            c.addAssign(float(1.0).div(max(float(0.01), length(vec2(
                uv.x.div(sin(iv.x.add(t2)).div(k)),
                uv.y.div(cos(iv.y.add(t2)).div(k)),
            )))));
        });
        c.divAssign(4.0);
        const val = float(1.5).sub(sqrt(c)).toVar();
        If(float(u.u_p2).greaterThan(0.0), () => {
            val.assign(pow(max(float(0.0), val), float(1.0).add(float(u.u_p2).mul(2.0))));
        });
        return pow(clamp(val, 0.0, 1.0), float(u.u_intensity).mul(float(1.0).add(u.u_factor)));
    })();
};

// ─── INK SPLAT ───
export const inkSplat: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const uv = vec2(st).sub(0.5).mul(2.0).mul(u.u_scale);
        const d = length(uv);
        const r = float(0.5).add(fbm2d(vec2(atan(uv.y, uv.x).mul(5.0), u.u_time), u.u_seed, u.u_detail).mul(0.2)).toVar();
        r.addAssign(_noise2d(uv.mul(float(5.0).add(float(u.u_factor).mul(10.0))).add(10.0), u.u_seed).mul(0.3).mul(u.u_factor));
        return clamp(float(1.0).sub(smoothstep(r.sub(0.1), r.add(0.1), d)).mul(u.u_intensity), 0.0, 1.0);
    })();
};

// ─── MOSAIC ───
export const mosaic: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const uv = vec2(st).mul(u.u_scale).mul(10.0);
        const iv = floor(uv);
        const f = fract(uv);
        const c = iv.add(vec2(random2d(iv, u.u_seed), random2d(iv.mul(1.2), u.u_seed)));
        const id = random2d(c, u.u_seed);
        const col = smoothstep(0.0, float(0.5).add(float(u.u_factor).mul(0.5)), id);
        const border = step(float(0.1).mul(float(1.0).sub(u.u_detail)), min(f.x, f.y));
        return pow(clamp(col.mul(border), 0.0, 1.0), u.u_intensity);
    })();
};

// ─── CRYSTALS ───
export const crystals: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const uv = vec2(st).mul(u.u_scale).mul(4.0);
        const n = floor(uv);
        const f = fract(uv);
        const mDist = float(1.0).toVar();
        const mPoint = vec2(0.0).toVar();

        Loop({ start: int(-1), end: int(2), type: 'int', condition: '<' }, ({ i: jj }) => {
            Loop({ start: int(-1), end: int(2), type: 'int', condition: '<' }, ({ i: ii }) => {
                const g = vec2(float(ii), float(jj));
                const o = sin(float(u.u_time).mul(0.5).add(random2d(n.add(g), u.u_seed).mul(6.2831))).mul(0.5).add(0.5);
                const rv = g.add(o).sub(f);
                const dd = dot(rv, rv);
                If(dd.lessThan(mDist), () => {
                    mDist.assign(dd);
                    mPoint.assign(n.add(g).add(o));
                });
            });
        });

        const val = random2d(mPoint, u.u_seed);
        const edge = smoothstep(0.0, float(0.1).mul(float(1.0).sub(u.u_factor)), mDist);
        return pow(clamp(val.mul(float(1.0).sub(edge.mul(u.u_detail))), 0.0, 1.0), u.u_intensity);
    })();
};

// ─── SEA WAVES ───
export const seaWaves: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const freq = float(0.5).mul(u.u_scale).toVar();
        const amp = float(0.6).toVar();
        const choppy = float(4.0).mul(u.u_factor).toVar();
        const p = vec2(st).mul(5.0).toVar();
        const h = float(0.0).toVar();
        const t = float(u.u_time).mul(u.u_speed);
        // Simplified sea octave: noise-based wave function
        Loop(4, () => {
            // sea_octave(uv, choppy) approximation
            const uvPlus = p.add(t).mul(freq).toVar();
            uvPlus.addAssign(_noise2d(uvPlus, u.u_seed));
            const wvPlus = float(1.0).sub(abs(sin(uvPlus.x)));
            const swvPlus = abs(cos(uvPlus.x));
            const wvMixed = mix(wvPlus, swvPlus, wvPlus);
            const d1 = pow(max(float(0.0), float(1.0).sub(pow(max(float(0.0), wvMixed), 0.65))), choppy);

            const uvMinus = p.sub(t).mul(freq).toVar();
            uvMinus.addAssign(_noise2d(uvMinus, u.u_seed));
            const wvMinus = float(1.0).sub(abs(sin(uvMinus.x)));
            const swvMinus = abs(cos(uvMinus.x));
            const wvMixedM = mix(wvMinus, swvMinus, wvMinus);
            const d2 = pow(max(float(0.0), float(1.0).sub(pow(max(float(0.0), wvMixedM), 0.65))), choppy);

            h.addAssign(d1.add(d2).mul(amp));
            // mat2(1.6,1.2,-1.2,1.6) transform
            p.assign(rotate2d(0.6435).mul(p).mul(2.0));
            freq.mulAssign(1.9);
            amp.mulAssign(0.22);
            choppy.assign(mix(choppy, float(1.0), 0.2));
        });
        If(float(u.u_p2).greaterThan(0.0), () => {
            h.mulAssign(float(1.0).add(float(u.u_p2).mul(2.0)));
        });
        return pow(clamp(h.mul(0.5), 0.0, 1.0), u.u_intensity);
    })();
};

// ─── FROST PATTERN ─── (simplified - no full SDF raymarching)
export const frostPattern: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const uv = vec2(st).mul(2.0).sub(1.0).add(vec2(-1.68, 0.9));
        const v = float(50.0).mul(length(max(abs(uv).sub(0.05), 0.0)));
        const f = min(v, float(1.0).sub(v)).mul(2.0).mul(fract(atan(uv.y, uv.x).div(3.14159).sub(float(u.u_time).mul(0.3))));
        // Simplified: skip full raymarching, use noise-based approximation
        const rd = normalize(vec3(vec2(st).sub(0.5).mul(2.0), 1.0));
        const accum = float(0.0).toVar();
        const d = float(0.0).toVar();
        Loop(20, ({ i }) => {
            const p = rd.mul(d).toVar();
            p.x.subAssign(0.75);
            p.assign(vec3(
                rotate2d(length(p.sub(vec3(p.z, p.y, p.z))).mul(0.3).mul(u.u_p1)).mul(vec2(p.x, p.y)),
                p.z,
            ));
            p.z.addAssign(sin(p.y.add(u.u_time)));
            p.z.addAssign(float(u.u_time).mul(5.0).mul(u.u_speed));
            const spacing = float(0.9).add(u.u_factor);
            const pz = mod(p.z.sub(spacing), spacing).sub(spacing.mul(0.5));
            const scene = length(vec2(abs(p.x).sub(2.0), pz)).sub(0.75);
            const s = abs(scene).mul(0.3);
            d.addAssign(max(s, float(0.01)));
            If(s.greaterThan(0.001), () => {
                accum.addAssign(float(0.002).div(s));
            });
        });
        return mix(clamp(f, 0.0, 1.0), clamp(accum.mul(u.u_intensity), 0.0, 1.0), 0.8);
    })();
};
