float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u = st * u_scale * 10.0; 
        float w = sin(u.x + u_time * u_factor * 5.0); 
        w += sin(u.x * 2.0 + u_time) * u_p1; 
        
        // Pulse (p12)
        if(u_p12 > 0.0) w *= 1.0 + sin(u_time * 10.0) * u_p12 * 0.5;

        return pow(clamp(w * 0.5 + 0.5, 0.0, 1.0), u_intensity); 
    }