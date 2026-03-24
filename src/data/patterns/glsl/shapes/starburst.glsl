float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        vec2 p = st - 0.5; 
        
        // Warp (p15)
        if(u_p15 > 0.0) p += vec2(noise(st*5.0), noise(st*5.0+10.0))*u_p15*0.1;

        float a = atan(p.y, p.x); 
        float rays = 8.0 + floor(u_scale * 20.0); 
        float w = 0.5 + 0.5 * cos(a * rays + u_time); 
        float s = 1.0 + u_factor * 50.0; 
        w = pow(clamp(w, 0.0, 1.0), s); 
        return pow(clamp(w, 0.0, 1.0), u_intensity); 
    }