float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u = st * u_scale * 20.0; 
        float w = sin(u.x + sin(u.y * u_factor + u_time) * 2.0 * (1.0+u_p1)); 
        if(u_p2 > 0.0) w = smoothstep(-u_p2, u_p2, w); 
        
        // Warp (p12)
        if(u_p12 > 0.0) w += noise(st * 5.0) * u_p12;

        return pow(clamp(w * 0.5 + 0.5, 0.0, 1.0), u_intensity); 
    }