
import { TextureType, ViewMode, MouseInteractionType, BlendMode, GeometryType, PreviewAnimation, WaveType, BaseEffectType } from './types/types';

export const DEFAULTS = {
  RESOLUTION: 512,
  TEXTURE_TYPE: TextureType.PERLIN_NOISE, 
  GEOMETRY: GeometryType.PLANE,
  GEOMETRY_CONFIG: {
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 4,
      rounding: 0.1,
      smoothness: 64
  },
  VIEW_MODE: ViewMode.ALBEDO, 
  ANIMATE: true,
  TIME: 0,
  
  // Modal Defaults
  IS_CODE_OPEN: false,
  IS_SHORTCUTS_OPEN: false,
  
  PARAMS: { 
    scale: 1.0, intensity: 1.0, speed: 0.5, factor: 0.5, 
    distortion: 0.0, detail: 0.5, seed: 0.0,
    color1: '#8B5CF6',
    color2: '#06B6D4',
    palette: [
        { color: '#8B5CF6', enabled: true },
        { color: '#06B6D4', enabled: true },
        { color: '#10B981', enabled: false },
        { color: '#F59E0B', enabled: false },
        { color: '#EF4444', enabled: false },
        { color: '#EC4899', enabled: false },
        { color: '#6366F1', enabled: false },
        { color: '#ffffff', enabled: false }
    ],
    p1: 0.5,
    p2: 0.5,
    p3: 0.5,
    p4: 0.5,
    p5: 0.5,
    p6: 0.5,
    p7: 0.5,
    p8: 0.5,
    p9: 0.5,
    p10: 0.5,
    p11: 0.5,
    p12: 0.5,
    p13: 0.5,
    p14: 0.5,
    p15: 0.5
  },
  
  PARAM_ANIMATIONS: {},

  BLENDING: {
    enabled: false,
    type: TextureType.CELLULAR_NOISE,
    mode: BlendMode.OVERLAY,
    opacity: 0.5,
    scale: 1.0,
    factor: 0.5,
    intensity: 1.0
  },
  
  BASE_TEXTURE: {
      enabled: false,
      texture: null,
      opacity: 1.0,
      blendMode: BlendMode.NORMAL,
      effectType: BaseEffectType.NONE,
      effectStrength: 0.5
  },
  
  STICKER: {
      enabled: false,
      texture: null,
      opacity: 1.0,
      blendMode: BlendMode.NORMAL,
      posX: 0.0,
      posY: 0.0,
      scale: 0.5,
      rotation: 0.0,
      color: '#ffffff',
      useColor: false,
      gizmoVisible: true
  },
  
  TRANSFORM: { angle: 0, offsetX: 0, offsetY: 0 },
  SYMMETRY: { enabled: false, segments: 6, rotation: 0, zoom: 1.0 },
  TILING: { 
    enabled: false, mirror: false, repeatX: 1, repeatY: 1,
    offsetX: 0, offsetY: 0, rotation: 0, scale: 1.0
  },
  
  POST_PROCESS: { 
    applyToMap: true, 
    polar: false, 
    toon: false, 
    toonLevels: 4, 
    posterize: false, 
    posterizeLevels: 4, 
    chromaticAberration: 0,
    radialMask: 0, 
    vignette: 0,
    bloom: false,
    bloomThreshold: 0.8,
    bloomStrength: 0.5,
    blur: false,
    blurStrength: 0.0,
    normalize: false,
    glitch: false,
    glitchStrength: 0.5,
    glitchSpeed: 1.0,
    pixelate: false,
    pixelDensity: 64,
    scanlines: false,
    scanlineIntensity: 0.2,
    crtDistortion: 0.0,
    halftone: false,
    halftoneScale: 50.0,
    edgeDetect: false,
    edgeColor: '#00ff00'
  },
  
  NORMAL_MAP: { enabled: true, strength: 1.5, invert: false, smoothness: 0.2 },
  DISPLACEMENT: { enabled: true, strength: 0.5, bias: 0.0 },
  AO: { enabled: true, strength: 1.2, radius: 0.5 },
  
  COLOR_BALANCE: { 
    shadows: { r: 0, g: 0, b: 0 }, 
    midtones: { r: 0, g: 0, b: 0 }, 
    highlights: { r: 0, g: 0, b: 0 },
    brightness: 0, contrast: 0, saturation: 0, hue: 0, cycleSpeed: 0
  },
  
  IMAGE_ALPHA: { enabled: false, threshold: 0.5, tolerance: 0.1, blur: 0.05, maskTexture: null, maskEnabled: false },
  SPRITE_SHEET: { columns: 4, rows: 4, totalFrames: 16, duration: 1.0 },
  MOUSE: { enabled: false, type: MouseInteractionType.DISTORT, strength: 0.5, radius: 0.2 },
  
  ENVIRONMENT: {
      animation: PreviewAnimation.NONE,
      animationSpeed: 1.0,
      lightIntensity: 1.0,
      exposure: 1.0, // NEW DEFAULT
      bgDarkness: 0.9,
      lightX: -0.5,
      lightY: 0.5,
      lightColor: '#ffffff', // NEW
      ambientColor: '#333333', // NEW
      roughness: 0.4,
      metalness: 0.2,
      envType: 0,
      holographic: false,
      holoStrength: 0.8,
      
      bgColor: '#000000',
      bgEnabled: false,
      envBackground: false,

      // Stage
      stageEnabled: true,
      stageColor: '#222222',
      stageOpacity: 0.8,
      
      // Fog
      fogEnabled: false,
      fogDensity: 0.05,
      fogColor: '#000000', 
      fogNear: 2, // NEW
      fogFar: 20, // NEW
      
      // Particles
      particlesEnabled: false,
      particleCount: 500,
      particleSpeed: 0.5,
      particleSize: 0.5,
      particleColor: '#4f46e5', // NEW (Indigo)
      particleOpacity: 0.5, // NEW
      particleSpreadY: 3.0, // NEW
      
      // Smoke
      smokeEnabled: false,
      smokeDensity: 0.5,
      smokeSpeed: 0.5,
      smokeColor: '#aaaaaa',

      // Scene FX - Bloom
      sceneBloom: false,
      sceneBloomIntensity: 0.8,
      sceneBloomThreshold: 0.9,
      sceneBloomRadius: 0.6,
      sceneBloomSmoothing: 0.02,

      // Scene FX - Vignette
      sceneVignette: false,
      sceneVignetteOffset: 0.5,
      sceneVignetteDarkness: 0.5,

      // Scene FX - Chromatic
      sceneChromatic: false,
      sceneChromaticOffset: 0.003,
      sceneChromaticRadial: true,

      // Scene FX - Noise
      sceneNoise: false,
      sceneNoiseOpacity: 0.2,

      // Scene FX - Glitch
      sceneGlitch: false,
      sceneGlitchStrength: 0.6, // Vector2(0.3, 1.0) avg
      sceneGlitchDelay: 1.5, // Vector2(1.5, 3.5) min
      sceneGlitchDuration: 0.6, // Vector2(0.6, 1.0) min

      // Scene FX - TiltShift
      sceneTiltShift: false,
      sceneTiltShiftBlur: 0.5,
      sceneTiltShiftFocus: 0.5,

      sceneScanlines: false,
      scenePixelate: false,
      sceneOutline: false,
      
      // ADVANCED FX
      sceneAscii: false,
      sceneDither: false,
      scenePosterize: false,
      scenePosterizeLevels: 4,
      sceneRuttEtra: false
  },
  
  SETTINGS: {
      renderDpr: 0, 
      exportFormat: 'png' as const,
      antialias: true,
      showFPS: false
  },

  TILE_MODE: false,
  
  CAMERA: {
      position: [0, 0, 4] as [number, number, number],
      target: [0, 0, 0] as [number, number, number],
      fov: 45
  },
  
  ANIMATION_DEFAULT: {
      enabled: false,
      type: WaveType.SINE,
      speed: 1.0,
      min: 0,
      max: 1
  },
  
  CUSTOM_MODEL: null,
  
  SVG: {
      url: null,
      preset: 'star',
      extrude: 0.1,
      scale: 1.0
  },
  
  TEXT: {
      text: 'HELLO',
      font: 'helvetiker',
      extrude: 0.1,
      size: 1.0,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02
  }
};
