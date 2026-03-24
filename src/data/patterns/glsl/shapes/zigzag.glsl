float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u = st * u_scale * 10.0; 
        float z = abs(fract(u.x + u.y) - 0.5) * 2.0; 
        if(u_factor > 0.5) z = abs(fract(u.x - u.y) - 0.5) * 2.0; 
        float thickness = 0.2 + u_p1; 
        float blur = u_p2 * 0.5; 
        return pow(clamp(smoothstep(thickness + blur, thickness - blur, z), 0.0, 1.0), u_intensity); 
    }