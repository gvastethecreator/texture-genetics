/**
 * TSL SDF Patterns (10 raymarched patterns)
 */
import {
    Fn, float, vec2, vec3, int, mat2, mat3,
    sin, cos, abs, floor, fract, mod, dot,
    mix, step, max, min, clamp, pow, length, distance,
    smoothstep, atan, exp, sqrt, normalize, acos,
    If, Loop, cross,
} from 'three/tsl';
import type { TslPatternFn } from '../tslBuilder';
import type { TslUniforms } from '../uniforms';
import { rot2D, rotComplex, sdBox, opRep, smin } from '../chunks/sdf';
import { noise3d, fbm3d, gyroid } from '../chunks/noise';

// ─── 1. HYPER TUNNEL ───
export const hyperTunnel: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p2 = vec2(st).sub(0.5).mul(2.0);
        const rayDir = normalize(vec3(p2, float(1.0).div(float(u.u_scale).mul(2.0)))).toVar();
        rayDir.x.addAssign(u.u_p14);
        rayDir.y.addAssign(u.u_p15);

        const d = float(0.0).toVar();
        const accum = float(0.0).toVar();
        const t = float(u.u_time).mul(u.u_speed);
        const rMat = rotComplex(t.mul(0.5));

        Loop({ start: int(0), end: int(80), type: 'int', condition: '<' }, ({ i }: { i: any }) => {
            If(float(i).greaterThan(float(40.0).add(float(u.u_p6).mul(40.0))), () => { return; });
            const p = vec3(rayDir).mul(d).toVar();
            p.z.subAssign(10.0);
            // Rotate xz
            const pxz = vec2(p.x, p.z).mul(rMat).toVar();
            p.x.assign(pxz.x);
            p.z.assign(pxz.y);
            // Twist
            If(float(u.u_p3).greaterThan(0.0), () => {
                const twistMat = rot2D(p.z.mul(u.u_p3).mul(0.2));
                const pxy = vec2(p.x, p.y).mul(twistMat).toVar();
                p.x.assign(pxy.x);
                p.y.assign(pxy.y);
            });
            // Mirror
            If(p.y.lessThan(-6.3), () => {
                p.y.assign(p.y.negate().sub(9.0));
            });
            p.z.addAssign(sin(p.y.add(u.u_time)));
            p.x.assign(mix(abs(p.x), p.x, 0.01));
            p.z.addAssign(float(u.u_time).mul(5.0).mul(u.u_speed));
            // Simplified distance field
            const s = length(vec2(p.x, p.y)).sub(float(4.0).mul(float(1.0).add(u.u_p4)));
            const wave = sin(length(p));
            const w = float(0.01).add(float(0.07).mul(abs(max(wave, sqrt(s.mul(s).add(dot(p, p))).sub(1.5)).sub(float(i).div(150.0)))));
            const wScaled = w.mul(float(1.0).sub(float(u.u_factor).mul(0.5)));
            d.addAssign(wScaled);
            accum.addAssign(float(1.3).div(max(0.001, wScaled)).mul(0.002).mul(u.u_intensity).mul(float(1.0).add(u.u_p2)));
            If(d.greaterThan(20.0), () => { return; });
        });
        // Fog fadeout
        If(float(u.u_p9).greaterThan(0.0), () => {
            accum.assign(mix(accum, 0.0, float(1.0).sub(exp(d.negate().mul(u.u_p9).mul(0.1)))));
        });
        // Twist distortion
        If(float(u.u_p13).greaterThan(0.0), () => {
            accum.addAssign(sin(d.mul(u.u_p13)).mul(0.1));
        });
        return clamp(accum, 0.0, 1.0);
    })();
};

// ─── 2. ALIEN BIOMASS ───
export const alienBiomass: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const rd = normalize(vec3(vec2(st).sub(0.5).mul(2.0), 1.0)).toVar();
        rd.x.addAssign(u.u_p14);
        rd.y.addAssign(u.u_p15);
        const T = float(u.u_time).mul(u.u_speed).mul(2.0);
        const t = float(0.0).toVar();
        const accum = float(0.0).toVar();
        const d = float(0.1).toVar();

        Loop({ start: int(0), end: int(50), type: 'int', condition: '<' }, () => {
            const p = vec3(rd).mul(t).toVar();
            // Rotate zy
            const pzy = vec2(p.z, p.y).mul(rot2D(1.0)).toVar();
            p.z.assign(pzy.x);
            p.y.assign(pzy.y);
            p.z.addAssign(T);
            const w = T.mul(0.2);
            p.x.addAssign(sin(w).mul(2.0));
            const pxy = vec2(p.x, p.y).mul(rot2D(cos(w).mul(0.1))).toVar();
            p.x.assign(pxy.x);
            p.y.assign(pxy.y);
            const sphereDist = p.y.add(4.0);
            const h = sphereDist.sub(2.3).add(abs(p.x.mul(0.2).mul(u.u_factor)));
            d.assign(min(d, h).mul(0.8));
            t.addAssign(d);
            // Accumulate simplified glow
            If(h.greaterThan(0.001), () => {
                accum.addAssign(0.03);
            });
            If(t.greaterThan(20.0), () => { return; });
        });
        const val = accum.mul(u.u_intensity).mul(0.5).toVar();
        If(float(u.u_p13).greaterThan(0.0), () => {
            val.assign(pow(max(0.0, val), float(1.0).sub(float(u.u_p13).mul(0.5))));
        });
        return clamp(val, 0.0, 1.0);
    })();
};

// ─── 3. CUBIC SPACE ───
export const cubicSpace: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const ro = vec3(float(u.u_p12).mul(2.0), float(u.u_p13).mul(2.0), float(-4.0).add(float(u.u_p11).mul(2.0))).toVar();
        const rd = normalize(vec3(vec2(st).sub(0.5).mul(2.0), 1.0)).toVar();
        const t = float(u.u_time).mul(u.u_speed);
        const rMat = rot2D(t.mul(0.2).add(u.u_p14));
        // Rotate ro.xz
        const roxz = vec2(ro.x, ro.z).mul(rMat).toVar();
        ro.x.assign(roxz.x);
        ro.z.assign(roxz.y);
        const rdxz = vec2(rd.x, rd.z).mul(rMat).toVar();
        rd.x.assign(rdxz.x);
        rd.z.assign(rdxz.y);

        const d = float(0.0).toVar();
        const accum = float(0.0).toVar();

        Loop({ start: int(0), end: int(40), type: 'int', condition: '<' }, ({ i }: { i: any }) => {
            const p = ro.add(rd.mul(d)).toVar();
            const q = opRep(p, vec3(float(2.0).add(float(u.u_factor).mul(2.0)))).toVar();
            // Rotate q
            const fi = float(i);
            const qxy = vec2(q.x, q.y).mul(rot2D(t.add(fi.mul(0.1)))).toVar();
            q.x.assign(qxy.x);
            q.y.assign(qxy.y);
            const qxz = vec2(q.x, q.z).mul(rot2D(t.mul(0.5))).toVar();
            q.x.assign(qxz.x);
            q.z.assign(qxz.y);
            const box = sdBox(q, vec3(float(0.4).mul(u.u_scale)));
            accum.addAssign(float(0.02).div(float(0.02).add(abs(box))).mul(u.u_intensity));
            d.addAssign(max(0.05, abs(box).mul(0.5)));
            If(d.greaterThan(20.0), () => { return; });
        });
        If(float(u.u_p15).greaterThan(0.0), () => {
            accum.assign(pow(max(0.0, accum), float(1.0).add(u.u_p15)));
        });
        return clamp(accum.mul(0.1), 0.0, 1.0);
    })();
};

// ─── 4. LOW TECH TUNNEL ───
export const lowTechTunnel: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p2 = vec2(st).sub(0.5).mul(2.0);
        const T = float(u.u_time).mul(u.u_speed).mul(4.0).add(5.0).add(sin(float(u.u_time).mul(0.3)).mul(5.0));
        // Camera path
        const pathZ = T;
        const pathX = cos(pathZ.mul(0.1)).mul(12.0);
        const pathY = cos(pathZ.mul(0.12)).mul(12.0);
        const ro = vec3(pathX, pathY, pathZ).toVar();
        // Look ahead
        const nextZ = T.add(4.0);
        const nextX = cos(nextZ.mul(0.1)).mul(12.0);
        const nextY = cos(nextZ.mul(0.12)).mul(12.0);
        const Z = normalize(vec3(nextX, nextY, nextZ).sub(ro));
        const X = normalize(vec3(Z.z, 0.0, Z.x.negate()));
        const Y = cross(X, Z);
        // Camera matrix
        const rd = normalize(
            X.mul(p2.x).add(Y.mul(p2.y)).add(Z.mul(1.0))
        ).toVar();
        const d = float(0.0).toVar();
        const s = float(0.0).toVar();
        const accum = float(0.0).toVar();

        Loop({ start: int(0), end: int(28), type: 'int', condition: '<' }, () => {
            ro.addAssign(rd.mul(s));
            const xPath = cos(ro.z.mul(0.1)).mul(12.0);
            const yPath = cos(ro.z.mul(0.12)).mul(12.0);
            // Tunnel distance
            s.assign(cos(ro.z.mul(0.6)).mul(2.0).add(4.0));
            s.subAssign(min(length(vec2(ro.x, ro.y).sub(xPath.sub(6.0))), length(vec2(ro.x.sub(xPath), ro.y.sub(yPath)))));
            d.addAssign(abs(s).mul(0.3).add(0.01));
            accum.addAssign(float(1.0).div(max(0.001, abs(s))));
            If(d.greaterThan(30.0), () => { return; });
        });
        return clamp(accum.mul(0.00002).mul(u.u_intensity), 0.0, 1.0);
    })();
};

// ─── 5. OCTGRAMS ───
export const octgrams: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p2 = vec2(st).sub(0.5).mul(2.0);
        const ro = vec3(0.0, -0.2, float(u.u_time).mul(4.0).mul(u.u_speed)).toVar();
        const ray = normalize(vec3(p2, float(1.5).div(u.u_scale))).toVar();
        // Rotate ray
        const rxy = vec2(ray.x, ray.y).mul(rot2D(sin(float(u.u_time).mul(0.03)).mul(5.0))).toVar();
        ray.x.assign(rxy.x);
        ray.y.assign(rxy.y);
        const ryz = vec2(ray.y, ray.z).mul(rot2D(sin(float(u.u_time).mul(0.05)).mul(0.2))).toVar();
        ray.y.assign(ryz.x);
        ray.z.assign(ryz.y);

        const t = float(0.1).toVar();
        const ac = float(0.0).toVar();

        Loop({ start: int(0), end: int(99), type: 'int', condition: '<' }, ({ i: _i }: { i: any }) => {
            const pos = mod(ro.add(ray.mul(t)).sub(2.0), 4.0).sub(2.0);
            // Simplified box_set: nested boxes with time-varying position
            const boxScale = float(2.0).sub(abs(sin(float(u.u_time).mul(0.4))).mul(1.5));
            // Multiple box evaluations
            const posY1 = vec3(pos.x, pos.y.add(sin(float(u.u_time).mul(0.4)).mul(2.5)), pos.z).toVar();
            const rxy1 = vec2(posY1.x, posY1.y).mul(rot2D(0.8)).toVar();
            posY1.x.assign(rxy1.x);
            posY1.y.assign(rxy1.y);
            const b1 = sdBox(posY1.mul(boxScale), vec3(0.4, 0.4, 0.1)).div(1.5).negate();

            const posY2 = vec3(pos.x, pos.y.sub(sin(float(u.u_time).mul(0.4)).mul(2.5)), pos.z).toVar();
            const rxy2 = vec2(posY2.x, posY2.y).mul(rot2D(0.8)).toVar();
            posY2.x.assign(rxy2.x);
            posY2.y.assign(rxy2.y);
            const b2 = sdBox(posY2.mul(boxScale), vec3(0.4, 0.4, 0.1)).div(1.5).negate();

            const b5 = sdBox(pos.mul(0.5), vec3(0.4, 0.4, 0.1)).div(1.5).negate().mul(6.0);
            const d = max(max(b1, b2), b5);
            const dAbs = max(abs(d), 0.01);
            ac.addAssign(exp(dAbs.negate().mul(23.0).mul(float(1.0).sub(float(u.u_factor).mul(0.5)))));
            t.addAssign(dAbs.mul(0.55));
        });
        return clamp(ac.mul(0.02).mul(u.u_intensity), 0.0, 1.0);
    })();
};

// ─── 6. COSMIC FLOW ───
export const cosmicFlow: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p2 = vec2(st).sub(0.5).mul(2.0);
        const ro = vec3(0.0, 0.0, float(u.u_time).mul(5.0).mul(u.u_speed)).toVar();
        const ta = ro.add(vec3(0.0, 0.0, 1.0));
        // Simple camera
        const cw = normalize(ta.sub(ro));
        const cp = vec3(0.0, 1.0, 0.0);
        const cu = normalize(cross(cw, cp));
        const cv = normalize(cross(cu, cw));
        const rd = normalize(cu.mul(p2.x).add(cv.mul(p2.y)).add(cw.mul(1.5))).toVar();

        const t = float(0.0).toVar();
        const accum = float(0.0).toVar();

        Loop({ start: int(0), end: int(40), type: 'int', condition: '<' }, () => {
            const pos = ro.add(rd.mul(t)).toVar();
            // Distance: tube with noise displacement
            const tubeDist = length(vec2(pos.x, pos.y)).sub(1.0);
            // Noise displacement
            const n = noise3d(pos.mul(u.u_scale), u.u_seed).toVar();
            const q = pos.mul(u.u_scale).mul(2.0);
            n.addAssign(noise3d(q, u.u_seed).mul(0.5));
            pos.x.addAssign(sin(pos.z.mul(0.2).add(float(u.u_time).mul(u.u_speed))).mul(u.u_factor));
            pos.y.addAssign(sin(pos.z.mul(0.2).add(float(u.u_time).mul(u.u_speed))).mul(u.u_factor));
            const d = tubeDist.sub(n.mul(0.5));
            If(d.lessThan(0.01), () => {
                accum.addAssign(float(1.0).sub(t.div(20.0)));
            });
            accum.addAssign(float(0.02).div(float(0.05).add(abs(d))).mul(u.u_intensity).mul(0.1));
            t.addAssign(max(0.05, d.mul(0.5)));
            If(t.greaterThan(20.0), () => { return; });
        });
        return clamp(accum, 0.0, 1.0);
    })();
};

// ─── 7. INDRA NET ───
export const indraNet: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const ro = vec3(u.u_p12, u.u_p13, float(-3.0).add(u.u_p11)).toVar();
        const rd = normalize(vec3(vec2(st).sub(0.5).mul(2.0), 1.0)).toVar();
        const t = float(u.u_time).mul(u.u_speed);
        const rMat = rot2D(t.mul(0.2).add(u.u_p14));
        const roxz = vec2(ro.x, ro.z).mul(rMat).toVar();
        ro.x.assign(roxz.x);
        ro.z.assign(roxz.y);
        const rdxz = vec2(rd.x, rd.z).mul(rMat).toVar();
        rd.x.assign(rdxz.x);
        rd.z.assign(rdxz.y);

        const d = float(0.0).toVar();
        const accum = float(0.0).toVar();

        Loop({ start: int(0), end: int(40), type: 'int', condition: '<' }, () => {
            const p = ro.add(rd.mul(d)).toVar();
            p.assign(mod(p.add(2.0), 4.0).sub(2.0));
            const sphere = length(p).sub(float(0.5).mul(u.u_scale));
            const connections = min(length(vec2(p.x, p.y)), min(length(vec2(p.y, p.z)), length(vec2(p.z, p.x)))).sub(float(0.05).add(float(u.u_factor).mul(0.1)));
            const shape = smin(sphere, connections, 0.2);
            d.addAssign(max(0.02, abs(shape)));
            accum.addAssign(float(0.02).div(float(0.02).add(abs(shape))).mul(u.u_intensity));
            If(d.greaterThan(20.0), () => { return; });
        });
        If(float(u.u_p15).greaterThan(0.0), () => {
            accum.assign(pow(max(0.0, accum), float(1.0).add(u.u_p15)));
        });
        return clamp(accum.mul(0.2), 0.0, 1.0);
    })();
};

// ─── 8. SPHERICAL SPIRAL ───
export const sphericalSpiral: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const p = vec2(st).sub(0.5).mul(2.0).toVar();
        const r = length(p);
        // Outside sphere → 0
        const result = float(0.0).toVar();
        If(r.lessThanEqual(1.0), () => {
            const z = sqrt(float(1.0).sub(r.mul(r)));
            const pos = vec3(p, z).toVar();
            const t = float(u.u_time).mul(u.u_speed);
            // Rotations
            const posxz = vec2(pos.x, pos.z).mul(rot2D(t.add(u.u_p12))).toVar();
            pos.x.assign(posxz.x);
            pos.z.assign(posxz.y);
            const posyz = vec2(pos.y, pos.z).mul(rot2D(t.mul(0.5).add(u.u_p13))).toVar();
            pos.y.assign(posyz.x);
            pos.z.assign(posyz.y);
            const theta = atan(pos.y, pos.x);
            const phi = acos(clamp(pos.z, -1.0, 1.0));
            const spiral = sin(phi.mul(float(10.0).add(float(u.u_p1).mul(50.0))).add(theta));
            const width = float(0.95).sub(float(u.u_factor).mul(0.1));
            const dots = smoothstep(width, 1.0, spiral).toVar();
            If(float(u.u_p15).greaterThan(0.0), () => {
                dots.assign(pow(max(0.0, dots), float(1.0).sub(float(u.u_p15).mul(0.5))));
            });
            result.assign(clamp(dots.mul(u.u_intensity), 0.0, 1.0));
        });
        return result;
    })();
};

// ─── 9. ALIEN COCOON ───
export const alienCocoon: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const ro = vec3(u.u_p12, u.u_p13, float(-3.0).div(u.u_scale).add(u.u_p11)).toVar();
        const rd = normalize(vec3(vec2(st).sub(0.5).mul(2.0), 1.0)).toVar();
        // P14 rotation
        const rdxy = vec2(rd.x, rd.y).mul(rot2D(float(u.u_p14))).toVar();
        rd.x.assign(rdxy.x);
        rd.y.assign(rdxy.y);

        const t = float(0.0).toVar();
        const accum = float(0.0).toVar();

        Loop({ start: int(0), end: int(50), type: 'int', condition: '<' }, () => {
            const p = ro.add(rd.mul(t));
            const sphere = length(p).sub(1.5);
            const g = gyroid(p, float(4.0).add(float(u.u_factor).mul(5.0))).mul(0.1);
            const d = sphere.add(g);
            If(d.lessThan(0.1), () => {
                accum.addAssign(float(0.1).sub(d).mul(u.u_intensity));
            });
            t.addAssign(max(0.02, d.mul(0.5)));
            If(t.greaterThan(10.0), () => { return; });
        });
        If(float(u.u_p15).greaterThan(0.0), () => {
            accum.assign(pow(max(0.0, accum), float(1.0).add(u.u_p15)));
        });
        return clamp(accum, 0.0, 1.0);
    })();
};

// ─── 10. VOLUMETRIC FOG ───
export const volumetricFog: TslPatternFn = (st: any, u: TslUniforms) => {
    return Fn(() => {
        const ro = vec3(u.u_p12, float(1.0).add(u.u_p13), float(u.u_time).mul(u.u_speed).add(u.u_p11)).toVar();
        const rd = normalize(vec3(vec2(st).sub(0.5).mul(2.0), 1.0)).toVar();
        rd.y.subAssign(0.3);
        // P14 tilt
        If(float(u.u_p14).abs().greaterThan(0.0), () => {
            const rdyz = vec2(rd.y, rd.z).mul(rot2D(float(u.u_p14))).toVar();
            rd.y.assign(rdyz.x);
            rd.z.assign(rdyz.y);
        });

        const t = float(0.0).toVar();
        const accum = float(0.0).toVar();

        Loop({ start: int(0), end: int(30), type: 'int', condition: '<' }, () => {
            const p = ro.add(rd.mul(t));
            const den = fbm3d(p.mul(0.5).mul(u.u_scale), u.u_seed);
            const h = smoothstep(1.0, -1.0, p.y);
            accum.addAssign(den.mul(h).mul(0.05).mul(u.u_intensity));
            t.addAssign(float(0.2).add(float(u.u_factor).mul(0.2)));
        });
        If(float(u.u_p15).greaterThan(0.0), () => {
            accum.assign(pow(max(0.0, accum), float(1.0).add(u.u_p15)));
        });
        return clamp(accum, 0.0, 1.0);
    })();
};
