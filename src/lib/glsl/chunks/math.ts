export const MATH_UTILS = `
    mat2 rotate2d(float _angle){
        float s = sin(_angle);
        float c = cos(_angle);
        return mat2(c,-s,s,c);
    }

    vec2 toPolar(vec2 st) {
        vec2 pos = st - 0.5;
        float r = length(pos) * 2.0;
        float a = atan(pos.y, pos.x);
        return vec2(a / (2.0 * PI) + 0.5, r);
    }
    
    // Anti-Aliased Step function using derivatives
    // Replaces standard step() to reduce jagged edges on procedural patterns
    float aastep(float threshold, float value) {
        float afwidth = fwidth(value) * 0.5;
        return smoothstep(threshold - afwidth, threshold + afwidth, value);
    }

    vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.www) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    
    float blendApply(float base, float blend, int mode) {
        if (mode == 0) return blend;
        if (mode == 1) return min(base + blend, 1.0);
        if (mode == 2) return base * blend;
        if (mode == 3) return 1.0 - (1.0 - base) * (1.0 - blend);
        if (mode == 4) return (base < 0.5) ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend));
        if (mode == 5) return (blend < 0.5) ? (2.0 * base * blend + base * base * (1.0 - 2.0 * blend)) : (sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend));
        if (mode == 6) return abs(base - blend);
        return blend;
    }

    vec3 applyBlendModeVec3(vec3 base, vec3 blend, int mode) {
        if (mode == 0) return blend;
        if (mode == 1) return min(base + blend, vec3(1.0)); // Add
        if (mode == 2) return base * blend; // Multiply
        if (mode == 3) return vec3(1.0) - (vec3(1.0) - base) * (vec3(1.0) - blend); // Screen
        if (mode == 4) return mix(2.0 * base * blend, vec3(1.0) - 2.0 * (vec3(1.0) - base) * (vec3(1.0) - blend), step(vec3(0.5), base)); // Overlay
        if (mode == 5) { // Soft Light (Simple approx)
            return mix(
                base - (vec3(1.0) - 2.0 * blend) * base * (vec3(1.0) - base),
                base + (2.0 * blend - vec3(1.0)) * (sqrt(base) - base),
                step(vec3(0.5), blend)
            );
        }
        if (mode == 6) return abs(base - blend); // Difference
        return blend;
    }

    // --- GRADIENT PALETTE INTERPOLATOR ---
    // Maps a value (0..1) through the active palette colors
    vec3 getPaletteColor(float t, vec3 colors[8], int count) {
        if (count <= 1) return colors[0];
        
        // Clamp t to safe range
        t = clamp(t, 0.0, 1.0);
        
        // Map t to array index range
        float scaledT = t * float(count - 1);
        int index = int(floor(scaledT));
        float f = fract(scaledT);
        
        // GLSL array indexing must be careful, but uniform indexing is usually fine
        // We iterate to avoid dynamic indexing on some older drivers if necessary, 
        // but explicit access is cleaner for 8 items.
        
        vec3 c1 = vec3(0.0);
        vec3 c2 = vec3(0.0);
        
        // Manual unroll for compatibility and safety
        if (index == 0) { c1 = colors[0]; c2 = colors[1]; }
        else if (index == 1) { c1 = colors[1]; c2 = colors[2]; }
        else if (index == 2) { c1 = colors[2]; c2 = colors[3]; }
        else if (index == 3) { c1 = colors[3]; c2 = colors[4]; }
        else if (index == 4) { c1 = colors[4]; c2 = colors[5]; }
        else if (index == 5) { c1 = colors[5]; c2 = colors[6]; }
        else if (index == 6) { c1 = colors[6]; c2 = colors[7]; }
        else { c1 = colors[count-1]; c2 = colors[count-1]; } // End clamp
        
        return mix(c1, c2, f);
    }
`;
