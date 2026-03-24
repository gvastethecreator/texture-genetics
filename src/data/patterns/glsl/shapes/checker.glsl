float getPattern(vec2 uv) { 
        // Coords
        vec2 st = uv;
        // P12: X Shift, P13: Y Shift
        st += vec2(u_p12, u_p13);
        // P14: Rotation
        if(u_p14 != 0.0) st = rotate2d(u_p14 * 6.28) * (st - 0.5) + 0.5;

        vec2 u=st*u_scale*10.0; 
        u+=vec2(u_p6*2.0); 
        u+=vec2(sin(u.y*u_p10),cos(u.x*u_p10))*u_p10; 
        if(u_factor>0.0){float s=sin(u_factor);float c=cos(u_factor);u=mat2(c,-s,s,c)*u;} 
        // P11: Phase Shift
        u+=sin(u.yx*2.0 + u_p11 * 10.0)*u_p2*0.5; 
        
        vec2 id=floor(u); 
        vec2 f=fract(u); 
        float check=mod(id.x+id.y, 2.0); 
        if(u_p3>0.0){vec2 dist=abs(f-0.5)-0.5;float d=length(max(dist+u_p3*0.5,0.0));float shape=smoothstep(0.5,0.5-u_p1*0.5,d*2.0);check=mix(check,shape,u_p5);} 
        if(u_p4>0.0){float d=length(f-0.5);float inner=smoothstep(0.4,0.4-u_p1,d);check=mix(check,max(check,inner),u_p4);} 
        if(u_p8>0.0){float grid=max(step(1.0-u_p8,f.x),step(1.0-u_p8,f.y));grid=max(grid,max(step(f.x,u_p8),step(f.y,u_p8)));check=mix(check,1.0-check,grid);} 
        
        float softness=u_p1*0.5; 
        float result=smoothstep(0.5-softness,0.5+softness,check); 
        
        if(u_p9>0.0){float n=random(id+u_seed);result=mix(result,n,u_p9*0.5);} 
        if(u_p7>0.0){float distToCenter=length(uv-0.5);result*=1.0-smoothstep(0.2,0.8,distToCenter*u_p7*2.0);} 
        
        // P15: Gamma/Grain
        if(u_p15 > 0.0) {
            float noiseVal = random(uv * 100.0 + u_time);
            result = mix(result, noiseVal, u_p15 * 0.2);
        }
        
        return pow(max(0.0, result), u_intensity); 
    }