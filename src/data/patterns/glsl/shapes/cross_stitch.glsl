float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u = st * u_scale * 10.0; 
        if(u_p9 > 0.0) u += noise(u*2.0)*u_p9*0.1; 
        vec2 f = fract(u); 
        float c = mod(floor(u.x) + floor(u.y), 2.0); 
        vec2 uvCross = (f - 0.5) * 2.0; 
        if (u_p10 > 0.0) uvCross = rotate2d(u_p10 * 0.5) * uvCross; 
        float thick = 0.5 - u_p3 * 0.4; 
        float crossShape = smoothstep(thick, thick+0.1, abs(uvCross.x)) + smoothstep(thick, thick+0.1, abs(uvCross.y)); 
        crossShape = 1.0 - clamp(crossShape, 0.0, 1.0); 
        if(u_p4 > 0.0) crossShape *= 1.0 - smoothstep(0.4, 0.5, length(uvCross))*u_p4; 
        float stitch = c * crossShape; 
        if(u_p1 > 0.0) stitch = mix(c, stitch, u_p1); 
        if(u_p6 > 0.0) stitch += (random(u) - 0.5) * u_p6; 
        return pow(clamp(stitch, 0.0, 1.0), u_intensity); 
    }