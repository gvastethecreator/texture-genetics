float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        float n=noise(st*u_scale*4.0+u_time*u_speed*0.2); 
        n+=0.5*noise(st*u_scale*8.0-u_time*0.1); 
        float freq=5.0+u_p3*20.0; 
        float val=fract(n*freq); 
        float thick=0.1+u_factor*0.4; 
        float line=smoothstep(thick,thick-0.05,abs(val-0.5)); 
        return clamp(line*u_intensity,0.0,1.0); 
    }