import checkerGlsl from "../../../data/patterns/glsl/shapes/checker.glsl?raw";
import hexagonGridGlsl from "../../../data/patterns/glsl/shapes/hexagon_grid.glsl?raw";
import circleGlsl from "../../../data/patterns/glsl/shapes/circle.glsl?raw";
import flowerGlsl from "../../../data/patterns/glsl/shapes/flower.glsl?raw";
import ringGlsl from "../../../data/patterns/glsl/shapes/ring.glsl?raw";
import coneGlsl from "../../../data/patterns/glsl/shapes/cone.glsl?raw";
import crossGlsl from "../../../data/patterns/glsl/shapes/cross.glsl?raw";
import bricksGlsl from "../../../data/patterns/glsl/shapes/bricks.glsl?raw";
import zigzagGlsl from "../../../data/patterns/glsl/shapes/zigzag.glsl?raw";
import wavePatternGlsl from "../../../data/patterns/glsl/shapes/wave_pattern.glsl?raw";
import waveformGlsl from "../../../data/patterns/glsl/shapes/waveform.glsl?raw";
import truchetGlsl from "../../../data/patterns/glsl/shapes/truchet.glsl?raw";
import isometricGlsl from "../../../data/patterns/glsl/shapes/isometric.glsl?raw";
import spiralGlsl from "../../../data/patterns/glsl/shapes/spiral.glsl?raw";
import starburstGlsl from "../../../data/patterns/glsl/shapes/starburst.glsl?raw";
import uvDebugGlsl from "../../../data/patterns/glsl/shapes/uv_debug.glsl?raw";
import mazeGlsl from "../../../data/patterns/glsl/shapes/maze.glsl?raw";
import warpGridGlsl from "../../../data/patterns/glsl/shapes/warp_grid.glsl?raw";
import isoLinesGlsl from "../../../data/patterns/glsl/shapes/iso_lines.glsl?raw";
import crossStitchGlsl from "../../../data/patterns/glsl/shapes/cross_stitch.glsl?raw";
import weaveKnitGlsl from "../../../data/patterns/glsl/shapes/weave_knit.glsl?raw";
import rotatingGridGlsl from "../../../data/patterns/glsl/shapes/rotating_grid.glsl?raw";
import rippleGridGlsl from "../../../data/patterns/glsl/shapes/ripple_grid.glsl?raw";
import rgbRingsGlsl from "../../../data/patterns/glsl/shapes/rgb_rings.glsl?raw";
import pyramidSceneGlsl from "../../../data/patterns/glsl/shapes/pyramid_scene.glsl?raw";

import { TextureType, PatternDefinition } from "../../../core/types/types";

export const SHAPES: Partial<Record<TextureType, PatternDefinition>> = {
  [TextureType.CHECKER]: { code: checkerGlsl },

  [TextureType.HEXAGON_GRID]: { code: hexagonGridGlsl },

  [TextureType.CIRCLE]: { code: circleGlsl },

  [TextureType.FLOWER]: { code: flowerGlsl },

  [TextureType.RING]: { code: ringGlsl },

  [TextureType.CONE]: { code: coneGlsl },

  [TextureType.CROSS]: { code: crossGlsl },

  [TextureType.BRICKS]: { code: bricksGlsl },

  [TextureType.ZIGZAG]: { code: zigzagGlsl },

  [TextureType.WAVE_PATTERN]: { code: wavePatternGlsl },

  [TextureType.WAVEFORM]: { code: waveformGlsl },

  [TextureType.TRUCHET]: { code: truchetGlsl },

  [TextureType.ISOMETRIC]: { code: isometricGlsl },

  [TextureType.SPIRAL]: { code: spiralGlsl },

  [TextureType.STARBURST]: { code: starburstGlsl },

  [TextureType.UV_DEBUG]: { code: uvDebugGlsl },

  [TextureType.MAZE]: { code: mazeGlsl },

  [TextureType.WARP_GRID]: { code: warpGridGlsl },

  [TextureType.ISO_LINES]: { code: isoLinesGlsl },

  [TextureType.CROSS_STITCH]: { code: crossStitchGlsl },

  [TextureType.WEAVE_KNIT]: { code: weaveKnitGlsl },

  [TextureType.ROTATING_GRID]: { code: rotatingGridGlsl },

  [TextureType.RIPPLE_GRID]: { code: rippleGridGlsl },

  [TextureType.RGB_RINGS]: { code: rgbRingsGlsl },
  [TextureType.PYRAMID_SCENE]: { code: pyramidSceneGlsl },
};
