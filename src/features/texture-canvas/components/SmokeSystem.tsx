import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SpriteNodeMaterial } from "three/webgpu";
import {
  abs,
  float,
  instancedBufferAttribute,
  max,
  mod,
  smoothstep,
  sin,
  uniform,
  uv,
  vec2,
  vec3,
} from "three/tsl";
import { snoise3d } from "../../../lib/tsl/chunks/noise";
import { AppState } from "../../../core/types/types";

type InstancedSprite = THREE.Sprite & { count: number };

type SmokeUniforms = {
  u_time: any;
  u_speed: any;
  u_density: any;
  u_color: any;
};

export const SmokeSystem: React.FC<{ appState: AppState }> = ({ appState }) => {
  const uniformsRef = useRef<SmokeUniforms | null>(null);
  const count = 200;

  const smoke = useMemo(() => {
    const offsets = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(Math.random()) * 2.0;
      const theta = Math.random() * 2 * Math.PI;

      offsets[i * 3] = r * Math.cos(theta);
      offsets[i * 3 + 1] = -2.0;
      offsets[i * 3 + 2] = r * Math.sin(theta);

      scales[i] = 0.5 + Math.random() * 1.5;
      randoms[i] = Math.random();
    }

    const offsetAttribute = new THREE.InstancedBufferAttribute(offsets, 3);
    const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
    const randomAttribute = new THREE.InstancedBufferAttribute(randoms, 1);

    const u_time = uniform(0);
    const u_speed = uniform(appState.environment.smokeSpeed);
    const u_density = uniform(appState.environment.smokeDensity);
    const u_color = uniform(new THREE.Color(appState.environment.smokeColor));
    uniformsRef.current = { u_time, u_speed, u_density, u_color };

    const offset = vec3(instancedBufferAttribute(offsetAttribute, "vec3"));
    const baseScale = float(instancedBufferAttribute(scaleAttribute, "float"));
    const random = float(instancedBufferAttribute(randomAttribute, "float"));

    const life = mod(u_time.mul(random.mul(0.1).add(0.1)).mul(u_speed).add(random.mul(10.0)), 1.0);
    const noisePos = offset.mul(0.5).add(vec3(0.0, u_time.mul(0.2), 0.0));
    const drift = vec3(
      snoise3d(noisePos.add(vec3(1.3, 0.0, 0.0))),
      snoise3d(noisePos.add(vec3(0.0, 2.1, 0.0))),
      snoise3d(noisePos.add(vec3(0.0, 0.0, 3.7))),
    )
      .mul(life)
      .mul(1.5);

    const animatedPos = vec3(
      offset.x.add(drift.x).add(life.mul(0.5)),
      offset.y.add(life.mul(4.0)).add(drift.y),
      offset.z.add(drift.z),
    );

    const spriteUv = uv();
    const circle = float(1.0).sub(smoothstep(0.0, 0.5, spriteUv.sub(vec2(0.5, 0.5)).length()));
    const alpha = sin(life.mul(Math.PI))
      .mul(u_density)
      .mul(max(float(0.05), float(0.5).sub(abs(offset.x).mul(0.1))));
    const scale = baseScale.mul(float(0.5).add(life.mul(2.0)));

    const material = new SpriteNodeMaterial();
    material.transparent = true;
    material.depthWrite = false;
    material.blending = THREE.NormalBlending;
    material.colorNode = u_color;
    material.opacityNode = alpha.mul(circle).mul(0.5);
    material.positionNode = animatedPos;
    material.scaleNode = vec2(scale, scale);

    const sprite = new THREE.Sprite(material) as InstancedSprite;
    sprite.count = count;
    sprite.frustumCulled = false;

    return sprite;
  }, [
    appState.environment.smokeColor,
    appState.environment.smokeDensity,
    appState.environment.smokeSpeed,
  ]);

  useEffect(() => {
    const u = uniformsRef.current;
    if (!u) return;

    u.u_speed.value = appState.environment.smokeSpeed;
    u.u_density.value = appState.environment.smokeDensity;
    u.u_color.value.set(appState.environment.smokeColor);
  }, [
    appState.environment.smokeColor,
    appState.environment.smokeDensity,
    appState.environment.smokeSpeed,
  ]);

  useEffect(() => {
    return () => {
      smoke.material.dispose();
    };
  }, [smoke]);

  useFrame((state) => {
    const u = uniformsRef.current;
    if (!u) return;

    u.u_time.value = state.clock.elapsedTime;
  });

  return <primitive object={smoke} />;
};
