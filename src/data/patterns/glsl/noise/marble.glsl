float getPattern(vec2 uv) { 
        vec2 p = uv * u_scale * 2.0; 
        p += vec2(u_p14, u_p15);
        if(u_p7>0.0) p = rotate2d(u_p7)*p; 
        float n=fbm(p+u_time*0.1); 
        float veins = u_p4 * 20.0 + 10.0; 
        float distort = u_p3 * 10.0 + 1.0; 
        float marble = 0.5+0.5*cos(p.x*veins + n*distort*u_factor); 
        if(u_p1>0.0) marble = mix(marble, marble*marble, u_p1); 
        
        // P12: Grain
        if(u_p12 > 0.0) marble += (random(p*20.0) - 0.5) * u_p12 * 0.2;
        // P15: Gamma
        if(u_p15 > 0.0) marble = pow(max(0.0, marble), 1.0 - u_p15 * 0.5);

        return pow(clamp(marble, 0.0, 1.0),u_intensity); 
    }