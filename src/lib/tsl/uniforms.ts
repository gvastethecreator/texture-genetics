/**
 * TSL Uniform System
 * Creates and manages uniform nodes for the material pipeline.
 * Each call to createTslUniforms() produces an independent set (safe for offscreen).
 */
import * as THREE from 'three';
import { uniform, uniformArray } from 'three/tsl';
import type UniformNode from 'three/src/nodes/core/UniformNode.js';
import type UniformArrayNode from 'three/src/nodes/accessors/UniformArrayNode.js';
import { AppState, TextureType } from '../../core/types/types';

// Shorthand types for typed uniform nodes
type UFloat = UniformNode<'float', number>;
type UVec2 = UniformNode<'vec2', THREE.Vector2>;
type UVec3 = UniformNode<'vec3', THREE.Vector3> | UniformNode<'color', THREE.Color>;
type UColor = UniformNode<'color', THREE.Color>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UPalette = UniformArrayNode<any>;

/** All TSL uniform nodes for one material instance */
export interface TslUniforms {
    // Time & Global
    u_time: UFloat;
    u_resolution: UVec2;
    u_viewMode: UFloat;

    // Pattern Params
    u_scale: UFloat;
    u_intensity: UFloat;
    u_speed: UFloat;
    u_factor: UFloat;
    u_distortion: UFloat;
    u_detail: UFloat;
    u_seed: UFloat;

    // Extra p1–p15
    u_p1: UFloat;
    u_p2: UFloat;
    u_p3: UFloat;
    u_p4: UFloat;
    u_p5: UFloat;
    u_p6: UFloat;
    u_p7: UFloat;
    u_p8: UFloat;
    u_p9: UFloat;
    u_p10: UFloat;
    u_p11: UFloat;
    u_p12: UFloat;
    u_p13: UFloat;
    u_p14: UFloat;
    u_p15: UFloat;

    // Legacy color
    u_color1: UColor;
    u_color2: UColor;

    // Palette
    u_palette: UPalette;
    u_paletteCount: UFloat;

    // Blending
    u_blendEnabled: UFloat;
    u_blendMode: UFloat;
    u_blendOpacity: UFloat;
    u_blendScale: UFloat;
    u_blendFactor: UFloat;
    u_blendIntensity: UFloat;
    u_blendDetail: UFloat;
    u_blendSeed: UFloat;

    // Transforms
    u_angle: UFloat;
    u_offset: UVec2;

    // Symmetry
    u_symEnabled: UFloat;
    u_symSegments: UFloat;
    u_symRotation: UFloat;
    u_symZoom: UFloat;

    // Tiling
    u_tilingEnabled: UFloat;
    u_tilingMirror: UFloat;
    u_tilingRepeat: UVec2;
    u_tilingOffset: UVec2;
    u_tilingRotation: UFloat;
    u_tilingScale: UFloat;

    // Post-Process
    u_applyToMap: UFloat;
    u_polar: UFloat;
    u_toon: UFloat;
    u_toonLevels: UFloat;
    u_posterize: UFloat;
    u_posterizeLevels: UFloat;
    u_chromaticAberration: UFloat;
    u_radialMask: UFloat;
    u_vignette: UFloat;
    u_bloomEnabled: UFloat;
    u_bloomThreshold: UFloat;
    u_bloomStrength: UFloat;
    u_blurEnabled: UFloat;
    u_blurStrength: UFloat;
    u_normalize: UFloat;
    u_glitch: UFloat;
    u_glitchStrength: UFloat;
    u_glitchSpeed: UFloat;
    u_pixelate: UFloat;
    u_pixelDensity: UFloat;
    u_scanlines: UFloat;
    u_scanlineIntensity: UFloat;
    u_crtDistortion: UFloat;
    u_halftone: UFloat;
    u_halftoneScale: UFloat;
    u_edgeDetect: UFloat;
    u_edgeColor: UColor;

    // Normal Map
    u_normalEnabled: UFloat;
    u_normalStrength: UFloat;
    u_normalInvert: UFloat;
    u_normalSmoothness: UFloat;

    // Displacement
    u_dispStrength: UFloat;
    u_dispBias: UFloat;

    // AO
    u_aoEnabled: UFloat;
    u_aoStrength: UFloat;
    u_aoRadius: UFloat;

    // Color Balance
    u_shadows: UColor;
    u_midtones: UColor;
    u_highlights: UColor;
    u_brightness: UFloat;
    u_contrast: UFloat;
    u_saturation: UFloat;
    u_hue: UFloat;
    u_cycleSpeed: UFloat;

    // Alpha & Mask
    u_alphaEnabled: UFloat;
    u_alphaThreshold: UFloat;
    u_alphaTolerance: UFloat;
    u_alphaBlur: UFloat;
    u_maskEnabled: UFloat;

    // Mouse
    u_mouse: UVec2;
    u_mouseType: UFloat;
    u_mouseStrength: UFloat;
    u_mouseRadius: UFloat;
    u_mouseEnabled: UFloat;

    // Environment
    u_lightDir: UVec3;
    u_lightIntensity: UFloat;
    u_roughness: UFloat;
    u_metalness: UFloat;
    u_envType: UFloat;
    u_holographic: UFloat;
    u_holoStrength: UFloat;
    u_fogEnabled: UFloat;
    u_fogDensity: UFloat;
    u_fogColor: UColor;
    u_isUVDebug: UFloat;
}

function hexToVec3(hex: string): THREE.Color {
    return new THREE.Color(hex);
}

const FOG_COLORS = {
    0: new THREE.Color('#111111'),
    1: new THREE.Color('#331a1a'),
    2: new THREE.Color('#020205'),
    3: new THREE.Color('#4a4036'),
};

const getFogColor = (state: AppState): THREE.Color => {
    const manualFogColor = state.environment?.fogColor;
    if (manualFogColor) return new THREE.Color(manualFogColor);

    const type = (state.environment?.envType ?? 0) as 0 | 1 | 2 | 3;
    return FOG_COLORS[type] ?? FOG_COLORS[0];
};

function getActivePalette(state: AppState) {
    const palette = state.params.palette?.length
        ? state.params.palette
        : [
            { color: state.params.color1 || '#ffffff', enabled: true },
            { color: state.params.color2 || '#000000', enabled: true },
        ];

    const activeColors = palette.filter(entry => entry.enabled);
    if (activeColors.length === 0) {
        return [
            { color: '#ffffff', enabled: true },
            { color: '#000000', enabled: true },
        ];
    }

    return activeColors;
}

function buildPaletteArray(state: AppState): THREE.Color[] {
    const colors = getActivePalette(state).map(entry => new THREE.Color(entry.color));
    // Pad to 8 with black
    while (colors.length < 8) colors.push(new THREE.Color(0x000000));
    return colors.slice(0, 8);
}

/** Create a fresh set of TSL uniform nodes from app state */
export function createTslUniforms(state: AppState): TslUniforms {
    const paletteColors = buildPaletteArray(state);
    const enabledCount = getActivePalette(state).length;

    return {
        // Time & Global
        u_time: uniform(0),
        u_resolution: uniform(new THREE.Vector2(1024, 1024)),
        u_viewMode: uniform(state.viewMode ?? 0),

        // Pattern
        u_scale: uniform(Math.max(0.001, state.params.scale)),
        u_intensity: uniform(state.params.intensity),
        u_speed: uniform(state.params.speed),
        u_factor: uniform(state.params.factor),
        u_distortion: uniform(state.params.distortion),
        u_detail: uniform(state.params.detail),
        u_seed: uniform(state.params.seed),

        // Extra
        u_p1: uniform(state.params.p1),
        u_p2: uniform(state.params.p2),
        u_p3: uniform(state.params.p3),
        u_p4: uniform(state.params.p4),
        u_p5: uniform(state.params.p5),
        u_p6: uniform(state.params.p6),
        u_p7: uniform(state.params.p7),
        u_p8: uniform(state.params.p8),
        u_p9: uniform(state.params.p9),
        u_p10: uniform(state.params.p10),
        u_p11: uniform(state.params.p11),
        u_p12: uniform(state.params.p12),
        u_p13: uniform(state.params.p13),
        u_p14: uniform(state.params.p14),
        u_p15: uniform(state.params.p15),

        // Legacy
        u_color1: uniform(hexToVec3(state.params.color1)),
        u_color2: uniform(hexToVec3(state.params.color2)),

        // Palette
        u_palette: uniformArray(paletteColors, 'color'),
        u_paletteCount: uniform(Math.max(1, enabledCount)),

        // Blending
        u_blendEnabled: uniform(state.blending.enabled ? 1 : 0),
        u_blendMode: uniform(state.blending.mode),
        u_blendOpacity: uniform(state.blending.opacity),
        u_blendScale: uniform(Math.max(0.001, state.blending.scale)),
        u_blendFactor: uniform(state.blending.factor),
        u_blendIntensity: uniform(state.blending.intensity),
        u_blendDetail: uniform(state.blending.factor),
        u_blendSeed: uniform(state.params.seed + 100.0),

        // Transforms
        u_angle: uniform((state.transform?.angle ?? 0) * (Math.PI / 180)),
        u_offset: uniform(new THREE.Vector2(state.transform?.offsetX ?? 0, state.transform?.offsetY ?? 0)),

        // Symmetry
        u_symEnabled: uniform(state.symmetry?.enabled ? 1 : 0),
        u_symSegments: uniform(state.symmetry?.segments ?? 6),
        u_symRotation: uniform((state.symmetry?.rotation ?? 0) * (Math.PI / 180)),
        u_symZoom: uniform(Math.max(0.01, state.symmetry?.zoom ?? 1)),

        // Tiling
        u_tilingEnabled: uniform(state.tiling?.enabled ? 1 : 0),
        u_tilingMirror: uniform(state.tiling?.mirror ? 1 : 0),
        u_tilingRepeat: uniform(new THREE.Vector2(state.tiling?.repeatX ?? 1, state.tiling?.repeatY ?? 1)),
        u_tilingOffset: uniform(new THREE.Vector2(state.tiling?.offsetX ?? 0, state.tiling?.offsetY ?? 0)),
        u_tilingRotation: uniform((state.tiling?.rotation ?? 0) * (Math.PI / 180)),
        u_tilingScale: uniform(Math.max(0.01, state.tiling?.scale ?? 1)),

        // Post-Process
        u_applyToMap: uniform(state.postProcess?.applyToMap ? 1 : 0),
        u_polar: uniform(state.postProcess?.polar ? 1 : 0),
        u_toon: uniform(state.postProcess?.toon ? 1 : 0),
        u_toonLevels: uniform(state.postProcess?.toonLevels ?? 4),
        u_posterize: uniform(state.postProcess?.posterize ? 1 : 0),
        u_posterizeLevels: uniform(state.postProcess?.posterizeLevels ?? 4),
        u_chromaticAberration: uniform(state.postProcess?.chromaticAberration ?? 0),
        u_radialMask: uniform(state.postProcess?.radialMask ?? 0),
        u_vignette: uniform(state.postProcess?.vignette ?? 0),
        u_bloomEnabled: uniform(state.postProcess?.bloom ? 1 : 0),
        u_bloomThreshold: uniform(state.postProcess?.bloomThreshold ?? 0.8),
        u_bloomStrength: uniform(state.postProcess?.bloomStrength ?? 0.5),
        u_blurEnabled: uniform(state.postProcess?.blur ? 1 : 0),
        u_blurStrength: uniform(state.postProcess?.blurStrength ?? 0.5),
        u_normalize: uniform(state.postProcess?.normalize ? 1 : 0),
        u_glitch: uniform(state.postProcess?.glitch ? 1 : 0),
        u_glitchStrength: uniform(state.postProcess?.glitchStrength ?? 0),
        u_glitchSpeed: uniform(state.postProcess?.glitchSpeed ?? 1),
        u_pixelate: uniform(state.postProcess?.pixelate ? 1 : 0),
        u_pixelDensity: uniform(state.postProcess?.pixelDensity ?? 100),
        u_scanlines: uniform(state.postProcess?.scanlines ? 1 : 0),
        u_scanlineIntensity: uniform(state.postProcess?.scanlineIntensity ?? 0.5),
        u_crtDistortion: uniform(state.postProcess?.crtDistortion ?? 0),
        u_halftone: uniform(state.postProcess?.halftone ? 1 : 0),
        u_halftoneScale: uniform(state.postProcess?.halftoneScale ?? 1),
        u_edgeDetect: uniform(state.postProcess?.edgeDetect ? 1 : 0),
        u_edgeColor: uniform(new THREE.Color(state.postProcess?.edgeColor ?? '#ffffff')),

        // Normal Map
        u_normalEnabled: uniform(state.normalMap?.enabled ? 1 : 0),
        u_normalStrength: uniform(state.normalMap?.strength ?? 1),
        u_normalInvert: uniform(state.normalMap?.invert ? 1 : 0),
        u_normalSmoothness: uniform(state.normalMap?.smoothness ?? 0.5),

        // Displacement
        u_dispStrength: uniform(state.displacement?.strength ?? 0),
        u_dispBias: uniform(state.displacement?.bias ?? 0),

        // AO
        u_aoEnabled: uniform(state.ao?.enabled ? 1 : 0),
        u_aoStrength: uniform(state.ao?.strength ?? 0.5),
        u_aoRadius: uniform(state.ao?.radius ?? 0.5),

        // Color Balance
        u_shadows: uniform(new THREE.Color(state.colorBalance?.shadows?.r ?? 0.5, state.colorBalance?.shadows?.g ?? 0.5, state.colorBalance?.shadows?.b ?? 0.5)),
        u_midtones: uniform(new THREE.Color(state.colorBalance?.midtones?.r ?? 0.5, state.colorBalance?.midtones?.g ?? 0.5, state.colorBalance?.midtones?.b ?? 0.5)),
        u_highlights: uniform(new THREE.Color(state.colorBalance?.highlights?.r ?? 0.5, state.colorBalance?.highlights?.g ?? 0.5, state.colorBalance?.highlights?.b ?? 0.5)),
        u_brightness: uniform(state.colorBalance?.brightness ?? 0),
        u_contrast: uniform(state.colorBalance?.contrast ?? 0),
        u_saturation: uniform(state.colorBalance?.saturation ?? 0),
        u_hue: uniform(state.colorBalance?.hue ?? 0),
        u_cycleSpeed: uniform(state.colorBalance?.cycleSpeed ?? 0),

        // Alpha
        u_alphaEnabled: uniform(state.imageAlpha?.enabled ? 1 : 0),
        u_alphaThreshold: uniform(state.imageAlpha?.threshold ?? 0.5),
        u_alphaTolerance: uniform(state.imageAlpha?.tolerance ?? 0.1),
        u_alphaBlur: uniform(state.imageAlpha?.blur ?? 0),
        u_maskEnabled: uniform(state.imageAlpha?.maskEnabled ? 1 : 0),

        // Mouse
        u_mouse: uniform(new THREE.Vector2(0, 0)),
        u_mouseType: uniform(state.mouse?.type ?? 0),
        u_mouseStrength: uniform(state.mouse?.strength ?? 0.5),
        u_mouseRadius: uniform(state.mouse?.radius ?? 0.2),
        u_mouseEnabled: uniform(state.mouse?.enabled ? 1 : 0),

        // Environment
        u_lightDir: uniform(new THREE.Vector3(state.environment?.lightX ?? 0.5, state.environment?.lightY ?? 1, 1.0)),
        u_lightIntensity: uniform(state.environment?.lightIntensity ?? 1),
        u_roughness: uniform(state.environment?.roughness ?? 0.5),
        u_metalness: uniform(state.environment?.metalness ?? 0),
        u_envType: uniform(state.environment?.envType ?? 0),
        u_holographic: uniform(state.environment?.holographic ? 1 : 0),
        u_holoStrength: uniform(state.environment?.holoStrength ?? 0.5),
        u_fogEnabled: uniform(state.environment?.fogEnabled ? 1 : 0),
        u_fogDensity: uniform(state.environment?.fogDensity ?? 0),
        u_fogColor: uniform(getFogColor(state)),
        u_isUVDebug: uniform(state.textureType === TextureType.UV_DEBUG ? 1 : 0),
    };
}

/** Update pattern-related uniform values (call on state change) */
export function updateTslUniforms(u: TslUniforms, state: AppState): void {
    u.u_scale.value = Math.max(0.001, state.params.scale);
    u.u_intensity.value = state.params.intensity;
    u.u_speed.value = state.params.speed;
    u.u_factor.value = state.params.factor;
    u.u_distortion.value = state.params.distortion;
    u.u_detail.value = state.params.detail;
    u.u_seed.value = state.params.seed;

    u.u_p1.value = state.params.p1;
    u.u_p2.value = state.params.p2;
    u.u_p3.value = state.params.p3;
    u.u_p4.value = state.params.p4;
    u.u_p5.value = state.params.p5;
    u.u_p6.value = state.params.p6;
    u.u_p7.value = state.params.p7;
    u.u_p8.value = state.params.p8;
    u.u_p9.value = state.params.p9;
    u.u_p10.value = state.params.p10;
    u.u_p11.value = state.params.p11;
    u.u_p12.value = state.params.p12;
    u.u_p13.value = state.params.p13;
    u.u_p14.value = state.params.p14;
    u.u_p15.value = state.params.p15;

    // Palette
    const paletteColors = buildPaletteArray(state);
    u.u_palette.array = paletteColors;
    u.u_paletteCount.value = getActivePalette(state).length;

    (u.u_color1.value as THREE.Color).set(state.params.color1);
    (u.u_color2.value as THREE.Color).set(state.params.color2);

    // Blending
    u.u_blendEnabled.value = state.blending.enabled ? 1 : 0;
    u.u_blendMode.value = state.blending.mode;
    u.u_blendOpacity.value = state.blending.opacity;
    u.u_blendScale.value = Math.max(0.001, state.blending.scale);
    u.u_blendFactor.value = state.blending.factor;
    u.u_blendIntensity.value = state.blending.intensity;
    u.u_blendDetail.value = state.blending.factor;
    u.u_blendSeed.value = state.params.seed + 100.0;

    // Transforms
    u.u_angle.value = (state.transform?.angle ?? 0) * (Math.PI / 180);
    (u.u_offset.value as THREE.Vector2).set(state.transform?.offsetX ?? 0, state.transform?.offsetY ?? 0);
    u.u_symEnabled.value = state.symmetry?.enabled ? 1 : 0;
    u.u_symSegments.value = state.symmetry?.segments ?? 6;
    u.u_symRotation.value = (state.symmetry?.rotation ?? 0) * (Math.PI / 180);
    u.u_symZoom.value = Math.max(0.01, state.symmetry?.zoom ?? 1);
    u.u_tilingEnabled.value = state.tiling?.enabled ? 1 : 0;
    u.u_tilingMirror.value = state.tiling?.mirror ? 1 : 0;
    (u.u_tilingRepeat.value as THREE.Vector2).set(state.tiling?.repeatX ?? 1, state.tiling?.repeatY ?? 1);
    (u.u_tilingOffset.value as THREE.Vector2).set(state.tiling?.offsetX ?? 0, state.tiling?.offsetY ?? 0);
    u.u_tilingRotation.value = (state.tiling?.rotation ?? 0) * (Math.PI / 180);
    u.u_tilingScale.value = Math.max(0.01, state.tiling?.scale ?? 1);

    // Post-process
    u.u_applyToMap.value = state.postProcess?.applyToMap ? 1 : 0;
    u.u_polar.value = state.postProcess?.polar ? 1 : 0;
    u.u_toon.value = state.postProcess?.toon ? 1 : 0;
    u.u_toonLevels.value = state.postProcess?.toonLevels ?? 4;
    u.u_posterize.value = state.postProcess?.posterize ? 1 : 0;
    u.u_posterizeLevels.value = state.postProcess?.posterizeLevels ?? 4;
    u.u_chromaticAberration.value = state.postProcess?.chromaticAberration ?? 0;
    u.u_radialMask.value = state.postProcess?.radialMask ?? 0;
    u.u_vignette.value = state.postProcess?.vignette ?? 0;
    u.u_bloomEnabled.value = state.postProcess?.bloom ? 1 : 0;
    u.u_bloomThreshold.value = state.postProcess?.bloomThreshold ?? 0.8;
    u.u_bloomStrength.value = state.postProcess?.bloomStrength ?? 0.5;
    u.u_blurEnabled.value = state.postProcess?.blur ? 1 : 0;
    u.u_blurStrength.value = state.postProcess?.blurStrength ?? 0.5;
    u.u_normalize.value = state.postProcess?.normalize ? 1 : 0;
    u.u_glitch.value = state.postProcess?.glitch ? 1 : 0;
    u.u_glitchStrength.value = state.postProcess?.glitchStrength ?? 0;
    u.u_glitchSpeed.value = state.postProcess?.glitchSpeed ?? 1;
    u.u_pixelate.value = state.postProcess?.pixelate ? 1 : 0;
    u.u_pixelDensity.value = state.postProcess?.pixelDensity ?? 100;
    u.u_scanlines.value = state.postProcess?.scanlines ? 1 : 0;
    u.u_scanlineIntensity.value = state.postProcess?.scanlineIntensity ?? 0.5;
    u.u_crtDistortion.value = state.postProcess?.crtDistortion ?? 0;
    u.u_halftone.value = state.postProcess?.halftone ? 1 : 0;
    u.u_halftoneScale.value = state.postProcess?.halftoneScale ?? 1;
    u.u_edgeDetect.value = state.postProcess?.edgeDetect ? 1 : 0;
    (u.u_edgeColor.value as THREE.Color).set(state.postProcess?.edgeColor ?? '#ffffff');

    // Material
    u.u_normalEnabled.value = state.normalMap?.enabled ? 1 : 0;
    u.u_normalStrength.value = state.normalMap?.strength ?? 1;
    u.u_normalInvert.value = state.normalMap?.invert ? 1 : 0;
    u.u_normalSmoothness.value = state.normalMap?.smoothness ?? 0.5;
    u.u_dispStrength.value = state.displacement?.strength ?? 0;
    u.u_dispBias.value = state.displacement?.bias ?? 0;
    u.u_aoEnabled.value = state.ao?.enabled ? 1 : 0;
    u.u_aoStrength.value = state.ao?.strength ?? 0.5;
    u.u_aoRadius.value = state.ao?.radius ?? 0.5;

    // Color balance
    (u.u_shadows.value as THREE.Color).setRGB(state.colorBalance?.shadows?.r ?? 0.5, state.colorBalance?.shadows?.g ?? 0.5, state.colorBalance?.shadows?.b ?? 0.5);
    (u.u_midtones.value as THREE.Color).setRGB(state.colorBalance?.midtones?.r ?? 0.5, state.colorBalance?.midtones?.g ?? 0.5, state.colorBalance?.midtones?.b ?? 0.5);
    (u.u_highlights.value as THREE.Color).setRGB(state.colorBalance?.highlights?.r ?? 0.5, state.colorBalance?.highlights?.g ?? 0.5, state.colorBalance?.highlights?.b ?? 0.5);
    u.u_brightness.value = state.colorBalance?.brightness ?? 0;
    u.u_contrast.value = state.colorBalance?.contrast ?? 0;
    u.u_saturation.value = state.colorBalance?.saturation ?? 0;
    u.u_hue.value = state.colorBalance?.hue ?? 0;
    u.u_cycleSpeed.value = state.colorBalance?.cycleSpeed ?? 0;

    // Alpha and mouse
    u.u_alphaEnabled.value = state.imageAlpha?.enabled ? 1 : 0;
    u.u_alphaThreshold.value = state.imageAlpha?.threshold ?? 0.5;
    u.u_alphaTolerance.value = state.imageAlpha?.tolerance ?? 0.1;
    u.u_alphaBlur.value = state.imageAlpha?.blur ?? 0;
    u.u_maskEnabled.value = state.imageAlpha?.maskEnabled ? 1 : 0;
    u.u_mouseEnabled.value = state.mouse?.enabled ? 1 : 0;
    u.u_mouseType.value = state.mouse?.type ?? 0;
    u.u_mouseStrength.value = state.mouse?.strength ?? 0.5;
    u.u_mouseRadius.value = state.mouse?.radius ?? 0.2;

    // Environment
    (u.u_lightDir.value as THREE.Vector3).set(state.environment?.lightX ?? 0.5, state.environment?.lightY ?? 1, 1.0);
    u.u_lightIntensity.value = state.environment?.lightIntensity ?? 1;
    u.u_roughness.value = state.environment?.roughness ?? 0.5;
    u.u_metalness.value = state.environment?.metalness ?? 0;
    u.u_envType.value = state.environment?.envType ?? 0;
    u.u_holographic.value = state.environment?.holographic ? 1 : 0;
    u.u_holoStrength.value = state.environment?.holoStrength ?? 0.5;
    u.u_fogEnabled.value = state.environment?.fogEnabled ? 1 : 0;
    u.u_fogDensity.value = state.environment?.fogDensity ?? 0;
    (u.u_fogColor.value as THREE.Color).copy(getFogColor(state));

    // View
    u.u_viewMode.value = state.viewMode ?? 0;
    u.u_isUVDebug.value = state.textureType === TextureType.UV_DEBUG ? 1 : 0;
}
