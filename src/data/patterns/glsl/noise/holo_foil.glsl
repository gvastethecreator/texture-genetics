float getPattern(vec2 uv) { 
        vec2 st = uv * 10.0 * u_scale;
        st += vec2(u_p14, u_p15);
        vec2 noise = holoVoronoi(st); 
        float v = noise.x * noise.y; 
        
        // P11: Warp
        if(u_p11 > 0.0) v += sin(st.x * 2.0) * 0.1 * u_p11;
        // P12: Grain
        if(u_p12 > 0.0) v += (random(st) - 0.5) * u_p12 * 0.1;
        // P15: Gamma
        if(u_p15 > 0.0) v = pow(max(0.0, v), 1.0 - u_p15 * 0.5);

        return pow(clamp(v, 0.0, 1.0), u_intensity * (1.0 - u_factor * 0.5)); 
    }