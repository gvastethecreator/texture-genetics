import flameGlsl from '../../../data/patterns/glsl/fire/flame.glsl?raw';
import fireGlsl from '../../../data/patterns/glsl/fire/fire.glsl?raw';
import solarGlsl from '../../../data/patterns/glsl/fire/solar.glsl?raw';
import sparkGlsl from '../../../data/patterns/glsl/fire/spark.glsl?raw';
import flashGlsl from '../../../data/patterns/glsl/fire/flash.glsl?raw';
import lightningGlsl from '../../../data/patterns/glsl/fire/lightning.glsl?raw';
import laserGlsl from '../../../data/patterns/glsl/fire/laser.glsl?raw';
import flareGlsl from '../../../data/patterns/glsl/fire/flare.glsl?raw';
import plasmaGlsl from '../../../data/patterns/glsl/fire/plasma.glsl?raw';

import { TextureType, PatternDefinition } from '../../../core/types/types';

export const FIRE_LIGHT: Partial<Record<TextureType, PatternDefinition>> = {
    [TextureType.COMPLEX_FIRE]: { deps: ['simplex'], code: `float noiseStack(vec3 pos, int octaves, float falloff) { float n=snoise(pos); float off=1.0; float amp=1.0; for(int i=0;i<3;i++){ if(i>=octaves)break; pos*=2.0; off*=falloff; amp*=0.5; n=(1.0-off)*n+off*snoise(pos); } return(1.0+n)*0.5; } float getPattern(vec2 uv) { vec2 u=(uv-0.5)*2.0; u.y+=0.5; u.x+=u.y*(u_p1-0.5)*2.0; u.x+=sin(u.y*10.0+u_time*5.0)*u_p9*0.05; float scale=u_scale*3.0; float rise=u_speed*(1.0+u_p5*2.0); vec3 p=vec3(u*scale,u_time*rise); float xfuel=max(0.0, 1.0-abs(u.x*2.0)); float ypart=smoothstep(1.2,0.0,u.y); xfuel*=(1.0+u_p10*0.5); float fuel=pow(max(0.0, xfuel*ypart), 1.0+u_factor*2.0); int octaves=1+int(u_p6*3.0); float n=noiseStack(p+vec3(0.0,-u_time*2.0,0.0),octaves,0.5); float turbulence=u_p3*2.0; float fire=fuel*n*(1.0+u_intensity); float core=smoothstep(0.1,0.8-u_p7*0.4,fire); fire+=core*u_p2; if(u_p8>0.0){fire*=smoothstep(0.0,0.2+u_p8*0.5,fire);} if(u_p4>0.0){float smoke=noiseStack(p*0.5+vec3(0.0,u_time,0.0),2,0.6);fire=mix(fire,smoke*0.5,u_p4*u.y);} return clamp(fire,0.0,1.0); }` },
    [TextureType.FLAME]: { code: flameGlsl, deps: ['fbm']  },
    [TextureType.FIRE]: { code: fireGlsl, deps: ['fbm']  },
    [TextureType.SOLAR]: { code: solarGlsl, deps: ['fbm']  },
    [TextureType.SPARK]: { code: sparkGlsl  },
    [TextureType.FLASH]: { code: flashGlsl  },
    [TextureType.LIGHTNING]: { code: lightningGlsl  },
    [TextureType.LASER]: { code: laserGlsl  },
    [TextureType.FLARE]: { code: flareGlsl  },
    [TextureType.PLASMA]: { code: plasmaGlsl  },
};
