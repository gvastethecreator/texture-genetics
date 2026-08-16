import * as THREE from "three";
import { TextureType, type AppState } from "../../core/types/types";

export type RendererUniformDomain =
  | "core"
  | "pattern"
  | "transform"
  | "post-process"
  | "material"
  | "color"
  | "interaction"
  | "environment";

type ProjectedUniformValue = number | boolean | string | readonly number[] | readonly string[];
type ProjectedUniformDomain = Record<string, ProjectedUniformValue>;
export type RendererUniformProjection = Record<RendererUniformDomain, ProjectedUniformDomain>;

const FOG_COLORS = ["#111111", "#331a1a", "#020205", "#4a4036"] as const;

export const projectFogColor = (state: AppState): string =>
  state.environment.fogColor || FOG_COLORS[state.environment.envType] || FOG_COLORS[0];

const activePalette = (state: AppState): string[] => {
  const source = state.params.palette?.length
    ? state.params.palette
    : [
        { color: state.params.color1 || "#ffffff", enabled: true },
        { color: state.params.color2 || "#000000", enabled: true },
      ];
  const colors = source.filter((entry) => entry.enabled).map((entry) => entry.color);
  return colors.length > 0 ? colors.slice(0, 8) : ["#ffffff", "#000000"];
};

export const projectRendererUniforms = (state: AppState): RendererUniformProjection => {
  const palette = activePalette(state);
  const paddedPalette = [...palette];
  while (paddedPalette.length < 8) paddedPalette.push("#000000");

  return {
    core: {
      u_viewMode: state.viewMode,
      u_isUVDebug: state.textureType === TextureType.UV_DEBUG,
    },
    pattern: {
      u_scale: Math.max(0.001, state.params.scale),
      u_intensity: state.params.intensity,
      u_speed: state.params.speed,
      u_factor: state.params.factor,
      u_distortion: state.params.distortion,
      u_detail: state.params.detail,
      u_seed: state.params.seed,
      u_p1: state.params.p1,
      u_p2: state.params.p2,
      u_p3: state.params.p3,
      u_p4: state.params.p4,
      u_p5: state.params.p5,
      u_p6: state.params.p6,
      u_p7: state.params.p7,
      u_p8: state.params.p8,
      u_p9: state.params.p9,
      u_p10: state.params.p10,
      u_p11: state.params.p11,
      u_p12: state.params.p12,
      u_p13: state.params.p13,
      u_p14: state.params.p14,
      u_p15: state.params.p15,
      u_color1: state.params.color1,
      u_color2: state.params.color2,
      u_palette: paddedPalette,
      u_paletteCount: palette.length,
      u_blendEnabled: state.blending.enabled,
      u_blendMode: state.blending.mode,
      u_blendOpacity: state.blending.opacity,
      u_blendScale: Math.max(0.001, state.blending.scale),
      u_blendFactor: state.blending.factor,
      u_blendIntensity: state.blending.intensity,
      u_blendDetail: state.blending.factor,
      u_blendSeed: state.params.seed + 100,
    },
    transform: {
      u_angle: state.transform.angle * (Math.PI / 180),
      u_offset: [state.transform.offsetX, state.transform.offsetY],
      u_symEnabled: state.symmetry.enabled,
      u_symSegments: state.symmetry.segments,
      u_symRotation: state.symmetry.rotation * (Math.PI / 180),
      u_symZoom: Math.max(0.01, state.symmetry.zoom),
      u_tilingEnabled: state.tiling.enabled,
      u_tilingMirror: state.tiling.mirror,
      u_tilingRepeat: [state.tiling.repeatX, state.tiling.repeatY],
      u_tilingOffset: [state.tiling.offsetX, state.tiling.offsetY],
      u_tilingRotation: state.tiling.rotation * (Math.PI / 180),
      u_tilingScale: Math.max(0.01, state.tiling.scale),
    },
    "post-process": {
      u_applyToMap: state.postProcess.applyToMap,
      u_polar: state.postProcess.polar,
      u_toon: state.postProcess.toon,
      u_toonLevels: state.postProcess.toonLevels,
      u_posterize: state.postProcess.posterize,
      u_posterizeLevels: state.postProcess.posterizeLevels,
      u_chromaticAberration: state.postProcess.chromaticAberration,
      u_radialMask: state.postProcess.radialMask,
      u_vignette: state.postProcess.vignette,
      u_bloomEnabled: state.postProcess.bloom,
      u_bloomThreshold: state.postProcess.bloomThreshold,
      u_bloomStrength: state.postProcess.bloomStrength,
      u_blurEnabled: state.postProcess.blur,
      u_blurStrength: state.postProcess.blurStrength,
      u_normalize: state.postProcess.normalize,
      u_glitch: state.postProcess.glitch,
      u_glitchStrength: state.postProcess.glitchStrength,
      u_glitchSpeed: state.postProcess.glitchSpeed,
      u_pixelate: state.postProcess.pixelate,
      u_pixelDensity: state.postProcess.pixelDensity,
      u_scanlines: state.postProcess.scanlines,
      u_scanlineIntensity: state.postProcess.scanlineIntensity,
      u_crtDistortion: state.postProcess.crtDistortion,
      u_halftone: state.postProcess.halftone,
      u_halftoneScale: state.postProcess.halftoneScale,
      u_edgeDetect: state.postProcess.edgeDetect,
      u_edgeColor: state.postProcess.edgeColor,
    },
    material: {
      u_normalEnabled: state.normalMap.enabled,
      u_normalStrength: state.normalMap.strength,
      u_normalInvert: state.normalMap.invert,
      u_normalSmoothness: state.normalMap.smoothness,
      u_dispStrength: state.displacement.strength,
      u_dispBias: state.displacement.bias,
      u_aoEnabled: state.ao.enabled,
      u_aoStrength: state.ao.strength,
      u_aoRadius: state.ao.radius,
    },
    color: {
      u_shadows: [
        state.colorBalance.shadows.r,
        state.colorBalance.shadows.g,
        state.colorBalance.shadows.b,
      ],
      u_midtones: [
        state.colorBalance.midtones.r,
        state.colorBalance.midtones.g,
        state.colorBalance.midtones.b,
      ],
      u_highlights: [
        state.colorBalance.highlights.r,
        state.colorBalance.highlights.g,
        state.colorBalance.highlights.b,
      ],
      u_brightness: state.colorBalance.brightness,
      u_contrast: state.colorBalance.contrast,
      u_saturation: state.colorBalance.saturation,
      u_hue: state.colorBalance.hue,
      u_cycleSpeed: state.colorBalance.cycleSpeed,
    },
    interaction: {
      u_alphaEnabled: state.imageAlpha.enabled,
      u_alphaThreshold: state.imageAlpha.threshold,
      u_alphaTolerance: state.imageAlpha.tolerance,
      u_alphaBlur: state.imageAlpha.blur,
      u_maskEnabled: state.imageAlpha.maskEnabled,
      u_mouseEnabled: state.mouse.enabled,
      u_mouseType: state.mouse.type,
      u_mouseStrength: state.mouse.strength,
      u_mouseRadius: state.mouse.radius,
    },
    environment: {
      u_lightDir: [state.environment.lightX, state.environment.lightY, 1],
      u_lightIntensity: state.environment.lightIntensity,
      u_roughness: state.environment.roughness,
      u_metalness: state.environment.metalness,
      u_envType: state.environment.envType,
      u_holographic: state.environment.holographic,
      u_holoStrength: state.environment.holoStrength,
      u_fogEnabled: state.environment.fogEnabled,
      u_fogDensity: state.environment.fogDensity,
      u_fogColor: projectFogColor(state),
    },
  };
};

interface UniformTarget {
  value?: unknown;
  array?: unknown;
}

const applyValue = (target: UniformTarget, value: ProjectedUniformValue): void => {
  if (Array.isArray(value)) {
    if ("array" in target && target.array !== undefined) {
      target.array = value.map((entry) =>
        typeof entry === "string" ? new THREE.Color(entry) : entry,
      );
      return;
    }
    if (target.value instanceof THREE.Color && value.length === 3) {
      target.value.setRGB(Number(value[0]), Number(value[1]), Number(value[2]));
      return;
    }
    if (target.value instanceof THREE.Vector2 || target.value instanceof THREE.Vector3) {
      target.value.fromArray(value.map(Number));
      return;
    }
    if (Array.isArray(target.value)) {
      target.value = value.map((entry) =>
        typeof entry === "string" ? new THREE.Color(entry) : entry,
      );
    }
    return;
  }

  if (target.value instanceof THREE.Color && typeof value === "string") {
    target.value.set(value);
  } else if (typeof target.value === "number" && typeof value === "boolean") {
    target.value = value ? 1 : 0;
  } else {
    target.value = value;
  }
};

export const applyRendererUniformProjection = (
  targets: Record<string, UniformTarget>,
  projection: RendererUniformProjection,
  domains: readonly RendererUniformDomain[] = Object.keys(projection) as RendererUniformDomain[],
): void => {
  for (const domain of domains) {
    for (const [name, value] of Object.entries(projection[domain])) {
      const target = targets[name];
      if (target) applyValue(target, value);
    }
  }
};
