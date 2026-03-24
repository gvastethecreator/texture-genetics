
import { LucideIcon } from 'lucide-react';
import React from 'react';


export enum GeometryType {
  PLANE = 'Plane',
  CUBE = 'Cube',
  SPHERE = 'Sphere',
  CYLINDER = 'Cylinder',
  CARD = 'Trading Card',
  CUSTOM = 'Custom Model',
  SVG = 'SVG Shape',
  TEXT = '3D Text'
}

export enum PreviewAnimation {
    NONE = 0,
    TURNTABLE = 1,
    TUMBLE = 2,
    HOVER = 3,
    HEARTBEAT = 4,
    SHAKE = 5
}

export enum TextureType {
  // Basic Shapes
  CHECKER = 'Checker',
  CIRCLE = 'Circle',
  RING = 'Ring',
  CONE = 'Cone',
  CROSS = 'Cross',
  HEXAGON_GRID = 'Hexagon Grid',
  ISOMETRIC = 'Isometric 3D',
  FLOWER = 'Flower',
  BRICKS = 'Bricks',
  ZIGZAG = 'ZigZag',
  WAVE_PATTERN = 'Waves',
  WAVEFORM = 'Waveform',
  TRUCHET = 'Truchet',
  SPIRAL = 'Hypnotic Spiral',
  STARBURST = 'Starburst',
  CROSS_STITCH = 'Cross Stitch',
  RGB_RINGS = 'RGB Rings',
  WEAVE_KNIT = 'Weave Knit',
  ROTATING_GRID = 'Rotating Grid',
  RIPPLE_GRID = 'Ripple Grid',
  UV_DEBUG = 'UV Check (Debug)',
  MAZE = 'Maze',
  PYRAMID_SCENE = 'Wireframe Pyramid',
  WARP_GRID = 'Warp Grid',
  ISO_LINES = 'Iso Lines',
  
  // Gradients
  GRADIENT_LINEAR = 'Gradient Linear',
  GRADIENT_RADIAL = 'Gradient Radial',
  GRADIENT_STRIPES = 'Gradient Stripes',
  
  // Noise & Organic
  PERLIN_NOISE = 'Perlin Noise',
  SIMPLEX_NOISE = 'Simplex Noise',
  CELLULAR_NOISE = 'Cellular Noise',
  WORLEY_NOISE = 'Worley Noise', // NEW
  FBM_NOISE = 'FBM Noise',
  GRADIENT_NOISE = 'Gradient Noise',
  RIDGED_FRACTAL = 'Ridged Fractal',
  VALUE_NOISE = 'Value Noise',
  VORONOI_SMOOTH = 'Smooth Voronoi',
  VORONOI_ROCKS = 'Voronoi Rocks',
  TRABECULUM = 'Trabeculum (Organic)',
  FUR_FIBERS = 'Fur Fibers',
  TURBULENCE = 'Turbulence',
  CURL_NOISE = 'Curl Noise',
  GYROID = 'Gyroid Surface',
  MARBLE = 'Marble',
  WOOD = 'Wood',
  GRUNGE = 'Grunge',
  SQUIGGLES = 'Squiggles',
  HOLO_FOIL = 'Holo Foil',
  OIL_PAINT = 'Oil Paint',
  FLUID_WARP = 'Fluid Warp',
  
  // Fire & Light
  FLAME = 'Flame',
  FIRE = 'Fire',
  COMPLEX_FIRE = 'Realistic Fire',
  SOLAR = 'Solar',
  SPARK = 'Spark',
  FLASH = 'Flash',
  LIGHTNING = 'Lightning',
  LASER = 'Laser',
  FLARE = 'Flare',
  PLASMA = 'Plasma Energy',
  
  // Nature & Elements
  CLOUD = 'Cloud',
  REALISTIC_CLOUDS = 'Realistic Clouds',
  SMOKE = 'Smoke',
  WATER = 'Water',
  SNOW = 'Snow',
  RAIN = 'Rain',
  BUBBLES = 'Bubbles',
  CAUSTICS = 'Caustics',
  INK_SPLAT = 'Ink Splat',
  MOSAIC = 'Simple Mosaic',
  CRYSTALS = 'Crystal Mosaic',
  SEA_WAVES = 'Sea Waves',
  FROST_PATTERN = 'Frost Pattern',
  
  // Abstract & FX
  MAGIC_CIRCLE = 'Magic Circle',
  MANDALA = 'Mandala',
  ELECTRIC = 'Electric',
  BINARY_MATRIX = 'Binary Matrix',
  CIRCUIT = 'Circuit Board',
  SCANLINES = 'Scanlines',
  EXPLOSION = 'Explosion',
  RADIAL_WAVE = 'Radial Wave',
  MANDELBROT = 'Mandelbrot',
  JULIA = 'Julia Set',
  FLOW_FIELD = 'Flow Field',
  INFINITE_FALL = 'Infinite Fall',
  VOXEL_TUNNEL = 'Voxel Tunnel',
  HYPNOTIC_RINGS = 'Hypnotic Rings',
  METABALL_SPIRAL = 'Metaball Spiral',
  INVERSE_MOBIUS = 'Inverse Mobius',
  STEREO_FLOW = 'Stereo Flow',
  GABOR_NOISE = 'Gabor Noise',
  SMOOTH_SWIRL = 'Smooth Swirl',
  NEON_RIPPLES = 'Neon Ripples',
  BLACK_HOLE = 'Black Hole',
  SPACE_DUST = 'Space Dust',

  // 3D & SDF
  HYPER_TUNNEL = 'Hyper Tunnel',
  ALIEN_BIOMASS = 'Alien Biomass',
  CUBIC_SPACE = 'Cubic Space',
  LOW_TECH_TUNNEL = 'Low Tech Tunnel',
  OCTGRAMS = 'Octgrams',
  COSMIC_FLOW = 'Cosmic Flow',
  INDRA_NET = 'Indra Net',
  SPHERICAL_SPIRAL = 'Spherical Fibonacci',
  ALIEN_COCOON = 'Alien Cocoon',
  VOLUMETRIC_FOG = 'Volumetric Fog'
}

export enum ViewMode {
  ALBEDO = 0,
  NORMAL = 1,
  HEIGHT = 2,
  RENDER = 3,
  UV = 4
}

export enum MouseInteractionType {
  DISTORT = 0,
  MAGNIFY = 1,
  SPOTLIGHT = 2,
  COLOR_SHIFT = 3
}

export enum BlendMode {
  NORMAL = 0,
  ADD = 1,
  MULTIPLY = 2,
  SCREEN = 3,
  OVERLAY = 4,
  SOFT_LIGHT = 5,
  DIFFERENCE = 6
}

export enum BaseEffectType {
    NONE = 0,
    DISPLACEMENT = 1,
    PIXEL_SORT = 2,
    DATAMOSH = 3,
    RIPPLE = 4,
    CHROMATIC = 5
}

export enum WaveType {
    SINE = 'sine',
    COSINE = 'cosine',
    TRIANGLE = 'triangle',
    SAWTOOTH = 'sawtooth',
    NOISE = 'noise'
}

export interface AnimationConfig {
    enabled: boolean;
    type: WaveType;
    speed: number;
    min: number;
    max: number;
}

export interface PaletteColor {
    color: string;
    enabled: boolean;
}

export interface ShaderParams {
  scale: number;
  intensity: number;
  speed: number;
  factor: number;
  distortion: number;
  detail: number;
  seed: number;
  
  // Legacy / Fallback
  color1: string;
  color2: string;
  
  // New Rich Palette
  palette: PaletteColor[];

  // Extra Params for Advanced Configuration
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  p5: number;
  p6: number;
  p7: number;
  p8: number;
  p9: number;
  p10: number;
  p11: number;
  p12: number;
  p13: number;
  p14: number;
  p15: number;
}

export interface RangeConfig {
    min?: number;
    max?: number;
    step?: number;
}

export interface CategoryData {
    types: TextureType[];
    color: string;
    icon: LucideIcon;
}

export interface ShaderDefinition {
    name: string;
    labels: Partial<Record<keyof ShaderParams, string>>;
    ranges?: Partial<Record<keyof ShaderParams, RangeConfig>>;
}

export interface PatternDefinition {
    code: string;
    deps?: string[];
}

export interface BlendingParams {
  enabled: boolean;
  type: TextureType;
  mode: BlendMode;
  opacity: number;
  scale: number;
  factor: number;
  intensity: number;
}

export interface BaseTextureParams {
    enabled: boolean;
    texture: string | null;
    opacity: number;
    blendMode: BlendMode;
    effectType: BaseEffectType;
    effectStrength: number;
}

// New Interface for Sticker Layer
export interface StickerParams {
    enabled: boolean;
    texture: string | null;
    opacity: number;
    blendMode: BlendMode;
    posX: number;
    posY: number;
    scale: number;
    rotation: number;
    color: string; // Tint
    useColor: boolean; // Apply tint?
    gizmoVisible: boolean;
}

export interface TransformParams {
  angle: number;
  offsetX: number;
  offsetY: number;
}

export interface SymmetryParams {
    enabled: boolean;
    segments: number;
    rotation: number;
    zoom: number;
}

export interface TilingParams {
  enabled: boolean;
  mirror: boolean;
  repeatX: number;
  repeatY: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  scale: number;
}

export interface NormalMapParams {
  enabled: boolean;
  strength: number;
  invert: boolean;
  smoothness: number;
}

export interface DisplacementParams {
    enabled: boolean;
    strength: number;
    bias: number;
}

export interface AmbientOcclusionParams {
    enabled: boolean;
    strength: number;
    radius: number;
}

export interface PostProcessParams {
  applyToMap: boolean; // NEW: Toggle baking FX
  polar: boolean;
  toon: boolean;
  toonLevels: number;
  posterize: boolean;
  posterizeLevels: number;
  chromaticAberration: number;
  radialMask: number;
  vignette: number;
  bloom: boolean;
  bloomThreshold: number;
  bloomStrength: number;
  blur: boolean;
  blurStrength: number;
  normalize: boolean;
  glitch: boolean;
  glitchStrength: number;
  glitchSpeed: number;
  
  // New Retro/Visual Effects
  pixelate: boolean;
  pixelDensity: number; // 32 to 1024
  scanlines: boolean;
  scanlineIntensity: number;
  crtDistortion: number;
  
  // New v3.6 FX
  halftone: boolean;
  halftoneScale: number;
  edgeDetect: boolean;
  edgeColor: string;
}

export interface ColorBalanceParams {
  shadows: { r: number; g: number; b: number };
  midtones: { r: number; g: number; b: number };
  highlights: { r: number; g: number; b: number };
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  cycleSpeed: number;
}

export interface ImageAlphaParams {
  enabled: boolean;
  threshold: number;
  tolerance: number;
  blur: number;
  maskTexture: string | null;
  maskEnabled: boolean;
}

export interface SpriteSheetParams {
  columns: number;
  rows: number;
  totalFrames: number;
  duration: number;
}

export interface MouseParams {
    enabled: boolean;
    type: MouseInteractionType;
    strength: number;
    radius: number;
}

export interface EnvironmentParams {
    animation: PreviewAnimation;
    animationSpeed: number;
    lightIntensity: number;
    exposure: number; // NEW: Camera Exposure Control
    bgDarkness: number;
    lightX: number; 
    lightY: number;
    lightColor: string;
    ambientColor: string;
    roughness: number;
    metalness: number;
    envType: number;
    holographic: boolean;
    holoStrength: number;
    
    // Environment Background
    bgColor: string;
    bgEnabled: boolean;
    envBackground: boolean; 

    // Stage
    stageEnabled: boolean;
    stageColor: string;
    stageOpacity: number;
    
    // Fog
    fogEnabled: boolean;
    fogDensity: number;
    fogColor: string;
    fogNear: number; 
    fogFar: number; 
    
    // Particles (Detailed)
    particlesEnabled: boolean;
    particleCount: number;
    particleSpeed: number;
    particleSize: number;
    particleColor: string; 
    particleOpacity: number; 
    particleSpreadY: number; 
    
    // Volumetric Smoke
    smokeEnabled: boolean;
    smokeDensity: number;
    smokeSpeed: number;
    smokeColor: string;

    // Scene Post FX - BLOOM
    sceneBloom: boolean;
    sceneBloomIntensity: number;
    sceneBloomThreshold: number; 
    sceneBloomRadius: number; 
    sceneBloomSmoothing: number; 

    // Scene Post FX - VIGNETTE
    sceneVignette: boolean;
    sceneVignetteOffset: number; 
    sceneVignetteDarkness: number; 

    // Scene Post FX - CHROMATIC
    sceneChromatic: boolean;
    sceneChromaticOffset: number; 
    sceneChromaticRadial: boolean; 
    
    // Scene Post FX - NOISE
    sceneNoise: boolean;
    sceneNoiseOpacity: number; 

    // Scene Post FX - GLITCH
    sceneGlitch: boolean;
    sceneGlitchStrength: number; 
    sceneGlitchDelay: number; 
    sceneGlitchDuration: number; 

    // Scene Post FX - TILT SHIFT
    sceneTiltShift: boolean;
    sceneTiltShiftBlur: number;
    sceneTiltShiftFocus: number; 

    sceneScanlines: boolean; // CRT Scanline
    scenePixelate: boolean; // Retro Pixelate
    sceneOutline: boolean; // Cell Shading / Edge Detection
    
    // ADVANCED FX (v4.0)
    sceneAscii: boolean; // Matrix Style
    sceneDither: boolean; // Ordered Dithering
    scenePosterize: boolean; // Color Quantization
    scenePosterizeLevels: number;
    sceneRuttEtra: boolean; // Scanline Displacement Simulation
}

export interface SettingsParams {
    renderDpr: number; // 0 = Auto/Native (Best Quality), 1 = Low (Fast)
    exportFormat: 'png' | 'jpeg' | 'webp';
    antialias: boolean;
    showFPS: boolean;
}

export interface CameraState {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
}

export interface SvgParams {
    url: string | null;
    preset: string; // 'star', 'heart', 'custom'
    extrude: number;
    scale: number;
}

export interface TextParams {
    text: string;
    font: string;
    extrude: number;
    size: number;
    curveSegments: number;
    bevelEnabled: boolean;
    bevelThickness: number;
    bevelSize: number;
}

export interface GeometryConfig {
    bevelEnabled: boolean;
    bevelThickness: number;
    bevelSize: number;
    bevelSegments: number;
    rounding: number;
    smoothness: number;
}

export interface AppState {
  resolution: number;
  textureType: TextureType;
  geometry: GeometryType;
  geometryConfig: GeometryConfig;
  viewMode: ViewMode;
  animate: boolean;
  time: number;
  isFullscreen: boolean;
  tilingPreview: boolean;
  tileMode: boolean; // For visual testing in renderer
  gridOverlay: boolean;
  isSidebarOpen: boolean;
  isSettingsOpen: boolean;
  isCodeOpen: boolean;
  isShortcutsOpen: boolean;
  
  params: ShaderParams;
  paramAnimations: Record<string, AnimationConfig>;
  blending: BlendingParams;
  baseTexture: BaseTextureParams;
  sticker: StickerParams;
  transform: TransformParams;
  symmetry: SymmetryParams;
  tiling: TilingParams;
  postProcess: PostProcessParams;
  normalMap: NormalMapParams;
  displacement: DisplacementParams;
  ao: AmbientOcclusionParams;
  colorBalance: ColorBalanceParams;
  imageAlpha: ImageAlphaParams;
  spriteSheet: SpriteSheetParams;
  mouse: MouseParams;
  environment: EnvironmentParams;
  settings: SettingsParams;
  
  // New: Camera Persistence
  camera: CameraState;
  
  customModel: string | null;
  svg: SvgParams;
  text: TextParams;
}

export interface UserPreset {
    id: string;
    name: string;
    date: number;
    state: Partial<AppState>;
}

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}
