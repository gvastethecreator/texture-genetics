float getPattern(vec2 uv) { 
        float a=u_factor*PI; 
        float s=sin(a); 
        float c=cos(a); 
        vec2 u=mat2(c,-s,s,c)*(uv-0.5)+0.5; 
        u += vec2(u_p13, u_p14); // Offset
        float val = 0.5+0.5*sin(u.x*u_scale*50.0+u_time);
        
        // P15: Gamma
        if(u_p15 > 0.0) val = pow(max(0.0, val), 1.0 + u_p15 * 2.0);

        return pow(clamp(val, 0.0, 1.0),u_intensity); 
    }