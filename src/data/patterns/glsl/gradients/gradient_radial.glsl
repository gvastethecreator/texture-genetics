float getPattern(vec2 uv) { 
        vec2 u=uv-0.5; 
        u += vec2(u_p13, u_p14); // Offset
        u.x*=1.0+(u_factor-0.5)*2.0; 
        float val = 1.0-length(u)*u_scale*2.0;
        
        // P15: Gamma
        if(u_p15 > 0.0) val = pow(max(0.0, val), 1.0 + u_p15 * 2.0);
        
        return pow(clamp(val,0.0,1.0),u_intensity); 
    }