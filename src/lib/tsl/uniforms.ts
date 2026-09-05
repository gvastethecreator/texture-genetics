/**
 * TSL Uniform System
 * Creates and manages uniform nodes for the material pipeline.
 * Each call to createTslUniforms() produces an independent set (safe for offscreen).
 */
import * as THREE from "three";
import { uniform, uniformArray } from "three/tsl";
import type UniformNode from "three/src/nodes/core/UniformNode.js";
import type UniformArrayNode from "three/src/nodes/accessors/UniformArrayNode.js";
import { AppState, TextureType } from "../../core/types/types";
import {
  applyRendererUniformProjection,
  projectFogColor,
  projectRendererUniforms,
  type RendererUniformDomain,
} from "../rendering/stateProjection";

// Shorthand types for typed uniform nodes
type UFloat = UniformNode<"float", number>;
type UVec2 = UniformNode<"vec2", THREE.Vector2>;
type UVec3 = UniformNode<"vec3", THREE.Vector3> | UniformNode<"color", THREE.Color>;
type UColor = UniformNode<"color", THREE.Color>;
type UPalette = UniformArrayNode<"color">;

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

  // Sticker
  u_stickerEnabled: UFloat;
  u_stickerOpacity: UFloat;
  u_stickerBlendMode: UFloat;
  u_stickerPos: UVec2;
  u_stickerScale: UFloat;
  u_stickerRot: UFloat;
  u_stickerColor: UColor;
  u_stickerUseColor: UFloat;

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

const getFogColor = (state: AppState): THREE.Color => new THREE.Color(projectFogColor(state));

function getActivePalette(state: AppState) {
  const palette = state.params.palette?.length
    ? state.params.palette
    : [
        { color: state.params.color1 || "#ffffff", enabled: true },
        { color: state.params.color2 || "#000000", enabled: true },
      ];

  const activeColors = palette.filter((entry) => entry.enabled);
  if (activeColors.length === 0) {
    return [
      { color: "#ffffff", enabled: true },
      { color: "#000000", enabled: true },
    ];
  }

  return activeColors;
}

function buildPaletteArray(state: AppState): THREE.Color[] {
  const colors = getActivePalette(state).map((entry) => new THREE.Color(entry.color));
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
    u_palette: uniformArray(paletteColors, "color"),
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
    u_offset: uniform(
      new THREE.Vector2(state.transform?.offsetX ?? 0, state.transform?.offsetY ?? 0),
    ),

    // Symmetry
    u_symEnabled: uniform(state.symmetry?.enabled ? 1 : 0),
    u_symSegments: uniform(state.symmetry?.segments ?? 6),
    u_symRotation: uniform((state.symmetry?.rotation ?? 0) * (Math.PI / 180)),
    u_symZoom: uniform(Math.max(0.01, state.symmetry?.zoom ?? 1)),

    // Tiling
    u_tilingEnabled: uniform(state.tiling?.enabled ? 1 : 0),
    u_tilingMirror: uniform(state.tiling?.mirror ? 1 : 0),
    u_tilingRepeat: uniform(
      new THREE.Vector2(state.tiling?.repeatX ?? 1, state.tiling?.repeatY ?? 1),
    ),
    u_tilingOffset: uniform(
      new THREE.Vector2(state.tiling?.offsetX ?? 0, state.tiling?.offsetY ?? 0),
    ),
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
    u_edgeColor: uniform(new THREE.Color(state.postProcess?.edgeColor ?? "#ffffff")),

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
    u_shadows: uniform(
      new THREE.Color(
        state.colorBalance?.shadows?.r ?? 0.5,
        state.colorBalance?.shadows?.g ?? 0.5,
        state.colorBalance?.shadows?.b ?? 0.5,
      ),
    ),
    u_midtones: uniform(
      new THREE.Color(
        state.colorBalance?.midtones?.r ?? 0.5,
        state.colorBalance?.midtones?.g ?? 0.5,
        state.colorBalance?.midtones?.b ?? 0.5,
      ),
    ),
    u_highlights: uniform(
      new THREE.Color(
        state.colorBalance?.highlights?.r ?? 0.5,
        state.colorBalance?.highlights?.g ?? 0.5,
        state.colorBalance?.highlights?.b ?? 0.5,
      ),
    ),
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

    u_stickerEnabled: uniform(state.sticker.enabled ? 1 : 0),
    u_stickerOpacity: uniform(state.sticker.opacity),
    u_stickerBlendMode: uniform(state.sticker.blendMode),
    u_stickerPos: uniform(new THREE.Vector2(state.sticker.posX, state.sticker.posY)),
    u_stickerScale: uniform(Math.max(0.01, state.sticker.scale)),
    u_stickerRot: uniform(state.sticker.rotation * (Math.PI / 180)),
    u_stickerColor: uniform(new THREE.Color(state.sticker.color || "#ffffff")),
    u_stickerUseColor: uniform(state.sticker.useColor ? 1 : 0),

    // Environment
    u_lightDir: uniform(
      new THREE.Vector3(state.environment?.lightX ?? 0.5, state.environment?.lightY ?? 1, 1.0),
    ),
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

export type TslUniformDomain = RendererUniformDomain;

const ALL_UNIFORM_DOMAINS: readonly TslUniformDomain[] = [
  "core",
  "pattern",
  "transform",
  "post-process",
  "material",
  "color",
  "interaction",
  "environment",
];

/** Update only the requested renderer domains; defaults to a full offscreen/export sync. */
export function updateTslUniforms(
  u: TslUniforms,
  state: AppState,
  domains: readonly TslUniformDomain[] = ALL_UNIFORM_DOMAINS,
): void {
  applyRendererUniformProjection(
    u as unknown as Record<string, { value?: unknown; array?: unknown }>,
    projectRendererUniforms(state),
    domains,
  );
}
