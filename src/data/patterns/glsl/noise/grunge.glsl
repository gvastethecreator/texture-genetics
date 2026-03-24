float getPattern(vec2 uv) { 
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
    }