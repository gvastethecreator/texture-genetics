
import { TextureType, PatternDefinition } from '../../core/types/types';

export const ABSTRACT: Partial<Record<TextureType, PatternDefinition>> = {
    [TextureType.SCANLINES]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14); // Offset Y
        if(u_p15 > 0.001) { // Prevent div by zero
            float steps = 50.0 * u_p15;
            st.x = floor(st.x * steps) / steps; // Static
        }

        float c=u_resolution.y*u_scale*0.1*(1.0+u_p1*2.0); 
        float m=u_factor>0.5?u_time*5.0:0.0; 
        float l=sin(st.y*c+m)*0.5+0.5; 
        float vig=1.0-distance(st,vec2(0.5))*u_intensity; 
        if(u_p2 > 0.0) l += (random(st * u_time) - 0.5) * u_p2; 
        
        return clamp(l*vig, 0.0, 1.0); 
    }` },

    [TextureType.MAGIC_CIRCLE]: { code: `float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st += vec2(sin(st.y*10.0), cos(st.x*10.0)) * u_p15 * 0.05; // Wobble

        vec2 u=(st-0.5)*2.0*u_scale; 
        float d=length(u); 
        float a=atan(u.y,u.x); 
        float v=smoothstep(0.02,0.0,abs(d-0.8)); 
        float k=3.0+floor(u_factor*8.0); 
        v+=smoothstep(0.02,0.0,abs(d-0.5-0.1*cos(a*k+u_time))); 
        if(d>0.6&&d<0.75) v+=step(0.5,noise(vec2(a*10.0,0.0)))*0.5; 
        return clamp(v*u_intensity,0.0,1.0); 
    }` },

    [TextureType.MANDALA]: { code: `float getPattern(vec2 uv) { vec2 u=(uv-0.5)*2.0*u_scale; float d=length(u); float a=atan(u.y,u.x); float p=4.0+floor(u_factor*12.0); float v=smoothstep(0.0,1.0,cos(a*p)*0.5+0.5-d); v+=cos(d*20.0-u_time)*0.2; return pow(clamp(v,0.0,1.0),u_intensity); }` },
    [TextureType.ELECTRIC]: { code: `float getPattern(vec2 uv) { vec2 p=(uv*2.0-1.0)*u_scale; float t=u_time*2.0; for(int i=1;i<8;i++){ float s=0.3*(1.0+u_factor); p.x+=s/float(i)*sin(float(i)*3.0*p.y+t); p.y+=s/float(i)*cos(float(i)*3.0*p.x+t); } return pow(clamp(sin(p.x+p.y+1.0)*0.5+0.5, 0.0, 1.0),u_intensity); }` },
    [TextureType.BINARY_MATRIX]: { code: `float getPattern(vec2 uv) { vec2 u=uv*u_scale*20.0; vec2 i=floor(u); float s=random(i.x)*5.0+2.0; float y=mod(u.y+u_time*s*(1.0+u_p2),20.0); float v=step(10.0,y)*random(i+floor(u_time*5.0)); v*=smoothstep(20.0,10.0,y); if(random(u.y+u_time)>1.0-(u_factor*0.2 + u_p1 * 0.5)) v=1.0; return clamp(v*u_intensity*(1.0+u_p3),0.0,1.0); }` },
    [TextureType.EXPLOSION]: { code: `float getPattern(vec2 uv) { vec2 u=(uv-0.5)*2.0*u_scale; float d=length(u); float r=mod(u_time,2.0); float val=smoothstep(0.1,0.0,abs(d-r)); float n=noise(u*10.0+u_time); val+=step(1.0-u_factor*0.5,n)*(1.0-d); return clamp(val*u_intensity,0.0,1.0); }` },
    [TextureType.RADIAL_WAVE]: { code: `float getPattern(vec2 uv) { vec2 u=uv-0.5; float w=sin(length(u)*40.0*u_scale-u_time*5.0); if(u_factor>0.0) w+=sin(atan(u.y,u.x)*10.0*u_factor); return pow(clamp(w * 0.5 + 0.5, 0.0, 1.0),u_intensity); }` },
    
    [TextureType.CIRCUIT]: { code: `float getPattern(vec2 uv) { vec2 u=uv*u_scale*10.0; vec2 i=floor(u); vec2 f=fract(u); float r=random(i); float v=0.0; float thick = 0.05 + 0.1*u_factor; if(r<0.5) v=step(abs(f.x-0.5), thick); else v=step(abs(f.y-0.5), thick); if(random(i+1.0)>0.8) v+=step(length(f-0.5), 0.2 + u_p10 * 0.2); if(u_p6 > 0.0 && v > 0.5) v *= random(i + floor(u_time * 5.0)) > (1.0-u_p6) ? 1.0 : 0.0; return pow(clamp(v, 0.0, 1.0), u_intensity); }` },
    
    [TextureType.MANDELBROT]: { code: `float getPattern(vec2 uv) { vec2 c = (uv - 0.5) * 3.0 / u_scale - vec2(0.5, 0.0) + u_offset; vec2 z = vec2(0.0); float iter = 0.0; float maxIter = 20.0 + u_detail * 80.0; for(float i=0.0; i<100.0; i++){ if(i > maxIter) break; z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c; if(dot(z,z) > 4.0) break; iter++; } return pow(clamp(iter/maxIter, 0.0, 1.0), u_intensity) * (1.0 + u_factor * sin(iter)); }` },
    [TextureType.JULIA]: { code: `float getPattern(vec2 uv) { vec2 z = (uv - 0.5) * 3.0 / u_scale; vec2 c = vec2(-0.8, 0.156) + vec2(sin(u_time*0.5), cos(u_time*0.5))*0.1*u_factor; float iter = 0.0; float maxIter = 20.0 + u_detail * 80.0; for(float i=0.0; i<100.0; i++){ if(i > maxIter) break; z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c; if(dot(z,z) > 4.0) break; iter++; } return pow(clamp(iter/maxIter, 0.0, 1.0), u_intensity); }` },
    
    [TextureType.FLOW_FIELD]: { code: `float getPattern(vec2 uv) { vec2 p = (uv - 0.5) * 2.0 * u_scale; float f = sin(atan(p.y, p.x) + length(p) * (2.0 + u_factor * 10.0)); float l = abs(mod(p.y, 0.1) - 0.05) + p.x; float move = u_time * sign(f) * u_speed; float x = mod(l + move, 0.05 + u_p2 * 0.1) * 20.0; float w = 0.1 + (1.0 - u_detail) * 0.2; float lines = smoothstep(0.0, w, x) * smoothstep(0.5, 0.5 + w, 1.0 - x); float gap = u_intensity * 0.5; lines *= smoothstep(0.0, max(0.001, gap), abs(f)); return clamp(lines, 0.0, 1.0); }` },
    
    [TextureType.INFINITE_FALL]: { code: `float getPattern(vec2 uv) { vec2 u = (uv - 0.5) * 2.0; float t = u_time * 2.0; float ang = u_time * (u_factor - 0.5); float s = sin(ang); float c = cos(ang); u = mat2(c,-s,s,c) * u; u *= u_scale; float v = 0.0; float tot = 0.0; mat2 M = mat2(cos(1.7),sin(1.7),-sin(1.7),cos(1.7)); for(float i=0.0; i<20.0; i++) { float k = i - t; float a = 1.0 - cos(6.2831 * k / 20.0); float sc = exp2(mod(k, 20.0)); float n = noise(u * sc * 0.2); v += a/sc * (1.0 - abs(2.0 * n - 1.0)); tot += a/sc; u = M * u; } return pow(clamp(1.5 * v / tot, 0.0, 1.0), u_intensity); }` },
    [TextureType.VOXEL_TUNNEL]: { code: `vec3 is(vec3 p, vec3 d, float y) { return vec3(p.x-(d.x/d.y*(p.y-y)),y,p.z-(d.z/d.y*(p.y-y))); } float getPattern(vec2 uv) { vec2 p = (uv - 0.5) * 2.0; float t = u_time * u_speed; vec3 ro = vec3(0.0, 10.0, t * 15.0); vec3 rd = normalize(vec3(p.x, -1.0, 1.0)); float accum = 0.0; float depth = 2.0; if (rd.y < 0.0) { for(float i=0.0; i<10.0; i+=1.0) { float layerY = -depth * (i/10.0); vec3 hit = is(ro, rd, layerY); float n = noise(hit.xz * 0.1 * u_scale); if ( abs(layerY - hit.y) < 0.1 ) accum += n * 0.1; } } float tunnel = 1.0 / length(p); float checkers = sin(tunnel * 10.0 + u_time) * sin(atan(p.y, p.x) * 5.0); return clamp(accum + checkers * u_factor * 0.2, 0.0, 1.0) * u_intensity; }` },
    [TextureType.HYPNOTIC_RINGS]: { code: `float getPattern(vec2 uv) { vec2 u = (uv - 0.5) * 2.0; float dist = length(u); float angle = atan(u.y, u.x); float s = 10.0 * u_scale; float t = u_time * (u_speed * 2.0 + 0.5); float val = sin((dist * s) + angle + cos(dist * s * u_factor) - t); val -= dist * (1.0 + 0.5 * sin(t * 1.3)); return clamp(val * 0.5 + 0.5, 0.0, 1.0) * u_intensity; }` },
    [TextureType.METABALL_SPIRAL]: { code: `float getPattern(vec2 uv) { vec2 u = (uv - 0.5) * 2.0; float t = u_time * u_speed; float phase = 1.1; float tho = length(u) * phase + sin(t); u += vec2(tho * cos(tho - 1.25 * t * 2.0), tho * sin(tho - 1.15 * t * 2.0)); float mbr = 0.5 + u_factor * 2.0; float mb = mbr / dot(u, u); float d = smoothstep(mb - 2.0, mb + 1.2, 1.0); return clamp(1.0 - d, 0.0, 1.0) * u_intensity; }` },
    [TextureType.INVERSE_MOBIUS]: { code: `vec2 cdiv(vec2 a, vec2 b) { return vec2(a.x*b.x + a.y*b.y, a.y*b.x - a.x*b.y) / dot(b,b); } float getPattern(vec2 uv) { vec2 z = (uv - 0.5) * 2.0; vec2 a = vec2(u_factor - 0.5, 0.0) * 1.5; vec2 b = vec2(0.5 - u_factor, 0.2); z = cdiv(z - a, z - b); float r = length(z); float angle = atan(z.y, z.x); vec2 gridUV = vec2(angle / 6.2831, log(max(0.001, r))); gridUV.x += u_time * 0.1; gridUV.y -= u_time * 0.5; gridUV *= u_scale * 5.0; vec2 f = fract(gridUV); float line = max(step(0.9 - u_intensity * 0.2, f.x), step(0.9 - u_intensity * 0.2, f.y)); if (u_detail > 0.0) { float n = noise(gridUV * 5.0); line = mix(line, n, u_detail * 0.5); } return clamp(line, 0.0, 1.0); }` },
    [TextureType.STEREO_FLOW]: { code: `float getPattern(vec2 uv) { vec2 u = (uv - 0.5) * 2.0; float t = u_time * u_speed; float n = noise(u * u_scale * 2.0 + t); for(float i=0.0; i<10.0; i++) { vec2 p = vec2(sin(t * 2.0 + i) * 0.5, cos(t * 1.5 - i) * 0.5); float dist = distance(u, p); float r = 0.1 + sin(i) * 0.05 * u_factor; if (dist < r) n = noise(u * 10.0 + i); } return clamp(n, 0.0, 1.0) * u_intensity; }` },
    [TextureType.SMOOTH_SWIRL]: { code: `float getSwirl(vec2 uv) { vec2 st = (uv - 0.5) * 2.0; float r = length(st); float a = atan(st.y, st.x) + r * u_factor * 5.0 - u_time; st = vec2(cos(a), sin(a)) * r; st = st * 0.5 + 0.5; float val = st.x * st.y; return smoothstep(0.2, 0.8, val); } float getPattern(vec2 uv) { float s = getSwirl(uv * u_scale); if (u_detail > 0.0) { float s2 = getSwirl(uv * u_scale * 1.5 + vec2(0.2)); s = mix(s, s2, u_detail); } return pow(clamp(s, 0.0, 1.0), u_intensity); }` },
    [TextureType.NEON_RIPPLES]: { code: `float getPattern(vec2 uv) { vec2 u = (uv * 2.0 - 1.0) * u_scale; float t = u_time * 0.5 * u_speed; float v = 0.0; float layers = 2.0 + floor(u_factor * 6.0); for(float i = 1.0; i < 8.0; i++){ if(i > layers) break; u.y += i * 0.1 / i * sin(u.x * i * i + t) * sin(u.y * i * i + t); } float r = u.y - 0.1; float g = u.y + 0.3; float b = u.y + 0.95; float combined = (r + g + b) / 3.0; return clamp(combined, 0.0, 1.0) * u_intensity; }` },
    [TextureType.BLACK_HOLE]: { deps: ['simplex'], code: `float light1(float intensity, float attenuation, float dist) { return intensity / (1.0 + dist * attenuation); } float light2(float intensity, float attenuation, float dist) { return intensity / (1.0 + dist * dist * attenuation); } float getPattern(vec2 uv) { vec2 u = (uv * 2.0 - 1.0) * u_scale; float len = length(u); float ang = atan(u.y, u.x); float n0 = snoise(u * 0.65 + u_time * 0.5) * 0.5 + 0.5; float r0 = mix(mix(0.6, 1.0, 0.4), mix(0.6, 1.0, 0.6), n0); float d0 = distance(u, r0 / max(0.001, len) * u); float v0 = light1(1.0, 10.0, d0); v0 *= smoothstep(r0 * 1.05, r0, len); float a = u_time * -1.0; vec2 pos = vec2(cos(a), sin(a)) * r0; float d = distance(u, pos); float v1 = light2(1.5, 5.0, d); v1 *= light1(1.0, 50.0, d0); float v2 = smoothstep(1.0, mix(0.6, 1.0, n0 * 0.5), len); float v3 = smoothstep(0.6, mix(0.6, 1.0, 0.5), len); float col = (v0 + v1) * v2 * v3; col += (1.0 / (len * 2.0 + 0.1)) * u_factor * 0.1; return clamp(col, 0.0, 1.0) * u_intensity; }` },
    [TextureType.SPACE_DUST]: { deps: ['sdf'], code: `float getPattern(vec2 uv) { vec2 u = (uv - 0.5) * 2.0; vec3 d = normalize(vec3(u, 1.0 - u_distortion * 0.5)); vec3 p = vec3(0.0, 0.0, -3.0); float t = u_time * u_speed; mat2 r = rot2D(t * 0.2); d.xz *= r; p.xz *= r; float i=0.0, l=0.0; vec3 c = p; float accum = 0.0; for(int j=0; j<60; j++) { vec3 v = p; float s = 1.0; for(float k=0.0; k<5.0; k++) { v = abs(v) - vec3(1.0 + u_scale * 0.2); v.xz *= rot2D(1.0 + u_factor); v.yz *= rot2D(1.0); s *= 0.5; } float dist = length(v) * s - 0.02; if (dist < 0.01) { accum += 0.1 / (1.0 + float(j)*0.1); p += d * dist; } else { p += d * max(0.05, dist); } if (length(p) > 20.0) break; } return clamp(accum * u_intensity, 0.0, 1.0); }` },
    [TextureType.GABOR_NOISE]: { code: `float getPattern(vec2 uv) { vec2 u = (uv - 0.5) * 4.0 * u_scale; float v = 0.0; float freq = 6.0 + u_factor * 10.0; for(float i=-2.0; i<=2.0; i++) { for(float j=-2.0; j<=2.0; j++) { vec2 offset = vec2(i, j) * 0.7; vec2 p = u - offset; float len = dot(p, p); float wave = sin(freq * dot(p, vec2(cos(u_time), sin(u_time)))); v += exp(-2.0 * len) * wave; } } return clamp(0.5 + 0.5 * v, 0.0, 1.0) * u_intensity; }` },
};
