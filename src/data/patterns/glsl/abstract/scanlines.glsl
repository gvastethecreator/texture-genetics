float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14); // Offset Y
        if(u_p15 > 0.001) { // Prevent div by zero
            float steps = 50.0 * u_p15;
            st.x = floor(st.x * steps) / steps; // Static
        }

        float c=u_resolution.y*u_scale*0.1*(1.0+u_p1*2.0); 
        float m=u_factor>0.5?u_time*5.0:0.0; 
        float l=sin(st.y*c+m)*0.5+0.5; 
        float vig=1.0-distance(st,vec2(0.5))*u_intensity; 
        if(u_p2 > 0.0) l += (random(st * u_time) - 0.5) * u_p2; 
        
        return clamp(l*vig, 0.0, 1.0); 
    }