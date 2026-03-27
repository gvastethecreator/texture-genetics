import scanlinesGlsl from '../../../data/patterns/glsl/abstract/scanlines.glsl?raw';
import magicCircleGlsl from '../../../data/patterns/glsl/abstract/magic_circle.glsl?raw';
import mandalaGlsl from '../../../data/patterns/glsl/abstract/mandala.glsl?raw';
import electricGlsl from '../../../data/patterns/glsl/abstract/electric.glsl?raw';
import binaryMatrixGlsl from '../../../data/patterns/glsl/abstract/binary_matrix.glsl?raw';
import explosionGlsl from '../../../data/patterns/glsl/abstract/explosion.glsl?raw';
import radialWaveGlsl from '../../../data/patterns/glsl/abstract/radial_wave.glsl?raw';
import circuitGlsl from '../../../data/patterns/glsl/abstract/circuit.glsl?raw';
import mandelbrotGlsl from '../../../data/patterns/glsl/abstract/mandelbrot.glsl?raw';
import juliaGlsl from '../../../data/patterns/glsl/abstract/julia.glsl?raw';
import flowFieldGlsl from '../../../data/patterns/glsl/abstract/flow_field.glsl?raw';
import infiniteFallGlsl from '../../../data/patterns/glsl/abstract/infinite_fall.glsl?raw';
import voxelTunnelGlsl from '../../../data/patterns/glsl/abstract/voxel_tunnel.glsl?raw';
import hypnoticRingsGlsl from '../../../data/patterns/glsl/abstract/hypnotic_rings.glsl?raw';
import metaballSpiralGlsl from '../../../data/patterns/glsl/abstract/metaball_spiral.glsl?raw';
import inverseMobiusGlsl from '../../../data/patterns/glsl/abstract/inverse_mobius.glsl?raw';
import stereoFlowGlsl from '../../../data/patterns/glsl/abstract/stereo_flow.glsl?raw';
import smoothSwirlGlsl from '../../../data/patterns/glsl/abstract/smooth_swirl.glsl?raw';
import neonRipplesGlsl from '../../../data/patterns/glsl/abstract/neon_ripples.glsl?raw';
import gaborNoiseGlsl from '../../../data/patterns/glsl/abstract/gabor_noise.glsl?raw';

import { TextureType, PatternDefinition } from '../../../core/types/types';

export const ABSTRACT: Partial<Record<TextureType, PatternDefinition>> = {
    [TextureType.SCANLINES]: { code: scanlinesGlsl  },

    [TextureType.MAGIC_CIRCLE]: { code: magicCircleGlsl  },

    [TextureType.MANDALA]: { code: mandalaGlsl  },
    [TextureType.ELECTRIC]: { code: electricGlsl  },
    [TextureType.BINARY_MATRIX]: { code: binaryMatrixGlsl  },
    [TextureType.EXPLOSION]: { code: explosionGlsl  },
    [TextureType.RADIAL_WAVE]: { code: radialWaveGlsl  },
    
    [TextureType.CIRCUIT]: { code: circuitGlsl  },
    
    [TextureType.MANDELBROT]: { code: mandelbrotGlsl  },
    [TextureType.JULIA]: { code: juliaGlsl  },
    
    [TextureType.FLOW_FIELD]: { code: flowFieldGlsl  },
    
    [TextureType.INFINITE_FALL]: { code: infiniteFallGlsl  },
    [TextureType.VOXEL_TUNNEL]: { code: voxelTunnelGlsl  },
    [TextureType.HYPNOTIC_RINGS]: { code: hypnoticRingsGlsl  },
    [TextureType.METABALL_SPIRAL]: { code: metaballSpiralGlsl  },
    [TextureType.INVERSE_MOBIUS]: { code: inverseMobiusGlsl  },
    [TextureType.STEREO_FLOW]: { code: stereoFlowGlsl  },
    [TextureType.SMOOTH_SWIRL]: { code: smoothSwirlGlsl  },
    [TextureType.NEON_RIPPLES]: { code: neonRipplesGlsl  },
    [TextureType.BLACK_HOLE]: { deps: ['simplex'], code: `float light1(float intensity, float attenuation, float dist) { return intensity / (1.0 + dist * attenuation); } float light2(float intensity, float attenuation, float dist) { return intensity / (1.0 + dist * dist * attenuation); } float getPattern(vec2 uv) { vec2 u = (uv * 2.0 - 1.0) * u_scale; float len = length(u); float ang = atan(u.y, u.x); float n0 = snoise(u * 0.65 + u_time * 0.5) * 0.5 + 0.5; float r0 = mix(mix(0.6, 1.0, 0.4), mix(0.6, 1.0, 0.6), n0); float d0 = distance(u, r0 / max(0.001, len) * u); float v0 = light1(1.0, 10.0, d0); v0 *= smoothstep(r0 * 1.05, r0, len); float a = u_time * -1.0; vec2 pos = vec2(cos(a), sin(a)) * r0; float d = distance(u, pos); float v1 = light2(1.5, 5.0, d); v1 *= light1(1.0, 50.0, d0); float v2 = smoothstep(1.0, mix(0.6, 1.0, n0 * 0.5), len); float v3 = smoothstep(0.6, mix(0.6, 1.0, 0.5), len); float col = (v0 + v1) * v2 * v3; col += (1.0 / (len * 2.0 + 0.1)) * u_factor * 0.1; return clamp(col, 0.0, 1.0) * u_intensity; }` },
    [TextureType.SPACE_DUST]: { deps: ['sdf'], code: `float getPattern(vec2 uv) { vec2 u = (uv - 0.5) * 2.0; vec3 d = normalize(vec3(u, 1.0 - u_distortion * 0.5)); vec3 p = vec3(0.0, 0.0, -3.0); float t = u_time * u_speed; mat2 r = rot2D(t * 0.2); d.xz *= r; p.xz *= r; float i=0.0, l=0.0; vec3 c = p; float accum = 0.0; for(int j=0; j<60; j++) { vec3 v = p; float s = 1.0; for(float k=0.0; k<5.0; k++) { v = abs(v) - vec3(1.0 + u_scale * 0.2); v.xz *= rot2D(1.0 + u_factor); v.yz *= rot2D(1.0); s *= 0.5; } float dist = length(v) * s - 0.02; if (dist < 0.01) { accum += 0.1 / (1.0 + float(j)*0.1); p += d * dist; } else { p += d * max(0.05, dist); } if (length(p) > 20.0) break; } return clamp(accum * u_intensity, 0.0, 1.0); }` },
    [TextureType.GABOR_NOISE]: { code: gaborNoiseGlsl  },
};
