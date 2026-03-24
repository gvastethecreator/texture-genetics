float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st += vec2(sin(st.y*10.0), cos(st.x*10.0)) * u_p15 * 0.05; // Wobble

        vec2 u=(st-0.5)*2.0*u_scale; 
        float d=length(u); 
        float a=atan(u.y,u.x); 
        float v=smoothstep(0.02,0.0,abs(d-0.8)); 
        float k=3.0+floor(u_factor*8.0); 
        v+=smoothstep(0.02,0.0,abs(d-0.5-0.1*cos(a*k+u_time))); 
        if(d>0.6&&d<0.75) v+=step(0.5,noise(vec2(a*10.0,0.0)))*0.5; 
        return clamp(v*u_intensity,0.0,1.0); 
    }