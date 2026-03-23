
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState } from '../../../core/types/types';

// GLSL 3.0 Smoke Vertex Shader
const SMOKE_VERT = `
uniform float u_time;
uniform float u_speed;
uniform float u_density;

// Custom Instanced Attributes (Explicit 'in')
in float a_scale;
in float a_random;
in vec3 a_offset;

// Outputs
out vec2 vUv;
out float vAlpha;

// --- CURL NOISE ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) { 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857; 
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z); 
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

vec3 curlNoise(vec3 p) {
    const float e = 0.1;
    float n1 = snoise(p + vec3(e, 0.0, 0.0));
    float n2 = snoise(p - vec3(e, 0.0, 0.0));
    float n3 = snoise(p + vec3(0.0, e, 0.0));
    float n4 = snoise(p - vec3(0.0, e, 0.0));
    float n5 = snoise(p + vec3(0.0, 0.0, e));
    float n6 = snoise(p - vec3(0.0, 0.0, e));
    return vec3(n3 - n4 - (n5 - n6), n5 - n6 - (n1 - n2), n1 - n2 - (n3 - n4));
}

void main() {
    vUv = uv;
    
    // Physics Simulation
    float life = mod(u_time * (0.1 + a_random * 0.1) * u_speed + a_random * 10.0, 1.0);
    
    // Initial Position
    vec3 pos = a_offset;
    
    // Rise
    pos.y += life * 4.0;
    
    // Curl Drift
    vec3 noisePos = pos * 0.5 + vec3(0.0, u_time * 0.2, 0.0);
    vec3 curl = curlNoise(noisePos);
    pos += curl * life * 2.0;
    
    // Wind push (slight global drift)
    pos.x += life * 0.5;
    
    // Billboard View
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Scale based on life
    float scale = a_scale * (0.5 + life * 2.0);
    
    gl_Position = projectionMatrix * (mvPosition + vec4(position.x * scale, position.y * scale, 0.0, 0.0));
    
    // Fade in/out
    float alpha = sin(life * 3.14159);
    vAlpha = alpha * u_density * (0.5 - abs(a_offset.x) * 0.1); 
}
`;

const SMOKE_FRAG = `
uniform vec3 u_color;
in vec2 vUv;
in float vAlpha;
layout(location = 0) out vec4 pc_fragColor;

void main() {
    // Soft circle particle
    float d = length(vUv - 0.5);
    float circle = 1.0 - smoothstep(0.0, 0.5, d);
    
    pc_fragColor = vec4(u_color, vAlpha * circle * 0.5);
}
`;

export const SmokeSystem: React.FC<{ appState: AppState }> = ({ appState }) => {
    // Note: Conditional rendering logic removed to allow parent to control mount/unmount
    
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = 200; // Particle count

    const [geometry, material] = useMemo(() => {
        const geo = new THREE.PlaneGeometry(1, 1);
        const mat = new THREE.ShaderMaterial({
            vertexShader: SMOKE_VERT,
            fragmentShader: SMOKE_FRAG,
            uniforms: {
                u_time: { value: 0 },
                u_speed: { value: 1.0 },
                u_density: { value: 1.0 },
                u_color: { value: new THREE.Color(0xaaaaaa) }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
            glslVersion: THREE.GLSL3 // WEBGL 2
        });

        // Attributes
        const offsets = new Float32Array(count * 3);
        const scales = new Float32Array(count);
        const randoms = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            // Emit from a base circle
            const r = Math.sqrt(Math.random()) * 2.0;
            const theta = Math.random() * 2 * Math.PI;
            offsets[i * 3] = r * Math.cos(theta); // x
            offsets[i * 3 + 1] = -2.0; // Start below stage
            offsets[i * 3 + 2] = r * Math.sin(theta); // z
            
            scales[i] = 0.5 + Math.random() * 1.5;
            randoms[i] = Math.random();
        }

        geo.setAttribute('a_offset', new THREE.InstancedBufferAttribute(offsets, 3));
        geo.setAttribute('a_scale', new THREE.InstancedBufferAttribute(scales, 1));
        geo.setAttribute('a_random', new THREE.InstancedBufferAttribute(randoms, 1));

        return [geo, mat];
    }, []);

    useFrame((state) => {
        if (meshRef.current && material) {
            material.uniforms.u_time.value = state.clock.elapsedTime;
            material.uniforms.u_speed.value = appState.environment.smokeSpeed;
            material.uniforms.u_density.value = appState.environment.smokeDensity;
            material.uniforms.u_color.value.setStyle(appState.environment.smokeColor);
        }
    });

    return (
        <instancedMesh 
            ref={meshRef} 
            args={[geometry, material, count]} 
            frustumCulled={false}
        />
    );
};
