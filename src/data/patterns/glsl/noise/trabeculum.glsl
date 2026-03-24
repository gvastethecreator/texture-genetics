float getPattern(vec2 uv) { 
        vec2 p = uv * u_scale * 5.0; 
        p += vec2(u_p14, u_p15);
        vec3 p3 = vec3(p, u_time * 0.2); 
        vec3 w = worley3(p3); 
        float c0 = 0.0; 
        if (u_factor < 0.33) c0 = w.y - w.x; 
        else if (u_factor < 0.66) c0 = 2.0 * (w.y - w.x); 
        else { float denom = (1.0/(w.z-w.x)+1.0/(w.y-w.x)); if (abs(denom) > 0.001) c0 = 1.0 - 1.0/denom; } 
        
        // P15: Gamma
        if(u_p15 > 0.0) c0 = pow(max(0.0, c0), 1.0 - u_p15 * 0.5);

        return pow(clamp(c0, 0.0, 1.0), u_intensity); 
    }