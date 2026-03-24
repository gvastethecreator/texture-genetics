float getPattern(vec2 uv) { 
        vec2 st = uv + vec2(u_p13, u_p14);
        vec2 u=(st-0.5)*u_scale; 
        if(u_p3>0.0) u = mat2(cos(u_p3), -sin(u_p3), sin(u_p3), cos(u_p3)) * u; 
        float t=0.05+0.2*u_factor; 
        float shape = step(abs(u.x),t)+step(abs(u.y),t); 
        if(u_p1>0.0) shape = smoothstep(0.0, u_p1, shape); 
        
        // Fractal (p10)
        if(u_p10>0.0) {
            shape += step(abs(fract(u.x*3.0)-0.5), t*0.5) * u_p10 * 0.5;
        }

        return pow(clamp(shape,0.0,1.0),u_intensity); 
    }