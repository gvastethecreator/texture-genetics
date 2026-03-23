
export const SPECTRAL_LIB = `
    // Internal hash for self-contained lighting noise
    vec2 holoHash2(vec2 p) {
        vec2 q = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
        return fract(sin(q)*43758.5453);
    }

    vec4 holoHash4(vec2 p) {
        vec4 q = vec4(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)), dot(p,vec2(419.2,371.9)), dot(p,vec2(832.3,201.5)));
        return fract(sin(q)*43758.5453);
    }

    vec2 holoVoronoi(vec2 p) {
        vec2 ip = floor(p);
        vec2 fp = fract(p);
        float md = 8.0;
        vec2 mz = vec2(0.0);
        for( int j=-1; j<=1; j++ ) {
            for( int i=-1; i<=1; i++ ) {
                vec2 g = vec2(float(i),float(j));
                vec4 o = holoHash4(ip + g);
                vec2 r = g + vec2(o.xy) - fp;
                float d = dot(r,r);
                if(d < md) { md = d; mz = o.zw; }
            }
        }
        return mz;
    }

    vec3 spectral_gems(float w) {
        return vec3(
            max(1.0 - pow(4.0 * (w - 0.75), 2.0), 0.0),
            max(1.0 - pow(4.0 * (w - 0.5), 2.0), 0.0),
            max(1.0 - pow(4.0 * (w - 0.25), 2.0), 0.0)
        );
    }
    
    // Holographic effect calculation
    vec3 getHolographicColor(vec3 baseCol, vec3 viewDir, vec3 lightDir, vec3 normal, vec2 uv, float strength, float lightIntensity, float scale) {
        if (strength <= 0.001) return baseCol;

        // Use internal self-contained voronoi
        vec2 noise = holoVoronoi(uv * 20.0 * scale);
        
        float theta = noise.x * 6.2831;
        float phi = acos(1.0 - noise.y * 0.00125);
        
        vec3 k = cross(normal, vec3(1.0, 0.0, 0.0)); 
        if(length(k) < 0.01) k = cross(normal, vec3(0.0, 1.0, 0.0));
        k = normalize(k);
        
        vec3 v = normal;
        vec3 a = normal * cos(phi) + cross(k, v) * sin(phi) + k * dot(k, v) * (1.0 - cos(phi));
        vec3 b = dot(a, normal) * normal;
        vec3 o = a - b;
        vec3 w = cross(normal, o);
        vec3 th = length(o) * (cos(theta) * normalize(o) + sin(theta) * normalize(w));
        vec3 holoNormal = normalize(b + th);
        
        vec3 n = normalize(mix(normal, holoNormal, 0.8)); 
        float spectrum = pow(max(dot(-viewDir, reflect(-lightDir, n)), 0.0), 2.0);
        
        // Iridescence based on viewing angle
        float angle = dot(vWorldPosition, vec3(0.0, 1.0, 0.0)); 
        float corner = (1.0 + cos(4.0 * angle)) * 0.5;
        spectrum = (spectrum + corner * 0.42) * (1.0 - corner * 0.29);

        vec3 holo = spectral_gems(1.0 - (spectrum - 0.55) * 5.0) * lightIntensity;
        return baseCol + holo * strength;
    }
`;

export const LIGHTING_FUNCTIONS = `
    // --- SOBEL NORMAL MAPPING (HIGH QUALITY) ---
    vec3 getAccurateNormal(vec2 uv, float centerVal, float intensity, bool enabled, bool invert) {
        if (!enabled) return vec3(0.0, 0.0, 1.0);
        
        float dX = dFdx(centerVal);
        float dY = dFdy(centerVal);
        
        if (abs(dX) < 0.00001 && abs(dY) < 0.00001) return vec3(0.0, 0.0, 1.0);

        float pixelScale = fwidth(vUv.x) + fwidth(vUv.y);
        pixelScale = max(pixelScale, 0.0001); 

        float factor = intensity * 0.02 / pixelScale; 
        factor = clamp(factor, 0.0, 100.0);
        
        vec3 n = vec3(-dX * factor, -dY * factor, 1.0);
        if (invert) n.xy = -n.xy;
        return normalize(n);
    }

    // --- CURVATURE AO ---
    float getAO(vec2 uv, float val, vec3 normal, bool enabled, float strength) {
        if (!enabled) return 1.0;
        float slope = 1.0 - normal.z;
        float curvature = length(fwidth(normal)) / length(fwidth(vWorldPosition));
        curvature = clamp(curvature * 0.1, 0.0, 1.0);
        float occlusion = (slope * 0.5 + curvature * 2.0) * strength;
        return clamp(1.0 - occlusion, 0.0, 1.0);
    }

    // --- ENVIRONMENT MAPPING ---
    vec3 getEnvironment(vec3 dir, int type, float roughness) {
        float y = dir.y;
        vec3 col;
        
        // Environment Colors (Boosted Saturation)
        if (type == 1) { // Sunset
            vec3 z = vec3(0.1, 0.2, 0.8); vec3 h = vec3(1.0, 0.4, 0.1); vec3 g = vec3(0.2, 0.1, 0.1);
            col = mix(g, mix(h, z, pow(max(0.0, y), 0.5)), smoothstep(-0.2, 0.2, y));
        } else if (type == 2) { // Midnight
            vec3 z = vec3(0.02, 0.02, 0.1); vec3 h = vec3(0.05, 0.1, 0.3); vec3 g = vec3(0.01);
            col = mix(g, mix(h, z, pow(max(0.0, y), 0.5)), smoothstep(-0.2, 0.2, y));
        } else if (type == 3) { // Dawn
            vec3 z = vec3(0.5, 0.6, 0.9); vec3 h = vec3(1.0, 0.7, 0.5); vec3 g = vec3(0.3, 0.2, 0.2);
            col = mix(g, mix(h, z, pow(max(0.0, y), 0.5)), smoothstep(-0.2, 0.2, y));
        } else { // Studio (Neutral but not grey)
            col = mix(vec3(0.25), vec3(0.95), pow(max(0.0, y), 0.5));
            // Add slight blue/orange tint to studio for realism
            col *= mix(vec3(1.0, 0.95, 0.9), vec3(0.9, 0.95, 1.0), dir.x * 0.5 + 0.5); 
        }
        
        // Fake blur for roughness
        return mix(col, vec3(length(col) * 0.5), roughness);
    }
    
    // --- ROBUST PBR BRDF ---
    vec3 fresnelSchlick(float cosTheta, vec3 F0) {
        return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
    }

    float distributionGGX(vec3 N, vec3 H, float roughness) {
        // Safety clamp roughness to avoid divide by zero
        float a      = roughness*roughness;
        float a2     = max(0.001, a*a); 
        float NdotH  = max(dot(N, H), 0.0);
        float NdotH2 = NdotH*NdotH;
        float num    = a2;
        float denom  = (NdotH2 * (a2 - 1.0) + 1.0);
        denom = PI * denom * denom;
        return num / max(denom, 0.0001);
    }

    float geometrySchlickGGX(float NdotV, float roughness) {
        float r = (roughness + 1.0);
        float k = (r*r) / 8.0;
        float num   = NdotV;
        float denom = NdotV * (1.0 - k) + k;
        return num / max(denom, 0.0001);
    }

    float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
        float NdotV = max(dot(N, V), 0.0);
        float NdotL = max(dot(N, L), 0.0);
        float ggx2  = geometrySchlickGGX(NdotV, roughness);
        float ggx1  = geometrySchlickGGX(NdotL, roughness);
        return ggx1 * ggx2;
    }

    vec3 getLitColor(vec3 albedo, vec3 normal, vec3 viewDir, vec3 lightDir, float roughness, float metalness, float ao, int envType, float lightIntensity) {
        // Safety Clamps
        roughness = clamp(roughness, 0.05, 1.0); // Never 0.0
        vec3 N = normalize(normal);
        vec3 V = normalize(viewDir);
        vec3 L = normalize(lightDir);
        
        // Robust Half Vector to avoid NaN when L = -V
        vec3 H = normalize(V + L + vec3(0.0001));
        
        // Base Reflectivity (F0)
        vec3 F0 = vec3(0.04); 
        F0 = mix(F0, albedo, metalness); 
        
        // Specular Calculation
        float NDF = distributionGGX(N, H, roughness);   
        float G   = geometrySmith(N, V, L, roughness);      
        vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0);
        
        vec3 numerator    = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
        vec3 specular     = numerator / denominator;
        
        // Energy conservation
        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metalness;	  
        
        float NdotL = max(dot(N, L), 0.0);
        
        specular = clamp(specular, 0.0, 4.0); // Soft cap specular intensity to prevent blowouts
        
        vec3 directLighting = (kD * albedo / PI + specular * 0.8) * NdotL * lightIntensity; 
        
        // IBL / Ambient Calculation (Simplified for Safety)
        vec3 R = reflect(-V, N);
        vec3 envColor = getEnvironment(R, envType, roughness);
        vec3 F_ambient = fresnelSchlick(max(dot(N, V), 0.0), F0);
        vec3 kS_ambient = F_ambient;
        vec3 kD_ambient = 1.0 - kS_ambient;
        kD_ambient *= 1.0 - metalness;
        
        vec3 irradiance = getEnvironment(N, envType, 1.0); 
        vec3 diffuseIBL = irradiance * albedo;
        
        vec3 ambient = (kD_ambient * diffuseIBL + envColor * F_ambient * 0.5) * ao * 0.5;
        
        // Base Color Injection (Anti-Washout)
        ambient = mix(ambient, albedo * 0.2, 0.5);

        // FALLBACK: Always ensure minimum visibility if lighting math fails
        vec3 fallback = albedo * 0.1;

        return ambient + directLighting + fallback;
    }
`;
