float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u = st * 6.0 * u_scale; 
        float t = u_time * u_speed; 
        if(u_p8 > 0.0) u = rotate2d(u_p8) * u; 
        u.y += sin(u.x * u_p10 + t) * u_p1; 
        float contrast = u_p3 * 5.0 + 1.0; 
        float sq = floor((fract(u.y)*2.0-1.0)*(fract(u.x)*2.0-1.0))+1.0; 
        float tension = 0.075 - u_p9 * 0.05; 
        float sq2 = floor(fract(u.x-u.y-tension)+0.15) * floor(fract((u.x+u.y)-tension)+0.15); 
        sq2 += floor(fract(u.x-u.y-tension+0.5)+0.15) * floor(fract((u.x+u.y+0.5)-tension)+0.15); 
        float pattern = mix(sq, sq2, u_p2); 
        if (u_p4 > 0.0) pattern -= noise(u*10.0)*u_p4; 
        return pow(clamp(pattern, 0.0, 1.0), u_intensity); 
    }