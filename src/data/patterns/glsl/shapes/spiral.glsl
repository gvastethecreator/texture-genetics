float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        
        vec2 u = st - 0.5; 
        
        // Warp (p15)
        if(u_p15 > 0.0) u += vec2(noise(st*5.0), noise(st*5.0+10.0))*u_p15*0.1;

        float r = length(u); 
        float a = atan(u.y, u.x); 
        float s = sin(r * 20.0 * u_scale - a * (5.0 + u_factor * 10.0) + u_time * 2.0); 
        return pow(clamp(s * 0.5 + 0.5, 0.0, 1.0), u_intensity); 
    }