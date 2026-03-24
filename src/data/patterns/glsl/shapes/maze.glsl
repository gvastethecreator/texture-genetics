float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        vec2 u=st*u_scale*10.0+vec2(u_seed); 
        vec2 i=floor(u); 
        vec2 f=fract(u); 
        float r=random(i); 
        vec2 d=(r>0.5)?vec2(1.0,-1.0):vec2(1.0,1.0); 
        vec2 p=f-0.5; 
        float line=abs(dot(p,normalize(d))); 
        float w=0.1+u_p1*0.3; 
        float v=1.0-smoothstep(w-0.01,w+0.01,line); 
        return pow(clamp(v,0.0,1.0),u_intensity); 
    }