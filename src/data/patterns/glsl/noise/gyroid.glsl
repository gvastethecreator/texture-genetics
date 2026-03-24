float getPattern(vec2 uv) { 
        vec3 p = vec3(uv * u_scale * 8.0, u_time * 0.5); 
        p.xy += vec2(u_p14, u_p15);
        p.z *= (0.5 + u_p1 * 1.5); 
        p.y *= (0.5 + u_p2 * 1.5); 
        float d = gyroid(p, 1.0); 
        if(u_detail > 0.0) d += gyroid(p, 2.1) * 0.5 * u_detail; 
        if(u_detail > 0.5) d += gyroid(p, 4.3) * 0.25 * u_detail; 
        d = d * (1.0 - u_factor * 0.5) + u_factor * sin(d * 5.0); 
        
        // P15: Gamma
        float val = d * 0.5 + 0.5;
        if(u_p15 > 0.0) val = pow(max(0.0, val), 1.0 - u_p15 * 0.5);

        return pow(clamp(val, 0.0, 1.0), u_intensity); 
    }