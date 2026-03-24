float getPattern(vec2 uv) { 
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
    }