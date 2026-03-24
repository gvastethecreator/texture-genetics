float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u=st*u_scale*10.0; 
        float TSC=0.3*u_time*u_speed; 
        vec2 T=vec2(-50.0*TSC,20.0*sin(TSC)); 
        vec2 pos=u; 
        float A=u_p1*5.0; 
        float Q=u_factor*0.5+0.01; 
        vec2 uwave=vec2(sin(Q*pos.y),sin(Q*pos.x)); 
        vec2 warpedPos=pos+A*uwave+T; 
        float v=max(sin(warpedPos.x),cos(warpedPos.y)); 
        float shade=0.25*(2.0+sin(Q*u.x))*(2.0+sin(Q*u.y)); 
        float pattern=v*shade; 
        float thickness=u_p3; 
        pattern=smoothstep(thickness-0.1,thickness+0.1,pattern); 
        return clamp(pattern*u_intensity,0.0,1.0); 
    }