import { TextureType } from "../../core/types/types";
import { registerTslPattern } from "./tslBuilder";

// ─── Fire Patterns ───
import {
  complexFire,
  flame,
  fire,
  solar,
  spark,
  flash,
  lightning,
  laser,
  flare,
  plasma,
} from "./patterns/firePatterns";

// ─── Nature Patterns ───
import {
  cloud,
  realisticClouds,
  smoke,
  water,
  snow,
  rain,
  bubbles,
  caustics,
  inkSplat,
  mosaic,
  crystals,
  seaWaves,
  frostPattern,
} from "./patterns/naturePatterns";

// ─── Abstract Patterns ───
import {
  scanlines,
  magicCircle,
  mandala,
  electric,
  binaryMatrix,
  explosion,
  radialWave,
  circuit,
  mandelbrot,
  julia,
  flowField,
  infiniteFall,
  voxelTunnel,
  hypnoticRings,
  metaballSpiral,
  inverseMobius,
  stereoFlow,
  smoothSwirl,
  neonRipples,
  blackHole,
  spaceDust,
  gaborNoise,
} from "./patterns/abstractPatterns";

// ─── SDF Patterns ───
import {
  hyperTunnel,
  alienBiomass,
  cubicSpace,
  lowTechTunnel,
  octgrams,
  cosmicFlow,
  indraNet,
  sphericalSpiral,
  alienCocoon,
  volumetricFog,
} from "./patterns/sdfPatterns";

// Fire (10)
registerTslPattern(TextureType.COMPLEX_FIRE, complexFire);
registerTslPattern(TextureType.FLAME, flame);
registerTslPattern(TextureType.FIRE, fire);
registerTslPattern(TextureType.SOLAR, solar);
registerTslPattern(TextureType.SPARK, spark);
registerTslPattern(TextureType.FLASH, flash);
registerTslPattern(TextureType.LIGHTNING, lightning);
registerTslPattern(TextureType.LASER, laser);
registerTslPattern(TextureType.FLARE, flare);
registerTslPattern(TextureType.PLASMA, plasma);

// Nature (13)
registerTslPattern(TextureType.CLOUD, cloud);
registerTslPattern(TextureType.REALISTIC_CLOUDS, realisticClouds);
registerTslPattern(TextureType.SMOKE, smoke);
registerTslPattern(TextureType.WATER, water);
registerTslPattern(TextureType.SNOW, snow);
registerTslPattern(TextureType.RAIN, rain);
registerTslPattern(TextureType.BUBBLES, bubbles);
registerTslPattern(TextureType.CAUSTICS, caustics);
registerTslPattern(TextureType.INK_SPLAT, inkSplat);
registerTslPattern(TextureType.MOSAIC, mosaic);
registerTslPattern(TextureType.CRYSTALS, crystals);
registerTslPattern(TextureType.SEA_WAVES, seaWaves);
registerTslPattern(TextureType.FROST_PATTERN, frostPattern);

// Abstract (22)
registerTslPattern(TextureType.SCANLINES, scanlines);
registerTslPattern(TextureType.MAGIC_CIRCLE, magicCircle);
registerTslPattern(TextureType.MANDALA, mandala);
registerTslPattern(TextureType.ELECTRIC, electric);
registerTslPattern(TextureType.BINARY_MATRIX, binaryMatrix);
registerTslPattern(TextureType.EXPLOSION, explosion);
registerTslPattern(TextureType.RADIAL_WAVE, radialWave);
registerTslPattern(TextureType.CIRCUIT, circuit);
registerTslPattern(TextureType.MANDELBROT, mandelbrot);
registerTslPattern(TextureType.JULIA, julia);
registerTslPattern(TextureType.FLOW_FIELD, flowField);
registerTslPattern(TextureType.INFINITE_FALL, infiniteFall);
registerTslPattern(TextureType.VOXEL_TUNNEL, voxelTunnel);
registerTslPattern(TextureType.HYPNOTIC_RINGS, hypnoticRings);
registerTslPattern(TextureType.METABALL_SPIRAL, metaballSpiral);
registerTslPattern(TextureType.INVERSE_MOBIUS, inverseMobius);
registerTslPattern(TextureType.STEREO_FLOW, stereoFlow);
registerTslPattern(TextureType.SMOOTH_SWIRL, smoothSwirl);
registerTslPattern(TextureType.NEON_RIPPLES, neonRipples);
registerTslPattern(TextureType.BLACK_HOLE, blackHole);
registerTslPattern(TextureType.SPACE_DUST, spaceDust);
registerTslPattern(TextureType.GABOR_NOISE, gaborNoise);

// SDF (10)
registerTslPattern(TextureType.HYPER_TUNNEL, hyperTunnel);
registerTslPattern(TextureType.ALIEN_BIOMASS, alienBiomass);
registerTslPattern(TextureType.CUBIC_SPACE, cubicSpace);
registerTslPattern(TextureType.LOW_TECH_TUNNEL, lowTechTunnel);
registerTslPattern(TextureType.OCTGRAMS, octgrams);
registerTslPattern(TextureType.COSMIC_FLOW, cosmicFlow);
registerTslPattern(TextureType.INDRA_NET, indraNet);
registerTslPattern(TextureType.SPHERICAL_SPIRAL, sphericalSpiral);
registerTslPattern(TextureType.ALIEN_COCOON, alienCocoon);
registerTslPattern(TextureType.VOLUMETRIC_FOG, volumetricFog);
