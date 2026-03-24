float getPattern(vec2 uv) { 
        vec2 st = uv * u_scale * 5.0; 
        st += vec2(u_p14, u_p15); // Shift
        if(u_p13!=0.0) st = rotate2d(u_p13) * st;

        float jitter = u_p1; 
        vec3 v = voronoi(st); 
        float dist = v.x; 
        if(u_p2 > 0.0) dist = mix(dist, v.y - v.x, u_p2); 
        
        if(u_factor > 0.0) dist = smoothstep(u_factor * 0.2, 0.0, abs(dist - 0.5 * u_factor)); 
        else dist = 1.0 - dist; 
        
        // P12: Bubbles/Cells Mod
        if(u_p12 > 0.0) dist = mix(dist, smoothstep(0.4, 0.5, dist), u_p12);
        
        // P11: Grain
        if(u_p11 > 0.0) dist += (random(uv*100.0) - 0.5) * u_p11 * 0.1;

        return pow(clamp(dist, 0.0, 1.0), u_intensity); 
    }