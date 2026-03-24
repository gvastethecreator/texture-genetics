float getPattern(vec2 uv) { 
        vec2 p = uv * u_scale * 4.0; 
        p += vec2(u_p14, u_p15);
        if(u_p5 > 0.0) p += sin(p.yx * 5.0) * u_p5 * 0.1; 
        float n=noise(p); 
        float rings = 10.0 + u_factor * 20.0 + u_p3 * 10.0; 
        float wood = 0.5 + 0.5 * sin((length(p - 0.5) + n * 0.1 * u_p7) * rings); 
        if(u_p4 > 0.0) { float knots = noise(p * 2.0); wood = mix(wood, knots, u_p4 * smoothstep(0.4, 0.6, knots)); } 
        
        // P12: Detail
        if(u_p12 > 0.0) wood += n * u_p12 * 0.1;
        // P15: Gamma
        if(u_p15 > 0.0) wood = pow(max(0.0, wood), 1.0 - u_p15 * 0.5);

        return pow(clamp(wood, 0.0, 1.0),u_intensity); 
    }