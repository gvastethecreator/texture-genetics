float getPattern(vec2 uv) { 
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
    }