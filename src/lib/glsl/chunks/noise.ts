export const BASE_NOISE = `
    // LUT-less pseudo random
    float random(vec2 st) {
        return fract(sin(dot(st.xy + vec2(u_seed), vec2(12.9898,78.233))) * 43758.5453123);
    }
    float random(float n) { return fract(sin(n + u_seed) * 43758.5453123); }
    
    // 3D Random
    float random(vec3 p) { 
        return fract(sin(dot(p + vec3(u_seed), vec3(12.9898, 78.233, 45.5432))) * 43758.5453); 
    }

    // Modulo 289 without a division (permutations)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }

    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    // Hash functions needed for some complex patterns
    vec2 hash22(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
        p3 += dot(p3, p3.yzx+19.19);
        return fract((p3.xx+p3.yz)*p3.zy);
    }
    
    float hash12(vec2 p) {
        vec3 p3  = fract(vec3(p.xyx) * .1031);
        p3 += dot(p3, p3.yzx + 19.19);
        return fract((p3.x + p3.y) * p3.z);
    }
    
    vec3 hash33(vec3 p) {
        p = fract(p * vec3(.1031, .1030, .0973));
        p += dot(p, p.yxz+33.33);
        return fract((p.xxy + p.yxx)*p.zyx);
    }
`;

export const SIMPLEX_NOISE = `
    // 2D Simplex Noise
    float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    // 3D Simplex Noise
    float snoise(vec3 v) { 
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i); 
        vec4 p = permute( permute( permute( 
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                
        float n_ = 0.142857142857; 
        vec3  ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z); 
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ ); 
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }
`;

export const VALUE_NOISE = `
    float valueNoise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        f = f * f * (3.0 - 2.0 * f);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
`;

export const CLASSIC_NOISE = `
    // 2D Classic Noise
    float noise(in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    // 1D Noise
    float noise(float p) {
        float i = floor(p);
        float f = fract(p);
        return mix(random(i), random(i + 1.0), f * f * (3.0 - 2.0 * f));
    }

    // 3D Value Noise
    float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float n = i.x + i.y * 57.0 + i.z * 113.0;
        
        float a = random(i + vec3(0.0, 0.0, 0.0));
        float b = random(i + vec3(1.0, 0.0, 0.0));
        float c = random(i + vec3(0.0, 1.0, 0.0));
        float d = random(i + vec3(1.0, 1.0, 0.0));
        float e = random(i + vec3(0.0, 0.0, 1.0));
        float g = random(i + vec3(1.0, 0.0, 1.0)); // f renamed to g to avoid conflict
        float h = random(i + vec3(0.0, 1.0, 1.0));
        float k = random(i + vec3(1.0, 1.0, 1.0));
        
        float res = mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
                        mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
        return res;
    }
`;

export const FBM = `
    // 2D FBM
    float fbm(in vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        mat2 rot = mat2(0.87758, 0.47942, -0.47942, 0.87758); 
        
        value += amplitude * noise(st); st = rot * st * 2.0 + vec2(100.0); amplitude *= 0.5;
        if(u_detail > 0.0) { value += amplitude * noise(st) * u_detail; } st = rot * st * 2.0 + vec2(100.0); amplitude *= 0.5;
        if(u_detail > 0.2) { value += amplitude * noise(st) * min(1.0, u_detail * 1.5); } st = rot * st * 2.0 + vec2(100.0); amplitude *= 0.5;
        if(u_detail > 0.5) { value += amplitude * noise(st) * min(1.0, u_detail * 2.0); } st = rot * st * 2.0 + vec2(100.0); amplitude *= 0.5;
        if(u_detail > 0.8) { value += amplitude * noise(st); }
        return value;
    }

    // 3D FBM
    float fbm(in vec3 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i=0; i<5; i++) {
            value += amplitude * noise(p); 
            p = p * 2.0 + vec3(100.0); 
            amplitude *= 0.5;
        }
        return value;
    }

    float ridgedFBM(vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
            float n = 1.0 - abs(noise(st) * 2.0 - 1.0);
            n = pow(n, 1.0 + u_factor);
            value += n * amplitude;
            st = st * 2.0;
            amplitude *= 0.5;
        }
        return value;
    }
`;

export const CURL_NOISE = `
    vec2 curlNoise(vec2 p) {
        const float e = 0.1;
        float n1 = snoise(p + vec2(e, 0.0));
        float n2 = snoise(p - vec2(e, 0.0));
        float n3 = snoise(p + vec2(0.0, e));
        float n4 = snoise(p - vec2(0.0, e));
        return vec2(n3 - n4, n2 - n1) * 5.0;
    }
`;

export const VORONOI = `
    vec3 voronoi( in vec2 x ) {
        vec2 n = floor(x);
        vec2 f = fract(x);
        vec2 mg, mr;
        float md = 8.0;
        for( int j=-1; j<=1; j++ ) {
            for( int i=-1; i<=1; i++ ) {
                vec2 g = vec2(float(i),float(j));
                vec2 o = hash22(n + g); // FIX: Use 2D hash
                o = 0.5 + 0.5*sin( u_time + 6.2831*o );
                vec2 r = g + o - f;
                float d = dot(r,r);
                if( d<md ) { md = d; mr = r; mg = g; }
            }
        }
        return vec3( md, mr );
    }

    float voronoiSmooth(vec2 uv) {
        vec2 n = floor(uv);
        vec2 f = fract(uv);
        float res = 0.0;
        float smoothness = 0.1 + u_factor * 2.0; 
        for(int j=-1; j<=1; j++) {
            for(int i=-1; i<=1; i++) {
                vec2 b = vec2(float(i), float(j));
                vec2 r = vec2(b) - f + hash22(n + b); // FIX: Use 2D hash
                float d = length(r);
                res += exp( -smoothness*d );
            }
        }
        return -(1.0/smoothness)*log( res );
    }
    
    vec3 worley3(vec3 p) {
        vec4 d = vec4(1e15); // Use vec4 for sorting buffer
        vec3 ip = floor(p);
        for (float i=-1.; i<2.; i++)
            for (float j=-1.; j<2.; j++)
                for (float k=-1.; k<2.; k++) {
                    vec3 p0 = ip+vec3(i,j,k);
                    vec3 c = hash33(p0)+p0-p;
                    float d0 = dot(c,c);
                    // Manually assign to avoid swizzling assignment errors in some drivers
                    if (d0<d.x) { d.w=d.z; d.z=d.y; d.y=d.x; d.x=d0; }
                    else if (d0<d.y) { d.w=d.z; d.z=d.y; d.y=d0; }
                    else if (d0<d.z) { d.w=d.z; d.z=d0; }
                    else if (d0<d.w) { d.w=d0; }
                }
        return sqrt(d.xyz);
    }
`;

export const GYROID = `
    float gyroid(vec3 p, float scale) {
        p *= scale;
        return dot(sin(p), cos(p.yzx));
    }
`;
