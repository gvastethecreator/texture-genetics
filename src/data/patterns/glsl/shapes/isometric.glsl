float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        if(u_p15!=0.0) st = rotate2d(u_p15) * (st-0.5) + 0.5;

        vec2 u = st * u_scale * 10.0; 
        u.x *= 1.155; 
        vec2 grid = floor(u); 
        vec2 f = fract(u); 
        float v = mod(grid.x + grid.y, 3.0) / 2.0; 
        float edge = step(0.05 * (1.0-u_factor), min(f.x, f.y)); 
        return pow(clamp(mix(v, 1.0, 1.0-edge * u_detail), 0.0, 1.0), u_intensity); 
    }