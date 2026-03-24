float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;
        
        vec2 u=st-0.5; 
        float a=atan(u.y,u.x)+u_time*u_factor; 
        float val = (a/PI)*0.5+0.5; 
        if(u_p1>0.0) val = mod(val * (1.0+u_p1*10.0), 1.0); 
        if(u_p2>0.0) val = pow(max(0.0, val), 1.0 + u_p2 * 4.0); 
        
        // Warp (p12)
        if(u_p12>0.0) val += sin(length(u)*10.0)*u_p12*0.2;

        return pow(clamp(val, 0.0, 1.0),u_intensity); 
    }