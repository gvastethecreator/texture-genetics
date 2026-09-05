import * as THREE from "three";
import { AppState, TextureType, BaseEffectType } from "../../core/types/types";
import {
  applyRendererUniformProjection,
  projectFogColor,
  projectRendererUniforms,
} from "../rendering/stateProjection";

// GLOBAL EMPTY TEXTURE (Prevent WebGL warnings/crashes on null textures)
// Explicitly configured for compatibility
const emptyTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
emptyTexture.format = THREE.RGBAFormat;
emptyTexture.type = THREE.UnsignedByteType;
emptyTexture.minFilter = THREE.NearestFilter;
emptyTexture.magFilter = THREE.NearestFilter;
emptyTexture.needsUpdate = true;

const getFogColor = (state: AppState): THREE.Color => new THREE.Color(projectFogColor(state));

// --- INITIALIZATION HELPERS ---

const getBlendingUniforms = (state: AppState) => ({
  u_blendEnabled: { value: state.blending.enabled },
  u_blendMode: { value: state.blending.mode },
  u_blendOpacity: { value: state.blending.opacity },
  u_blendScale: { value: Math.max(0.001, state.blending.scale) },
  u_blendFactor: { value: state.blending.factor },
  u_blendIntensity: { value: state.blending.intensity },
  u_blendDetail: { value: state.blending.factor },
  u_blendSeed: { value: state.params.seed + 100.0 },
});

const getTransformUniforms = (state: AppState) => ({
  u_angle: { value: state.transform.angle * (Math.PI / 180) },
  u_offset: { value: new THREE.Vector2(state.transform.offsetX, state.transform.offsetY) },

  // Symmetry
  u_symEnabled: { value: state.symmetry.enabled },
  u_symSegments: { value: state.symmetry.segments },
  u_symRotation: { value: state.symmetry.rotation * (Math.PI / 180) },
  u_symZoom: { value: Math.max(0.01, state.symmetry.zoom) },

  // Tiling
  u_tilingEnabled: { value: state.tiling.enabled },
  u_tilingMirror: { value: state.tiling.mirror },
  u_tilingRepeat: { value: new THREE.Vector2(state.tiling.repeatX, state.tiling.repeatY) },
  u_tilingOffset: { value: new THREE.Vector2(state.tiling.offsetX, state.tiling.offsetY) },
  u_tilingRotation: { value: state.tiling.rotation * (Math.PI / 180) },
  u_tilingScale: { value: Math.max(0.01, state.tiling.scale) },
});

const getPostProcessUniforms = (state: AppState) => ({
  u_applyToMap: { value: state.postProcess.applyToMap },
  u_polar: { value: state.postProcess.polar },
  u_toon: { value: state.postProcess.toon },
  u_toonLevels: { value: state.postProcess.toonLevels },
  u_posterize: { value: state.postProcess.posterize },
  u_posterizeLevels: { value: state.postProcess.posterizeLevels },
  u_chromaticAberration: { value: state.postProcess.chromaticAberration },
  u_radialMask: { value: state.postProcess.radialMask },
  u_vignette: { value: state.postProcess.vignette },
  u_bloomEnabled: { value: state.postProcess.bloom },
  u_bloomThreshold: { value: state.postProcess.bloomThreshold },
  u_bloomStrength: { value: state.postProcess.bloomStrength },
  u_blurEnabled: { value: state.postProcess.blur },
  u_blurStrength: { value: state.postProcess.blurStrength },
  u_normalize: { value: state.postProcess.normalize },
  u_glitch: { value: state.postProcess.glitch },
  u_glitchStrength: { value: state.postProcess.glitchStrength },
  u_glitchSpeed: { value: state.postProcess.glitchSpeed },

  // Retro FX
  u_pixelate: { value: state.postProcess.pixelate },
  u_pixelDensity: { value: state.postProcess.pixelDensity },
  u_scanlines: { value: state.postProcess.scanlines },
  u_scanlineIntensity: { value: state.postProcess.scanlineIntensity },
  u_crtDistortion: { value: state.postProcess.crtDistortion },

  // New FX
  u_halftone: { value: state.postProcess.halftone },
  u_halftoneScale: { value: state.postProcess.halftoneScale },
  u_edgeDetect: { value: state.postProcess.edgeDetect },
  u_edgeColor: { value: new THREE.Color(state.postProcess.edgeColor) },
});

const getMaterialUniforms = (state: AppState) => ({
  u_normalEnabled: { value: state.normalMap.enabled },
  u_normalStrength: { value: state.normalMap.strength },
  u_normalInvert: { value: state.normalMap.invert },
  u_normalSmoothness: { value: state.normalMap.smoothness },
  u_dispStrength: { value: state.displacement.strength },
  u_dispBias: { value: state.displacement.bias },
  u_aoEnabled: { value: state.ao.enabled },
  u_aoStrength: { value: state.ao.strength },
  u_aoRadius: { value: state.ao.radius },
});

const getColorBalanceUniforms = (state: AppState) => ({
  u_shadows: {
    value: new THREE.Vector3(
      state.colorBalance.shadows.r,
      state.colorBalance.shadows.g,
      state.colorBalance.shadows.b,
    ),
  },
  u_midtones: {
    value: new THREE.Vector3(
      state.colorBalance.midtones.r,
      state.colorBalance.midtones.g,
      state.colorBalance.midtones.b,
    ),
  },
  u_highlights: {
    value: new THREE.Vector3(
      state.colorBalance.highlights.r,
      state.colorBalance.highlights.g,
      state.colorBalance.highlights.b,
    ),
  },
  u_brightness: { value: state.colorBalance.brightness },
  u_contrast: { value: state.colorBalance.contrast },
  u_saturation: { value: state.colorBalance.saturation },
  u_hue: { value: state.colorBalance.hue },
  u_cycleSpeed: { value: state.colorBalance.cycleSpeed },
});

const getEnvironmentUniforms = (state: AppState) => ({
  u_lightDir: { value: new THREE.Vector3(state.environment.lightX, state.environment.lightY, 1.0) },
  u_lightIntensity: { value: state.environment.lightIntensity },
  u_roughness: { value: state.environment.roughness },
  u_metalness: { value: state.environment.metalness },
  u_envType: { value: state.environment.envType },
  u_holographic: { value: state.environment.holographic },
  u_holoStrength: { value: state.environment.holoStrength },
  u_fogEnabled: { value: state.environment.fogEnabled },
  u_fogDensity: { value: state.environment.fogDensity },
  u_fogColor: { value: getFogColor(state) }, // Uses Cached value
});

const getStickerUniforms = (state: AppState, stickerTexture: THREE.Texture | null) => ({
  u_stickerEnabled: { value: state.sticker.enabled && !!stickerTexture },
  u_stickerTexture: { value: stickerTexture || emptyTexture },
  u_stickerOpacity: { value: state.sticker.opacity },
  u_stickerBlendMode: { value: state.sticker.blendMode },
  u_stickerPos: { value: new THREE.Vector2(state.sticker.posX, state.sticker.posY) },
  u_stickerScale: { value: Math.max(0.01, state.sticker.scale) },
  u_stickerRot: { value: state.sticker.rotation * (Math.PI / 180) },
  u_stickerColor: { value: new THREE.Color(state.sticker.color || "#ffffff") },
  u_stickerUseColor: { value: state.sticker.useColor },
});

export const createUniformsFromState = (
  state: AppState,
  maskTexture: THREE.Texture | null = null,
  baseTexture: THREE.Texture | null = null,
  stickerTexture: THREE.Texture | null = null,
) => {
  const baseTex = state.baseTexture || {
    enabled: false,
    opacity: 1.0,
    blendMode: 0,
    effectType: BaseEffectType.NONE,
    effectStrength: 0.5,
  };

  // Fill palette if missing (Legacy support for old presets loaded without migration)
  const palette = state.params.palette || [
    { color: state.params.color1 || "#fff", enabled: true },
    { color: state.params.color2 || "#000", enabled: true },
  ];

  const activeColors = palette.filter((p) => p.enabled);
  if (activeColors.length === 0) {
    // Fallback if user disables all
    activeColors.push({ color: "#ffffff", enabled: true });
    activeColors.push({ color: "#000000", enabled: true });
  }

  const paletteUniformValue = Array.from({ length: 8 }).map((_, i) => {
    if (i < activeColors.length) {
      return new THREE.Color(activeColors[i].color);
    }
    return new THREE.Color(0x000000); // Filler
  });

  return {
    u_time: { value: state.time },
    u_resolution: { value: new THREE.Vector2(state.resolution, state.resolution) },
    u_viewMode: { value: state.viewMode },

    // Manual construction to include new palette logic
    u_scale: { value: Math.max(0.001, state.params.scale) },
    u_intensity: { value: state.params.intensity },
    u_speed: { value: state.params.speed },
    u_factor: { value: state.params.factor },
    u_distortion: { value: state.params.distortion },
    u_detail: { value: state.params.detail },
    u_seed: { value: state.params.seed },
    u_color1: { value: new THREE.Color(state.params.color1) },
    u_color2: { value: new THREE.Color(state.params.color2) },
    u_palette: { value: paletteUniformValue },
    u_paletteCount: { value: activeColors.length },

    u_p1: { value: state.params.p1 },
    u_p2: { value: state.params.p2 },
    u_p3: { value: state.params.p3 },
    u_p4: { value: state.params.p4 },
    u_p5: { value: state.params.p5 },
    u_p6: { value: state.params.p6 },
    u_p7: { value: state.params.p7 },
    u_p8: { value: state.params.p8 },
    u_p9: { value: state.params.p9 },
    u_p10: { value: state.params.p10 },
    u_p11: { value: state.params.p11 },
    u_p12: { value: state.params.p12 },
    u_p13: { value: state.params.p13 },
    u_p14: { value: state.params.p14 },
    u_p15: { value: state.params.p15 },

    ...getBlendingUniforms(state),
    ...getTransformUniforms(state),
    ...getPostProcessUniforms(state),
    ...getMaterialUniforms(state),
    ...getColorBalanceUniforms(state),
    ...getEnvironmentUniforms(state),
    ...getStickerUniforms(state, stickerTexture),

    // Alpha & Mask
    u_alphaEnabled: { value: state.imageAlpha.enabled },
    u_alphaThreshold: { value: state.imageAlpha.threshold },
    u_alphaTolerance: { value: state.imageAlpha.tolerance },
    u_alphaBlur: { value: state.imageAlpha.blur },
    u_maskEnabled: { value: state.imageAlpha.maskEnabled && !!maskTexture },
    u_maskTexture: { value: maskTexture || emptyTexture },

    // Base Texture
    u_baseEnabled: { value: baseTex.enabled && !!baseTexture },
    u_baseTexture: { value: baseTexture || emptyTexture },
    u_baseOpacity: { value: baseTex.opacity },
    u_baseBlendMode: { value: baseTex.blendMode },
    u_baseEffect: { value: baseTex.effectType || 0 },
    u_baseEffectStrength: { value: baseTex.effectStrength || 0.5 },

    // Mouse
    u_mouse: { value: new THREE.Vector2(0, 0) },
    u_mouseEnabled: { value: state.mouse.enabled },
    u_mouseType: { value: state.mouse.type },
    u_mouseStrength: { value: state.mouse.strength },
    u_mouseRadius: { value: state.mouse.radius },

    u_isUVDebug: { value: state.textureType === TextureType.UV_DEBUG },
  };
};

const updateTextureUniforms = (
  uniforms: Record<string, THREE.IUniform>,
  state: AppState,
  maskTexture: THREE.Texture | null,
  baseTexture: THREE.Texture | null,
  stickerTexture: THREE.Texture | null,
) => {
  // Alpha/Mask
  uniforms.u_alphaEnabled.value = state.imageAlpha.enabled;
  uniforms.u_alphaThreshold.value = state.imageAlpha.threshold;
  uniforms.u_alphaTolerance.value = state.imageAlpha.tolerance;
  uniforms.u_alphaBlur.value = state.imageAlpha.blur;
  uniforms.u_maskEnabled.value = state.imageAlpha.maskEnabled && !!maskTexture;
  uniforms.u_maskTexture.value = maskTexture || emptyTexture;

  // Base Texture
  const baseTex = state.baseTexture || {
    enabled: false,
    opacity: 1.0,
    blendMode: 0,
    effectType: BaseEffectType.NONE,
    effectStrength: 0.5,
  };
  uniforms.u_baseEnabled.value = baseTex.enabled && !!baseTexture;
  uniforms.u_baseTexture.value = baseTexture || emptyTexture;
  uniforms.u_baseOpacity.value = baseTex.opacity;
  uniforms.u_baseBlendMode.value = baseTex.blendMode;
  uniforms.u_baseEffect.value = baseTex.effectType || 0;
  uniforms.u_baseEffectStrength.value = baseTex.effectStrength || 0.5;

  // Sticker Layer
  uniforms.u_stickerEnabled.value = state.sticker.enabled && !!stickerTexture;
  uniforms.u_stickerTexture.value = stickerTexture || emptyTexture;
  uniforms.u_stickerOpacity.value = state.sticker.opacity;
  uniforms.u_stickerBlendMode.value = state.sticker.blendMode;
  uniforms.u_stickerPos.value.set(state.sticker.posX, state.sticker.posY);
  uniforms.u_stickerScale.value = Math.max(0.01, state.sticker.scale);
  uniforms.u_stickerRot.value = state.sticker.rotation * (Math.PI / 180);
  const stickerColor =
    state.sticker.color && typeof state.sticker.color === "string"
      ? state.sticker.color
      : "#ffffff";
  // Optimization: avoid string parsing if already match
  if (
    uniforms.u_stickerColor.value.getHexString() !== stickerColor.replace("#", "").toLowerCase()
  ) {
    uniforms.u_stickerColor.value.setStyle(stickerColor);
  }
  uniforms.u_stickerUseColor.value = state.sticker.useColor;
};

// --- MAIN ORCHESTRATOR ---
// Now acts as a composed pipeline
export const updateUniformsFromState = (
  uniforms: Record<string, THREE.IUniform>,
  state: AppState,
  maskTexture: THREE.Texture | null = null,
  baseTexture: THREE.Texture | null = null,
  stickerTexture: THREE.Texture | null = null,
) => {
  if (uniforms.u_resolution.value.x !== state.resolution) {
    uniforms.u_resolution.value.set(state.resolution, state.resolution);
  }
  applyRendererUniformProjection(uniforms, projectRendererUniforms(state));
  updateTextureUniforms(uniforms, state, maskTexture, baseTexture, stickerTexture);
};
