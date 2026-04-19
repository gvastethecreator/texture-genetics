export const SDF_LIB = `
    // Basic SDF Primitives
    float sdBox(vec3 p, vec3 b) {
        vec3 q = abs(p) - b;
        return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
    }

    float sdSphere(vec3 p, float s) {
        return length(p) - s;
    }

    // Operations
    mat2 rot2D(float a) {
        float s = sin(a), c = cos(a);
        return mat2(c, -s, s, c);
    }

    // Infinite Domain Repetition
    vec3 opRep(vec3 p, vec3 c) {
        return mod(p + 0.5 * c, c) - 0.5 * c;
    }
    
    // Smooth Min (Organic blending)
    float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
    }
    
    // De-Golfed utility to create a rotation matrix from a vector4 seed
    mat2 rotComplex(float t) {
        return mat2(cos(sin(t)*.785 + vec4(0,33,11,0)));
    }
`;
