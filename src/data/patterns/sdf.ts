

import { TextureType, PatternDefinition } from '../../core/types/types';

export const SDF_PATTERNS: Partial<Record<TextureType, PatternDefinition>> = {
    [TextureType.HYPER_TUNNEL]: { deps: ['sdf'], code: `float getPattern(vec2 uv) { 
        float d=0.0,w=0.0; 
        float t=u_time*u_speed; 
        vec3 p,k; 
        vec3 rayDir=normalize(vec3((uv-0.5)*2.0,1.0/(u_scale*2.0))); 
        
        // P14/P15: Camera XY Adjustment
        rayDir.xy += vec2(u_p14, u_p15);

        float accum=0.0; 
        int maxIter=40+int(u_p6*40.0); 
        for(int j=0;j<80;j++){ 
            if(j>maxIter)break; 
            p=vec3(rayDir*d); 
            p.z-=10.0; 
            mat2 r=rotComplex(t*0.5); 
            p.xz*=r; 
            if(u_p3>0.0)p.xy*=rot2D(p.z*u_p3*0.2); 
            if(p.y<-6.3){p.y=-p.y-9.0;} 
            k=p; 
            vec3 q=k*0.5; 
            float fold=0.01+u_p7*0.2; 
            for(float n=0.01;n<0.2;n+=n){ 
                q.yz+=cos(q.xy*0.01)-abs(dot(sin(0.02*q.z+0.03*q.y+t*2.0+0.3*q/n),vec3(0.0)-vec3(0.0)+n)); 
            } 
            float s=length(k.xy)-(4.0*(1.0+u_p4)); 
            float wave=mix(sin(length(ceil(k*4.0).z+k)),sin(length(q)-1.0),smoothstep(5.0,5.5,q.y)); 
            if(u_p10>0.0)wave+=noise(k*u_p10)*0.5; 
            w=0.01+0.07*abs(max(wave,sqrt(s*s+dot(k,k))-1.5)-float(j)/150.0); 
            w*=(1.0-u_factor*0.5); 
            d+=w; 
            accum+=(1.3/max(0.001,w))*0.002*u_intensity*(1.0+u_p2); 
            if(d>20.0)break; 
        } 
        if(u_p9>0.0){ accum=mix(accum,0.0,1.0-exp(-d*u_p9*0.1)); } 
        
        // P13: Twist
        if(u_p13 > 0.0) accum += sin(d * u_p13) * 0.1;

        return clamp(accum,0.0,1.0); 
    }` },

    [TextureType.ALIEN_BIOMASS]: { deps: ['sdf'], code: `float getPattern(vec2 uv) { 
        vec3 p, q, k = vec3(0.0); 
        float t = 0.0, h = 0.0, w = 0.0; 
        float T = u_time * u_speed * 2.0; 
        vec3 rd = normalize(vec3((uv - 0.5) * 2.0, 1.0)); 
        
        // P14/P15: Camera XY
        rd.xy += vec2(u_p14, u_p15);

        float accum = 0.0; 
        float d = 0.1; 
        for(int i=0; i<50; i++) { 
            p = rd * t; 
            p.zy *= rot2D(1.0); 
            p.z += T; 
            p.x += sin(w = T * 0.2) * 2.0; 
            p.xy *= rot2D(cos(w) * 0.1); 
            float sphereDist = p.y + 4.0; 
            h = sphereDist - 2.3 + abs(p.x * 0.2 * u_factor); 
            w = h - d; 
            d = min(d, h) * 0.8; 
            t += d; 
            if (w > 0.001) { accum += k.z * k.x * 0.1; } 
            else { accum += k.y * 0.05; } 
            q = p; 
            k = vec3(0.0); 
            float a = 0.1, b = 0.8; 
            for(int j=0; j<3; j++) { 
                q.xz *= rot2D(0.6); 
                p.xz *= rot2D(0.6); 
                k.y += abs(dot(sin(q.xz * 0.4 / b), vec2(b))); 
                float x_val = p.x / a * 0.1 + T; 
                w = a * exp(sin(x_val)); 
                k.x += w; 
                p.x -= w * cos(x_val); 
                sphereDist -= w; 
                a *= 0.8; 
                b *= 0.5; 
            } 
            if (t > 20.0) break; 
        } 
        
        // P15: Gamma
        float val = accum * u_intensity * 0.5;
        // P13: Slime
        if(u_p13 > 0.0) val = pow(max(0.0, val), 1.0 - u_p13 * 0.5);

        return clamp(val, 0.0, 1.0); 
    }` },

    [TextureType.CUBIC_SPACE]: { deps: ['sdf'], code: `float getPattern(vec2 uv) { 
        vec3 ro = vec3(u_p12*2.0, u_p13*2.0, -4.0 + u_p11*2.0); 
        vec3 rd = normalize(vec3((uv - 0.5) * 2.0, 1.0)); 
        float t = u_time * u_speed; 
        mat2 r = rot2D(t * 0.2 + u_p14); 
        ro.xz *= r; 
        rd.xz *= r; 
        float d = 0.0; 
        float accum = 0.0; 
        for(int i=0; i<40; i++) { 
            vec3 p = ro + rd * d; 
            vec3 q = opRep(p, vec3(2.0 + u_factor * 2.0)); 
            q.xy *= rot2D(t + float(i)*0.1); 
            q.xz *= rot2D(t * 0.5); 
            float box = sdBox(q, vec3(0.4 * u_scale)); 
            accum += 0.02 / (0.02 + abs(box)) * u_intensity; 
            d += max(0.05, abs(box) * 0.5); 
            if(d > 20.0) break; 
        } 
        
        // P15: Gamma
        if(u_p15 > 0.0) accum = pow(max(0.0, accum), 1.0 + u_p15);

        return clamp(accum * 0.1, 0.0, 1.0); 
    }` },

    [TextureType.LOW_TECH_TUNNEL]: { deps: ['sdf'], code: `vec3 P(float z) { return vec3(12.0 * cos(z * vec2(0.1, 0.12)), z); } float A(float F, float H, float K, vec3 p) { return abs(dot(sin(F * p * K), H + p - p)) / max(0.001, K); } float getPattern(vec2 uv) { vec2 u = (uv - 0.5) * 2.0; vec3 c = vec3(0.0); float T = u_time * u_speed * 4.0 + 5.0 + 5.0 * sin(u_time * 0.3); vec3 p = P(T); vec3 Z = normalize(P(T + 4.0) - p); vec3 X = normalize(vec3(Z.z, 0.0, -Z.x)); vec3 D = normalize(vec3(u, 1.0)) * mat3(-X, cross(X, Z), Z); float i = 0.0, d = 0.0, s = 0.0; float accum = 0.0; for(int j=0; j<28; j++) { p += D * s; vec3 X_path = P(p.z); float t = sin(u_time); float e = length(p - vec3(X_path.x + t, X_path.y + t*2.0, 6.0 + T + t*2.0)) - 0.01; s = cos(p.z * 0.6) * 2.0 + 4.0; s -= min(length(p.xy - X_path.x - 6.0), length((p - X_path).xy)); s += A(4.0, 0.25, 0.1, p); s += A(T + 8.0, 0.22, 2.0, p); d += s = min(e, 0.01 + 0.3 * abs(s)); accum += 1.0/max(0.001, s) + 10.0 / max(e, 0.6); if (d > 30.0) break; } return clamp(accum * 0.00002 * u_intensity, 0.0, 1.0); }` },
    
    [TextureType.OCTGRAMS]: { deps: ['sdf'], code: `float sdBoxOct(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0); } float boxOct(vec3 pos, float scale) { pos *= scale; float base = sdBoxOct(pos, vec3(0.4, 0.4, 0.1)) / 1.5; pos.xy *= 5.0; pos.y -= 3.5; pos.xy *= rot2D(0.75); return -base; } float box_set(vec3 pos, float time) { vec3 pos_origin = pos; pos.y += sin(time * 0.4) * 2.5; pos.xy *= rot2D(0.8); float box1 = boxOct(pos, 2.0 - abs(sin(time * 0.4)) * 1.5); pos = pos_origin; pos.y -= sin(time * 0.4) * 2.5; pos.xy *= rot2D(0.8); float box2 = boxOct(pos, 2.0 - abs(sin(time * 0.4)) * 1.5); pos = pos_origin; pos.x += sin(time * 0.4) * 2.5; pos.xy *= rot2D(0.8); float box3 = boxOct(pos, 2.0 - abs(sin(time * 0.4)) * 1.5); pos = pos_origin; float box5 = boxOct(pos, 0.5) * 6.0; return max(max(max(box1, box2), box3), box5); } float getPattern(vec2 uv) { vec2 p = (uv - 0.5) * 2.0; vec3 ro = vec3(0.0, -0.2, u_time * 4.0 * u_speed); vec3 ray = normalize(vec3(p, 1.5 / u_scale)); ray.xy *= rot2D(sin(u_time * 0.03) * 5.0); ray.yz *= rot2D(sin(u_time * 0.05) * 0.2); float t = 0.1; float ac = 0.0; for (int i = 0; i < 99; i++){ vec3 pos = ro + ray * t; pos = mod(pos - 2.0, 4.0) - 2.0; float gTime = u_time - float(i) * 0.01; float d = box_set(pos, u_time); d = max(abs(d), 0.01); ac += exp(-d * 23.0 * (1.0 - u_factor * 0.5)); t += d * 0.55; } return clamp(ac * 0.02 * u_intensity, 0.0, 1.0); }` },
    
    [TextureType.COSMIC_FLOW]: { deps: ['sdf'], code: `vec3 cosmicPath(float t) { vec3 p = vec3(cos(t*0.3)*4.0, sin(t*0.3)*4.0, t); float nt = noise(mod(t, 60.0)); p += cos(p.zxy + nt * 6.0) * 0.4; return p; } mat3 setCamera(vec3 ro, vec3 ta, float cr) { vec3 cw = normalize(ta-ro); vec3 cp = vec3(sin(cr), cos(cr), 0.0); vec3 cu = normalize(cross(cw,cp)); vec3 cv = normalize(cross(cu,cw)); return mat3(cu, cv, cw); } float mapCosmic(vec3 p) { float d = 100.0; p.xy += sin(p.z * 0.2 + u_time * u_speed) * u_factor; float t = length(p.xy) - 1.0; float n = 0.0; vec3 q = p * u_scale; for(int i=0; i<3; i++) { n += (1.0/float(i+1)) * noise(q); q *= 2.0; } d = t - n * 0.5; return d; } float getPattern(vec2 uv) { vec2 p = (uv - 0.5) * 2.0; vec3 ro = vec3(0.0, 0.0, u_time * 5.0 * u_speed); vec3 ta = ro + vec3(0.0, 0.0, 1.0); mat3 cam = setCamera(ro, ta, 0.0); vec3 rd = cam * normalize(vec3(p, 1.5)); float t = 0.0; float accum = 0.0; for(int i=0; i<40; i++) { vec3 pos = ro + rd * t; float d = mapCosmic(pos); if(d < 0.01) { accum += (1.0 - t/20.0); break; } accum += 0.02 / (0.05 + abs(d)) * u_intensity * 0.1; t += max(0.05, d * 0.5); if(t > 20.0) break; } return clamp(accum, 0.0, 1.0); }` },
    
    [TextureType.INDRA_NET]: { deps: ['sdf'], code: `float getPattern(vec2 uv) { 
        vec3 ro = vec3(u_p12, u_p13, -3.0 + u_p11); 
        vec3 rd = normalize(vec3((uv - 0.5) * 2.0, 1.0)); 
        float t = u_time * u_speed; 
        mat2 r = rot2D(t * 0.2 + u_p14); 
        ro.xz *= r; 
        rd.xz *= r; 
        float d = 0.0; 
        float accum = 0.0; 
        for(int i=0; i<40; i++) { 
            vec3 p = ro + rd * d; 
            p = mod(p + 2.0, 4.0) - 2.0; 
            float sphere = length(p) - (0.5 * u_scale); 
            float connections = min(length(p.xy), min(length(p.yz), length(p.zx))) - (0.05 + u_factor * 0.1); 
            float shape = smin(sphere, connections, 0.2); 
            d += max(0.02, abs(shape)); 
            accum += 0.02 / (0.02 + abs(shape)) * u_intensity; 
            if(d > 20.0) break; 
        } 
        
        // P15: Gamma
        if(u_p15 > 0.0) accum = pow(max(0.0, accum), 1.0 + u_p15);

        return clamp(accum * 0.2, 0.0, 1.0); 
    }` },
    
    [TextureType.SPHERICAL_SPIRAL]: { deps: ['sdf'], code: `float getPattern(vec2 uv) { 
        vec2 p = (uv - 0.5) * 2.0; 
        float r = length(p); 
        if(r > 1.0) return 0.0; 
        float z = sqrt(1.0 - r*r); 
        vec3 pos = vec3(p, z); 
        float t = u_time * u_speed; 
        
        // P12/P13/P14: Rotation Offsets
        pos.xz *= rot2D(t + u_p12); 
        pos.yz *= rot2D(t * 0.5 + u_p13); 
        
        float theta = atan(pos.y, pos.x); 
        float phi = acos(pos.z); 
        float spiral = sin(phi * (10.0 + u_p1 * 50.0) + theta); 
        float width = 0.95 - u_factor * 0.1; 
        float dots = smoothstep(width, 1.0, spiral); 
        
        // P15: Gamma
        if(u_p15 > 0.0) dots = pow(max(0.0, dots), 1.0 - u_p15 * 0.5);

        return clamp(dots * u_intensity, 0.0, 1.0); 
    }` },
    
    [TextureType.ALIEN_COCOON]: { deps: ['sdf', 'gyroid'], code: `float getPattern(vec2 uv) { 
        vec3 ro = vec3(u_p12, u_p13, -3.0 / u_scale + u_p11); 
        vec3 rd = normalize(vec3((uv - 0.5) * 2.0, 1.0)); 
        
        // P14: Rot
        rd.xy *= rot2D(u_p14);

        float t = 0.0; 
        float accum = 0.0; 
        for(int i=0; i<50; i++) { 
            vec3 p = ro + rd * t; 
            float sphere = length(p) - 1.5; 
            float g = gyroid(p, 4.0 + u_factor * 5.0) * 0.1; 
            float d = sphere + g; 
            if (d < 0.1) { accum += (0.1 - d) * u_intensity; } 
            t += max(0.02, d * 0.5); 
            if (t > 10.0) break; 
        } 
        
        // P15: Gamma
        if(u_p15 > 0.0) accum = pow(max(0.0, accum), 1.0 + u_p15);

        return clamp(accum, 0.0, 1.0); 
    }` },
    
    [TextureType.VOLUMETRIC_FOG]: { deps: ['fbm', 'sdf'], code: `float getPattern(vec2 uv) { 
        vec3 ro = vec3(u_p12, 1.0 + u_p13, u_time * u_speed + u_p11); 
        vec3 rd = normalize(vec3((uv - 0.5) * 2.0, 1.0)); 
        rd.y -= 0.3; 
        
        // P14: Tilt
        if(u_p14 != 0.0) rd.yz *= rot2D(u_p14);

        float t = 0.0; 
        float accum = 0.0; 
        for(int i=0; i<30; i++) { 
            vec3 p = ro + rd * t; 
            float den = fbm(p * 0.5 * u_scale); 
            float h = smoothstep(1.0, -1.0, p.y); 
            accum += den * h * 0.05 * u_intensity; 
            t += 0.2 + u_factor * 0.2; 
        } 
        
        // P15: Gamma
        if(u_p15 > 0.0) accum = pow(max(0.0, accum), 1.0 + u_p15);

        return clamp(accum, 0.0, 1.0); 
    }` },
};
