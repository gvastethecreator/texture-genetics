/**
 * TSL Pattern Registration
 * Imports all TSL patterns and registers them in TSL_PATTERN_MAP.
 * Import this module once at app startup.
 */
import { TextureType } from '../../core/types/types';
import { registerTslPattern } from './tslBuilder';

// ─── Gradient Patterns ───
import { gradientLinear, gradientRadial, gradientStripes } from './patterns/gradients';

// ─── Shape Patterns ───
import {
    checker, circle, ring, cone, crossPattern,
    hexagonGrid, isometric, flower, bricks, zigzag,
    wavePattern, waveform, truchet, spiral, starburst,
    crossStitch, rgbRings, weaveKnit, rotatingGrid, rippleGrid,
    uvDebug, maze, pyramidScene, warpGrid, isoLines,
} from './patterns/shapes';

// ─── Noise Patterns ───
import {
    perlinNoise, simplexNoise, cellularNoise, worleyNoise,
    gradientNoise, valueNoisePattern, fbmNoise, ridgedFractal,
    voronoiSmoothPattern, voronoiRocks, trabeculum, turbulence,
    gyroidPattern, curlNoisePattern, marble, wood, grunge,
    squiggles, holoFoil, oilPaint, furFibers, fluidWarp,
} from './patterns/noisePatterns';

// ─── Fire Patterns ───
import {
    complexFire, flame, fire, solar, spark,
    flash, lightning, laser, flare, plasma,
} from './patterns/firePatterns';

// ─── Nature Patterns ───
import {
    cloud, realisticClouds, smoke, water, snow,
    rain, bubbles, caustics, inkSplat, mosaic,
    crystals, seaWaves, frostPattern,
} from './patterns/naturePatterns';

// ─── Abstract Patterns ───
import {
    scanlines, magicCircle, mandala, electric, binaryMatrix,
    explosion, radialWave, circuit, mandelbrot, julia,
    flowField, infiniteFall, voxelTunnel, hypnoticRings,
    metaballSpiral, inverseMobius, stereoFlow, smoothSwirl,
    neonRipples, blackHole, spaceDust, gaborNoise,
} from './patterns/abstractPatterns';

// ─── SDF Patterns ───
import {
    hyperTunnel, alienBiomass, cubicSpace, lowTechTunnel,
    octgrams, cosmicFlow, indraNet, sphericalSpiral,
    alienCocoon, volumetricFog,
} from './patterns/sdfPatterns';

// ─── Register All ───

// Gradients (3)
registerTslPattern(TextureType.GRADIENT_LINEAR, gradientLinear);
registerTslPattern(TextureType.GRADIENT_RADIAL, gradientRadial);
registerTslPattern(TextureType.GRADIENT_STRIPES, gradientStripes);

// Shapes (25)
registerTslPattern(TextureType.CHECKER, checker);
registerTslPattern(TextureType.CIRCLE, circle);
registerTslPattern(TextureType.RING, ring);
registerTslPattern(TextureType.CONE, cone);
registerTslPattern(TextureType.CROSS, crossPattern);
registerTslPattern(TextureType.HEXAGON_GRID, hexagonGrid);
registerTslPattern(TextureType.ISOMETRIC, isometric);
registerTslPattern(TextureType.FLOWER, flower);
registerTslPattern(TextureType.BRICKS, bricks);
registerTslPattern(TextureType.ZIGZAG, zigzag);
registerTslPattern(TextureType.WAVE_PATTERN, wavePattern);
registerTslPattern(TextureType.WAVEFORM, waveform);
registerTslPattern(TextureType.TRUCHET, truchet);
registerTslPattern(TextureType.SPIRAL, spiral);
registerTslPattern(TextureType.STARBURST, starburst);
registerTslPattern(TextureType.CROSS_STITCH, crossStitch);
registerTslPattern(TextureType.RGB_RINGS, rgbRings);
registerTslPattern(TextureType.WEAVE_KNIT, weaveKnit);
registerTslPattern(TextureType.ROTATING_GRID, rotatingGrid);
registerTslPattern(TextureType.RIPPLE_GRID, rippleGrid);
registerTslPattern(TextureType.UV_DEBUG, uvDebug);
registerTslPattern(TextureType.MAZE, maze);
registerTslPattern(TextureType.PYRAMID_SCENE, pyramidScene);
registerTslPattern(TextureType.WARP_GRID, warpGrid);
registerTslPattern(TextureType.ISO_LINES, isoLines);

// Noise (22)
registerTslPattern(TextureType.PERLIN_NOISE, perlinNoise);
registerTslPattern(TextureType.SIMPLEX_NOISE, simplexNoise);
registerTslPattern(TextureType.CELLULAR_NOISE, cellularNoise);
registerTslPattern(TextureType.WORLEY_NOISE, worleyNoise);
registerTslPattern(TextureType.GRADIENT_NOISE, gradientNoise);
registerTslPattern(TextureType.VALUE_NOISE, valueNoisePattern);
registerTslPattern(TextureType.FBM_NOISE, fbmNoise);
registerTslPattern(TextureType.RIDGED_FRACTAL, ridgedFractal);
registerTslPattern(TextureType.VORONOI_SMOOTH, voronoiSmoothPattern);
registerTslPattern(TextureType.VORONOI_ROCKS, voronoiRocks);
registerTslPattern(TextureType.TRABECULUM, trabeculum);
registerTslPattern(TextureType.TURBULENCE, turbulence);
registerTslPattern(TextureType.GYROID, gyroidPattern);
registerTslPattern(TextureType.CURL_NOISE, curlNoisePattern);
registerTslPattern(TextureType.MARBLE, marble);
registerTslPattern(TextureType.WOOD, wood);
registerTslPattern(TextureType.GRUNGE, grunge);
registerTslPattern(TextureType.SQUIGGLES, squiggles);
registerTslPattern(TextureType.HOLO_FOIL, holoFoil);
registerTslPattern(TextureType.OIL_PAINT, oilPaint);
registerTslPattern(TextureType.FUR_FIBERS, furFibers);
registerTslPattern(TextureType.FLUID_WARP, fluidWarp);

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
