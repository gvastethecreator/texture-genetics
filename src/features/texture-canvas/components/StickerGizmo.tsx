import React, { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import * as THREE from "three";
import { AppState } from "../../../core/types/types";

interface StickerGizmoProps {
  state: AppState;
  updateState: (s: Partial<AppState>) => void;
  visible: boolean;
  setControlsEnabled: (enabled: boolean) => void;
}

export const StickerGizmo: React.FC<StickerGizmoProps> = ({
  state,
  updateState,
  visible,
  setControlsEnabled,
}) => {
  const { camera, gl, scene } = useThree();
  const transformRef = useRef<TransformControls | null>(null);
  const helperRef = useRef<THREE.Mesh>(null);

  const isDragging = useRef(false);
  const stickerRef = useRef(state.sticker);
  useEffect(() => {
    stickerRef.current = state.sticker;
  }, [state.sticker]);

  // Only show if enabled, gizmo explicitly on, AND a texture is loaded
  const shouldShow =
    visible && state.sticker.enabled && state.sticker.gizmoVisible && !!state.sticker.texture;

  useEffect(() => {
    if (shouldShow) {
      const controls = new TransformControls(camera, gl.domElement);
      controls.setMode("translate");
      controls.space = "local";

      if (controls instanceof THREE.Object3D) {
        scene.add(controls);
        transformRef.current = controls;
      } else {
        return;
      }

      if (helperRef.current) {
        controls.attach(helperRef.current);
      }

      const onChange = () => {
        if (helperRef.current && isDragging.current) {
          const pos = helperRef.current.position;
          const rot = helperRef.current.rotation.z;
          const scale = helperRef.current.scale.x;

          const currentSticker = stickerRef.current;

          updateState({
            sticker: {
              ...currentSticker,
              posX: pos.x,
              posY: pos.y,
              scale: scale,
              rotation: rot * (180 / Math.PI),
            },
          });
        }
      };

      const onDragStart = () => {
        isDragging.current = true;
        setControlsEnabled(false);
      };

      const onDragEnd = () => {
        isDragging.current = false;
        setControlsEnabled(true);
      };

      controls.addEventListener("change", onChange);
      controls.addEventListener("dragging-changed", (event) => {
        if (event.value) onDragStart();
        else onDragEnd();
      });

      const handleKeyDown = (event: KeyboardEvent) => {
        if (!transformRef.current) return;
        const tag = (event.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;

        switch (event.key.toLowerCase()) {
          case "t":
            transformRef.current.setMode("translate");
            break;
          case "r":
            transformRef.current.setMode("rotate");
            break;
          case "s":
            transformRef.current.setMode("scale");
            break;
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        controls.removeEventListener("change", onChange);
        window.removeEventListener("keydown", handleKeyDown);
        controls.detach();
        if (controls.parent) controls.parent.remove(controls);
        controls.dispose();
        transformRef.current = null;
        setControlsEnabled(true);
      };
    }
  }, [shouldShow, camera, gl, scene, updateState, setControlsEnabled]);

  useEffect(() => {
    if (helperRef.current && !isDragging.current && shouldShow) {
      const mesh = helperRef.current;
      const targetX = state.sticker.posX;
      const targetY = state.sticker.posY;
      const targetScale = state.sticker.scale;
      const targetRot = state.sticker.rotation * (Math.PI / 180);

      if (Math.abs(mesh.position.x - targetX) > 0.001) mesh.position.x = targetX;
      if (Math.abs(mesh.position.y - targetY) > 0.001) mesh.position.y = targetY;
      if (Math.abs(mesh.scale.x - targetScale) > 0.001) mesh.scale.setScalar(targetScale);
      if (Math.abs(mesh.rotation.z - targetRot) > 0.001) mesh.rotation.z = targetRot;
    }
  }, [
    state.sticker.posX,
    state.sticker.posY,
    state.sticker.scale,
    state.sticker.rotation,
    shouldShow,
  ]);

  if (!shouldShow) return null;

  return (
    <mesh ref={helperRef} position={[0, 0, 0.01]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={0xffff00}
        transparent={true}
        opacity={0.05}
        depthTest={false}
        side={THREE.DoubleSide}
      />
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(1, 1)]} />
        <lineBasicMaterial color={0xffff00} depthTest={false} opacity={0.5} transparent />
      </lineSegments>
    </mesh>
  );
};
