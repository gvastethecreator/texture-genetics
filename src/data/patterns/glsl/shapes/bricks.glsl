float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15*0.5) * (st-0.5) + 0.5;

        vec2 u = st * u_scale * 10.0; 
        float row = floor(u.y); 
        u.x += mod(row, 2.0) * (0.5 + (u_p2 - 0.5)); 
        vec2 f = fract(u); 
        float mortar = 0.05 + (1.0-u_factor)*0.1 + u_p1 * 0.1; 
        float v = smoothstep(mortar, mortar+0.02, f.x) * smoothstep(1.0-mortar, 1.0-mortar-0.02, f.y); 
        
        // Tilt (p15/16 logic - mapping to p12)
        if(u_p12 > 0.0) v *= (0.5 + 0.5 * f.x * f.y);

        return pow(clamp(v, 0.0, 1.0), u_intensity); 
    }