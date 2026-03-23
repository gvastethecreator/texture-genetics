
import { TextureType, PatternDefinition } from '../../core/types/types';

export const SHAPES: Partial<Record<TextureType, PatternDefinition>> = {
    [TextureType.CHECKER]: { code: `float getPattern(vec2 uv) { 
        // Coords
        vec2 st = uv;
        // P12: X Shift, P13: Y Shift
        st += vec2(u_p12, u_p13);
        // P14: Rotation
        if(u_p14 != 0.0) st = rotate2d(u_p14 * 6.28) * (st - 0.5) + 0.5;

        vec2 u=st*u_scale*10.0; 
        u+=vec2(u_p6*2.0); 
        u+=vec2(sin(u.y*u_p10),cos(u.x*u_p10))*u_p10; 
        if(u_factor>0.0){float s=sin(u_factor);float c=cos(u_factor);u=mat2(c,-s,s,c)*u;} 
        // P11: Phase Shift
        u+=sin(u.yx*2.0 + u_p11 * 10.0)*u_p2*0.5; 
        
        vec2 id=floor(u); 
        vec2 f=fract(u); 
        float check=mod(id.x+id.y, 2.0); 
        if(u_p3>0.0){vec2 dist=abs(f-0.5)-0.5;float d=length(max(dist+u_p3*0.5,0.0));float shape=smoothstep(0.5,0.5-u_p1*0.5,d*2.0);check=mix(check,shape,u_p5);} 
        if(u_p4>0.0){float d=length(f-0.5);float inner=smoothstep(0.4,0.4-u_p1,d);check=mix(check,max(check,inner),u_p4);} 
        if(u_p8>0.0){float grid=max(step(1.0-u_p8,f.x),step(1.0-u_p8,f.y));grid=max(grid,max(step(f.x,u_p8),step(f.y,u_p8)));check=mix(check,1.0-check,grid);} 
        
        float softness=u_p1*0.5; 
        float result=smoothstep(0.5-softness,0.5+softness,check); 
        
        if(u_p9>0.0){float n=random(id+u_seed);result=mix(result,n,u_p9*0.5);} 
        if(u_p7>0.0){float distToCenter=length(uv-0.5);result*=1.0-smoothstep(0.2,0.8,distToCenter*u_p7*2.0);} 
        
        // P15: Gamma/Grain
        if(u_p15 > 0.0) {
            float noiseVal = random(uv * 100.0 + u_time);
            result = mix(result, noiseVal, u_p15 * 0.2);
        }
        
        return pow(max(0.0, result), u_intensity); 
    }` },

    [TextureType.HEXAGON_GRID]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv;
        st += vec2(u_p13, u_p14); // Offset
        if(u_p15 != 0.0) st = rotate2d(u_p15 * 3.14) * (st - 0.5) + 0.5;

        vec2 u=st*u_scale*10.0; 
        u.x+=floor(u.y)*u_p10; 
        if(u_p6>0.0){u+=sin(u.yx*2.0+u_time)*u_p6*0.2;} 
        
        // Hex Ratio (p12)
        float hr = 1.73 * (0.5 + u_p12);
        vec2 r=vec2(1.0, hr); 
        vec2 h=r*0.5; 
        vec2 a=mod(u,r)-h; 
        vec2 b=mod(u-h,r)-h; 
        vec2 gv=dot(a,a)<dot(b,b)?a:b; 
        vec2 id=u-gv; 
        float rand=random(id); 
        
        vec2 p=abs(gv); 
        float c=max(dot(p,normalize(vec2(1.0,1.73))),p.x); 
        float thickness=0.02+u_factor*0.4; 
        float roundness=u_p3*0.2; 
        float d=smoothstep(thickness+roundness+0.01,thickness,0.5-c); 
        
        // Pulse
        float pulse=sin(length(gv)*10.0-u_time*(2.0+u_p2*5.0) + u_p11*10.0); 
        d+=pulse*u_p4; 
        
        if(u_p5>0.0){d*=mix(1.0,rand,u_p5);} 
        if(u_p7>0.0){d+=(1.0-smoothstep(0.0,0.1,0.5-c))*u_p7;} 
        d=mix(d,1.0,u_p8*step(0.01,d)); 
        if(u_p9>0.0){d*=1.0-length(gv)*u_p9;} 
        
        return pow(clamp(d,0.0,1.0),u_intensity); 
    }` },

    [TextureType.CIRCLE]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv;
        st += vec2(u_p13, u_p14); // Pos
        if(u_p15 != 0.0) st.x *= 1.0 + (u_p15 - 0.5) * 2.0; // Aspect Ratio

        vec2 u=(st-0.5)*2.0; 
        if(u_p10>0.0){float a=atan(u.y,u.x)+u_p10*length(u);u=vec2(cos(a),sin(a))*length(u);} 
        float angle=atan(u.y,u.x); 
        float deform=sin(angle*5.0+u_time*u_p8)*u_p4*0.1; 
        if(u_p9>0.0){deform+=(noise(u*5.0)-0.5)*u_p9*0.5;} 
        
        float d=length(u)+deform; 
        if(u_p6>0.0){float count=1.0+u_p6*10.0;float gap=1.0-u_p7*0.9;d=fract(d*count);if(d>gap)d=1.0;} 
        
        float w=0.01+u_p2*0.5; 
        float soft=u_p3*0.5; 
        float v=1.0-smoothstep(u_scale-w-soft,u_scale-w,d); 
        
        if(u_factor>0.0){float outer=smoothstep(u_scale+w,u_scale+w+soft,d);v-=outer;} 
        if(u_p5>0.0){v+=(1.0-d)*u_p5;} 
        
        // P11: Warp Angle, P12: Outline
        if(u_p11 > 0.0) v = mix(v, step(0.5, v), u_p11);
        if(u_p12 > 0.0) v = abs(v - 0.5) * 2.0 * u_p12 + v * (1.0-u_p12);

        return pow(clamp(v,0.0,1.0),u_intensity); 
    }` },

    [TextureType.FLOWER]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15 > 0.0) st.x *= 1.0 + (u_p15-0.5)*2.0; // Aspect
        
        vec2 u=(st-0.5)*2.0*u_scale; 
        float r=length(u); 
        float a=atan(u.y,u.x)+u_time*u_speed + u_p12; 
        
        if(u_p7>0.0)a+=r*u_p7*5.0; 
        float petals=u_p3; 
        float f=cos(a*petals); 
        float curve=0.5+u_p6*1.5; 
        f=abs(cos(a*petals*0.5)); 
        f=pow(f,curve); 
        
        float inner=0.2+u_p5*0.5; 
        float radius=inner+f*(1.0-inner); 
        if(u_p9>0.0){radius+=(noise(u*5.0)-0.5)*u_p9*0.5;} 
        
        float softness=u_p2*0.5+0.01; 
        float flower=1.0-smoothstep(radius-softness,radius+softness,r); 
        float stamen=1.0-smoothstep(u_p10*0.3,u_p10*0.3+0.05,r); 
        float result=max(flower,stamen); 
        
        // Split (p11)
        if(u_p11 > 0.0) result = abs(result - 0.5) * 2.0 * u_p11 + result * (1.0-u_p11);

        return pow(clamp(result,0.0,1.0),u_intensity); 
    }` },

    [TextureType.RING]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        vec2 u=(st-0.5)*2.0; 
        if(u_p15>0.0) u.x *= 1.0 + (u_p15-0.5);

        float d=length(u)*u_scale; 
        if(u_p1>0.0) d+=sin(atan(u.y,u.x)*10.0)*0.1*u_p1; 
        float t=1.0-u_factor*0.8; 
        float wave=sin(d*10.0-u_time*(1.0+u_p2*2.0) + u_p12); // Phase
        if(u_p3>0.0) wave=smoothstep(-u_p3, u_p3, wave); 
        
        // Harmonics (p11)
        if(u_p11 > 0.0) wave += sin(d * 20.0) * 0.5 * u_p11;

        return pow(clamp(smoothstep(t-0.1,t,wave*0.5+0.5), 0.0, 1.0),u_intensity); 
    }` },

    [TextureType.CONE]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;
        
        vec2 u=st-0.5; 
        float a=atan(u.y,u.x)+u_time*u_factor; 
        float val = (a/PI)*0.5+0.5; 
        if(u_p1>0.0) val = mod(val * (1.0+u_p1*10.0), 1.0); 
        if(u_p2>0.0) val = pow(max(0.0, val), 1.0 + u_p2 * 4.0); 
        
        // Warp (p12)
        if(u_p12>0.0) val += sin(length(u)*10.0)*u_p12*0.2;

        return pow(clamp(val, 0.0, 1.0),u_intensity); 
    }` },

    [TextureType.CROSS]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        vec2 u=(st-0.5)*u_scale; 
        if(u_p3>0.0) u = mat2(cos(u_p3), -sin(u_p3), sin(u_p3), cos(u_p3)) * u; 
        float t=0.05+0.2*u_factor; 
        float shape = step(abs(u.x),t)+step(abs(u.y),t); 
        if(u_p1>0.0) shape = smoothstep(0.0, u_p1, shape); 
        
        // Fractal (p10)
        if(u_p10>0.0) {
            shape += step(abs(fract(u.x*3.0)-0.5), t*0.5) * u_p10 * 0.5;
        }

        return pow(clamp(shape,0.0,1.0),u_intensity); 
    }` },

    [TextureType.BRICKS]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15*0.5) * (st-0.5) + 0.5;

        vec2 u = st * u_scale * 10.0; 
        float row = floor(u.y); 
        u.x += mod(row, 2.0) * (0.5 + (u_p2 - 0.5)); 
        vec2 f = fract(u); 
        float mortar = 0.05 + (1.0-u_factor)*0.1 + u_p1 * 0.1; 
        float v = smoothstep(mortar, mortar+0.02, f.x) * smoothstep(1.0-mortar, 1.0-mortar-0.02, f.y); 
        
        // Tilt (p15/16 logic - mapping to p12)
        if(u_p12 > 0.0) v *= (0.5 + 0.5 * f.x * f.y);

        return pow(clamp(v, 0.0, 1.0), u_intensity); 
    }` },

    [TextureType.ZIGZAG]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u = st * u_scale * 10.0; 
        float z = abs(fract(u.x + u.y) - 0.5) * 2.0; 
        if(u_factor > 0.5) z = abs(fract(u.x - u.y) - 0.5) * 2.0; 
        float thickness = 0.2 + u_p1; 
        float blur = u_p2 * 0.5; 
        return pow(clamp(smoothstep(thickness + blur, thickness - blur, z), 0.0, 1.0), u_intensity); 
    }` },

    [TextureType.WAVE_PATTERN]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u = st * u_scale * 20.0; 
        float w = sin(u.x + sin(u.y * u_factor + u_time) * 2.0 * (1.0+u_p1)); 
        if(u_p2 > 0.0) w = smoothstep(-u_p2, u_p2, w); 
        
        // Warp (p12)
        if(u_p12 > 0.0) w += noise(st * 5.0) * u_p12;

        return pow(clamp(w * 0.5 + 0.5, 0.0, 1.0), u_intensity); 
    }` },

    [TextureType.WAVEFORM]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u = st * u_scale * 10.0; 
        float w = sin(u.x + u_time * u_factor * 5.0); 
        w += sin(u.x * 2.0 + u_time) * u_p1; 
        
        // Pulse (p12)
        if(u_p12 > 0.0) w *= 1.0 + sin(u_time * 10.0) * u_p12 * 0.5;

        return pow(clamp(w * 0.5 + 0.5, 0.0, 1.0), u_intensity); 
    }` },

    [TextureType.TRUCHET]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u = st * u_scale * 10.0; 
        vec2 i = floor(u); 
        vec2 f = fract(u); 
        float r = random(i + u_p12); 
        if(r > 0.5) f.x = 1.0 - f.x; 
        float d = min(length(f), length(f - 1.0)); 
        if(u_factor > 0.5) d = min(d, min(length(f - vec2(1.0, 0.0)), length(f - vec2(0.0, 1.0)))); 
        float w = 0.1 + u_detail * 0.2; 
        float v = smoothstep(0.5-w, 0.5-w+0.02, d) - smoothstep(0.5+w, 0.5+w+0.02, d); 
        return pow(clamp(v, 0.0, 1.0), u_intensity); 
    }` },

    [TextureType.ISOMETRIC]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u = st * u_scale * 10.0; 
        u.x *= 1.155; 
        vec2 grid = floor(u); 
        vec2 f = fract(u); 
        float v = mod(grid.x + grid.y, 3.0) / 2.0; 
        float edge = step(0.05 * (1.0-u_factor), min(f.x, f.y)); 
        return pow(clamp(mix(v, 1.0, 1.0-edge * u_detail), 0.0, 1.0), u_intensity); 
    }` },

    [TextureType.SPIRAL]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        
        vec2 u = st - 0.5; 
        
        // Warp (p15)
        if(u_p15 > 0.0) u += vec2(noise(st*5.0), noise(st*5.0+10.0))*u_p15*0.1;

        float r = length(u); 
        float a = atan(u.y, u.x); 
        float s = sin(r * 20.0 * u_scale - a * (5.0 + u_factor * 10.0) + u_time * 2.0); 
        return pow(clamp(s * 0.5 + 0.5, 0.0, 1.0), u_intensity); 
    }` },

    [TextureType.STARBURST]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        vec2 p = st - 0.5; 
        
        // Warp (p15)
        if(u_p15 > 0.0) p += vec2(noise(st*5.0), noise(st*5.0+10.0))*u_p15*0.1;

        float a = atan(p.y, p.x); 
        float rays = 8.0 + floor(u_scale * 20.0); 
        float w = 0.5 + 0.5 * cos(a * rays + u_time); 
        float s = 1.0 + u_factor * 50.0; 
        w = pow(clamp(w, 0.0, 1.0), s); 
        return pow(clamp(w, 0.0, 1.0), u_intensity); 
    }` },

    [TextureType.UV_DEBUG]: { code: `float getPattern(vec2 uv) { return 0.0; }` },

    [TextureType.MAZE]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        vec2 u=st*u_scale*10.0+vec2(u_seed); 
        vec2 i=floor(u); 
        vec2 f=fract(u); 
        float r=random(i); 
        vec2 d=(r>0.5)?vec2(1.0,-1.0):vec2(1.0,1.0); 
        vec2 p=f-0.5; 
        float line=abs(dot(p,normalize(d))); 
        float w=0.1+u_p1*0.3; 
        float v=1.0-smoothstep(w-0.01,w+0.01,line); 
        return pow(clamp(v,0.0,1.0),u_intensity); 
    }` },

    [TextureType.WARP_GRID]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u=st*u_scale*10.0; 
        float TSC=0.3*u_time*u_speed; 
        vec2 T=vec2(-50.0*TSC,20.0*sin(TSC)); 
        vec2 pos=u; 
        float A=u_p1*5.0; 
        float Q=u_factor*0.5+0.01; 
        vec2 uwave=vec2(sin(Q*pos.y),sin(Q*pos.x)); 
        vec2 warpedPos=pos+A*uwave+T; 
        float v=max(sin(warpedPos.x),cos(warpedPos.y)); 
        float shade=0.25*(2.0+sin(Q*u.x))*(2.0+sin(Q*u.y)); 
        float pattern=v*shade; 
        float thickness=u_p3; 
        pattern=smoothstep(thickness-0.1,thickness+0.1,pattern); 
        return clamp(pattern*u_intensity,0.0,1.0); 
    }` },

    [TextureType.ISO_LINES]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        float n=noise(st*u_scale*4.0+u_time*u_speed*0.2); 
        n+=0.5*noise(st*u_scale*8.0-u_time*0.1); 
        float freq=5.0+u_p3*20.0; 
        float val=fract(n*freq); 
        float thick=0.1+u_factor*0.4; 
        float line=smoothstep(thick,thick-0.05,abs(val-0.5)); 
        return clamp(line*u_intensity,0.0,1.0); 
    }` },
    
    [TextureType.CROSS_STITCH]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u = st * u_scale * 10.0; 
        if(u_p9 > 0.0) u += noise(u*2.0)*u_p9*0.1; 
        vec2 f = fract(u); 
        float c = mod(floor(u.x) + floor(u.y), 2.0); 
        vec2 uvCross = (f - 0.5) * 2.0; 
        if (u_p10 > 0.0) uvCross = rotate2d(u_p10 * 0.5) * uvCross; 
        float thick = 0.5 - u_p3 * 0.4; 
        float crossShape = smoothstep(thick, thick+0.1, abs(uvCross.x)) + smoothstep(thick, thick+0.1, abs(uvCross.y)); 
        crossShape = 1.0 - clamp(crossShape, 0.0, 1.0); 
        if(u_p4 > 0.0) crossShape *= 1.0 - smoothstep(0.4, 0.5, length(uvCross))*u_p4; 
        float stitch = c * crossShape; 
        if(u_p1 > 0.0) stitch = mix(c, stitch, u_p1); 
        if(u_p6 > 0.0) stitch += (random(u) - 0.5) * u_p6; 
        return pow(clamp(stitch, 0.0, 1.0), u_intensity); 
    }` },
    
    [TextureType.WEAVE_KNIT]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u = st * 6.0 * u_scale; 
        float t = u_time * u_speed; 
        if(u_p8 > 0.0) u = rotate2d(u_p8) * u; 
        u.y += sin(u.x * u_p10 + t) * u_p1; 
        float contrast = u_p3 * 5.0 + 1.0; 
        float sq = floor((fract(u.y)*2.0-1.0)*(fract(u.x)*2.0-1.0))+1.0; 
        float tension = 0.075 - u_p9 * 0.05; 
        float sq2 = floor(fract(u.x-u.y-tension)+0.15) * floor(fract((u.x+u.y)-tension)+0.15); 
        sq2 += floor(fract(u.x-u.y-tension+0.5)+0.15) * floor(fract((u.x+u.y+0.5)-tension)+0.15); 
        float pattern = mix(sq, sq2, u_p2); 
        if (u_p4 > 0.0) pattern -= noise(u*10.0)*u_p4; 
        return pow(clamp(pattern, 0.0, 1.0), u_intensity); 
    }` },
    
    [TextureType.ROTATING_GRID]: { code: `float circleShape(vec2 uv, float radius) { vec2 dist = uv - vec2(0.5); float angle = atan(dist.y, dist.x); if (u_factor > 0.5 && angle < -1.57) return 0.0; return 1.0 - smoothstep(radius - 0.01, radius + 0.01, dot(dist,dist)*4.0); } float getPattern(vec2 uv) { vec2 u = uv * 8.0 * u_scale; vec2 index = floor(u); vec2 f = fract(u); float check = mod(index.x + index.y, 2.0); float angle = u_time * u_speed; if(check > 0.5) angle *= -1.0; f -= 0.5; f = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * f; f += 0.5; float c = circleShape(f, 0.8 * u_detail); return pow(clamp(c, 0.0, 1.0), u_intensity); }` },
    
    [TextureType.RIPPLE_GRID]: { code: `float getPattern(vec2 uv) { vec2 u = uv * u_scale * 10.0; vec2 p0 = floor(u); float circles = 0.0; float chaos = u_p6; float freq = 10.0 + u_p10 * 20.0; for (int j = -2; j <= 2; ++j) { for (int i = -2; i <= 2; ++i) { vec2 pi = p0 + vec2(float(i), float(j)); vec2 hsh = pi; vec2 p = pi + hash22(hsh); float t = fract(0.3 * u_time * u_speed + hash12(hsh) * u_p5); vec2 v = p - u; float d = length(v); float radius = 3.0 * t * (1.0 + u_p3); float wave = sin(freq * (d - radius)); wave *= smoothstep(0.0, -0.3, d - radius) * smoothstep(-0.6, -0.3, d - radius); wave *= (1.0 - t * (1.0 + u_p2)); circles += wave; } } return clamp(circles * 0.5 + 0.5, 0.0, 1.0) * u_intensity; }` },
    
    [TextureType.RGB_RINGS]: { code: `float getPattern(vec2 uv) { vec2 u = (uv - 0.5) * 2.0; float d = length(u); if(u_p9 > 0.0) d = pow(max(0.001, d), 1.0 + u_p9); float t = u_time * u_speed * 6.28; float spacing = (10.0 + u_p1 * 40.0) / u_scale; float offR = u_p4 * PI; float offG = u_p5 * PI; float offB = u_p6 * PI; float ringPhase = d * spacing - t; float r = sin(ringPhase + offR); float g = cos(ringPhase + offG); float b = cos(ringPhase + offB + 2.0); float thickness = u_p7; r = smoothstep(thickness, thickness+0.1, r); g = smoothstep(thickness, thickness+0.1, g); b = smoothstep(thickness, thickness+0.1, b); float combined = (r + g + b) / 3.0; if(u_p2 > 0.0) combined += noise(u*10.0+t)*u_p2; return clamp(combined, 0.0, 1.0) * u_intensity; }` },
    [TextureType.PYRAMID_SCENE]: { code: `float distLine(vec3 ro, vec3 rd, vec3 p) { return length(cross(p - ro, rd)) / length(rd); } float df_line(vec2 a, vec2 b, vec2 p) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0); return length(pa - ba*h); } float getPattern(vec2 uv) { vec2 u = (uv - 0.5) * 2.0; float t = u_time * u_speed; vec3 camPos = vec3(sin(t*0.5)*1.5, 0.5 + (u_p1 - 0.5), cos(t*0.5)*1.5); vec3 lookAt = vec3(0.0, -0.08, 0.0); vec3 fwd = normalize(lookAt - camPos); vec3 right = normalize(cross(vec3(0,1,0), fwd)); vec3 up = cross(fwd, right); float fov = 0.4 + u_factor * 0.5; vec3 rd = normalize(fwd + fov * u.x * right + fov * u.y * up); float delta = 0.2 * u_scale; vec3 p1 = vec3(0, delta, 0); vec3 p2 = vec3(-delta, -delta, -delta); vec3 p3 = vec3(delta, -delta, -delta); vec3 p4 = vec3(delta, -delta, delta); vec3 p5 = vec3(-delta, -delta, delta); float d = distLine(camPos, rd, p1); d = min(d, distLine(camPos, rd, p2)); d = min(d, distLine(camPos, rd, p3)); d = min(d, distLine(camPos, rd, p4)); d = min(d, distLine(camPos, rd, p5)); float pointGlow = smoothstep(0.02, 0.0, d); float lineD = 100.0; lineD = min(lineD, distLine(camPos, rd, mix(p2, p3, 0.5))); float wireframe = 0.0; vec3 center = vec3(0.0); float distToCenter = length(cross(center - camPos, rd)); wireframe += 0.05 / (distToCenter + 0.01) * u_intensity; float interference = sin(d * 100.0 - u_time * 5.0) * 0.5 + 0.5; return clamp(pointGlow + wireframe * interference, 0.0, 1.0); }` },
};
