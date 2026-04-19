import { AppState, TextureType, BlendMode, GeometryType } from "./core/types/types";
import { DEFAULTS } from "./core/constants";

export interface Preset {
  name: string;
  category: string;
  state: Partial<AppState>;
}

// Helper to construct a full state update from partial overrides
const p = (
  type: TextureType,
  category: string,
  name: string,
  overrides: {
    params?: Partial<typeof DEFAULTS.PARAMS>;
    transform?: Partial<typeof DEFAULTS.TRANSFORM>;
    tiling?: Partial<typeof DEFAULTS.TILING>;
    postProcess?: Partial<typeof DEFAULTS.POST_PROCESS>;
    normalMap?: Partial<typeof DEFAULTS.NORMAL_MAP>;
    colorBalance?: typeof DEFAULTS.COLOR_BALANCE;
    imageAlpha?: Partial<typeof DEFAULTS.IMAGE_ALPHA>;
    mouse?: Partial<typeof DEFAULTS.MOUSE>;
    ao?: Partial<typeof DEFAULTS.AO>;
    blending?: Partial<typeof DEFAULTS.BLENDING>;
    environment?: Partial<typeof DEFAULTS.ENVIRONMENT>;
    geometry?: GeometryType;
    baseTexture?: Partial<typeof DEFAULTS.BASE_TEXTURE>;
    symmetry?: Partial<typeof DEFAULTS.SYMMETRY>;
  },
): Preset => {
  return {
    name,
    category,
    state: {
      textureType: type,
      geometry: overrides.geometry ?? DEFAULTS.GEOMETRY,
      params: { ...DEFAULTS.PARAMS, ...overrides.params },
      transform: { ...DEFAULTS.TRANSFORM, ...overrides.transform },
      tiling: { ...DEFAULTS.TILING, ...overrides.tiling },
      postProcess: { ...DEFAULTS.POST_PROCESS, ...overrides.postProcess },
      normalMap: { ...DEFAULTS.NORMAL_MAP, ...overrides.normalMap },
      colorBalance: overrides.colorBalance || DEFAULTS.COLOR_BALANCE,
      imageAlpha: { ...DEFAULTS.IMAGE_ALPHA, ...overrides.imageAlpha },
      spriteSheet: DEFAULTS.SPRITE_SHEET,
      mouse: { ...DEFAULTS.MOUSE, ...overrides.mouse },
      ao: { ...DEFAULTS.AO, ...overrides.ao },
      blending: { ...DEFAULTS.BLENDING, ...overrides.blending },
      environment: { ...DEFAULTS.ENVIRONMENT, ...overrides.environment },
      baseTexture: { ...DEFAULTS.BASE_TEXTURE, ...overrides.baseTexture },
      symmetry: { ...DEFAULTS.SYMMETRY, ...overrides.symmetry },
    },
  };
};

// Helper for quick palette construction
const c = (hex: string) => ({ color: hex, enabled: true });
const x = { color: "#000000", enabled: false };

export const PRESETS: Preset[] = [
  // =================================================================================
  // 🔮 FANTASY & RPG
  // =================================================================================
  p(TextureType.MAGIC_CIRCLE, "Fantasy RPG", "Eldritch Summoning", {
    params: {
      scale: 0.9,
      intensity: 2.5,
      speed: 0.2,
      factor: 0.6,
      palette: [
        c("#090014"),
        c("#240038"),
        c("#4a0e6e"),
        c("#9d00ff"),
        c("#d485ff"),
        c("#ffffff"),
        x,
        x,
      ],
      p1: 0.8, // Complexity
      p2: 0.1, // Rotation Speed
      p3: 0.7, // Runes Density
      p4: 0.3, // Pulse
      p5: 0.2, // Core Size
      p12: 0.1, // Distort
    },
    postProcess: { bloom: true, bloomStrength: 2.0, chromaticAberration: 0.3, radialMask: 0.4 },
    environment: {
      holographic: true,
      holoStrength: 0.5,
      particlesEnabled: true,
      particleCount: 300,
      particleSpeed: 0.2,
      fogEnabled: true,
      fogColor: "#1a0033",
      fogDensity: 0.08,
    },
  }),
  p(TextureType.FLUID_WARP, "Fantasy RPG", "Mana Potion", {
    params: {
      scale: 2.5,
      intensity: 1.2,
      speed: 0.4,
      factor: 0.7,
      palette: [c("#001a33"), c("#004488"), c("#0088ff"), c("#00ccff"), c("#aaddff"), x, x, x],
      p1: 0.6, // Flow
      p2: 0.4, // Viscosity
      p3: 0.8, // Turb
      p12: 0.1, // Grain
    },
    geometry: GeometryType.SPHERE,
    environment: {
      roughness: 0.1,
      metalness: 0.2,
      lightIntensity: 1.5,
      bgEnabled: true,
      bgColor: "#000000",
    },
    normalMap: { enabled: true, strength: 2.0, smoothness: 0.8 },
  }),
  p(TextureType.VORONOI_ROCKS, "Fantasy RPG", "Dragon Scales", {
    params: {
      scale: 4.0,
      intensity: 1.0,
      factor: 0.3,
      palette: [c("#1a0f00"), c("#331a00"), c("#663300"), c("#cc5500"), c("#ffaa00"), x, x, x],
      p1: 0.4, // Mix
      p2: 0.2, // Soft
      p3: 0.6, // Edge
      p15: 0.5, // Gamma
    },
    geometry: GeometryType.SPHERE,
    normalMap: { enabled: true, strength: 4.0, invert: true },
    environment: { roughness: 0.4, metalness: 0.6, envType: 1 },
  }),
  p(TextureType.SPHERICAL_SPIRAL, "Fantasy RPG", "Holy Shield", {
    params: {
      scale: 1.0,
      intensity: 2.0,
      speed: 0.5,
      palette: [c("#332200"), c("#aa7700"), c("#ffcc00"), c("#ffffaa"), c("#ffffff"), x, x, x],
      p1: 0.5, // Density
      p12: 0.2, // Rot X
      p13: 0.3, // Rot Y
    },
    postProcess: { bloom: true, bloomStrength: 1.5 },
    blending: {
      enabled: true,
      type: TextureType.HOLO_FOIL,
      mode: BlendMode.ADD,
      opacity: 0.4,
      scale: 2,
      factor: 0.5,
      intensity: 1,
    },
  }),

  // =================================================================================
  // 🦾 CYBERPUNK & UI
  // =================================================================================
  p(TextureType.BINARY_MATRIX, "Cyberpunk", "Netrunner Dive", {
    params: {
      scale: 1.5,
      intensity: 1.8,
      speed: 1.2,
      palette: [c("#000000"), c("#001100"), c("#003300"), c("#00ff33"), c("#ccffcc"), x, x, x],
      p3: 0.9, // Rain Density
      p4: 0.4, // Glitch Chance
      p5: 0.2, // Fade
      p13: 0.1, // Horizontal Drift
    },
    environment: { sceneAscii: true, sceneScanlines: true, sceneBloom: true },
    postProcess: {
      bloom: true,
      bloomStrength: 1.5,
      pixelate: true,
      pixelDensity: 128,
      glitch: true,
      glitchStrength: 0.3,
    },
  }),
  p(TextureType.CIRCUIT, "Cyberpunk", "Motherboard", {
    params: {
      scale: 5.0,
      intensity: 1.2,
      factor: 0.3,
      speed: 0.05,
      palette: [c("#050505"), c("#111111"), c("#222222"), c("#aa8800"), c("#ffcc00"), x, x, x],
      p10: 0.6, // Nodes
      p6: 0.4, // Tech Level
      p3: 0.2, // Thickness
    },
    postProcess: { bloom: true, bloomStrength: 0.8 },
    environment: { metalness: 0.9, roughness: 0.3, sceneScanlines: true },
  }),
  p(TextureType.CONE, "Cyberpunk", "Targeting Radar", {
    params: {
      scale: 1.0,
      intensity: 1.5,
      speed: 2.0,
      factor: 1.0,
      palette: [c("#000000"), c("#220000"), c("#880000"), c("#ff0000"), c("#ffffff"), x, x, x],
      p1: 0.1, // Gradient Steps
      p2: 0.0, // Smooth
      p3: 0.0,
      p12: 0.0,
    },
    postProcess: {
      scanlines: true,
      scanlineIntensity: 0.4,
      crtDistortion: 0.1,
      bloom: true,
      bloomStrength: 1.0,
    },
    blending: {
      enabled: true,
      type: TextureType.HEXAGON_GRID,
      mode: BlendMode.ADD,
      opacity: 0.3,
      scale: 5.0,
      factor: 0.1,
      intensity: 1.0,
    },
  }),
  p(TextureType.SCANLINES, "Cyberpunk", "System Failure", {
    params: {
      scale: 10.0,
      intensity: 1.0,
      speed: 0.2,
      palette: [c("#000000"), c("#ffffff"), c("#ff0000"), x, x, x, x, x],
      p1: 0.4, // Noise
      p2: 0.3, // Jitter
      p6: 0.8, // RGB Split
      p15: 0.5, // Static
    },
    environment: { sceneGlitch: true, sceneChromatic: true },
    postProcess: {
      glitch: true,
      glitchStrength: 1.0,
      glitchSpeed: 3.0,
      chromaticAberration: 1.5,
      crtDistortion: 0.3,
      pixelate: true,
      pixelDensity: 256,
    },
  }),

  // =================================================================================
  // ☣️ BIOTECH & HORROR
  // =================================================================================
  p(TextureType.ALIEN_BIOMASS, "Biotech", "Zerg Creep", {
    params: {
      scale: 1.2,
      intensity: 1.0,
      factor: 0.6,
      speed: 0.3,
      palette: [
        c("#1a0505"),
        c("#2b0000"),
        c("#4d0014"),
        c("#800020"),
        c("#ff3333"),
        c("#ff9999"),
        x,
        x,
      ],
      p1: 0.6, // Pulse
      p3: 0.5, // Veins
      p7: 0.8, // Wetness
      p13: 0.4, // Slime
    },
    normalMap: { enabled: true, strength: 3.5, smoothness: 0.9 },
    environment: {
      roughness: 0.1,
      metalness: 0.1,
      envType: 1,
      lightIntensity: 2.0,
      sceneVignette: true,
    },
  }),
  p(TextureType.TRABECULUM, "Biotech", "Bone Marrow", {
    params: {
      scale: 4.0,
      intensity: 1.0,
      factor: 0.45,
      palette: [c("#3e2723"), c("#5d4037"), c("#8d6e63"), c("#d7ccc8"), c("#ffffff"), x, x, x],
      p3: 0.5, // Thickness
      p4: 0.7, // Pore Size
      p10: 0.4, // Erode
    },
    normalMap: { enabled: true, strength: 2.0, invert: true, smoothness: 0.3 },
    ao: { enabled: true, strength: 2.0, radius: 0.4 },
    environment: { roughness: 0.7, metalness: 0.0 },
  }),
  p(TextureType.GYROID, "Biotech", "Alien Brain", {
    params: {
      scale: 3.0,
      intensity: 1.0,
      factor: 0.5,
      speed: 0.1,
      palette: [c("#220022"), c("#440044"), c("#880088"), c("#aa44aa"), c("#ff88ff"), x, x, x],
      p1: 0.6, // Thickness
      p2: 0.3, // Twist
      p5: 0.9, // Detail
      p11: 0.1, // Erode
    },
    geometry: GeometryType.SPHERE,
    normalMap: { enabled: true, strength: 2.0 },
    ao: { enabled: true, strength: 1.5, radius: 0.5 },
    environment: { roughness: 0.2, metalness: 0.4, sceneChromatic: true },
  }),

  // =================================================================================
  // 🏔️ NATURE & ELEMENTS
  // =================================================================================
  p(TextureType.COMPLEX_FIRE, "Elements", "Inferno", {
    params: {
      scale: 1.5,
      intensity: 1.3,
      factor: 0.5,
      speed: 0.8,
      palette: [
        c("#000000"),
        c("#1a0500"),
        c("#4d1a00"),
        c("#ff4400"),
        c("#ffcc00"),
        c("#ffffff"),
        x,
        x,
      ],
      p2: 0.6, // Sparks
      p3: 0.4, // Turbulence
      p7: 0.7, // Core Temp
      p4: 0.3, // Smoke Mix
    },
    postProcess: { bloom: true, bloomStrength: 1.8, bloomThreshold: 0.3 },
    environment: {
      smokeEnabled: true,
      smokeColor: "#331100",
      smokeDensity: 0.8,
      particlesEnabled: true,
      particleSpeed: 1.5,
      particleCount: 200,
    },
  }),
  p(TextureType.FROST_PATTERN, "Elements", "Glacial Ice", {
    params: {
      scale: 1.5,
      intensity: 1.0,
      factor: 0.7,
      speed: 0.02,
      palette: [
        c("#001122"),
        c("#113355"),
        c("#336699"),
        c("#88aacc"),
        c("#ddeeff"),
        c("#ffffff"),
        x,
        x,
      ],
      p1: 0.8, // Crystal Density
      p2: 0.3, // Branching
      p13: 0.6, // Thickness
    },
    postProcess: { bloom: true, bloomStrength: 0.6 },
    normalMap: { enabled: true, strength: 3.5, smoothness: 0.9 },
    environment: { roughness: 0.1, metalness: 0.1, sceneTiltShift: true, sceneTiltShiftBlur: 0.3 },
  }),
  p(TextureType.REALISTIC_CLOUDS, "Elements", "Storm Front", {
    params: {
      scale: 1.2,
      intensity: 1.0,
      factor: 0.6,
      speed: 0.3,
      palette: [
        c("#0a0a1a"),
        c("#16213e"),
        c("#303a52"),
        c("#4b5d67"),
        c("#909090"),
        c("#c0c0c0"),
        x,
        x,
      ],
      p1: 0.8, // Coverage
      p2: 0.5, // Absorb
      p3: 0.6, // Density
      p12: 0.4, // Layering
    },
    environment: {
      envType: 3,
      lightIntensity: 0.6,
      fogEnabled: true,
      fogDensity: 0.02,
      fogColor: "#16213e",
    },
  }),
  p(TextureType.CAUSTICS, "Elements", "Caribbean Pool", {
    params: {
      scale: 3.0,
      intensity: 1.2,
      speed: 0.6,
      factor: 0.5,
      palette: [
        c("#006994"),
        c("#0088bb"),
        c("#00aadd"),
        c("#44ccff"),
        c("#88eeff"),
        c("#ffffff"),
        x,
        x,
      ],
      p3: 0.2, // Chromatic Aberration in pattern
      p2: 0.8, // Sharpness
    },
    blending: {
      enabled: true,
      type: TextureType.MOSAIC,
      mode: BlendMode.MULTIPLY,
      opacity: 0.4,
      scale: 6.0,
      factor: 0.0,
      intensity: 1.0,
    },
    environment: { stageEnabled: true, stageColor: "#004466" },
  }),
  p(TextureType.MARBLE, "Elements", "Molten Rock", {
    params: {
      scale: 2.0,
      intensity: 1.2,
      speed: 0.1,
      palette: [
        c("#1a0000"),
        c("#330000"),
        c("#660000"),
        c("#aa2200"),
        c("#ff6600"),
        c("#ffff00"),
        x,
        x,
      ],
      p1: 0.7, // Vein Sharpness
      p4: 0.8, // Turbulence
      p12: 0.3, // Grain
    },
    postProcess: { bloom: true, bloomStrength: 1.5, bloomThreshold: 0.4 },
    normalMap: { enabled: true, strength: 3.0 },
    environment: { smokeEnabled: true, smokeColor: "#220000" },
  }),

  // =================================================================================
  // 🧱 REALISTIC MATERIALS
  // =================================================================================
  p(TextureType.GRUNGE, "Materials", "Rusted Metal", {
    params: {
      scale: 2.5,
      intensity: 1.0,
      factor: 0.7,
      palette: [
        c("#2b1d0e"),
        c("#4e2a14"),
        c("#8b4513"),
        c("#a0522d"),
        c("#cd853f"),
        c("#888888"),
        x,
        x,
      ],
      p1: 0.6, // Dirt
      p2: 0.5, // Scratch
      p4: 0.6, // Erode
      p11: 0.4, // Seed
    },
    environment: { metalness: 0.8, roughness: 0.6 },
    normalMap: { enabled: true, strength: 2.5 },
  }),
  p(TextureType.BRICKS, "Materials", "Dungeon Wall", {
    params: {
      scale: 3.5,
      intensity: 1.0,
      factor: 0.6,
      palette: [c("#0a0500"), c("#1a1105"), c("#332211"), c("#554433"), c("#776655"), x, x, x],
      p1: 0.18, // Mortar
      p2: 0.5, // Stagger
      p6: 0.9, // Noise/Aging
      p7: 0.5, // Cracks
      p10: 0.3, // Roughness
    },
    normalMap: { enabled: true, strength: 6.0 },
    ao: { enabled: true, strength: 1.8 },
  }),
  p(TextureType.WEAVE_KNIT, "Materials", "Chainmail", {
    params: {
      scale: 12.0,
      intensity: 1.2,
      palette: [
        c("#000000"),
        c("#222222"),
        c("#555555"),
        c("#888888"),
        c("#aaaaaa"),
        c("#ffffff"),
        x,
        x,
      ],
      p1: 0.8, // Mix
      p3: 0.25, // Width
      p9: 0.1, // Tension
      p12: 0.0, // Grain
    },
    environment: { metalness: 1.0, roughness: 0.35 },
    normalMap: { enabled: true, strength: 4.5 },
  }),
  p(TextureType.WOOD, "Materials", "Polished Oak", {
    params: {
      scale: 2.5,
      intensity: 1.0,
      factor: 0.5,
      palette: [c("#2b1a0e"), c("#452815"), c("#6d4c41"), c("#8d6e63"), c("#a1887f"), x, x, x],
      p3: 0.2, // Knots
      p5: 0.1, // Warp
      p12: 0.15, // Grain Detail
    },
    normalMap: { enabled: true, strength: 1.5, smoothness: 0.6 },
    environment: { roughness: 0.2, metalness: 0.0 },
  }),
  p(TextureType.MOSAIC, "Materials", "Bathroom Tiles", {
    params: {
      scale: 8.0,
      intensity: 1.0,
      factor: 0.2,
      palette: [c("#ffffff"), c("#dddddd"), c("#aabbcc"), c("#8899aa"), x, x, x, x],
      p4: 0.05, // Grout Width
      p5: 0.1, // Roughness
      p6: 0.0, // Tilt
    },
    normalMap: { enabled: true, strength: 1.5, smoothness: 0.1 },
  }),

  // =================================================================================
  // 🌀 ABSTRACT & MOTION GRAPHICS
  // =================================================================================
  p(TextureType.HYPNOTIC_RINGS, "Abstract", "Vertigo", {
    params: {
      scale: 3.0,
      intensity: 1.0,
      speed: 1.5,
      palette: [c("#000000"), c("#ffffff"), x, x, x, x, x, x],
      p3: 0.3, // Warp
      p5: 0.6, // Spiral
      p9: 0.7, // Pulse
    },
    transform: { angle: 0, offsetX: 0, offsetY: 0 },
    postProcess: { polar: false, radialMask: 0.3 },
  }),
  p(TextureType.SMOOTH_SWIRL, "Abstract", "Liquid Candy", {
    params: {
      scale: 1.8,
      intensity: 1.0,
      speed: 0.6,
      palette: [c("#ff00aa"), c("#aa00ff"), c("#00aaff"), c("#00ffaa"), c("#ffff00"), x, x, x],
      p2: 0.6, // Swirl
      p3: 0.8, // Detail
      p11: 0.4, // Warp
    },
    environment: { roughness: 0.2, metalness: 0.1 },
  }),
  p(TextureType.MANDELBROT, "Abstract", "Deep Fractal", {
    params: {
      scale: 1.0,
      intensity: 1.5,
      palette: [
        c("#000000"),
        c("#000510"),
        c("#001133"),
        c("#003366"),
        c("#ffaa00"),
        c("#ffff00"),
        c("#ffffff"),
        x,
      ],
      p4: 60.0, // Iterations
      p7: 0.9, // Glow
      p8: 3.0, // Color Stripe
      p13: -0.7, // Pan X
      p14: 0.0, // Pan Y
    },
    postProcess: { bloom: true, bloomStrength: 0.6 },
  }),
  p(TextureType.NEON_RIPPLES, "Abstract", "Synthwave Grid", {
    params: {
      scale: 2.0,
      intensity: 1.5,
      speed: 0.8,
      palette: [c("#220033"), c("#660066"), c("#ff00aa"), c("#00ffff"), x, x, x, x],
      p1: 0.5, // Freq
      p4: 0.3, // Distort
      p7: 0.8, // Glow
    },
    transform: { offsetX: 0, offsetY: -0.2 },
    environment: { sceneRuttEtra: true },
    postProcess: { bloom: true, bloomStrength: 1.8, scanlines: true },
  }),
  p(TextureType.SPACE_DUST, "Abstract", "Nebula Cloud", {
    params: {
      scale: 1.0,
      intensity: 1.2,
      speed: 0.2,
      palette: [
        c("#000000"),
        c("#110022"),
        c("#330044"),
        c("#660066"),
        c("#ff0088"),
        c("#00aaff"),
        x,
        x,
      ],
      p2: 0.5, // Density
      p6: 0.8, // Stars
      p7: 0.6, // Nebula
    },
    environment: {
      fogEnabled: true,
      fogColor: "#110022",
      fogDensity: 0.05,
      sceneBloom: true,
      sceneBloomIntensity: 0.5,
    },
  }),

  // =================================================================================
  // 👾 RETRO & PIXEL ART
  // =================================================================================
  p(TextureType.ISOMETRIC, "Retro", "Q-Bert 8Bit", {
    params: {
      scale: 8.0,
      intensity: 1.0,
      palette: [c("#000000"), c("#ffaa00"), c("#ff0000"), c("#0000ff"), x, x, x, x],
      p3: 0.05, // Edge Width
      p6: 0.2, // Shadow
    },
    environment: { scenePixelate: true, sceneOutline: true },
    postProcess: { pixelate: true, pixelDensity: 64, posterize: true, posterizeLevels: 4 },
  }),
  p(TextureType.MAZE, "Retro", "Pac-Maze", {
    params: {
      scale: 5.0,
      intensity: 1.0,
      palette: [c("#000000"), c("#0000aa"), x, x, x, x, x, x],
      p4: 0.25, // Wall Width
      p5: 0.0, // Roundness
      p10: 0.0, // 3D
    },
    environment: { sceneAscii: true },
    postProcess: { pixelate: true, pixelDensity: 128, bloom: true, bloomStrength: 0.6 },
  }),
  p(TextureType.CHECKER, "Retro", "Vapor Checker", {
    params: {
      scale: 4.0,
      intensity: 1.0,
      palette: [c("#220033"), c("#ff00aa"), x, x, x, x, x, x],
      p8: 0.1, // Grid Lines only
      p7: 0.6, // Horizon Fade
    },
    transform: { angle: 0, offsetX: 0, offsetY: -0.25 },
    environment: { sceneDither: true, sceneRuttEtra: true },
    postProcess: { bloom: true, bloomStrength: 1.5, scanlines: true, scanlineIntensity: 0.3 },
  }),
];
