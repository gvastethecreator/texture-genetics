float getPattern(vec2 uv) { 
        vec2 st = uv * u_scale * 5.0;
        st += vec2(u_p14, u_p15);
        
        vec2 i_st = floor(st);
        vec2 f_st = fract(st);
        float m_dist = 1.0;
        
        for (int y= -1; y <= 1; y++) {
            for (int x= -1; x <= 1; x++) {
                vec2 neighbor = vec2(float(x),float(y));
                // FIX: Use proper 2D Hash to avoid diagonal collapse
                vec2 point = hash22(i_st + neighbor); 
                
                vec2 jitter = point;
                if (u_speed > 0.0) {
                    jitter = 0.5 + 0.5 * sin(u_time * u_speed * 2.0 + 6.2831 * point);
                }
                
                point = mix(vec2(0.5), jitter, u_p1); // Jitter
                
                vec2 diff = neighbor + point - f_st;
                float dist = length(diff);
                
                if( dist < m_dist ) {
                    m_dist = dist;
                }
            }
        }
        
        float val = 1.0 - m_dist;
        
        if (u_p3 > 0.0) val = m_dist; // Invert
        
        // Edge Softness (P2)
        if (u_p2 > 0.0) {
            float e = u_p2 * 0.9; // max 0.9
            val = smoothstep(0.0 + e * 0.5, 1.0 - e * 0.5, val);
        }
        
        // Mix with Noise (u_factor)
        if (u_factor > 0.0) {
            val = mix(val, val * noise(st + u_time), u_factor);
        }
        
        // P15: Gamma
        if(u_p15 > 0.0) val = pow(max(0.0, val), 1.0 - u_p15 * 0.5);
        
        return clamp(val * u_intensity, 0.0, 1.0);
    }