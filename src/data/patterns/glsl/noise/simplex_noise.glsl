float getPattern(vec2 uv) { 
        vec2 st = uv * u_scale * 8.0; 
        st += vec2(u_p14, u_p15); // Shift
        if(u_p13!=0.0) st = rotate2d(u_p13) * st;

        if(u_p2 > 0.0) st += snoise(vec3(st, u_time*0.1)) * u_p2; 
        float n = snoise(vec3(st, u_time * 0.2)); 
        if(u_p1 > 0.0) n = mix(n, 1.0 - abs(n), u_p1); 
        
        // P3-P12: Filling gaps
        if(u_p3 > 0.0) n = pow(n * 0.5 + 0.5, 1.0 + u_p3 * 2.0) * 2.0 - 1.0;
        if(u_p4 > 0.0) n += snoise(vec3(st * 2.0, u_time * 0.3)) * u_p4 * 0.5;
        
        // P12: Grain
        if(u_p12 > 0.0) n += (random(st*50.0) - 0.5) * u_p12 * 0.1;

        return pow(clamp(n * 0.5 + 0.5, 0.0, 1.0), u_intensity); 
    }