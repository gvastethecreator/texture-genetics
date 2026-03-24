float getPattern(vec2 uv) { 
        vec2 p = uv * u_scale * 4.0; 
        p += vec2(u_p14, u_p15);
        vec2 c = curlNoise(p + u_time * 0.2); 
        float v = length(c); 
        v += (1.0 - smoothstep(0.0, 1.0, v)) * u_factor; 
        
        // P15: Gamma
        if(u_p15 > 0.0) v = pow(max(0.0, v), 1.0 - u_p15 * 0.5);

        return pow(clamp(v, 0.0, 1.0), u_intensity); 
    }