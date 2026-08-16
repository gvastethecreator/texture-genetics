import { useEffect, useMemo, useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PointsNodeMaterial } from "three/webgpu";
import {
  float,
  instancedBufferAttribute,
  mod,
  smoothstep,
  sin,
  uniform,
  uv,
  vec2,
  vec3,
} from "three/tsl";
import { snoise3d } from "../../../lib/tsl/chunks/noise";

type InstancedSprite = THREE.Sprite & { count: number };

type ParticleUniforms = {
  u_time: any;
  u_mouse: any;
  u_speed: any;
  u_size: any;
  u_color: any;
  u_opacity: any;
  u_spread: any;
};

export const ParticleSystem = memo(
  ({
    count = 500,
    speed = 0.5,
    size = 0.5,
    color = "#4f46e5",
    opacity = 0.5,
    spread = 3.0,
  }: {
    count?: number;
    speed?: number;
    size?: number;
    color?: string;
    opacity?: number;
    spread?: number;
  }) => {
    const uniformsRef = useRef<ParticleUniforms | null>(null);

    const particles = useMemo(() => {
      const origins = new Float32Array(count * 3);
      const randoms = new Float32Array(count);
      const sizes = new Float32Array(count);
      const speeds = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        origins[i * 3] = (Math.random() - 0.5) * 3.0;
        origins[i * 3 + 1] = (Math.random() - 0.5) * 3.0;
        origins[i * 3 + 2] = (Math.random() - 0.5) * 1.5;

        randoms[i] = Math.random();
        sizes[i] = Math.random() * 0.5 + 0.5;
        speeds[i] = 0.5 + Math.random();
      }

      const originAttribute = new THREE.InstancedBufferAttribute(origins, 3);
      const randomAttribute = new THREE.InstancedBufferAttribute(randoms, 1);
      const sizeAttribute = new THREE.InstancedBufferAttribute(sizes, 1);
      const speedAttribute = new THREE.InstancedBufferAttribute(speeds, 1);

      const u_time = uniform(0);
      const u_mouse = uniform(new THREE.Vector2(0.5, 0.5));
      const u_speed = uniform(speed);
      const u_size = uniform(size);
      const u_color = uniform(new THREE.Color(color));
      const u_opacity = uniform(opacity);
      const u_spread = uniform(spread);

      uniformsRef.current = { u_time, u_mouse, u_speed, u_size, u_color, u_opacity, u_spread };

      const origin = vec3(instancedBufferAttribute<"vec3">(originAttribute, "vec3"));
      const random = float(instancedBufferAttribute<"float">(randomAttribute, "float"));
      const baseSize = float(instancedBufferAttribute<"float">(sizeAttribute, "float"));
      const localSpeed = float(instancedBufferAttribute<"float">(speedAttribute, "float"));

      const t = u_time.mul(localSpeed).mul(u_speed).mul(0.3).add(random.mul(100.0));
      const noiseBase = origin.mul(1.5);

      const flow = vec3(
        snoise3d(noiseBase.add(vec3(t.mul(0.2), random.mul(3.1), 0.0))),
        snoise3d(noiseBase.add(vec3(4.3, t.mul(0.15), random.mul(7.2)))),
        snoise3d(noiseBase.add(vec3(random.mul(5.7), 9.1, t.mul(0.25)))),
      ).mul(0.35);

      const basePos = origin.add(flow);
      const rise = mod(t.mul(0.5), 3.0).sub(1.5).mul(u_spread);
      const mousePos = vec2(u_mouse.x.sub(0.5).mul(3.0), u_mouse.y.sub(0.5).mul(3.0));
      const planePos = vec2(basePos.x, basePos.y.add(rise));
      const mouseDelta = planePos.sub(mousePos);
      const dist = mouseDelta.length();
      const repulsion = smoothstep(0.8, 0.0, dist);
      const repelDir = mouseDelta.add(vec2(0.0001, 0.0001)).normalize().mul(repulsion).mul(0.5);

      const animatedPos = vec3(
        basePos.x.add(sin(t.add(basePos.y)).mul(0.1)).add(repelDir.x),
        basePos.y.add(rise).add(repelDir.y),
        basePos.z.add(sin(t.mul(2.0)).mul(0.1)),
      );

      const spriteUv = uv();
      const glow = float(1.0)
        .sub(smoothstep(0.0, 0.5, spriteUv.sub(vec2(0.5, 0.5)).length()))
        .pow(2.0);
      const alpha = float(0.3).add(repulsion.mul(0.7));
      const pointSize = baseSize
        .mul(25.0)
        .mul(u_size)
        .mul(float(1.0).add(sin(t.mul(3.0)).mul(0.3)));

      const material = new PointsNodeMaterial();
      material.transparent = true;
      material.depthWrite = false;
      material.blending = THREE.AdditiveBlending;
      material.alphaToCoverage = true;
      material.sizeAttenuation = true;
      material.colorNode = u_color;
      material.opacityNode = glow.mul(alpha).mul(u_opacity);
      material.positionNode = animatedPos;
      material.sizeNode = pointSize;

      const sprite = new THREE.Sprite(material) as InstancedSprite;
      sprite.count = count;
      sprite.frustumCulled = false;

      return sprite;
    }, [count]);

    useEffect(() => {
      const u = uniformsRef.current;
      if (!u) return;

      u.u_speed.value = speed;
      u.u_size.value = size;
      u.u_opacity.value = opacity;
      u.u_spread.value = spread;
      u.u_color.value.set(color);
    }, [speed, size, color, opacity, spread]);

    useEffect(() => {
      return () => {
        particles.material.dispose();
      };
    }, [particles]);

    useFrame((state) => {
      const u = uniformsRef.current;
      if (!u) return;

      u.u_time.value = state.clock.elapsedTime;
      (u.u_mouse.value as THREE.Vector2).lerp(
        new THREE.Vector2(state.pointer.x, state.pointer.y).addScalar(1).multiplyScalar(0.5),
        0.1,
      );
    });

    return <primitive object={particles} />;
  },
);
