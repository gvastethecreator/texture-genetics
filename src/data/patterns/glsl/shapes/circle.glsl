float getPattern(vec2 uv) { 
        vec2 st = uv;
        st += vec2(u_p13, u_p14); // Pos
        if(u_p15 != 0.0) st.x *= 1.0 + (u_p15 - 0.5) * 2.0; // Aspect Ratio

        vec2 u=(st-0.5)*2.0; 
        if(u_p10>0.0){float a=atan(u.y,u.x)+u_p10*length(u);u=vec2(cos(a),sin(a))*length(u);} 
        float angle=atan(u.y,u.x); 
        float deform=sin(angle*5.0+u_time*u_p8)*u_p4*0.1; 
        if(u_p9>0.0){deform+=(noise(u*5.0)-0.5)*u_p9*0.5;} 
        
        float d=length(u)+deform; 
        if(u_p6>0.0){float count=1.0+u_p6*10.0;float gap=1.0-u_p7*0.9;d=fract(d*count);if(d>gap)d=1.0;} 
        
        float w=0.01+u_p2*0.5; 
        float soft=u_p3*0.5; 
        float v=1.0-smoothstep(u_scale-w-soft,u_scale-w,d); 
        
        if(u_factor>0.0){float outer=smoothstep(u_scale+w,u_scale+w+soft,d);v-=outer;} 
        if(u_p5>0.0){v+=(1.0-d)*u_p5;} 
        
        // P11: Warp Angle, P12: Outline
        if(u_p11 > 0.0) v = mix(v, step(0.5, v), u_p11);
        if(u_p12 > 0.0) v = abs(v - 0.5) * 2.0 * u_p12 + v * (1.0-u_p12);

        return pow(clamp(v,0.0,1.0),u_intensity); 
    }