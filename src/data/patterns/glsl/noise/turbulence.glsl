float getPattern(vec2 uv) { 
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
    }