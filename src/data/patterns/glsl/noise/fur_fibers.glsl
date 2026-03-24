float getPattern(vec2 uv) { 
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
    }