float getPattern(vec2 uv) { 
        // Global Transformations
        vec2 st=uv*u_scale*3.0; 
        st += vec2(u_p14, u_p15); // Shift X/Y
        if(u_p13!=0.0) st = rotate2d(u_p13) * (st - 0.5 * u_scale * 3.0) + 0.5 * u_scale * 3.0;

        // P7/P8: Domain Warping
        if(u_p7>0.0){vec2 q=vec2(noise(st),noise(st+vec2(5.2,1.3)));float angle=u_p8*6.28;mat2 rot=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));st+=rot*q*u_p7;} 
        if(u_p4>0.0){st+=noise(st*2.0)*u_p4;} 
        
        float v=0.0; 
        float a=0.5; 
        float max_oct=1.0+floor(u_factor*7.0); 
        float pers=0.5+(u_p1-0.5); 
        float lac=2.0+(u_p2-0.5); 
        float timeOffset=u_time*0.1+u_p5*10.0; 
        
        for(int i=0;i<8;i++){ 
            if(float(i)>=max_oct)break; 
            float n=noise(st+timeOffset); 
            if(u_p3>0.0){n=mix(n,1.0-abs(n*2.0-1.0),u_p3);} 
            if(u_p6>0.0){n=mix(n,abs(n*2.0-1.0),u_p6);} 
            if(u_p9>0.0){n=pow(n,1.0+u_p9);} 
            v+=n*a; 
            st*=lac; 
            a*=pers; 
        } 
        
        if(u_p10>0.0){v=smoothstep(u_p10*0.5,1.0-u_p10*0.5,v);} 
        
        // P11: Grain Overlay
        if(u_p11 > 0.0) v += (random(st * 100.0) - 0.5) * u_p11 * 0.2;

        // P15: Gamma Correction (Last param as standard)
        if(u_p15 > 0.0) v = pow(max(0.0, v), 1.0/max(0.1, 1.0 - u_p15 * 0.8));
        
        return pow(clamp(v,0.0,1.0),u_intensity); 
    }