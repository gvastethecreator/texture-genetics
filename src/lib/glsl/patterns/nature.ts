import cloudGlsl from "../../../data/patterns/glsl/nature/cloud.glsl?raw";
import smokeGlsl from "../../../data/patterns/glsl/nature/smoke.glsl?raw";
import waterGlsl from "../../../data/patterns/glsl/nature/water.glsl?raw";
import snowGlsl from "../../../data/patterns/glsl/nature/snow.glsl?raw";
import rainGlsl from "../../../data/patterns/glsl/nature/rain.glsl?raw";
import bubblesGlsl from "../../../data/patterns/glsl/nature/bubbles.glsl?raw";
import causticsGlsl from "../../../data/patterns/glsl/nature/caustics.glsl?raw";
import inkSplatGlsl from "../../../data/patterns/glsl/nature/ink_splat.glsl?raw";
import mosaicGlsl from "../../../data/patterns/glsl/nature/mosaic.glsl?raw";
import crystalsGlsl from "../../../data/patterns/glsl/nature/crystals.glsl?raw";
import seaWavesGlsl from "../../../data/patterns/glsl/nature/sea_waves.glsl?raw";

import { TextureType, PatternDefinition } from "../../../core/types/types";

export const NATURE: Partial<Record<TextureType, PatternDefinition>> = {
  [TextureType.CLOUD]: { code: cloudGlsl, deps: ["fbm"] },
  [TextureType.REALISTIC_CLOUDS]: {
    deps: ["fbm"],
    code: `float getPattern(vec2 uv) { vec2 u = uv * u_scale; float time = u_time * u_speed * 0.1; float q = fbm(u * 1.1 * 0.5); float r = 0.0; vec2 uv2 = u * 1.1; uv2 -= q - time; float weight = 0.8; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for(int i=0; i<5; i++) { r += abs(weight * noise(uv2)); uv2 = m * uv2 + time; weight *= 0.7; } float f = 0.0; uv2 = u * 1.1; uv2 -= q - time; weight = 0.7; for(int i=0; i<5; i++) { f += weight * noise(uv2); uv2 = m * uv2 + time; weight *= 0.6; } f *= r + f; float cloud = (0.2 + u_factor * 0.5) + 8.0 * f * r; return clamp(cloud * u_intensity * 0.1, 0.0, 1.0); }`,
  },
  [TextureType.SMOKE]: { code: smokeGlsl, deps: ["fbm"] },

  [TextureType.WATER]: { code: waterGlsl },

  [TextureType.SNOW]: { code: snowGlsl },

  [TextureType.RAIN]: { code: rainGlsl },

  [TextureType.BUBBLES]: { code: bubblesGlsl },

  [TextureType.CAUSTICS]: { code: causticsGlsl },

  [TextureType.INK_SPLAT]: { code: inkSplatGlsl, deps: ["fbm"] },
  [TextureType.MOSAIC]: { code: mosaicGlsl },
  [TextureType.CRYSTALS]: { code: crystalsGlsl },

  [TextureType.SEA_WAVES]: { code: seaWavesGlsl },

  [TextureType.FROST_PATTERN]: {
    deps: ["sdf"],
    code: `float cylinderDist(vec3 p, float spacing) { p.z = mod(p.z - spacing, spacing) - 0.5 * spacing; p.x = abs(p.x); return length(p.xz - vec2(2.0, 0.0)) - 0.75; } float getPattern(vec2 uv) { vec2 u = (uv * 2.0 - 1.0) + vec2(-1.68, 0.9); float v = 50.0 * length(max(abs(u) - 0.05, 0.0)); float f = min(v, 1.0 - v) * 2.0 * fract(atan(u.y, u.x)/3.14159 - u_time * 0.3); vec3 ro = vec3(0.0); vec3 rd = normalize(vec3((uv - 0.5) * 2.0, 1.0)); float s = 1.0; float d = 0.0; float accum = 0.0; for(int i=0; i<40; i++) { if (s < 0.001 || d > 20.0) break; vec3 p = ro + rd * d; p.x -= 0.75; p.xy *= rot2D(length(p.xy - p.zy) * 0.3 * u_p1); p.z += sin(p.y + u_time); p.x = mix(abs(p.x), p.x, 0.01); p.z += u_time * 5.0 * u_speed; float scene = cylinderDist(p, 0.9 + u_factor); s = abs(scene) * 0.3; d += s; if(s > 0.001) accum += 0.002 / s; } return mix(clamp(f,0.0,1.0), clamp(accum * u_intensity, 0.0, 1.0), 0.8); }`,
  },
};
