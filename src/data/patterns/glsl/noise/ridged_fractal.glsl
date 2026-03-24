float getPattern(vec2 uv) { 
        vec2 st = uv * u_scale * 3.0; 
        st += vec2(u_p14, u_p15);
        if(u_p3 > 0.0) st += u_p3; 
        float n = ridgedFBM(st + u_time * 0.05); 
        if(u_p1 > 0.0) n *= (1.0 + u_p1); 
        if(u_p2 > 0.0) n = pow(max(0.0, n), 1.0 + u_p2); 
        
        // P12: Rot
        if(u_p12 > 0.0) {
            float ang = u_p12 * 3.14;
            st = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * st;
        }
        
        // P15: Gamma
        if(u_p15 > 0.0) n = pow(max(0.0, n), 1.0 + u_p15);

        return pow(clamp(n, 0.0, 1.0), u_intensity); 
    }