float getPattern(vec2 uv) { 
        vec2 st = uv * u_scale * 10.0; 
        st += vec2(u_p14, u_p15);
        if(u_p1 > 0.0) st = floor(st * u_p1) / u_p1; 
        float n = valueNoise(st); 
        if(u_p2 > 0.0) n = smoothstep(0.0, 1.0 - u_p2, n); 
        
        // P11: Skew
        if(u_p11 > 0.0) st.x += st.y * u_p11;
        
        // P12: Grain
        if(u_p12 > 0.0) n += (random(st*20.0) - 0.5) * u_p12 * 0.2;

        return pow(clamp(n, 0.0, 1.0), u_intensity); 
    }