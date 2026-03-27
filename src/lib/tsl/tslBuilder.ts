/**
 * TSL Shader Builder
 * Replaces the GLSL string-concat pipeline with a TSL node graph.
 *
 * Usage:
 *   const material = createTslMaterial(state);
 *   // update per-frame: material.uniforms.u_time.value = t;
 */
import * as THREE from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
    Fn,
    float,
    vec2,
    vec3,
    vec4,
    int,
    texture,
    uv,
    normalLocal,
    positionWorld,
    cameraPosition,
    clamp as tslClamp,
    mix,
    dot,
    floor,
    max,
    normalize,
    sin,
    smoothstep,
    step,
    If,
} from 'three/tsl';
import type { AppState, TextureType } from '../../core/types/types';
import { TslUniforms, createTslUniforms } from './uniforms';
import { applyBlendModeVec3, blendApply, getPaletteColor, rotate2d } from './chunks/math';
import { random2d } from './chunks/noise';
import {
    getTransformedUV,
    pixelateUV,
    applyScanlines,
    acesTonemap,
    applyColorBalance,
    applyHalftone,
    applyEdgeDetect,
    applyPostProcess,
} from './chunks/postProcess';
import {
    getAccurateNormal,
    getAO,
    getLitColor,
    getHolographicColor,
} from './chunks/lighting';

// ─── Pattern function signature ───
// Each TSL pattern: (st: vec2 node, u: TslUniforms) => float node [0..1]
export type TslPatternFn = (st: any, u: TslUniforms) => any;

export interface TslTextureInputs {
    maskTexture?: THREE.Texture | null;
    baseTexture?: THREE.Texture | null;
    stickerTexture?: THREE.Texture | null;
}

/** Registry: TextureType → TSL pattern function */
export const TSL_PATTERN_MAP: Partial<Record<TextureType, TslPatternFn>> = {};

/** Register a TSL pattern */
export function registerTslPattern(type: TextureType, fn: TslPatternFn): void {
    TSL_PATTERN_MAP[type] = fn;
}

// ─── Main fragment assembly ───

/**
 * Build the complete fragment color node from state.
 * Returns { colorNode, opacityNode } ready to assign on a MeshBasicNodeMaterial.
 */
export function buildFragmentGraph(u: TslUniforms, state: AppState, textures: TslTextureInputs = {}) {
    const mainType = state.textureType;
    const mainFn = TSL_PATTERN_MAP[mainType];
    const maskTexture = textures.maskTexture ?? null;
    const baseTexture = textures.baseTexture ?? null;
    const stickerTexture = textures.stickerTexture ?? null;

    const hasMaskTexture = !!(state.imageAlpha.maskEnabled && maskTexture);
    const hasBaseTexture = !!(state.baseTexture?.enabled && baseTexture);
    const hasStickerTexture = !!(state.sticker?.enabled && stickerTexture);

    const baseOpacity = state.baseTexture?.opacity ?? 1.0;
    const baseBlendMode = state.baseTexture?.blendMode ?? 0;
    const baseEffect = state.baseTexture?.effectType ?? 0;
    const baseEffectStrength = state.baseTexture?.effectStrength ?? 0.5;

    const stickerBlendMode = state.sticker?.blendMode ?? 0;
    const stickerOpacity = state.sticker?.opacity ?? 1.0;
    const stickerScale = Math.max(0.01, state.sticker?.scale ?? 1.0);
    const stickerRotation = (state.sticker?.rotation ?? 0) * (Math.PI / 180);
    const stickerPosX = state.sticker?.posX ?? 0;
    const stickerPosY = state.sticker?.posY ?? 0;
    const stickerUseColor = !!state.sticker?.useColor;
    const stickerTint = new THREE.Color(state.sticker?.color ?? '#ffffff');

    // Fallback magenta if pattern not registered
    if (!mainFn) {
        return {
            colorNode: vec3(1.0, 0.0, 1.0),
            opacityNode: float(1.0),
        };
    }

    const fragmentFn = Fn(() => {
        // ── UV Transforms ──
        const baseUvNode = uv();
        const st = getTransformedUV(
            baseUvNode,
            u.u_mouseEnabled,
            u.u_mouse,
            u.u_mouseRadius,
            u.u_mouseStrength,
            u.u_mouseType,
            u.u_angle,
            u.u_offset,
            u.u_symEnabled,
            u.u_symSegments,
            u.u_symRotation,
            u.u_symZoom,
            u.u_polar,
            u.u_tilingEnabled,
            u.u_tilingScale,
            u.u_tilingOffset,
            u.u_tilingRotation,
            u.u_tilingRepeat,
            u.u_tilingMirror,
        ).toVar();

        // Pixelation
        st.assign(pixelateUV(st, u.u_pixelate, u.u_pixelDensity));

        // Glitch UV offset
        If(u.u_glitch.greaterThan(0.5), () => {
            const noise = random2d(floor(st.y.mul(20.0)).add(floor(u.u_time.mul(u.u_glitchSpeed).mul(10.0))), float(0.0));
            If(noise.greaterThan(float(1.0).sub(float(u.u_glitchStrength).mul(0.5))), () => {
                st.x.addAssign(random2d(u.u_time, float(0.0)).sub(0.5).mul(u.u_glitchStrength).mul(0.2));
            });
        });

        // ── Pattern Generation ──
        const n = tslClamp(float(mainFn(st, u)), 0.0, 1.0).toVar();

        // ── Blending Layer ──
        If(u.u_blendEnabled.greaterThan(0.5), () => {
            const blendType = state.blending.type;
            const blendFn = TSL_PATTERN_MAP[blendType];
            if (blendFn) {
                // Create blend uniforms view (swap scale/factor/intensity/seed)
                const blendU: TslUniforms = {
                    ...u,
                    u_scale: u.u_blendScale,
                    u_factor: u.u_blendFactor,
                    u_intensity: u.u_blendIntensity,
                    u_detail: u.u_blendDetail,
                    u_seed: u.u_blendSeed,
                };
                const b = tslClamp(float(blendFn(st, blendU)), 0.0, 1.0);
                n.assign(blendApply(n, b, u.u_blendMode));
            }
        });

        // ── Color Mapping ──
        const col = getPaletteColor(tslClamp(n, 0.0, 1.0), u.u_palette, u.u_paletteCount).toVar();

        // ── Base Texture ──
        if (hasBaseTexture && baseTexture) {
            const baseTexUV = vec2(baseUvNode).toVar();

            if (baseEffect === 1) {
                baseTexUV.addAssign(vec2(n, n).mul(baseEffectStrength).mul(0.1));
            }

            if (baseEffect === 4) {
                baseTexUV.addAssign(sin(baseTexUV.mul(10.0).add(n.mul(10.0))).mul(0.01).mul(baseEffectStrength));
            }

            const baseSample = texture(baseTexture, baseTexUV);
            const baseColor = vec3(baseSample.x, baseSample.y, baseSample.z);
            const blendedBase = applyBlendModeVec3(baseColor, col, baseBlendMode);
            col.assign(mix(baseColor, blendedBase, baseOpacity));
        }

        // ── Sticker Layer ──
        if (hasStickerTexture && stickerTexture) {
            const stickerUV = vec2(baseUvNode).sub(0.5).toVar();
            stickerUV.subAssign(vec2(stickerPosX, stickerPosY).mul(0.5));
            stickerUV.assign(rotate2d(-stickerRotation).mul(stickerUV));
            stickerUV.divAssign(stickerScale);
            stickerUV.addAssign(0.5);

            const stickerInBounds = step(0.0, stickerUV.x)
                .mul(step(stickerUV.x, 1.0))
                .mul(step(0.0, stickerUV.y))
                .mul(step(stickerUV.y, 1.0));

            const stickerSample = texture(stickerTexture, stickerUV);
            const stickerColor = vec3(stickerSample.x, stickerSample.y, stickerSample.z).toVar();

            if (stickerUseColor) {
                stickerColor.assign(stickerColor.mul(vec3(stickerTint.r, stickerTint.g, stickerTint.b)));
            }

            const blendedSticker = applyBlendModeVec3(col, stickerColor, stickerBlendMode);
            const stickerAlpha = stickerSample.w.mul(stickerOpacity).mul(stickerInBounds);
            col.assign(mix(col, blendedSticker, stickerAlpha));
        }

        // ── Toon Shading (pattern level) ──
        If(u.u_toon.greaterThan(0.5), () => {
            const levels = max(float(2.0), u.u_toonLevels);
            col.assign(floor(col.mul(levels)).div(levels));
        });

        // ── Lighting & Materials ──
        const normal = normalLocal.toVar();
        const viewMode = int(u.u_viewMode);

        // Normal map
        If(viewMode.equal(int(1)).or(viewMode.equal(int(3))), () => {
            const procNormal = getAccurateNormal(n, u.u_normalStrength, u.u_normalEnabled, u.u_normalInvert);
            normal.assign(normalize(normal.add(procNormal.mul(0.5))));
        });

        // PBR Render mode
        If(viewMode.equal(int(3)), () => {
            const ao = getAO(n, normal, u.u_aoEnabled, u.u_aoStrength);
            const viewDir = normalize(cameraPosition.sub(positionWorld));
            col.assign(getLitColor(col, normal, viewDir, u.u_lightDir, u.u_roughness, u.u_metalness, ao, u.u_envType, u.u_lightIntensity));

            If(u.u_holographic.greaterThan(0.5), () => {
                col.assign(getHolographicColor(col, viewDir, u.u_lightDir, normal, st, u.u_holoStrength, u.u_lightIntensity, u.u_scale));
            });

            // Saturation boost
            const lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
            const saturated = mix(vec3(lum), col, 1.25);
            col.assign(mix(col, saturated, tslClamp(lum.mul(2.0), 0.0, 1.0)));
            col.assign(acesTonemap(col));
        });

        // ── View Mode Overrides ──
        If(viewMode.equal(int(1)), () => {
            col.assign(normal.mul(0.5).add(0.5));
        });
        If(viewMode.equal(int(2)), () => {
            col.assign(vec3(n));
        });
        If(viewMode.equal(int(4)), () => {
            col.assign(vec3(uv().x, uv().y, 0.0));
        });

        // ── Post Process ──
        If(u.u_applyToMap.greaterThan(0.5).or(viewMode.equal(int(3))), () => {
            col.assign(applyScanlines(col, baseUvNode, u.u_scanlines, u.u_resolution, u.u_scanlineIntensity, u.u_crtDistortion, u.u_time));
            col.assign(applyColorBalance(col, u.u_brightness, u.u_contrast, u.u_saturation, u.u_hue, u.u_cycleSpeed, u.u_time, u.u_shadows, u.u_midtones, u.u_highlights));

            If(u.u_halftone.greaterThan(0.5), () => {
                col.assign(applyHalftone(col, baseUvNode, u.u_halftoneScale));
            });
            If(u.u_edgeDetect.greaterThan(0.5), () => {
                col.assign(applyEdgeDetect(col, baseUvNode, u.u_edgeColor));
            });

            col.assign(applyPostProcess(col, baseUvNode, u.u_vignette, u.u_bloomEnabled, u.u_bloomThreshold, u.u_bloomStrength, u.u_posterize, u.u_posterizeLevels));

            // Chromatic Aberration
            If(u.u_chromaticAberration.greaterThan(0.0), () => {
                col.x.mulAssign(float(1.0).add(u.u_chromaticAberration.mul(0.01)));
                col.z.mulAssign(float(1.0).sub(u.u_chromaticAberration.mul(0.01)));
            });
        });

        // ── Alpha Masking ──
        const alpha = float(1.0).toVar();
        If(u.u_alphaEnabled.greaterThan(0.5), () => {
            const lumaAlpha = dot(col, vec3(0.299, 0.587, 0.114));
            const mask = smoothstep(
                float(u.u_alphaThreshold).sub(u.u_alphaTolerance),
                float(u.u_alphaThreshold).add(u.u_alphaTolerance),
                lumaAlpha,
            );
            alpha.assign(mask);

            if (hasMaskTexture && maskTexture) {
                alpha.assign(alpha.mul(texture(maskTexture, baseUvNode).x));
            }
        });

        return vec4(tslClamp(col, 0.0, 1.0), alpha);
    });

    const result = fragmentFn();
    return {
        colorNode: vec3(result.x, result.y, result.z),
        opacityNode: result.w,
    };
}

// ─── Material Factory ───

/**
 * Create a MeshBasicNodeMaterial with the full TSL pipeline.
 * Returns { material, uniforms } for per-frame updates.
 */
export function createTslMaterial(state: AppState, textures: TslTextureInputs = {}): {
    material: InstanceType<typeof MeshBasicNodeMaterial>;
    uniforms: TslUniforms;
} {
    const u = createTslUniforms(state);
    const { colorNode, opacityNode } = buildFragmentGraph(u, state, textures);

    const material = new MeshBasicNodeMaterial();
    material.colorNode = colorNode;
    material.opacityNode = opacityNode;
    material.transparent = true;
    material.side = THREE.DoubleSide;
    material.depthWrite = true;
    material.depthTest = true;
    material.fog = false;

    return { material, uniforms: u };
}
