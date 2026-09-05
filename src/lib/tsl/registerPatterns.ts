/**
 * TSL Pattern Registration
 * Imports all TSL patterns and registers them in TSL_PATTERN_MAP.
 * Import this module once at app startup.
 */
import { TextureType } from "../../core/types/types";
import { registerTslPattern } from "./tslBuilder";

// ─── Gradient Patterns ───
import { gradientLinear, gradientRadial, gradientStripes } from "./patterns/gradients";

// ─── Shape Patterns ───
import {
  checker,
  circle,
  ring,
  cone,
  crossPattern,
  hexagonGrid,
  isometric,
  flower,
  bricks,
  zigzag,
  wavePattern,
  waveform,
  truchet,
  spiral,
  starburst,
  crossStitch,
  rgbRings,
  weaveKnit,
  rotatingGrid,
  rippleGrid,
  uvDebug,
  maze,
  pyramidScene,
  warpGrid,
  isoLines,
} from "./patterns/shapes";

// ─── Noise Patterns ───
import {
  perlinNoise,
  simplexNoise,
  cellularNoise,
  worleyNoise,
  gradientNoise,
  valueNoisePattern,
  fbmNoise,
  ridgedFractal,
  voronoiSmoothPattern,
  voronoiRocks,
  trabeculum,
  turbulence,
  gyroidPattern,
  curlNoisePattern,
  marble,
  wood,
  grunge,
  squiggles,
  holoFoil,
  oilPaint,
  furFibers,
  fluidWarp,
} from "./patterns/noisePatterns";

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

export const loadOptionalTslPatterns = () => import("./registerOptionalTsl");

if (typeof requestIdleCallback === "function") {
  requestIdleCallback(() => {
    void loadOptionalTslPatterns();
  });
} else if (typeof setTimeout === "function") {
  setTimeout(() => {
    void loadOptionalTslPatterns();
  }, 1);
}
