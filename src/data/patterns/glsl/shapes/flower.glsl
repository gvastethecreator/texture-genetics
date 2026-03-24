float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15 > 0.0) st.x *= 1.0 + (u_p15-0.5)*2.0; // Aspect
        
        vec2 u=(st-0.5)*2.0*u_scale; 
        float r=length(u); 
        float a=atan(u.y,u.x)+u_time*u_speed + u_p12; 
        
        if(u_p7>0.0)a+=r*u_p7*5.0; 
        float petals=u_p3; 
        float f=cos(a*petals); 
        float curve=0.5+u_p6*1.5; 
        f=abs(cos(a*petals*0.5)); 
        f=pow(f,curve); 
        
        float inner=0.2+u_p5*0.5; 
        float radius=inner+f*(1.0-inner); 
        if(u_p9>0.0){radius+=(noise(u*5.0)-0.5)*u_p9*0.5;} 
        
        float softness=u_p2*0.5+0.01; 
        float flower=1.0-smoothstep(radius-softness,radius+softness,r); 
        float stamen=1.0-smoothstep(u_p10*0.3,u_p10*0.3+0.05,r); 
        float result=max(flower,stamen); 
        
        // Split (p11)
        if(u_p11 > 0.0) result = abs(result - 0.5) * 2.0 * u_p11 + result * (1.0-u_p11);

        return pow(clamp(result,0.0,1.0),u_intensity); 
    }