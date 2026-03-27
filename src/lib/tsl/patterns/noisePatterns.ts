/**
 * TSL Noise Patterns (22 patterns)
 */
import {
    Fn, float, vec2, vec3, int,
    sin, cos, abs, floor, fract, mod, dot,
    mix, step, max, min, clamp, pow, length,
    smoothstep, atan, exp2, If, Loop,
} from 'three/tsl';
import type { TslPatternFn } from '../tslBuilder';
import type { TslUniforms } from '../uniforms';
import { rotate2d } from '../chunks/math';
import {
    noise2d as _noise2d, random2d, snoise3d, valueNoise,
    fbm2d, ridgedFBM, voronoi2d, voronoiSmooth as _voronoiSmooth,
    worley3d, gyroid, curlNoise, hash22,
} from '../chunks/noise';
import { holoVoronoi } from '../chunks/lighting';

// ─── PERLIN NOISE ───
export const perlinNoise: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const stv = vec2(st).mul(u.u_scale).mul(3.0).toVar();
        stv.addAssign(vec2(u.u_p14, u.u_p15));
        If(float(u.u_p13).notEqual(0.0), () => {
            stv.assign(rotate2d(u.u_p13).mul(stv.sub(vec2(0.5).mul(u.u_scale).mul(3.0))).add(vec2(0.5).mul(u.u_scale).mul(3.0)));
        });
        // Domain warp P7/P8
        If(float(u.u_p7).greaterThan(0.0), () => {
            const q = vec2(_noise2d(stv, u.u_seed), _noise2d(stv.add(vec2(5.2, 1.3)), u.u_seed));
            const angle = float(u.u_p8).mul(6.28);
            const rot = rotate2d(angle);
            stv.addAssign(rot.mul(q).mul(u.u_p7));
        });
        If(float(u.u_p4).greaterThan(0.0), () => {
            stv.addAssign(_noise2d(stv.mul(2.0), u.u_seed).mul(u.u_p4));
        });

        const v = float(0.0).toVar();
        const a = float(0.5).toVar();
        const maxOct = float(1.0).add(floor(float(u.u_factor).mul(7.0)));
        const pers = float(0.5).add(float(u.u_p1).sub(0.5));
        const lac = float(2.0).add(float(u.u_p2).sub(0.5));
        const timeOffset = float(u.u_time).mul(0.1).add(float(u.u_p5).mul(10.0));
        const stLoop = vec2(stv).toVar();

        Loop(8, ({ i }) => {
            If(float(i).lessThan(maxOct), () => {
                const n = _noise2d(stLoop.add(timeOffset), u.u_seed).toVar();
                If(float(u.u_p3).greaterThan(0.0), () => {
                    n.assign(mix(n, float(1.0).sub(abs(n.mul(2.0).sub(1.0))), u.u_p3));
                });
                If(float(u.u_p6).greaterThan(0.0), () => {
                    n.assign(mix(n, abs(n.mul(2.0).sub(1.0)), u.u_p6));
                });
                If(float(u.u_p9).greaterThan(0.0), () => {
                    n.assign(pow(max(float(0.0), n), float(1.0).add(u.u_p9)));
                });
                v.addAssign(n.mul(a));
                stLoop.mulAssign(lac);
                a.mulAssign(pers);
            });
        });

        If(float(u.u_p10).greaterThan(0.0), () => {
            v.assign(smoothstep(float(u.u_p10).mul(0.5), float(1.0).sub(float(u.u_p10).mul(0.5)), v));
        });
        If(float(u.u_p11).greaterThan(0.0), () => {
            v.addAssign(random2d(stv.mul(100.0), u.u_seed).sub(0.5).mul(float(u.u_p11).mul(0.2)));
        });
        return pow(clamp(v, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── SIMPLEX NOISE ───
export const simplexNoise: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const stv = vec2(st).mul(u.u_scale).mul(8.0).toVar();
        stv.addAssign(vec2(u.u_p14, u.u_p15));
        If(float(u.u_p13).notEqual(0.0), () => {
            stv.assign(rotate2d(u.u_p13).mul(stv));
        });
        If(float(u.u_p2).greaterThan(0.0), () => {
            stv.addAssign(snoise3d(vec3(stv, float(u.u_time).mul(0.1))).mul(u.u_p2));
        });
        const n = snoise3d(vec3(stv, float(u.u_time).mul(0.2))).toVar();
        If(float(u.u_p1).greaterThan(0.0), () => {
            n.assign(mix(n, float(1.0).sub(abs(n)), u.u_p1));
        });
        If(float(u.u_p3).greaterThan(0.0), () => {
            n.assign(pow(max(float(0.0), n.mul(0.5).add(0.5)), float(1.0).add(float(u.u_p3).mul(2.0))).mul(2.0).sub(1.0));
        });
        If(float(u.u_p4).greaterThan(0.0), () => {
            n.addAssign(snoise3d(vec3(stv.mul(2.0), float(u.u_time).mul(0.3))).mul(float(u.u_p4).mul(0.5)));
        });
        If(float(u.u_p12).greaterThan(0.0), () => {
            n.addAssign(random2d(stv.mul(50.0), u.u_seed).sub(0.5).mul(float(u.u_p12).mul(0.1)));
        });
        return pow(clamp(n.mul(0.5).add(0.5), 0.0, 1.0), u.u_intensity);
    })();
};

// ─── CELLULAR NOISE ───
export const cellularNoise: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const stv = vec2(st).mul(u.u_scale).mul(5.0).toVar();
        stv.addAssign(vec2(u.u_p14, u.u_p15));
        If(float(u.u_p13).notEqual(0.0), () => {
            stv.assign(rotate2d(u.u_p13).mul(stv));
        });
        const v = voronoi2d(stv, u.u_time);
        const dist = v.x.toVar();
        If(float(u.u_p2).greaterThan(0.0), () => {
            dist.assign(mix(dist, v.y.sub(v.x), u.u_p2));
        });
        If(float(u.u_factor).greaterThan(0.0), () => {
            dist.assign(smoothstep(float(u.u_factor).mul(0.2), 0.0, abs(dist.sub(float(0.5).mul(u.u_factor)))));
        }).Else(() => {
            dist.assign(float(1.0).sub(dist));
        });
        If(float(u.u_p12).greaterThan(0.0), () => {
            dist.assign(mix(dist, smoothstep(0.4, 0.5, dist), u.u_p12));
        });
        If(float(u.u_p11).greaterThan(0.0), () => {
            dist.addAssign(random2d(vec2(st).mul(100.0), u.u_seed).sub(0.5).mul(float(u.u_p11).mul(0.1)));
        });
        return pow(clamp(dist, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── WORLEY NOISE ───
export const worleyNoise: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const stv = vec2(st).mul(u.u_scale).mul(5.0).toVar();
        stv.addAssign(vec2(u.u_p14, u.u_p15));
        const ist = floor(stv);
        const fst = fract(stv);
        const mDist = float(1.0).toVar();

        // Unrolled 3x3 neighbor search
        Loop({ start: int(-1), end: int(2), type: 'int', condition: '<' }, ({ i: jj }) => {
            Loop({ start: int(-1), end: int(2), type: 'int', condition: '<' }, ({ i: ii }) => {
                const neighbor = vec2(float(ii), float(jj));
                const point = hash22(ist.add(neighbor));
                const jitter = vec2(0.5).toVar();
                If(float(u.u_speed).greaterThan(0.0), () => {
                    const phase = float(u.u_time).mul(u.u_speed).mul(2.0);
                    jitter.assign(vec2(
                        sin(phase.add(point.x.mul(6.2831))),
                        sin(phase.add(point.y.mul(6.2831))),
                    ).mul(0.5).add(0.5));
                });
                const pt = mix(vec2(0.5), jitter, u.u_p1);
                const diff = neighbor.add(pt).sub(fst);
                const d = length(diff);
                If(d.lessThan(mDist), () => { mDist.assign(d); });
            });
        });

        const val = float(1.0).sub(mDist).toVar();
        If(float(u.u_p3).greaterThan(0.0), () => { val.assign(mDist); });
        If(float(u.u_p2).greaterThan(0.0), () => {
            const e = float(u.u_p2).mul(0.9);
            val.assign(smoothstep(e.mul(0.5), float(1.0).sub(e.mul(0.5)), val));
        });
        If(float(u.u_factor).greaterThan(0.0), () => {
            val.assign(mix(val, val.mul(_noise2d(stv.add(u.u_time), u.u_seed)), u.u_factor));
        });
        If(float(u.u_p15).greaterThan(0.0), () => {
            val.assign(pow(max(float(0.0), val), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return clamp(val.mul(u.u_intensity), 0.0, 1.0);
    })();
};

// ─── GRADIENT NOISE ───
export const gradientNoise: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const stv = vec2(st).mul(u.u_scale).mul(5.0).toVar();
        stv.addAssign(vec2(u.u_p14, u.u_p15));
        If(float(u.u_p1).greaterThan(0.0), () => {
            stv.assign(rotate2d(u.u_p1).mul(stv));
        });
        const n = _noise2d(stv.add(float(u.u_time).mul(0.1)), u.u_seed).toVar();
        const g = vec2(st).y.toVar();
        If(float(u.u_p2).greaterThan(0.0), () => {
            g.assign(sin(g.mul(float(u.u_p2).mul(10.0))).mul(0.5).add(0.5));
        });
        If(float(u.u_p12).greaterThan(0.0), () => {
            n.assign(sin(n.mul(10.0).add(float(u.u_p12).mul(6.28))).mul(0.5).add(0.5));
        });
        const val = mix(g, n, u.u_factor).toVar();
        If(float(u.u_p15).greaterThan(0.0), () => {
            val.assign(pow(max(float(0.0), val), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return pow(clamp(val, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── VALUE NOISE ───
export const valueNoisePattern: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const stv = vec2(st).mul(u.u_scale).mul(10.0).toVar();
        stv.addAssign(vec2(u.u_p14, u.u_p15));
        If(float(u.u_p1).greaterThan(0.0), () => {
            stv.assign(floor(stv.mul(u.u_p1)).div(u.u_p1));
        });
        If(float(u.u_p11).greaterThan(0.0), () => {
            stv.x.addAssign(stv.y.mul(u.u_p11));
        });
        const n = valueNoise(stv, u.u_seed).toVar();
        If(float(u.u_p2).greaterThan(0.0), () => {
            n.assign(smoothstep(0.0, float(1.0).sub(u.u_p2), n));
        });
        If(float(u.u_p12).greaterThan(0.0), () => {
            n.addAssign(random2d(stv.mul(20.0), u.u_seed).sub(0.5).mul(float(u.u_p12).mul(0.2)));
        });
        return pow(clamp(n, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── FBM NOISE ───
export const fbmNoise: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const pers = float(0.5).add(float(u.u_p1).sub(0.5));
        const lac = float(2.0).add(float(u.u_p2).sub(0.5));
        const stv = vec2(st).mul(u.u_scale).mul(3.0).add(float(u.u_time).mul(0.1)).toVar();
        stv.addAssign(vec2(u.u_p14, u.u_p15));
        const v = float(0.0).toVar();
        const a = float(0.5).toVar();
        Loop(6, () => {
            const n = _noise2d(stv, u.u_seed);
            v.addAssign(n.mul(a));
            stv.assign(stv.mul(lac).add(100.0));
            a.mulAssign(pers);
        });
        v.assign(mix(v, smoothstep(0.2, 0.8, v), u.u_factor));
        If(float(u.u_p11).greaterThan(0.0), () => {
            v.addAssign(sin(stv.x.mul(5.0)).mul(0.1).mul(u.u_p11));
        });
        If(float(u.u_p12).greaterThan(0.0), () => {
            v.addAssign(random2d(stv, u.u_seed).sub(0.5).mul(float(u.u_p12).mul(0.1)));
        });
        return pow(clamp(v, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── RIDGED FRACTAL ───
export const ridgedFractal: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const stv = vec2(st).mul(u.u_scale).mul(3.0).toVar();
        stv.addAssign(vec2(u.u_p14, u.u_p15));
        If(float(u.u_p3).greaterThan(0.0), () => { stv.addAssign(u.u_p3); });
        If(float(u.u_p12).greaterThan(0.0), () => {
            stv.assign(rotate2d(float(u.u_p12).mul(3.14)).mul(stv));
        });
        const n = ridgedFBM(stv.add(float(u.u_time).mul(0.05)), u.u_seed, u.u_factor).toVar();
        If(float(u.u_p1).greaterThan(0.0), () => { n.mulAssign(float(1.0).add(u.u_p1)); });
        If(float(u.u_p2).greaterThan(0.0), () => {
            n.assign(pow(max(float(0.0), n), float(1.0).add(u.u_p2)));
        });
        If(float(u.u_p15).greaterThan(0.0), () => {
            n.assign(pow(max(float(0.0), n), float(1.0).add(u.u_p15)));
        });
        return pow(clamp(n, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── VORONOI SMOOTH ───
export const voronoiSmoothPattern: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const stv = vec2(st).mul(u.u_scale).mul(5.0).toVar();
        stv.addAssign(vec2(u.u_p14, u.u_p15));
        If(float(u.u_p11).greaterThan(0.0), () => {
            stv.assign(rotate2d(u.u_p11).mul(stv));
        });
        const n = _voronoiSmooth(stv, u.u_time, u.u_factor).toVar();
        If(float(u.u_p1).greaterThan(0.0), () => {
            n.addAssign(sin(vec2(st).x.mul(20.0)).mul(0.1).mul(u.u_p1));
        });
        If(float(u.u_p12).greaterThan(0.0), () => {
            n.addAssign(random2d(stv.mul(10.0), u.u_seed).sub(0.5).mul(float(u.u_p12).mul(0.1)));
        });
        return pow(clamp(n.mul(0.5).add(0.5), 0.0, 1.0), u.u_intensity);
    })();
};

// ─── VORONOI ROCKS ───
export const voronoiRocks: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p = vec2(st).mul(u.u_scale).mul(2.0).toVar();
        p.addAssign(vec2(u.u_p14, u.u_p15));
        p.addAssign(
            vec2(
                sin(p.x.mul(6.28).mul(2.0).sub(cos(p.y.mul(6.28).mul(4.0)))),
                sin(p.y.mul(6.28).mul(2.0).sub(cos(p.x.mul(6.28).mul(4.0)))),
            ).mul(0.01).mul(u.u_distortion),
        );
        const v1 = voronoi2d(p.mul(5.0), u.u_time);
        const v2 = voronoi2d(p.mul(15.0).add(2.0), u.u_time);
        const rock = mix(v1.x, v2.x, u.u_p1).toVar();
        If(float(u.u_factor).greaterThan(0.5), () => { rock.assign(float(1.0).sub(rock)); });
        const soft = float(u.u_p4).mul(0.5);
        rock.assign(smoothstep(soft, float(1.0).sub(float(u.u_p2).mul(0.8)).sub(soft), rock));
        If(float(u.u_p15).greaterThan(0.0), () => {
            rock.assign(pow(max(float(0.0), rock), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return pow(clamp(rock, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── TRABECULUM ───
export const trabeculum: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p = vec2(st).mul(u.u_scale).mul(5.0).toVar();
        p.addAssign(vec2(u.u_p14, u.u_p15));
        const p3 = vec3(p, float(u.u_time).mul(0.2));
        const wRaw = worley3d(p3);
        const w = vec3(wRaw);
        const c0 = float(0.0).toVar();
        If(float(u.u_factor).lessThan(0.33), () => {
            c0.assign(w.y.sub(w.x));
        }).Else(() => {
            If(float(u.u_factor).lessThan(0.66), () => {
                c0.assign(w.y.sub(w.x).mul(2.0));
            }).Else(() => {
                const denom = float(1.0).div(w.z.sub(w.x).add(0.001)).add(float(1.0).div(w.y.sub(w.x).add(0.001)));
                c0.assign(float(1.0).sub(float(1.0).div(denom)));
            });
        });
        If(float(u.u_p15).greaterThan(0.0), () => {
            c0.assign(pow(max(float(0.0), c0), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return pow(clamp(c0, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── TURBULENCE ───
export const turbulence: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const s = vec2(st).mul(u.u_scale).mul(3.0).toVar();
        s.addAssign(vec2(u.u_p14, u.u_p15));
        const f = abs(fbm2d(s, u.u_seed, u.u_detail).mul(2.0).sub(1.0)).mul(0.5).toVar();
        s.mulAssign(2.1);
        f.addAssign(abs(fbm2d(s, u.u_seed, u.u_detail).mul(2.0).sub(1.0)).mul(0.25));
        const val = smoothstep(float(u.u_factor).mul(0.5), 1.0, f).toVar();
        If(float(u.u_p15).greaterThan(0.0), () => {
            val.assign(pow(max(float(0.0), val), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return pow(clamp(val, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── GYROID ───
export const gyroidPattern: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p = vec3(vec2(st).mul(u.u_scale).mul(8.0), float(u.u_time).mul(0.5)).toVar();
        p.x.addAssign(u.u_p14);
        p.y.addAssign(u.u_p15);
        p.z.mulAssign(float(0.5).add(float(u.u_p1).mul(1.5)));
        p.y.mulAssign(float(0.5).add(float(u.u_p2).mul(1.5)));
        const d = gyroid(p, 1.0).toVar();
        If(float(u.u_detail).greaterThan(0.0), () => {
            d.addAssign(gyroid(p, 2.1).mul(0.5).mul(u.u_detail));
        });
        If(float(u.u_detail).greaterThan(0.5), () => {
            d.addAssign(gyroid(p, 4.3).mul(0.25).mul(u.u_detail));
        });
        d.assign(d.mul(float(1.0).sub(float(u.u_factor).mul(0.5))).add(float(u.u_factor).mul(sin(d.mul(5.0)))));
        const val = d.mul(0.5).add(0.5).toVar();
        If(float(u.u_p15).greaterThan(0.0), () => {
            val.assign(pow(max(float(0.0), val), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return pow(clamp(val, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── CURL NOISE ───
export const curlNoisePattern: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p = vec2(st).mul(u.u_scale).mul(4.0).toVar();
        p.addAssign(vec2(u.u_p14, u.u_p15));
        const c = curlNoise(p.add(float(u.u_time).mul(0.2)));
        const v = length(c).toVar();
        v.addAssign(float(1.0).sub(smoothstep(0.0, 1.0, v)).mul(u.u_factor));
        If(float(u.u_p15).greaterThan(0.0), () => {
            v.assign(pow(max(float(0.0), v), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return pow(clamp(v, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── MARBLE ───
export const marble: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p = vec2(st).mul(u.u_scale).mul(2.0).toVar();
        p.addAssign(vec2(u.u_p14, u.u_p15));
        If(float(u.u_p7).greaterThan(0.0), () => {
            p.assign(rotate2d(u.u_p7).mul(p));
        });
        const n = fbm2d(p.add(float(u.u_time).mul(0.1)), u.u_seed, u.u_detail);
        const veins = float(u.u_p4).mul(20.0).add(10.0);
        const distort = float(u.u_p3).mul(10.0).add(1.0);
        const m = cos(p.x.mul(veins).add(n.mul(distort).mul(u.u_factor))).mul(0.5).add(0.5).toVar();
        If(float(u.u_p1).greaterThan(0.0), () => {
            m.assign(mix(m, m.mul(m), u.u_p1));
        });
        If(float(u.u_p12).greaterThan(0.0), () => {
            m.addAssign(random2d(p.mul(20.0), u.u_seed).sub(0.5).mul(float(u.u_p12).mul(0.2)));
        });
        If(float(u.u_p15).greaterThan(0.0), () => {
            m.assign(pow(max(float(0.0), m), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return pow(clamp(m, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── WOOD ───
export const wood: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p = vec2(st).mul(u.u_scale).mul(4.0).toVar();
        p.addAssign(vec2(u.u_p14, u.u_p15));
        If(float(u.u_p5).greaterThan(0.0), () => {
            p.addAssign(vec2(sin(p.y.mul(5.0)), sin(p.x.mul(5.0))).mul(float(u.u_p5).mul(0.1)));
        });
        const n = _noise2d(p, u.u_seed);
        const rings = float(10.0).add(float(u.u_factor).mul(20.0)).add(float(u.u_p3).mul(10.0));
        const w = sin(length(p.sub(0.5)).add(n.mul(0.1).mul(u.u_p7)).mul(rings)).mul(0.5).add(0.5).toVar();
        If(float(u.u_p4).greaterThan(0.0), () => {
            const knots = _noise2d(p.mul(2.0), u.u_seed);
            w.assign(mix(w, knots, float(u.u_p4).mul(smoothstep(0.4, 0.6, knots))));
        });
        If(float(u.u_p12).greaterThan(0.0), () => {
            w.addAssign(n.mul(float(u.u_p12).mul(0.1)));
        });
        If(float(u.u_p15).greaterThan(0.0), () => {
            w.assign(pow(max(float(0.0), w), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return pow(clamp(w, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── GRUNGE ───
export const grunge: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p = vec2(st).mul(u.u_scale).mul(10.0).toVar();
        p.addAssign(vec2(u.u_p14, u.u_p15));
        const n = random2d(p.add(floor(float(u.u_time).mul(5.0).mul(u.u_speed))), u.u_seed);
        const scratches = float(0.0).toVar();
        If(float(u.u_p4).greaterThan(0.0), () => {
            scratches.assign(smoothstep(float(0.98).sub(float(u.u_p4).mul(0.1)), 1.0, random2d(vec2(p.y, p.x), u.u_seed)));
        });
        const f = fbm2d(vec2(st).mul(2.0), u.u_seed, u.u_detail);
        const s = smoothstep(float(0.5).sub(float(u.u_factor).mul(0.4)), 1.0, f);
        const result = mix(n.mul(0.3), float(1.0), s).toVar();
        If(float(u.u_p3).greaterThan(0.0), () => {
            result.assign(mix(result, float(0.0), scratches));
        });
        If(float(u.u_p15).greaterThan(0.0), () => {
            result.assign(pow(max(float(0.0), result), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return pow(clamp(result, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── SQUIGGLES ───
export const squiggles: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const uv = vec2(st).mul(u.u_scale).mul(5.0).toVar();
        uv.addAssign(vec2(u.u_p14, u.u_p15));
        const grid = floor(uv);
        const sub = fract(uv).sub(0.5).toVar();
        const n = random2d(grid, u.u_seed);
        const a = n.mul(2.0).mul(3.14159).add(u.u_time).add(float(u.u_factor).mul(5.0));
        sub.assign(rotate2d(a).mul(sub));
        const d = abs(length(sub).sub(0.5));
        const val = smoothstep(0.1, float(0.05).mul(float(1.0).sub(u.u_detail)), d).toVar();
        If(float(u.u_p11).greaterThan(0.0), () => {
            val.addAssign(random2d(uv, u.u_seed).sub(0.5).mul(u.u_p11));
        });
        If(float(u.u_p12).greaterThan(0.0), () => {
            val.addAssign(random2d(uv.mul(10.0), u.u_seed).sub(0.5).mul(float(u.u_p12).mul(0.2)));
        });
        If(float(u.u_p15).greaterThan(0.0), () => {
            val.assign(pow(max(float(0.0), val), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return clamp(val.mul(u.u_intensity), 0.0, 1.0);
    })();
};

// ─── HOLO FOIL ───
export const holoFoil: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const stv = vec2(st).mul(10.0).mul(u.u_scale).toVar();
        stv.addAssign(vec2(u.u_p14, u.u_p15));
        const n = holoVoronoi(stv);
        const v = n.x.mul(n.y).toVar();
        If(float(u.u_p11).greaterThan(0.0), () => {
            v.addAssign(sin(stv.x.mul(2.0)).mul(0.1).mul(u.u_p11));
        });
        If(float(u.u_p12).greaterThan(0.0), () => {
            v.addAssign(random2d(stv, u.u_seed).sub(0.5).mul(float(u.u_p12).mul(0.1)));
        });
        If(float(u.u_p15).greaterThan(0.0), () => {
            v.assign(pow(max(float(0.0), v), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return pow(clamp(v, 0.0, 1.0), float(u.u_intensity).mul(float(1.0).sub(float(u.u_factor).mul(0.5))));
    })();
};

// ─── OIL PAINT ───
export const oilPaint: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p = vec2(st).mul(u.u_scale).mul(2.0).toVar();
        p.addAssign(vec2(u.u_p14, u.u_p15));
        const q = vec2(
            fbm2d(p, u.u_seed, u.u_detail),
            fbm2d(p.add(vec2(5.2, 1.3)), u.u_seed, u.u_detail),
        );
        const r = vec2(
            fbm2d(p.add(q.mul(4.0)).add(vec2(1.7, 9.2)).add(float(u.u_time).mul(0.15)), u.u_seed, u.u_detail),
            fbm2d(p.add(q.mul(4.0)).add(vec2(8.3, 2.8)).add(float(u.u_time).mul(0.126)), u.u_seed, u.u_detail),
        );
        const f = fbm2d(p.add(r.mul(4.0)), u.u_seed, u.u_detail);
        const val = mix(f, length(q), u.u_factor).toVar();
        If(float(u.u_p12).greaterThan(0.0), () => {
            val.addAssign(random2d(p.mul(10.0), u.u_seed).sub(0.5).mul(float(u.u_p12).mul(0.1)));
        });
        If(float(u.u_p15).greaterThan(0.0), () => {
            val.assign(pow(max(float(0.0), val), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return pow(clamp(val, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── FUR FIBERS ───
export const furFibers: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const uv = vec2(st).mul(u.u_scale).mul(10.0).toVar();
        uv.addAssign(vec2(u.u_p14, u.u_p15));
        const stv = rotate2d(float(u.u_p3).mul(3.14159)).mul(uv).toVar();
        stv.x.mulAssign(float(1.0).add(float(u.u_factor).mul(10.0)));
        const n = fbm2d(stv.add(vec2(0.0, float(u.u_time).mul(0.5))), u.u_seed, u.u_detail).toVar();
        If(float(u.u_p15).greaterThan(0.0), () => {
            n.assign(pow(max(float(0.0), n), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return pow(clamp(n, 0.0, 1.0), u.u_intensity);
    })();
};

// ─── FLUID WARP ───
export const fluidWarp: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p = vec2(st).mul(u.u_scale).mul(2.0).toVar();
        p.addAssign(vec2(u.u_p14, u.u_p15));
        const q = vec2(
            fbm2d(p, u.u_seed, u.u_detail),
            fbm2d(p.add(vec2(5.2, 1.3)), u.u_seed, u.u_detail),
        );
        const r = vec2(
            fbm2d(p.add(q.mul(4.0)).add(vec2(1.7, 9.2)).add(float(u.u_time).mul(u.u_speed).mul(0.15)), u.u_seed, u.u_detail),
            fbm2d(p.add(q.mul(4.0)).add(vec2(8.3, 2.8)).add(float(u.u_time).mul(u.u_speed).mul(0.126)), u.u_seed, u.u_detail),
        );
        const f = fbm2d(p.add(r.mul(4.0)), u.u_seed, u.u_detail);
        const v = mix(f, length(q), u.u_factor).toVar();
        If(float(u.u_detail).greaterThan(0.5), () => {
            v.assign(mix(v, r.x, 0.5));
        });
        If(float(u.u_p12).greaterThan(0.0), () => {
            v.addAssign(random2d(p.mul(10.0), u.u_seed).sub(0.5).mul(float(u.u_p12).mul(0.1)));
        });
        If(float(u.u_p15).greaterThan(0.0), () => {
            v.assign(pow(max(float(0.0), v), float(1.0).sub(float(u.u_p15).mul(0.5))));
        });
        return pow(clamp(v, 0.0, 1.0), u.u_intensity);
    })();
};
