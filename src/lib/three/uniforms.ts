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

// --- UPDATE HELPERS (COMPOSABLE) ---

const updateCoreUniforms = (uniforms: Record<string, THREE.IUniform>, state: AppState) => {
  // Only update resolution if strictly necessary (usually overridden by useFrame for window resizing)
  // We keep this to ensure the state value is reflected if window matches state
  if (uniforms.u_resolution.value.x !== state.resolution) {
    uniforms.u_resolution.value.set(state.resolution, state.resolution);
  }
  uniforms.u_viewMode.value = state.viewMode;
  uniforms.u_isUVDebug.value = state.textureType === TextureType.UV_DEBUG;
};

const updatePatternUniforms = (uniforms: Record<string, THREE.IUniform>, state: AppState) => {
  // Palette Update Logic
  const palette = state.params.palette || [
    { color: state.params.color1 || "#fff", enabled: true },
    { color: state.params.color2 || "#000", enabled: true },
  ];

  const activeColors = palette.filter((p) => p.enabled);
  if (activeColors.length === 0) {
    activeColors.push({ color: "#ffffff", enabled: true });
    activeColors.push({ color: "#000000", enabled: true });
  }

  // Update Packed Array
  const glColors = uniforms.u_palette.value as THREE.Color[];
  for (let i = 0; i < 8; i++) {
    if (i < activeColors.length) {
      // OPTIMIZATION: Only parse color string if it changed.
      // setStyle involves regex parsing and is expensive in a loop.
      const hex = activeColors[i].color;
      // Check against internal cache or just primitive check if possible
      // Since we can't easily read back 'hex' string from THREE.Color efficiently without .getHexString(),
      // and .getHexString() allocates new strings, we will rely on the fact that this function
      // is now called inside useEffect (only on change) rather than useFrame.
      // However, a simple dirty check prevents re-parsing if only one color changed.
      if (glColors[i].getHexString() !== hex.replace("#", "").toLowerCase()) {
        glColors[i].setStyle(hex);
      }
    }
  }
  uniforms.u_paletteCount.value = activeColors.length;

  uniforms.u_scale.value = Math.max(0.001, state.params.scale);
  uniforms.u_intensity.value = state.params.intensity;
  uniforms.u_speed.value = state.params.speed;
  uniforms.u_factor.value = state.params.factor;
  uniforms.u_distortion.value = state.params.distortion;
  uniforms.u_detail.value = state.params.detail;
  uniforms.u_seed.value = state.params.seed;
  uniforms.u_p1.value = state.params.p1;
  uniforms.u_p2.value = state.params.p2;
  uniforms.u_p3.value = state.params.p3;
  uniforms.u_p4.value = state.params.p4;
  uniforms.u_p5.value = state.params.p5;
  uniforms.u_p6.value = state.params.p6;
  uniforms.u_p7.value = state.params.p7;
  uniforms.u_p8.value = state.params.p8;
  uniforms.u_p9.value = state.params.p9;
  uniforms.u_p10.value = state.params.p10;
  uniforms.u_p11.value = state.params.p11;
  uniforms.u_p12.value = state.params.p12;
  uniforms.u_p13.value = state.params.p13;
  uniforms.u_p14.value = state.params.p14;
  uniforms.u_p15.value = state.params.p15;
};

const updateBlendingUniforms = (uniforms: Record<string, THREE.IUniform>, state: AppState) => {
  uniforms.u_blendEnabled.value = state.blending.enabled;
  uniforms.u_blendMode.value = state.blending.mode;
  uniforms.u_blendOpacity.value = state.blending.opacity;
  uniforms.u_blendScale.value = Math.max(0.001, state.blending.scale);
  uniforms.u_blendFactor.value = state.blending.factor;
  uniforms.u_blendIntensity.value = state.blending.intensity;
  uniforms.u_blendDetail.value = state.blending.factor;
  uniforms.u_blendSeed.value = state.params.seed + 100.0;
};

const updateTransformUniforms = (uniforms: Record<string, THREE.IUniform>, state: AppState) => {
  uniforms.u_angle.value = state.transform.angle * (Math.PI / 180);
  uniforms.u_offset.value.set(state.transform.offsetX, state.transform.offsetY);
  uniforms.u_symEnabled.value = state.symmetry.enabled;
  uniforms.u_symSegments.value = state.symmetry.segments;
  uniforms.u_symRotation.value = state.symmetry.rotation * (Math.PI / 180);
  uniforms.u_symZoom.value = Math.max(0.01, state.symmetry.zoom);

  uniforms.u_tilingEnabled.value = state.tiling.enabled;
  uniforms.u_tilingMirror.value = state.tiling.mirror;
  uniforms.u_tilingRepeat.value.set(state.tiling.repeatX, state.tiling.repeatY);
  uniforms.u_tilingOffset.value.set(state.tiling.offsetX, state.tiling.offsetY);
  uniforms.u_tilingRotation.value = state.tiling.rotation * (Math.PI / 180);
  uniforms.u_tilingScale.value = Math.max(0.01, state.tiling.scale);
};

const updatePostProcessUniforms = (uniforms: Record<string, THREE.IUniform>, state: AppState) => {
  uniforms.u_applyToMap.value = state.postProcess.applyToMap;
  uniforms.u_polar.value = state.postProcess.polar;
  uniforms.u_toon.value = state.postProcess.toon;
  uniforms.u_toonLevels.value = state.postProcess.toonLevels;
  uniforms.u_posterize.value = state.postProcess.posterize;
  uniforms.u_posterizeLevels.value = state.postProcess.posterizeLevels;
  uniforms.u_chromaticAberration.value = state.postProcess.chromaticAberration;
  uniforms.u_radialMask.value = state.postProcess.radialMask;
  uniforms.u_vignette.value = state.postProcess.vignette;
  uniforms.u_bloomEnabled.value = state.postProcess.bloom;
  uniforms.u_bloomThreshold.value = state.postProcess.bloomThreshold;
  uniforms.u_bloomStrength.value = state.postProcess.bloomStrength;
  uniforms.u_blurEnabled.value = state.postProcess.blur;
  uniforms.u_blurStrength.value = state.postProcess.blurStrength;
  uniforms.u_normalize.value = state.postProcess.normalize;
  uniforms.u_glitch.value = state.postProcess.glitch;
  uniforms.u_glitchStrength.value = state.postProcess.glitchStrength;
  uniforms.u_glitchSpeed.value = state.postProcess.glitchSpeed;

  uniforms.u_pixelate.value = state.postProcess.pixelate;
  uniforms.u_pixelDensity.value = state.postProcess.pixelDensity;
  uniforms.u_scanlines.value = state.postProcess.scanlines;
  uniforms.u_scanlineIntensity.value = state.postProcess.scanlineIntensity;
  uniforms.u_crtDistortion.value = state.postProcess.crtDistortion;

  // New FX
  uniforms.u_halftone.value = state.postProcess.halftone;
  uniforms.u_halftoneScale.value = state.postProcess.halftoneScale;
  uniforms.u_edgeDetect.value = state.postProcess.edgeDetect;
  if (
    uniforms.u_edgeColor.value.getHexString() !==
    state.postProcess.edgeColor.replace("#", "").toLowerCase()
  ) {
    uniforms.u_edgeColor.value.setStyle(state.postProcess.edgeColor);
  }
};

const updateMaterialUniforms = (uniforms: Record<string, THREE.IUniform>, state: AppState) => {
  uniforms.u_normalEnabled.value = state.normalMap.enabled;
  uniforms.u_normalStrength.value = state.normalMap.strength;
  uniforms.u_normalInvert.value = state.normalMap.invert;
  uniforms.u_normalSmoothness.value = state.normalMap.smoothness;
  uniforms.u_dispStrength.value = state.displacement.strength;
  uniforms.u_dispBias.value = state.displacement.bias;
  uniforms.u_aoEnabled.value = state.ao.enabled;
  uniforms.u_aoStrength.value = state.ao.strength;
  uniforms.u_aoRadius.value = state.ao.radius;
};

const updateColorBalanceUniforms = (uniforms: Record<string, THREE.IUniform>, state: AppState) => {
  if (state.colorBalance) {
    if (state.colorBalance.shadows) {
      uniforms.u_shadows.value.set(
        state.colorBalance.shadows.r,
        state.colorBalance.shadows.g,
        state.colorBalance.shadows.b,
      );
    }
    if (state.colorBalance.midtones) {
      uniforms.u_midtones.value.set(
        state.colorBalance.midtones.r,
        state.colorBalance.midtones.g,
        state.colorBalance.midtones.b,
      );
    }
    if (state.colorBalance.highlights) {
      uniforms.u_highlights.value.set(
        state.colorBalance.highlights.r,
        state.colorBalance.highlights.g,
        state.colorBalance.highlights.b,
      );
    }
    uniforms.u_brightness.value = state.colorBalance.brightness ?? 0;
    uniforms.u_contrast.value = state.colorBalance.contrast ?? 0;
    uniforms.u_saturation.value = state.colorBalance.saturation ?? 0;
    uniforms.u_hue.value = state.colorBalance.hue ?? 0;
    uniforms.u_cycleSpeed.value = state.colorBalance.cycleSpeed ?? 0;
  }
};

const updateEnvironmentUniforms = (uniforms: Record<string, THREE.IUniform>, state: AppState) => {
  uniforms.u_lightDir.value.set(state.environment.lightX, state.environment.lightY, 1.0);
  uniforms.u_lightIntensity.value = state.environment.lightIntensity;
  uniforms.u_roughness.value = state.environment.roughness;
  uniforms.u_metalness.value = state.environment.metalness;
  uniforms.u_envType.value = state.environment.envType;
  uniforms.u_holographic.value = state.environment.holographic;
  uniforms.u_holoStrength.value = state.environment.holoStrength;
  uniforms.u_fogEnabled.value = state.environment.fogEnabled;
  uniforms.u_fogDensity.value = state.environment.fogDensity;
  // PERFORMANCE FIX: Use copy() on existing cache instead of new THREE.Color()
  uniforms.u_fogColor.value.copy(getFogColor(state));
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

const updateMouseUniforms = (uniforms: Record<string, THREE.IUniform>, state: AppState) => {
  uniforms.u_mouseEnabled.value = state.mouse.enabled;
  uniforms.u_mouseType.value = state.mouse.type;
  uniforms.u_mouseStrength.value = state.mouse.strength;
  uniforms.u_mouseRadius.value = state.mouse.radius;
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
  updateCoreUniforms(uniforms, state);
  updatePatternUniforms(uniforms, state);
  updateBlendingUniforms(uniforms, state);
  updateTransformUniforms(uniforms, state);
  updatePostProcessUniforms(uniforms, state);
  updateMaterialUniforms(uniforms, state);
  updateColorBalanceUniforms(uniforms, state);
  updateEnvironmentUniforms(uniforms, state);
  applyRendererUniformProjection(uniforms, projectRendererUniforms(state));
  updateTextureUniforms(uniforms, state, maskTexture, baseTexture, stickerTexture);
  updateMouseUniforms(uniforms, state);
};
