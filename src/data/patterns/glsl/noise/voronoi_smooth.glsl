float getPattern(vec2 uv) { 
        vec2 st = uv * u_scale * 5.0;
        st += vec2(u_p14, u_p15);
        
        float n = voronoiSmooth(st); 
        if(u_p1 > 0.0) n = n + sin(uv.x * 20.0) * 0.1 * u_p1; 
        
        // P11: Rot
        if(u_p11 > 0.0) {
             float ang = u_p11;
             st = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * st;
        }
        
        // P12: Grain
        if(u_p12 > 0.0) n += (random(st*10.0) - 0.5) * u_p12 * 0.1;

        return pow(clamp(n * 0.5 + 0.5, 0.0, 1.0), u_intensity); 
    }