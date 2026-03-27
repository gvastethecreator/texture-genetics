import perlinNoiseGlsl from '../../../data/patterns/glsl/noise/perlin_noise.glsl?raw';
import simplexNoiseGlsl from '../../../data/patterns/glsl/noise/simplex_noise.glsl?raw';
import cellularNoiseGlsl from '../../../data/patterns/glsl/noise/cellular_noise.glsl?raw';
import worleyNoiseGlsl from '../../../data/patterns/glsl/noise/worley_noise.glsl?raw';
import gradientNoiseGlsl from '../../../data/patterns/glsl/noise/gradient_noise.glsl?raw';
import valueNoiseGlsl from '../../../data/patterns/glsl/noise/value_noise.glsl?raw';
import ridgedFractalGlsl from '../../../data/patterns/glsl/noise/ridged_fractal.glsl?raw';
import voronoiSmoothGlsl from '../../../data/patterns/glsl/noise/voronoi_smooth.glsl?raw';
import trabeculumGlsl from '../../../data/patterns/glsl/noise/trabeculum.glsl?raw';
import turbulenceGlsl from '../../../data/patterns/glsl/noise/turbulence.glsl?raw';
import gyroidGlsl from '../../../data/patterns/glsl/noise/gyroid.glsl?raw';
import curlNoiseGlsl from '../../../data/patterns/glsl/noise/curl_noise.glsl?raw';
import marbleGlsl from '../../../data/patterns/glsl/noise/marble.glsl?raw';
import woodGlsl from '../../../data/patterns/glsl/noise/wood.glsl?raw';
import grungeGlsl from '../../../data/patterns/glsl/noise/grunge.glsl?raw';
import squigglesGlsl from '../../../data/patterns/glsl/noise/squiggles.glsl?raw';
import holoFoilGlsl from '../../../data/patterns/glsl/noise/holo_foil.glsl?raw';
import furFibersGlsl from '../../../data/patterns/glsl/noise/fur_fibers.glsl?raw';

import { TextureType, PatternDefinition } from '../../../core/types/types';

export const NOISE: Partial<Record<TextureType, PatternDefinition>> = {
    [TextureType.PERLIN_NOISE]: { code: perlinNoiseGlsl  },

    [TextureType.SIMPLEX_NOISE]: { code: simplexNoiseGlsl, deps: ['simplex']  },

    [TextureType.CELLULAR_NOISE]: { code: cellularNoiseGlsl, deps: ['voronoi']  },

    [TextureType.WORLEY_NOISE]: { code: worleyNoiseGlsl  },

    [TextureType.FBM_NOISE]: { deps: ['fbm'], code: `float getPattern(vec2 uv) { 
        float pers=0.5+(u_p1-0.5); 
        float lac=2.0+(u_p2-0.5); 
        vec2 st=uv*u_scale*3.0+u_time*0.1; 
        st += vec2(u_p14, u_p15); // Shift

        float v=0.0; 
        float a=0.5; 
        for(int i=0;i<6;i++){ 
            float n=noise(st); 
            v+=n*a; 
            st=st*lac+vec2(100.0); 
            a*=pers; 
        } 
        v=mix(v,smoothstep(0.2,0.8,v),u_factor);
        
        // P11: Warp
        if(u_p11 > 0.0) v += sin(st.x * 5.0) * 0.1 * u_p11;
        
        // P12: Grain
        if(u_p12 > 0.0) v += (random(st) - 0.5) * u_p12 * 0.1;

        return pow(clamp(v,0.0,1.0),u_intensity); 
    }` },

    [TextureType.GRADIENT_NOISE]: { code: gradientNoiseGlsl  },
    
    [TextureType.VALUE_NOISE]: { code: valueNoiseGlsl, deps: ['value']  },
    
    [TextureType.RIDGED_FRACTAL]: { code: ridgedFractalGlsl, deps: ['fbm']  },
    
    [TextureType.VORONOI_SMOOTH]: { code: voronoiSmoothGlsl, deps: ['voronoi']  },
    
    [TextureType.VORONOI_ROCKS]: { deps: ['voronoi'], code: `float getPattern(vec2 uv) { 
        vec2 p=uv*u_scale*2.0; 
        p += vec2(u_p14, u_p15);
        p+=sin(p*6.28*2.0-cos(p.yx*6.28*4.0))*0.01*u_distortion; 
        vec3 v1=voronoi(p*5.0); 
        vec3 v2=voronoi(p*15.0+2.0); 
        float rock=mix(v1.x,v2.x,u_p1); 
        if(u_factor>0.5)rock=1.0-rock; 
        float soft=u_p4*0.5; 
        rock=smoothstep(0.0+soft,1.0-u_p2*0.8-soft,rock); 
        
        // P15: Gamma
        if(u_p15 > 0.0) rock = pow(max(0.0, rock), 1.0 - u_p15 * 0.5);

        return pow(clamp(rock,0.0,1.0),u_intensity); 
    }` },
    
    [TextureType.TRABECULUM]: { code: trabeculumGlsl, deps: ['voronoi']  },
    
    [TextureType.TURBULENCE]: { code: turbulenceGlsl, deps: ['fbm']  },
    
    [TextureType.GYROID]: { code: gyroidGlsl, deps: ['gyroid']  },
    
    [TextureType.CURL_NOISE]: { code: curlNoiseGlsl, deps: ['simplex', 'curl']  },
    
    [TextureType.MARBLE]: { code: marbleGlsl, deps: ['fbm']  },
    
    [TextureType.WOOD]: { code: woodGlsl  },
    
    [TextureType.GRUNGE]: { code: grungeGlsl, deps: ['fbm']  },
    
    [TextureType.SQUIGGLES]: { code: squigglesGlsl  },
    
    [TextureType.HOLO_FOIL]: { code: holoFoilGlsl  },
    
    [TextureType.OIL_PAINT]: { deps: ['fbm'], code: `float getPattern(vec2 uv) { 
        vec2 p = uv * u_scale * 2.0; 
        p += vec2(u_p14, u_p15);
        vec2 q = vec2(fbm(p + vec2(0.0, 0.0)), fbm(p + vec2(5.2, 1.3))); 
        vec2 r = vec2(fbm(p + 4.0*q + vec2(1.7, 9.2) + 0.15*u_time), fbm(p + 4.0*q + vec2(8.3, 2.8) + 0.126*u_time)); 
        float f = fbm(p + 4.0*r); 
        float val = mix(f, length(q), u_factor); 
        
        // P12: Grain
        if(u_p12 > 0.0) val += (random(p*10.0) - 0.5) * u_p12 * 0.1;
        // P15: Gamma
        if(u_p15 > 0.0) val = pow(max(0.0, val), 1.0 - u_p15 * 0.5);

        return pow(clamp(val, 0.0, 1.0), u_intensity); 
    }` },
    
    [TextureType.FUR_FIBERS]: { code: furFibersGlsl, deps: ['fbm']  },
    
    [TextureType.FLUID_WARP]: { deps: ['fbm'], code: `float getPattern(vec2 uv) { 
        vec2 p = uv * u_scale * 2.0; 
        p += vec2(u_p14, u_p15);
        vec2 q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3))); 
        vec2 r = vec2(fbm(p + 4.0*q + vec2(1.7, 9.2) + 0.15*u_time*u_speed), fbm(p + 4.0*q + vec2(8.3, 2.8) + 0.126*u_time*u_speed)); 
        float f = fbm(p + 4.0*r); 
        float v = mix(f, length(q), u_factor); 
        if (u_detail > 0.5) v = mix(v, r.x, 0.5); 
        
        // P12: Grain
        if(u_p12 > 0.0) v += (random(p*10.0) - 0.5) * u_p12 * 0.1;
        // P15: Gamma
        if(u_p15 > 0.0) v = pow(max(0.0, v), 1.0 - u_p15 * 0.5);

        return pow(clamp(v, 0.0, 1.0), u_intensity); 
    }` },
};
