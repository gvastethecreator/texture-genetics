/**
 * TSL Post-Process Chunk
 * UV transforms, pixelation, scanlines, color balance, halftone, edge detect, bloom, vignette, posterize.
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
    dot,
    mix,
    max,
    clamp,
    length,
    normalize,
    smoothstep,
    atan,
    mod,
    sqrt,
    If,
} from 'three/tsl';
import { rotate2d, toPolar, rgb2hsv, hsv2rgb, applyBlendModeVec3 } from './math';
import { random2d } from '../chunks/noise';

// ─── UV Transforms ───

export const getTransformedUV = Fn(
    ([
        uv_in,
        u_mouseEnabled,
        u_mouse,
        u_mouseRadius,
        u_mouseStrength,
        u_mouseType,
        u_angle,
        u_offset,
        u_symEnabled,
        u_symSegments,
        u_symRotation,
        u_symZoom,
        u_polar,
        u_tilingEnabled,
        u_tilingScale,
        u_tilingOffset,
        u_tilingRotation,
        u_tilingRepeat,
        u_tilingMirror,
    ]: any[]) => {
        const st = vec2(uv_in).toVar();

        // Mouse interaction
        If(float(u_mouseEnabled).greaterThan(0.5), () => {
            const mouseDist = length(st.sub(u_mouse));
            If(mouseDist.lessThan(float(u_mouseRadius).mul(2.0)), () => {
                const mouseInf = smoothstep(float(u_mouseRadius), 0.0, mouseDist).mul(u_mouseStrength);
                If(int(u_mouseType).equal(int(0)), () => {
                    st.subAssign(normalize(st.sub(u_mouse).add(0.0001)).mul(mouseInf));
                });
                If(int(u_mouseType).equal(int(1)), () => {
                    st.assign(
                        vec2(u_mouse).add(st.sub(u_mouse).mul(float(1.0).sub(float(mouseInf).mul(0.8)))),
                    );
                });
            });
        });

        // Rotation + offset
        st.subAssign(0.5);
        const rotMat = rotate2d(u_angle);
        st.assign(rotMat.mul(st));
        st.addAssign(0.5);
        st.addAssign(u_offset);

        // Symmetry / Kaleidoscope
        If(float(u_symEnabled).greaterThan(0.5), () => {
            const p = st.sub(0.5);
            const r = length(p);
            const a = atan(p.y, p.x).add(u_symRotation).toVar();
            const seg = float(6.2831853).div(max(float(2.0), float(u_symSegments)));
            a.assign(abs(mod(a, seg).sub(seg.mul(0.5))));
            st.assign(vec2(cos(a), sin(a)).mul(r).div(max(float(0.01), float(u_symZoom))).add(0.5));
        });

        // Polar coords
        If(float(u_polar).greaterThan(0.5), () => {
            st.assign(toPolar(st));
        });

        // Tiling
        If(float(u_tilingEnabled).greaterThan(0.5), () => {
            If(float(u_tilingScale).notEqual(float(1.0)), () => {
                st.assign(st.sub(0.5).mul(u_tilingScale).add(0.5));
            });
            st.addAssign(u_tilingOffset);
            If(float(u_tilingRotation).notEqual(float(0.0)), () => {
                st.subAssign(0.5);
                st.assign(rotate2d(u_tilingRotation).mul(st));
                st.addAssign(0.5);
            });
            const t = st.mul(u_tilingRepeat);
            // Mirror or wrap
            If(float(u_tilingMirror).greaterThan(0.5), () => {
                st.assign(float(1.0).sub(abs(mod(t, 2.0).sub(1.0))));
            }).Else(() => {
                st.assign(fract(t));
            });
        });

        return st;
    },
);

// ─── Pixelation ───

export const pixelateUV = Fn(([uv_in, u_pixelate, u_pixelDensity]: any[]) => {
    const uv = vec2(uv_in).toVar();
    If(float(u_pixelate).greaterThan(0.5), () => {
        const dx = float(1.0).div(u_pixelDensity);
        const dy = float(1.0).div(u_pixelDensity);
        uv.assign(vec2(floor(uv.x.div(dx)).mul(dx), floor(uv.y.div(dy)).mul(dy)));
    });
    return uv;
});

// ─── CRT / Scanlines ───

export const applyScanlines = Fn(
    ([color_in, uv_in, u_scanlines, u_resolution, u_scanlineIntensity, u_crtDistortion, u_time]: any[]) => {
        const color = vec3(color_in).toVar();
        const uv = vec2(uv_in);

        If(float(u_scanlines).greaterThan(0.5), () => {
            const count = vec2(u_resolution).y.mul(0.5);
            const slX = sin(uv.y.mul(count));
            const slY = cos(uv.y.mul(count));
            const scanlineColor = vec3(slX, slY, slX);
            color.addAssign(color.mul(scanlineColor).mul(u_scanlineIntensity));
            // Noise
            color.addAssign(color.mul(random2d(uv.mul(u_time), float(0.0))).mul(float(u_scanlineIntensity).mul(0.5)));

            If(float(u_crtDistortion).greaterThan(0.0), () => {
                const dist = length(uv.sub(0.5));
                color.mulAssign(smoothstep(0.8, float(0.8).sub(float(u_crtDistortion).mul(0.5)), dist));
            });
        });

        return color;
    },
);

// ─── ACES Tone Mapping ───

export const acesTonemap = Fn(([x_in]: [any]) => {
    const x = vec3(x_in);
    const a = float(2.51);
    const b = float(0.03);
    const c = float(2.43);
    const d = float(0.59);
    const e = float(0.14);
    return clamp(x.mul(x.mul(a).add(b)).div(x.mul(x.mul(c).add(d)).add(e)), 0.0, 1.0);
});

// ─── Color Balance ───

export const applyColorBalance = Fn(
    ([
        color_in,
        u_brightness,
        u_contrast,
        u_saturation,
        u_hue,
        u_cycleSpeed,
        u_time,
        u_shadows,
        u_midtones,
        u_highlights,
    ]: any[]) => {
        const color = vec3(color_in).toVar();

        // Brightness/Contrast
        color.assign(color.sub(0.5).mul(max(float(0.0), float(u_contrast).add(1.0))).add(0.5).add(u_brightness));

        // Saturation
        const gray = vec3(dot(color, vec3(0.2126, 0.7152, 0.0722)));
        color.assign(mix(gray, color, float(u_saturation).add(1.0)));

        // Hue Shift
        const safeCol = max(vec3(0.0), color);
        const hsv = rgb2hsv(safeCol).toVar();
        hsv.x.addAssign(float(u_hue));
        hsv.x.addAssign(float(u_time).mul(u_cycleSpeed));
        color.assign(hsv2rgb(hsv));

        // Grading
        const lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
        const bal = mix(mix(vec3(u_shadows), vec3(u_midtones), lum), vec3(u_highlights), lum);
        color.addAssign(bal.mul(0.5));

        return color;
    },
);

// ─── Halftone Effect ───

export const applyHalftone = Fn(([color_in, uv_in, scale_in]: any[]) => {
    const color = vec3(color_in);
    const uv = vec2(uv_in);
    const scale = float(scale_in);

    const rot = rotate2d(float(0.785398));
    const st = rot.mul(uv.sub(0.5)).add(0.5);
    const nearest = fract(st.mul(scale)).mul(2.0).sub(1.0);
    const dist = length(nearest);
    const radius = sqrt(float(1.0).sub(dot(color, vec3(0.299, 0.587, 0.114)))).mul(1.2);
    return mix(vec3(0.05), color, smoothstep(radius, radius.add(0.1), dist));
});

// ─── Edge Detect ───

export const applyEdgeDetect = Fn(([color_in, _uv_in, edgeColor_in]: any[]) => {
    const color = vec3(color_in);
    const edgeColor = vec3(edgeColor_in);

    const dx = color.dFdx();
    const dy = color.dFdy();
    const edge = clamp(length(dx).add(length(dy)).mul(10.0), 0.0, 1.0);
    const edgeSmooth = smoothstep(0.1, 0.5, edge);
    return mix(color.mul(0.1), edgeColor, edgeSmooth);
});

// ─── Post Process Pipeline ───

export const applyPostProcess = Fn(
    ([
        color_in,
        uv_in,
        u_vignette,
        u_bloomEnabled,
        u_bloomThreshold,
        u_bloomStrength,
        u_posterize,
        u_posterizeLevels,
    ]: any[]) => {
        const color = vec3(color_in).toVar();
        const uv = vec2(uv_in);

        // Vignette
        If(float(u_vignette).greaterThan(0.0), () => {
            const dist = length(uv.sub(0.5));
            color.mulAssign(smoothstep(0.8, float(0.8).sub(float(u_vignette).mul(0.8)), dist));
        });

        // Bloom
        If(float(u_bloomEnabled).greaterThan(0.5), () => {
            const brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
            If(brightness.greaterThan(float(u_bloomThreshold)), () => {
                color.addAssign(color.mul(float(u_bloomStrength).mul(brightness.sub(u_bloomThreshold))));
            });
        });

        // Posterize
        If(float(u_posterize).greaterThan(0.5), () => {
            const levels = max(float(2.0), float(u_posterizeLevels));
            color.assign(floor(color.mul(levels)).div(levels));
        });

        return color;
    },
);

// ─── Sticker (placeholder – requires texture sampler nodes) ───
// Sticker composition will be handled in the builder when texture support is wired.

export { applyBlendModeVec3 };
