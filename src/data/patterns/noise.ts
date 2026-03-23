
import { TextureType, PatternDefinition } from '../../core/types/types';

export const NOISE: Partial<Record<TextureType, PatternDefinition>> = {
    [TextureType.PERLIN_NOISE]: { code: `float getPattern(vec2 uv) { 
        // Global Transformations
        vec2 st=uv*u_scale*3.0; 
        st += vec2(u_p14, u_p15); // Shift X/Y
        if(u_p13!=0.0) st = rotate2d(u_p13) * (st - 0.5 * u_scale * 3.0) + 0.5 * u_scale * 3.0;

        // P7/P8: Domain Warping
        if(u_p7>0.0){vec2 q=vec2(noise(st),noise(st+vec2(5.2,1.3)));float angle=u_p8*6.28;mat2 rot=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));st+=rot*q*u_p7;} 
        if(u_p4>0.0){st+=noise(st*2.0)*u_p4;} 
        
        float v=0.0; 
        float a=0.5; 
        float max_oct=1.0+floor(u_factor*7.0); 
        float pers=0.5+(u_p1-0.5); 
        float lac=2.0+(u_p2-0.5); 
        float timeOffset=u_time*0.1+u_p5*10.0; 
        
        for(int i=0;i<8;i++){ 
            if(float(i)>=max_oct)break; 
            float n=noise(st+timeOffset); 
            if(u_p3>0.0){n=mix(n,1.0-abs(n*2.0-1.0),u_p3);} 
            if(u_p6>0.0){n=mix(n,abs(n*2.0-1.0),u_p6);} 
            if(u_p9>0.0){n=pow(n,1.0+u_p9);} 
            v+=n*a; 
            st*=lac; 
            a*=pers; 
        } 
        
        if(u_p10>0.0){v=smoothstep(u_p10*0.5,1.0-u_p10*0.5,v);} 
        
        // P11: Grain Overlay
        if(u_p11 > 0.0) v += (random(st * 100.0) - 0.5) * u_p11 * 0.2;

        // P15: Gamma Correction (Last param as standard)
        if(u_p15 > 0.0) v = pow(max(0.0, v), 1.0/max(0.1, 1.0 - u_p15 * 0.8));
        
        return pow(clamp(v,0.0,1.0),u_intensity); 
    }` },

    [TextureType.SIMPLEX_NOISE]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv * u_scale * 8.0; 
        st += vec2(u_p14, u_p15); // Shift
        if(u_p13!=0.0) st = rotate2d(u_p13) * st;

        if(u_p2 > 0.0) st += snoise(vec3(st, u_time*0.1)) * u_p2; 
        float n = snoise(vec3(st, u_time * 0.2)); 
        if(u_p1 > 0.0) n = mix(n, 1.0 - abs(n), u_p1); 
        
        // P3-P12: Filling gaps
        if(u_p3 > 0.0) n = pow(n * 0.5 + 0.5, 1.0 + u_p3 * 2.0) * 2.0 - 1.0;
        if(u_p4 > 0.0) n += snoise(vec3(st * 2.0, u_time * 0.3)) * u_p4 * 0.5;
        
        // P12: Grain
        if(u_p12 > 0.0) n += (random(st*50.0) - 0.5) * u_p12 * 0.1;

        return pow(clamp(n * 0.5 + 0.5, 0.0, 1.0), u_intensity); 
    }`, deps: ['simplex'] },

    [TextureType.CELLULAR_NOISE]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv * u_scale * 5.0; 
        st += vec2(u_p14, u_p15); // Shift
        if(u_p13!=0.0) st = rotate2d(u_p13) * st;

        float jitter = u_p1; 
        vec3 v = voronoi(st); 
        float dist = v.x; 
        if(u_p2 > 0.0) dist = mix(dist, v.y - v.x, u_p2); 
        
        if(u_factor > 0.0) dist = smoothstep(u_factor * 0.2, 0.0, abs(dist - 0.5 * u_factor)); 
        else dist = 1.0 - dist; 
        
        // P12: Bubbles/Cells Mod
        if(u_p12 > 0.0) dist = mix(dist, smoothstep(0.4, 0.5, dist), u_p12);
        
        // P11: Grain
        if(u_p11 > 0.0) dist += (random(uv*100.0) - 0.5) * u_p11 * 0.1;

        return pow(clamp(dist, 0.0, 1.0), u_intensity); 
    }`, deps: ['voronoi'] },

    [TextureType.WORLEY_NOISE]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv * u_scale * 5.0;
        st += vec2(u_p14, u_p15);
        
        vec2 i_st = floor(st);
        vec2 f_st = fract(st);
        float m_dist = 1.0;
        
        for (int y= -1; y <= 1; y++) {
            for (int x= -1; x <= 1; x++) {
                vec2 neighbor = vec2(float(x),float(y));
                // FIX: Use proper 2D Hash to avoid diagonal collapse
                vec2 point = hash22(i_st + neighbor); 
                
                vec2 jitter = point;
                if (u_speed > 0.0) {
                    jitter = 0.5 + 0.5 * sin(u_time * u_speed * 2.0 + 6.2831 * point);
                }
                
                point = mix(vec2(0.5), jitter, u_p1); // Jitter
                
                vec2 diff = neighbor + point - f_st;
                float dist = length(diff);
                
                if( dist < m_dist ) {
                    m_dist = dist;
                }
            }
        }
        
        float val = 1.0 - m_dist;
        
        if (u_p3 > 0.0) val = m_dist; // Invert
        
        // Edge Softness (P2)
        if (u_p2 > 0.0) {
            float e = u_p2 * 0.9; // max 0.9
            val = smoothstep(0.0 + e * 0.5, 1.0 - e * 0.5, val);
        }
        
        // Mix with Noise (u_factor)
        if (u_factor > 0.0) {
            val = mix(val, val * noise(st + u_time), u_factor);
        }
        
        // P15: Gamma
        if(u_p15 > 0.0) val = pow(max(0.0, val), 1.0 - u_p15 * 0.5);
        
        return clamp(val * u_intensity, 0.0, 1.0);
    }` },

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

    [TextureType.GRADIENT_NOISE]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv * u_scale * 5.0; 
        st += vec2(u_p14, u_p15);
        if(u_p1 > 0.0) st = mat2(cos(u_p1), -sin(u_p1), sin(u_p1), cos(u_p1)) * st; 
        float n = noise(st + u_time * 0.1); 
        float g = uv.y; 
        if(u_p2 > 0.0) g = sin(g * u_p2 * 10.0) * 0.5 + 0.5; 
        
        // P12: Phase
        if(u_p12 > 0.0) n = sin(n * 10.0 + u_p12 * 6.28) * 0.5 + 0.5;
        
        // P15: Gamma
        float val = mix(g, n, u_factor);
        if(u_p15 > 0.0) val = pow(max(0.0, val), 1.0 - u_p15 * 0.5);

        return pow(clamp(val, 0.0, 1.0), u_intensity); 
    }` },
    
    [TextureType.VALUE_NOISE]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv * u_scale * 10.0; 
        st += vec2(u_p14, u_p15);
        if(u_p1 > 0.0) st = floor(st * u_p1) / u_p1; 
        float n = valueNoise(st); 
        if(u_p2 > 0.0) n = smoothstep(0.0, 1.0 - u_p2, n); 
        
        // P11: Skew
        if(u_p11 > 0.0) st.x += st.y * u_p11;
        
        // P12: Grain
        if(u_p12 > 0.0) n += (random(st*20.0) - 0.5) * u_p12 * 0.2;

        return pow(clamp(n, 0.0, 1.0), u_intensity); 
    }`, deps: ['value'] },
    
    [TextureType.RIDGED_FRACTAL]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv * u_scale * 3.0; 
        st += vec2(u_p14, u_p15);
        if(u_p3 > 0.0) st += u_p3; 
        float n = ridgedFBM(st + u_time * 0.05); 
        if(u_p1 > 0.0) n *= (1.0 + u_p1); 
        if(u_p2 > 0.0) n = pow(max(0.0, n), 1.0 + u_p2); 
        
        // P12: Rot
        if(u_p12 > 0.0) {
            float ang = u_p12 * 3.14;
            st = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * st;
        }
        
        // P15: Gamma
        if(u_p15 > 0.0) n = pow(max(0.0, n), 1.0 + u_p15);

        return pow(clamp(n, 0.0, 1.0), u_intensity); 
    }`, deps: ['fbm'] },
    
    [TextureType.VORONOI_SMOOTH]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv * u_scale * 5.0;
        st += vec2(u_p14, u_p15);
        
        float n = voronoiSmooth(st); 
        if(u_p1 > 0.0) n = n + sin(uv.x * 20.0) * 0.1 * u_p1; 
        
        // P11: Rot
        if(u_p11 > 0.0) {
             float ang = u_p11;
             st = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * st;
        }
        
        // P12: Grain
        if(u_p12 > 0.0) n += (random(st*10.0) - 0.5) * u_p12 * 0.1;

        return pow(clamp(n * 0.5 + 0.5, 0.0, 1.0), u_intensity); 
    }`, deps: ['voronoi'] },
    
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
    
    [TextureType.TRABECULUM]: { code: `float getPattern(vec2 uv) { 
        vec2 p = uv * u_scale * 5.0; 
        p += vec2(u_p14, u_p15);
        vec3 p3 = vec3(p, u_time * 0.2); 
        vec3 w = worley3(p3); 
        float c0 = 0.0; 
        if (u_factor < 0.33) c0 = w.y - w.x; 
        else if (u_factor < 0.66) c0 = 2.0 * (w.y - w.x); 
        else { float denom = (1.0/(w.z-w.x)+1.0/(w.y-w.x)); if (abs(denom) > 0.001) c0 = 1.0 - 1.0/denom; } 
        
        // P15: Gamma
        if(u_p15 > 0.0) c0 = pow(max(0.0, c0), 1.0 - u_p15 * 0.5);

        return pow(clamp(c0, 0.0, 1.0), u_intensity); 
    }`, deps: ['voronoi'] },
    
    [TextureType.TURBULENCE]: { code: `float getPattern(vec2 uv) { 
        vec2 s = uv * u_scale * 3.0; 
        s += vec2(u_p14, u_p15);
        float f = 0.0; 
        f += 0.5 * abs(fbm(s) * 2.0 - 1.0); 
        s *= 2.1; 
        f += 0.25 * abs(fbm(s) * 2.0 - 1.0); 
        
        // P15: Gamma
        float val = smoothstep(u_factor * 0.5, 1.0, f);
        if(u_p15 > 0.0) val = pow(max(0.0, val), 1.0 - u_p15 * 0.5);

        return pow(clamp(val, 0.0, 1.0), u_intensity); 
    }`, deps: ['fbm'] },
    
    [TextureType.GYROID]: { code: `float getPattern(vec2 uv) { 
        vec3 p = vec3(uv * u_scale * 8.0, u_time * 0.5); 
        p.xy += vec2(u_p14, u_p15);
        p.z *= (0.5 + u_p1 * 1.5); 
        p.y *= (0.5 + u_p2 * 1.5); 
        float d = gyroid(p, 1.0); 
        if(u_detail > 0.0) d += gyroid(p, 2.1) * 0.5 * u_detail; 
        if(u_detail > 0.5) d += gyroid(p, 4.3) * 0.25 * u_detail; 
        d = d * (1.0 - u_factor * 0.5) + u_factor * sin(d * 5.0); 
        
        // P15: Gamma
        float val = d * 0.5 + 0.5;
        if(u_p15 > 0.0) val = pow(max(0.0, val), 1.0 - u_p15 * 0.5);

        return pow(clamp(val, 0.0, 1.0), u_intensity); 
    }`, deps: ['gyroid'] },
    
    [TextureType.CURL_NOISE]: { code: `float getPattern(vec2 uv) { 
        vec2 p = uv * u_scale * 4.0; 
        p += vec2(u_p14, u_p15);
        vec2 c = curlNoise(p + u_time * 0.2); 
        float v = length(c); 
        v += (1.0 - smoothstep(0.0, 1.0, v)) * u_factor; 
        
        // P15: Gamma
        if(u_p15 > 0.0) v = pow(max(0.0, v), 1.0 - u_p15 * 0.5);

        return pow(clamp(v, 0.0, 1.0), u_intensity); 
    }`, deps: ['simplex', 'curl'] },
    
    [TextureType.MARBLE]: { code: `float getPattern(vec2 uv) { 
        vec2 p = uv * u_scale * 2.0; 
        p += vec2(u_p14, u_p15);
        if(u_p7>0.0) p = rotate2d(u_p7)*p; 
        float n=fbm(p+u_time*0.1); 
        float veins = u_p4 * 20.0 + 10.0; 
        float distort = u_p3 * 10.0 + 1.0; 
        float marble = 0.5+0.5*cos(p.x*veins + n*distort*u_factor); 
        if(u_p1>0.0) marble = mix(marble, marble*marble, u_p1); 
        
        // P12: Grain
        if(u_p12 > 0.0) marble += (random(p*20.0) - 0.5) * u_p12 * 0.2;
        // P15: Gamma
        if(u_p15 > 0.0) marble = pow(max(0.0, marble), 1.0 - u_p15 * 0.5);

        return pow(clamp(marble, 0.0, 1.0),u_intensity); 
    }`, deps: ['fbm'] },
    
    [TextureType.WOOD]: { code: `float getPattern(vec2 uv) { 
        vec2 p = uv * u_scale * 4.0; 
        p += vec2(u_p14, u_p15);
        if(u_p5 > 0.0) p += sin(p.yx * 5.0) * u_p5 * 0.1; 
        float n=noise(p); 
        float rings = 10.0 + u_factor * 20.0 + u_p3 * 10.0; 
        float wood = 0.5 + 0.5 * sin((length(p - 0.5) + n * 0.1 * u_p7) * rings); 
        if(u_p4 > 0.0) { float knots = noise(p * 2.0); wood = mix(wood, knots, u_p4 * smoothstep(0.4, 0.6, knots)); } 
        
        // P12: Detail
        if(u_p12 > 0.0) wood += n * u_p12 * 0.1;
        // P15: Gamma
        if(u_p15 > 0.0) wood = pow(max(0.0, wood), 1.0 - u_p15 * 0.5);

        return pow(clamp(wood, 0.0, 1.0),u_intensity); 
    }` },
    
    [TextureType.GRUNGE]: { code: `float getPattern(vec2 uv) { 
        vec2 p = uv * u_scale * 10.0; 
        p += vec2(u_p14, u_p15);
        float n = random(p + floor(u_time * 5.0 * u_speed)); 
        float scratches = 0.0; 
        if(u_p4 > 0.0) scratches = smoothstep(0.98 - u_p4 * 0.1, 1.0, random(p.yx)); 
        float f = fbm(uv * 2.0); 
        float s = smoothstep(0.5 - u_factor * 0.4, 1.0, f); 
        float result = mix(n * 0.3, 1.0, s); 
        if(u_p3 > 0.0) result = mix(result, 0.0, scratches); 
        
        // P15: Gamma
        if(u_p15 > 0.0) result = pow(max(0.0, result), 1.0 - u_p15 * 0.5);

        return pow(clamp(result, 0.0, 1.0), u_intensity); 
    }`, deps: ['fbm'] },
    
    [TextureType.SQUIGGLES]: { code: `float getPattern(vec2 uv) { 
        vec2 u = uv * u_scale * 5.0; 
        u += vec2(u_p14, u_p15);
        vec2 grid = floor(u); 
        vec2 sub = fract(u) - 0.5; 
        float n = random(grid); 
        float a = (n * 2.0 * PI) + u_time + u_factor * 5.0; 
        float s = sin(a); 
        float c = cos(a); 
        sub = mat2(c,-s,s,c) * sub; 
        float d = abs(length(sub) - 0.5); 
        float val = smoothstep(0.1, 0.05 * (1.0 - u_detail), d);
        
        // P11: Jitter
        if(u_p11 > 0.0) val += (random(u) - 0.5) * u_p11;
        // P12: Grain
        if(u_p12 > 0.0) val += (random(u*10.0) - 0.5) * u_p12 * 0.2;
        // P15: Gamma
        if(u_p15 > 0.0) val = pow(max(0.0, val), 1.0 - u_p15 * 0.5);

        return clamp(val * u_intensity, 0.0, 1.0); 
    }` },
    
    [TextureType.HOLO_FOIL]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv * 10.0 * u_scale;
        st += vec2(u_p14, u_p15);
        vec2 noise = holoVoronoi(st); 
        float v = noise.x * noise.y; 
        
        // P11: Warp
        if(u_p11 > 0.0) v += sin(st.x * 2.0) * 0.1 * u_p11;
        // P12: Grain
        if(u_p12 > 0.0) v += (random(st) - 0.5) * u_p12 * 0.1;
        // P15: Gamma
        if(u_p15 > 0.0) v = pow(max(0.0, v), 1.0 - u_p15 * 0.5);

        return pow(clamp(v, 0.0, 1.0), u_intensity * (1.0 - u_factor * 0.5)); 
    }` },
    
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
    
    [TextureType.FUR_FIBERS]: { code: `float getPattern(vec2 uv) { 
        vec2 u = uv * u_scale * 10.0; 
        u += vec2(u_p14, u_p15);
        float angle = u_p3 * 3.14159; 
        float s = sin(angle); 
        float c = cos(angle); 
        vec2 st = mat2(c,-s,s,c) * u; 
        st.x *= 1.0 + u_factor * 10.0; 
        float n = fbm(st + vec2(0.0, u_time * 0.5)); 
        
        // P15: Gamma
        if(u_p15 > 0.0) n = pow(max(0.0, n), 1.0 - u_p15 * 0.5);

        return pow(clamp(n, 0.0, 1.0), u_intensity); 
    }`, deps: ['fbm'] },
    
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
