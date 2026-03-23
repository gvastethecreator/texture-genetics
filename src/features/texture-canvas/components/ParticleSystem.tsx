
import React, { useRef, useMemo, useEffect, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState } from '../../../core/types/types';

// GLSL 3.0 Particle Shader
const PARTICLE_VERTEX_SHADER = `
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_pixelRatio;
uniform float u_speed; 
uniform float u_size_mult;
uniform float u_spreadY;

in float a_random;
in float a_size;
in float a_speed;
in vec3 a_origin;

out vec3 vColor;
out float vAlpha;

// Simplex Noise 3D (Standard Ashima)
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
  vec3 pos = a_origin;
  
  // Use uniform speed multiplier
  float t = u_time * a_speed * u_speed * 0.3 + a_random * 100.0;
  
  vec3 flow = curlNoise(pos * 1.5 + t * 0.2);
  pos += flow * 0.4;
  
  pos.y += (mod(t * 0.5, 3.0) - 1.5) * u_spreadY;
  pos.x += sin(t + pos.y) * 0.1;
  
  vec3 mousePos = vec3((u_mouse.x - 0.5) * 3.0, (u_mouse.y - 0.5) * 3.0, 0.0);
  float dist = distance(pos.xy, mousePos.xy);
  float repulsion = smoothstep(0.8, 0.0, dist);
  pos += normalize(pos - mousePos) * repulsion * 0.5;
  
  pos.z += sin(t * 2.0) * 0.1;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  float sizePulse = 1.0 + sin(t * 3.0) * 0.3;
  // Apply uniform size multiplier
  gl_PointSize = (a_size * 80.0 * u_pixelRatio * u_size_mult * sizePulse) * (1.0 / -mvPosition.z);
  
  vAlpha = (0.3 + repulsion * 0.7);
}
`;

const PARTICLE_FRAGMENT_SHADER = `
uniform vec3 u_color;
uniform float u_opacity;

in float vAlpha;
layout(location = 0) out vec4 pc_fragColor;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  glow = pow(glow, 2.0);
  
  pc_fragColor = vec4(u_color, vAlpha * glow * u_opacity);
}
`;

export const ParticleSystem = memo(({ count = 500, speed = 0.5, size = 0.5, color = '#4f46e5', opacity = 0.5, spread = 3.0 }: { count?: number; speed?: number; size?: number; color?: string; opacity?: number; spread?: number }) => {
    const meshRef = useRef<THREE.Points>(null);
    const { gl } = useThree();
    
    const [geometry, material] = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const randoms = new Float32Array(count);
        const sizes = new Float32Array(count);
        const speeds = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 3.0;     
            pos[i * 3 + 1] = (Math.random() - 0.5) * 3.0; 
            pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5; 
            
            randoms[i] = Math.random();
            sizes[i] = Math.random() * 0.5 + 0.5;
            speeds[i] = 0.5 + Math.random();
        }
        
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('a_origin', new THREE.BufferAttribute(pos.slice(), 3)); 
        geo.setAttribute('a_random', new THREE.BufferAttribute(randoms, 1));
        geo.setAttribute('a_size', new THREE.BufferAttribute(sizes, 1));
        geo.setAttribute('a_speed', new THREE.BufferAttribute(speeds, 1));
        
        const mat = new THREE.ShaderMaterial({
            vertexShader: PARTICLE_VERTEX_SHADER,
            fragmentShader: PARTICLE_FRAGMENT_SHADER,
            uniforms: {
                u_time: { value: 0 },
                u_mouse: { value: new THREE.Vector2(0, 0) },
                u_pixelRatio: { value: gl.getPixelRatio() },
                u_speed: { value: speed },
                u_size_mult: { value: size },
                u_color: { value: new THREE.Color(color) },
                u_opacity: { value: opacity },
                u_spreadY: { value: spread }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            glslVersion: THREE.GLSL3
        });
        
        return [geo, mat];
    }, [count, gl]); // Recreate geometry if count changes

    // Update dynamic uniforms
    useEffect(() => {
        if (material) {
            material.uniforms.u_speed.value = speed;
            material.uniforms.u_size_mult.value = size;
            material.uniforms.u_color.value.setStyle(color);
            material.uniforms.u_opacity.value = opacity;
            material.uniforms.u_spreadY.value = spread;
        }
    }, [speed, size, color, opacity, spread, material]);

    useEffect(() => {
        return () => {
            geometry.dispose();
            material.dispose();
        }
    }, [geometry, material]);

    useFrame((state) => {
        if (material) {
            material.uniforms.u_time.value = performance.now() / 1000;
            material.uniforms.u_mouse.value.lerp(state.pointer.clone().addScalar(1).multiplyScalar(0.5), 0.1);
        }
    });

    return <points ref={meshRef} geometry={geometry} material={material} />;
});
