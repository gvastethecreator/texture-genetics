
export const TRANSFORM_FUNCTIONS = `
    vec2 getTransformedUV(vec2 uv) {
        vec2 st = uv;
        if(u_mouseEnabled) {
            float mouseDist = distance(uv, u_mouse);
            if (mouseDist < u_mouseRadius * 2.0) {
                 float mouseInf = smoothstep(u_mouseRadius, 0.0, mouseDist) * u_mouseStrength;
                 if(u_mouseType == 0) { st -= normalize(uv - u_mouse + 0.0001) * mouseInf; } 
                 else if (u_mouseType == 1) { st = u_mouse + (st - u_mouse) * (1.0 - mouseInf * 0.8); }
            }
        }
        
        st -= 0.5; st = rotate2d(u_angle) * st; st += 0.5; st += u_offset;

        // SYMMETRY / KALEIDOSCOPE
        if (u_symEnabled) {
            vec2 p = st - 0.5;
            float r = length(p);
            float a = atan(p.y, p.x) + u_symRotation;
            float seg = TAU / float(max(2.0, u_symSegments));
            a = abs(mod(a, seg) - seg * 0.5);
            st = vec2(cos(a), sin(a)) * r / max(0.01, u_symZoom) + 0.5;
        }

        if (u_polar) st = toPolar(st);
        
        if(u_tilingEnabled) {
            if (u_tilingScale != 1.0) st = (st - 0.5) * u_tilingScale + 0.5;
            st += u_tilingOffset;
            if (u_tilingRotation != 0.0) {
                 st -= 0.5; st = rotate2d(u_tilingRotation) * st; st += 0.5;
            }
            vec2 t = st * u_tilingRepeat;
            st = u_tilingMirror ? 1.0 - abs(mod(t, 2.0) - 1.0) : fract(t);
        }
        return st;
    }
    
    // Pixelation Logic
    vec2 pixelateUV(vec2 uv) {
        if (u_pixelate) {
            float dx = 1.0 / u_pixelDensity;
            float dy = 1.0 / u_pixelDensity;
            return vec2(floor(uv.x / dx) * dx, floor(uv.y / dy) * dy);
        }
        return uv;
    }
    
    // CRT / Scanlines Logic
    vec3 applyScanlines(vec3 color, vec2 uv) {
        if (!u_scanlines) return color;
        
        // Scanlines
        float count = u_resolution.y * 0.5; 
        vec2 sl = vec2(sin(uv.y * count), cos(uv.y * count));
        vec3 scanlines = vec3(sl.x, sl.y, sl.x);
        color += color * scanlines * u_scanlineIntensity;
        color += color * vec3(random(uv * u_time)) * u_scanlineIntensity * 0.5; // noise
        
        // Border Vignette (CRT Curve)
        if (u_crtDistortion > 0.0) {
             float dist = distance(uv, vec2(0.5));
             color *= smoothstep(0.8, 0.8 - u_crtDistortion * 0.5, dist);
        }
        
        return color;
    }
    
    // Sticker Composition Logic
    vec4 applySticker(vec4 bgCol, vec2 uv) {
        #ifdef USE_STICKER
            if (!u_stickerEnabled) return bgCol;
            
            // Map UV 0..1 to Center -0.5..0.5
            vec2 st = uv - 0.5;
            
            // Translate (u_stickerPos is -1..1 range from UI, scaled to fit)
            st -= u_stickerPos * 0.5; 
            
            // Rotate
            st = rotate2d(-u_stickerRot) * st;
            
            // Scale (Inverse operation for texture sampling)
            st /= u_stickerScale;
            
            // Remap back to 0..1 for texture lookup
            st += 0.5;
            
            // Check bounds to prevent tiling
            if (st.x >= 0.0 && st.x <= 1.0 && st.y >= 0.0 && st.y <= 1.0) {
                // GLSL 3.0 uses 'texture' not 'texture2D'
                vec4 texColor = texture(u_stickerTexture, st);
                
                // Color Tint
                if (u_stickerUseColor) {
                    texColor.rgb *= u_stickerColor;
                }
                
                // Apply Blend Mode
                vec3 blendedRGB = applyBlendModeVec3(bgCol.rgb, texColor.rgb, u_stickerBlendMode);
                float finalAlpha = texColor.a * u_stickerOpacity;
                
                // Composite
                return vec4(mix(bgCol.rgb, blendedRGB, finalAlpha), 1.0);
            }
        #endif
        return bgCol;
    }
`;

export const PROCESS_FUNCTIONS = `
    // ACES Tone Mapping - The "Hollywood" Look
    vec3 aces_tonemap(vec3 x) {
        const float a = 2.51;
        const float b = 0.03;
        const float c = 2.43;
        const float d = 0.59;
        const float e = 0.14;
        return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
    }

    vec3 applyColorBalance(vec3 color) {
        // Optimization: Skip if params are default
        if (u_brightness == 0.0 && u_contrast == 0.0 && u_saturation == 0.0 && u_hue == 0.0 && u_cycleSpeed == 0.0 &&
            length(u_shadows) == 0.0 && length(u_midtones) == 0.0 && length(u_highlights) == 0.0) {
            return color;
        }

        // Brightness/Contrast
        color = (color - 0.5) * max(0.0, u_contrast + 1.0) + 0.5 + u_brightness;
        
        // Saturation
        vec3 gray = vec3(dot(color, vec3(0.2126, 0.7152, 0.0722)));
        color = mix(gray, color, u_saturation + 1.0);
        
        // Hue Shift (Safe Mode)
        vec3 safeCol = max(vec3(0.0), color);
        vec3 hsv = rgb2hsv(safeCol);
        hsv.x += u_hue;
        hsv.x += u_time * u_cycleSpeed;
        color = hsv2rgb(hsv);
        
        // Grading (Shadows/Mids/Highs)
        float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
        vec3 shadow = u_shadows;
        vec3 mid = u_midtones;
        vec3 high = u_highlights;
        
        vec3 bal = mix(shadow, mid, lum);
        bal = mix(bal, high, lum);
        color += bal * 0.5; 
        
        return color;
    }
    
    // --- HALFTONE EFFECT (Rotated Dot Matrix) ---
    vec3 applyHalftone(vec3 color, vec2 uv, float scale) {
        // Rotate 45 degrees for CMYK style
        mat2 rot = rotate2d(0.785398); 
        vec2 st = rot * (uv - 0.5) + 0.5;
        
        vec2 nearest = 2.0 * fract(scale * st) - 1.0;
        float dist = length(nearest);
        float radius = sqrt(1.0 - dot(color, vec3(0.299, 0.587, 0.114))) * 1.2;
        
        vec3 white = vec3(1.0);
        vec3 black = vec3(0.05); // Ink black
        return mix(black, color, smoothstep(radius, radius + 0.1, dist));
    }
    
    // --- EDGE DETECTION (Derivative Based) ---
    vec3 applyEdgeDetect(vec3 color, vec2 uv, vec3 edgeColor) {
        // Calculate magnitude of gradient using dFdx/dFdy (Standard derivatives)
        vec3 dx = dFdx(color);
        vec3 dy = dFdy(color);
        float edge = length(dx) + length(dy);
        
        // Boost sensitivity
        edge *= 10.0;
        edge = smoothstep(0.1, 0.5, edge);
        
        return mix(color * 0.1, edgeColor, edge);
    }

    vec3 applyPostProcess(vec3 color, vec2 uv) {
        // Vignette
        if (u_vignette > 0.0) {
            float dist = distance(uv, vec2(0.5));
            color *= smoothstep(0.8, 0.8 - u_vignette * 0.8, dist);
        }
        
        // Bloom Thresholding
        if (u_bloomEnabled) {
            float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
            if(brightness > u_bloomThreshold) {
                color += color * u_bloomStrength * (brightness - u_bloomThreshold);
            }
        }
        
        // Posterize
        if (u_posterize) {
            float levels = max(2.0, u_posterizeLevels);
            color = floor(color * levels) / levels;
        }
        
        return color;
    }
`;
