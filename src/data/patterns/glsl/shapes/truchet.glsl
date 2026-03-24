float getPattern(vec2 uv) { 
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
    }