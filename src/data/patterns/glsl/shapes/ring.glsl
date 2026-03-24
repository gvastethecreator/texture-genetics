float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        vec2 u=(st-0.5)*2.0; 
        if(u_p15>0.0) u.x *= 1.0 + (u_p15-0.5);

        float d=length(u)*u_scale; 
        if(u_p1>0.0) d+=sin(atan(u.y,u.x)*10.0)*0.1*u_p1; 
        float t=1.0-u_factor*0.8; 
        float wave=sin(d*10.0-u_time*(1.0+u_p2*2.0) + u_p12); // Phase
        if(u_p3>0.0) wave=smoothstep(-u_p3, u_p3, wave); 
        
        // Harmonics (p11)
        if(u_p11 > 0.0) wave += sin(d * 20.0) * 0.5 * u_p11;

        return pow(clamp(smoothstep(t-0.1,t,wave*0.5+0.5), 0.0, 1.0),u_intensity); 
    }