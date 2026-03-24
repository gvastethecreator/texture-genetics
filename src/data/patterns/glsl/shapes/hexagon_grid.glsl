float getPattern(vec2 uv) { 
        vec2 st = uv;
        st += vec2(u_p13, u_p14); // Offset
        if(u_p15 != 0.0) st = rotate2d(u_p15 * 3.14) * (st - 0.5) + 0.5;

        vec2 u=st*u_scale*10.0; 
        u.x+=floor(u.y)*u_p10; 
        if(u_p6>0.0){u+=sin(u.yx*2.0+u_time)*u_p6*0.2;} 
        
        // Hex Ratio (p12)
        float hr = 1.73 * (0.5 + u_p12);
        vec2 r=vec2(1.0, hr); 
        vec2 h=r*0.5; 
        vec2 a=mod(u,r)-h; 
        vec2 b=mod(u-h,r)-h; 
        vec2 gv=dot(a,a)<dot(b,b)?a:b; 
        vec2 id=u-gv; 
        float rand=random(id); 
        
        vec2 p=abs(gv); 
        float c=max(dot(p,normalize(vec2(1.0,1.73))),p.x); 
        float thickness=0.02+u_factor*0.4; 
        float roundness=u_p3*0.2; 
        float d=smoothstep(thickness+roundness+0.01,thickness,0.5-c); 
        
        // Pulse
        float pulse=sin(length(gv)*10.0-u_time*(2.0+u_p2*5.0) + u_p11*10.0); 
        d+=pulse*u_p4; 
        
        if(u_p5>0.0){d*=mix(1.0,rand,u_p5);} 
        if(u_p7>0.0){d+=(1.0-smoothstep(0.0,0.1,0.5-c))*u_p7;} 
        d=mix(d,1.0,u_p8*step(0.01,d)); 
        if(u_p9>0.0){d*=1.0-length(gv)*u_p9;} 
        
        return pow(clamp(d,0.0,1.0),u_intensity); 
    }