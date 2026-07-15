import React, { useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";
import { AppState, GeometryType } from "../../../core/types/types";

export interface CameraHandler {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  setView: (view: "front" | "top" | "left" | "right" | "bottom" | "back" | "isometric") => void;
}

interface CameraRigProps {
  appState: AppState;
  controlsHandle: React.MutableRefObject<CameraHandler | null>;
  onZoomChange?: (zoom: number) => void;
  updateState: (s: Partial<AppState>) => void;
  enabled?: boolean; // NEW PROP
}

export const CameraRig: React.FC<CameraRigProps> = ({
  appState,
  controlsHandle,
  onZoomChange,
  updateState,
  enabled = true,
}) => {
  const { camera, gl, invalidate } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);
  const initialDistanceRef = useRef<number | null>(null);
  const previousGeometryRef = useRef<GeometryType | null>(null);
  const hasInitializedCameraRef = useRef(false);

  // Initial Load Logic
  useEffect(() => {
    if (!appState.camera || !appState.camera.position || !appState.camera.target) return;
    if (appState.camera.position[2] === 0) return;

    if (Array.isArray(appState.camera.position)) {
      camera.position.set(...appState.camera.position);
    }

    if (Array.isArray(appState.camera.target)) {
      camera.lookAt(...appState.camera.target);
      if (controlsRef.current) {
        controlsRef.current.target.set(...appState.camera.target);
        controlsRef.current.update();
      }
    }
    invalidate();
  }, [camera, invalidate]);

  // Camera Reset Logic
  const resetCamera = useCallback(() => {
    const isBackground = appState.geometry === GeometryType.BACKGROUND;
    const is3D = appState.geometry !== GeometryType.PLANE && !isBackground;
    const isTiling = appState.tileMode || appState.tilingPreview;

    if (camera instanceof THREE.PerspectiveCamera) {
      let dist = 3.5;

      if (isBackground) {
        camera.fov = 45;
        dist = 4.0;
      } else if (isTiling) {
        camera.fov = 45;
        dist = 14.0;
      } else {
        const targetOccupancy = is3D ? 0.65 : 0.9;
        const fov = is3D ? 35 : 45;
        camera.fov = fov;
        const radius = 1.5;
        const verticalFOV = fov * (Math.PI / 180);

        const tanFOV = Math.tan(verticalFOV / 2);
        if (tanFOV > 0.0001) {
          dist = radius / (targetOccupancy * tanFOV);
        }
      }

      if (!Number.isFinite(dist) || isNaN(dist) || dist < 0.1 || dist > 1000) {
        console.warn("Camera Rig: Distance calculation invalid. Using safe default.");
        dist = 4.0;
      }

      initialDistanceRef.current = dist;
      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }

      updateState({
        camera: {
          position: [0, 0, dist],
          target: [0, 0, 0],
          fov: camera.fov,
        },
      });

      if (onZoomChange) onZoomChange(100);
      invalidate();
    }
  }, [
    appState.geometry,
    appState.tileMode,
    appState.tilingPreview,
    camera,
    onZoomChange,
    invalidate,
    updateState,
  ]);

  // Setup OrbitControls
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.1;
    controls.maxDistance = 100.0;
    controlsRef.current = controls;

    if (appState.camera && Array.isArray(appState.camera.target)) {
      controls.target.set(...appState.camera.target);
    } else {
      controls.target.set(0, 0, 0);
    }

    if (camera.position.lengthSq() < 0.001) {
      camera.position.set(0, 0, 4);
    }

    controls.update();

    const handleChange = () => {
      invalidate();
      const dist = camera.position.distanceTo(controls.target);

      if (initialDistanceRef.current === null || initialDistanceRef.current === 0) {
        initialDistanceRef.current = dist;
      }

      if (initialDistanceRef.current > 0 && dist > 0) {
        const pct = Math.round((initialDistanceRef.current / dist) * 100);
        if (onZoomChange) onZoomChange(pct);
      }
    };

    const handleEnd = () => {
      updateState({
        camera: {
          position: [camera.position.x, camera.position.y, camera.position.z],
          target: [controls.target.x, controls.target.y, controls.target.z],
          fov: (camera as THREE.PerspectiveCamera).fov,
        },
      });
    };

    controls.addEventListener("change", handleChange);
    controls.addEventListener("end", handleEnd);

    return () => {
      controls.removeEventListener("change", handleChange);
      controls.removeEventListener("end", handleEnd);
      controls.dispose();
    };
  }, [camera, gl.domElement, invalidate, onZoomChange, updateState]);

  // Sync Enabled Prop
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = enabled;
    }
  }, [enabled]);

  useEffect(() => {
    const previousGeometry = previousGeometryRef.current;
    previousGeometryRef.current = appState.geometry;

    if (previousGeometry === null) {
      return;
    }

    if (previousGeometry !== appState.geometry) {
      resetCamera();
    }
  }, [appState.geometry, resetCamera]);

  useEffect(() => {
    if (hasInitializedCameraRef.current) {
      return;
    }

    hasInitializedCameraRef.current = true;
    resetCamera();
  }, [resetCamera]);

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.updateProjectionMatrix();
    }
  }, [appState.geometry]);

  useLayoutEffect(() => {
    if (controlsHandle) {
      controlsHandle.current = {
        zoomIn: () => {
          if (!controlsRef.current) return;
          const dist = camera.position.distanceTo(controlsRef.current.target);
          if (dist > controlsRef.current.minDistance) {
            const dir = new THREE.Vector3()
              .subVectors(controlsRef.current.target, camera.position)
              .normalize();
            if (Number.isFinite(dir.x)) {
              camera.position.addScaledVector(dir, dist * 0.2);
              controlsRef.current.update();
            }
          }
        },
        zoomOut: () => {
          if (!controlsRef.current) return;
          const dist = camera.position.distanceTo(controlsRef.current.target);
          if (dist < controlsRef.current.maxDistance) {
            const dir = new THREE.Vector3()
              .subVectors(camera.position, controlsRef.current.target)
              .normalize();
            if (Number.isFinite(dir.x)) {
              camera.position.addScaledVector(dir, dist * 0.2);
              controlsRef.current.update();
            }
          }
        },
        reset: resetCamera,
        setView: (view: "front" | "top" | "left" | "right" | "bottom" | "back" | "isometric") => {
          if (!controlsRef.current) return;
          const dist = camera.position.distanceTo(controlsRef.current.target) || 4;
          const target = controlsRef.current.target;

          switch (view) {
            case "front":
              camera.position.set(target.x, target.y, target.z + dist);
              break;
            case "back":
              camera.position.set(target.x, target.y, target.z - dist);
              break;
            case "top":
              camera.position.set(target.x, target.y + dist, target.z);
              break;
            case "bottom":
              camera.position.set(target.x, target.y - dist, target.z);
              break;
            case "left":
              camera.position.set(target.x - dist, target.y, target.z);
              break;
            case "right":
              camera.position.set(target.x + dist, target.y, target.z);
              break;
            case "isometric":
              const isoDist = dist / Math.sqrt(3);
              camera.position.set(target.x + isoDist, target.y + isoDist, target.z + isoDist);
              break;
          }

          camera.lookAt(target);
          controlsRef.current.update();
          updateState({
            camera: {
              position: [camera.position.x, camera.position.y, camera.position.z],
              target: [target.x, target.y, target.z],
              fov: (camera as THREE.PerspectiveCamera).fov,
            },
          });
        },
      };
    }
  }, [camera, resetCamera, updateState]);

  useFrame(() => {
    if (controlsRef.current && controlsRef.current.enabled) controlsRef.current.update();
  });

  return null;
};
