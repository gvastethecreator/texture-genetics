import { useFrame, useThree } from "@react-three/fiber";
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import droidSansFontUrl from "three/examples/fonts/droid/droid_sans_regular.typeface.json?url";
import droidSerifFontUrl from "three/examples/fonts/droid/droid_serif_regular.typeface.json?url";
import gentilisFontUrl from "three/examples/fonts/gentilis_regular.typeface.json?url";
import helvetikerFontUrl from "three/examples/fonts/helvetiker_regular.typeface.json?url";
import optimerFontUrl from "three/examples/fonts/optimer_regular.typeface.json?url";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import {
  AnimationConfig,
  AppState,
  GeometryType,
  PreviewAnimation,
} from "../../../core/types/types";
import { getGeometryForType } from "../../../lib/three/geometryFactory";
import { loadModelGeometry, ModelLoadError } from "../../../lib/three/modelLoader";
import { createTslMaterial } from "../../../lib/tsl/tslBuilder";
import { TslUniforms, type TslUniformDomain, updateTslUniforms } from "../../../lib/tsl/uniforms";
import { useTextureResource } from "../../../shared/hooks/useTextureResource";
import { calculateAnimatedValue } from "../../../shared/utils/animationUtils";

const FONT_URLS: Record<string, string> = {
  "droid/droid_sans": droidSansFontUrl,
  "droid/droid_serif": droidSerifFontUrl,
  gentilis: gentilisFontUrl,
  helvetiker: helvetikerFontUrl,
  optimer: optimerFontUrl,
};

interface MainMeshProps {
  appState: AppState;
  stateRef: React.MutableRefObject<AppState>;
  onLoadingChange?: (loading: boolean) => void;
  onAssetError?: (message: string | null) => void;
}

export const MainMesh: React.FC<MainMeshProps> = memo((props) => {
  const { appState, stateRef, onLoadingChange, onAssetError } = props;
  const { size, viewport, invalidate } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const instanceRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tslUniformsRef = useRef<TslUniforms | null>(null);
  const maskTex = useTextureResource(
    appState.imageAlpha.maskEnabled ? appState.imageAlpha.maskTexture : null,
  );
  const baseTex = useTextureResource(
    appState.baseTexture?.enabled ? appState.baseTexture.texture : null,
  );
  const stickerTex = useTextureResource(
    appState.sticker?.enabled ? appState.sticker.texture : null,
  );

  const [customGeometry, setCustomGeometry] = useState<THREE.BufferGeometry | null>(null);
  const lastLoadedModelUrl = useRef<string | null>(null);
  const lastSvgParams = useRef<string | null>(null);
  const lastTextParams = useRef<string | null>(null);
  const isBackgroundGeometry = appState.geometry === GeometryType.BACKGROUND;

  // Explicit Geometry Disposal
  useEffect(() => {
    return () => {
      if (customGeometry) customGeometry.dispose();
    };
  }, [customGeometry]);

  // Geometry Logic
  const geometry = useMemo(() => {
    if (
      (appState.geometry === GeometryType.CUSTOM ||
        appState.geometry === GeometryType.SVG ||
        appState.geometry === GeometryType.TEXT) &&
      customGeometry
    ) {
      return customGeometry;
    }
    return getGeometryForType(appState.geometry, appState.geometryConfig);
  }, [appState.geometry, appState.geometryConfig, customGeometry]);

  // Model Loading Logic
  useEffect(() => {
    let active = true;

    const clearCustomGeom = () => {
      setCustomGeometry((prev) => {
        if (prev) prev.dispose();
        return null;
      });
    };

    if (appState.geometry === GeometryType.CUSTOM && appState.customModel) {
      if (appState.customModel === lastLoadedModelUrl.current) return;
      if (onLoadingChange) onLoadingChange(true);
      onAssetError?.(null);
      lastLoadedModelUrl.current = appState.customModel;

      const loadModel = async () => {
        try {
          const geom = await loadModelGeometry(appState.customModel!);
          if (active) {
            clearCustomGeom();
            setCustomGeometry(geom);
          } else {
            geom.dispose();
          }
        } catch (e) {
          console.error("Failed to load model", e);
          if (active) {
            lastLoadedModelUrl.current = null;
            const reason =
              e instanceof ModelLoadError ? e.message : "The selected file could not be parsed";
            onAssetError?.(`Model could not be loaded. ${reason}`);
          }
        } finally {
          if (active && onLoadingChange) onLoadingChange(false);
        }
      };
      loadModel();
    } else if (appState.geometry === GeometryType.SVG) {
      const svgKey = JSON.stringify(appState.svg);
      if (svgKey === lastSvgParams.current) return;
      lastSvgParams.current = svgKey;

      if (onLoadingChange) onLoadingChange(true);

      const loadSvg = async () => {
        try {
          // For presets, we can generate a simple SVG string or load from URL
          let svgData = appState.svg.url;

          if (!svgData) {
            // Generate preset SVG
            if (appState.svg.preset === "star") {
              svgData =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
            } else if (appState.svg.preset === "heart") {
              svgData =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
            } else {
              svgData =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';
            }
          }

          const loader = new SVGLoader();
          const svgResult = await loader.loadAsync(svgData);

          const paths = svgResult.paths;
          const shapes: THREE.Shape[] = [];

          for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            const pathShapes = SVGLoader.createShapes(path);
            shapes.push(...pathShapes);
          }

          if (shapes.length > 0) {
            const extrudeSettings = {
              depth: appState.svg.extrude,
              bevelEnabled: false,
            };

            const geom = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
            geom.center();

            // Fix SVG being upside down
            geom.rotateX(Math.PI);

            const scale = appState.svg.scale * 0.1; // SVGs are usually large
            geom.scale(scale, scale, scale);

            geom.computeVertexNormals();
            clearCustomGeom();
            setCustomGeometry(geom);
          }
        } catch (e) {
          console.error("Failed to load SVG", e);
        } finally {
          if (active && onLoadingChange) onLoadingChange(false);
        }
      };
      loadSvg();
    } else if (appState.geometry === GeometryType.TEXT) {
      const textKey = JSON.stringify(appState.text);
      if (textKey === lastTextParams.current) return;
      lastTextParams.current = textKey;

      if (onLoadingChange) onLoadingChange(true);

      const loadText = async () => {
        try {
          const loader = new FontLoader();
          const fontUrl = FONT_URLS[appState.text.font] ?? helvetikerFontUrl;
          const font = await loader.loadAsync(fontUrl);

          const geom = new TextGeometry(appState.text.text || " ", {
            font: font,
            size: appState.text.size,
            depth: appState.text.extrude,
            curveSegments: appState.text.curveSegments,
            bevelEnabled: appState.text.bevelEnabled,
            bevelThickness: appState.text.bevelThickness,
            bevelSize: appState.text.bevelSize,
            bevelOffset: 0,
            bevelSegments: 3,
          });

          geom.center();
          geom.computeVertexNormals();
          clearCustomGeom();
          setCustomGeometry(geom);
        } catch (e) {
          console.error("Failed to load Text", e);
        } finally {
          if (active && onLoadingChange) onLoadingChange(false);
        }
      };
      loadText();
    } else {
      // Only clear custom geometry if we switch AWAY from CUSTOM/SVG/TEXT mode
      if (![GeometryType.CUSTOM, GeometryType.SVG, GeometryType.TEXT].includes(appState.geometry)) {
        clearCustomGeom();
        lastLoadedModelUrl.current = null;
        lastSvgParams.current = null;
        lastTextParams.current = null;
      }
    }

    return () => {
      active = false;
      if (onLoadingChange) onLoadingChange(false);
    };
  }, [
    appState.geometry,
    appState.customModel,
    appState.svg,
    appState.text,
    onLoadingChange,
    onAssetError,
  ]);

  // Material Logic (TSL)
  const material = useMemo(() => {
    try {
      const { material: mat, uniforms: u } = createTslMaterial(appState, {
        maskTexture: maskTex,
        baseTexture: baseTex,
        stickerTexture: stickerTex,
      });
      tslUniformsRef.current = u;
      return mat;
    } catch (e) {
      console.error("TSL Material Error", e);
      return new THREE.MeshBasicMaterial({ color: 0xff00ff });
    }
  }, [
    appState.textureType,
    appState.blending.enabled,
    appState.blending.type,
    appState.postProcess.bloom,
    appState.normalMap.enabled,
    appState.ao.enabled,
    appState.environment.holographic,
    appState.baseTexture.enabled,
    appState.baseTexture.texture,
    appState.baseTexture.opacity,
    appState.baseTexture.blendMode,
    appState.baseTexture.effectType,
    appState.baseTexture.effectStrength,
    appState.sticker.enabled,
    appState.sticker.texture,
    appState.sticker.opacity,
    appState.sticker.blendMode,
    appState.sticker.posX,
    appState.sticker.posY,
    appState.sticker.scale,
    appState.sticker.rotation,
    appState.sticker.color,
    appState.sticker.useColor,
    appState.viewMode,
    appState.imageAlpha.enabled,
    appState.imageAlpha.maskEnabled,
    appState.imageAlpha.maskTexture,
    maskTex,
    baseTex,
    stickerTex,
  ]);

  // Cleanup Material on Unmount/Change
  useEffect(() => {
    return () => {
      if (material) material.dispose();
    };
  }, [material]);

  const updateUniformDomain = useCallback(
    (domain: TslUniformDomain) => {
      const u = tslUniformsRef.current;
      if (u) {
        updateTslUniforms(u, stateRef.current, [domain]);
        invalidate();
      }
    },
    [invalidate, stateRef],
  );

  // Renderer-facing domains update independently, so camera/settings/UI edits do no shader work.
  useEffect(
    () => updateUniformDomain("pattern"),
    [appState.params, appState.blending, material, updateUniformDomain],
  );
  useEffect(
    () => updateUniformDomain("transform"),
    [appState.transform, appState.symmetry, appState.tiling, material, updateUniformDomain],
  );
  useEffect(
    () => updateUniformDomain("post-process"),
    [appState.postProcess, material, updateUniformDomain],
  );
  useEffect(
    () => updateUniformDomain("material"),
    [appState.normalMap, appState.displacement, appState.ao, material, updateUniformDomain],
  );
  useEffect(
    () => updateUniformDomain("color"),
    [appState.colorBalance, material, updateUniformDomain],
  );
  useEffect(
    () => updateUniformDomain("interaction"),
    [appState.imageAlpha, appState.mouse, material, updateUniformDomain],
  );
  useEffect(
    () => updateUniformDomain("environment"),
    [appState.environment, material, updateUniformDomain],
  );
  useEffect(
    () => updateUniformDomain("core"),
    [appState.textureType, appState.viewMode, material, updateUniformDomain],
  );

  // --- RENDER LOOP (TSL) ---
  // Only update smooth animations and time
  useFrame((state) => {
    try {
      const loopState = stateRef.current;
      const u = tslUniformsRef.current;
      if (!u) return;

      // Time & Resolution (Always Dynamic)
      if (loopState.animate) {
        u.u_time.value = state.clock.elapsedTime * loopState.params.speed;
      } else {
        u.u_time.value = loopState.time;
      }

      // Resolution (Canvas Resize)
      const dpr = state.gl.getPixelRatio();
      (u.u_resolution.value as THREE.Vector2).set(size.width * dpr, size.height * dpr);

      // Mouse (Smooth Interaction)
      (u.u_mouse.value as THREE.Vector2).set(
        state.pointer.x * 0.5 + 0.5,
        state.pointer.y * 0.5 + 0.5,
      );

      // Parameter Animations (Waveforms)
      if (loopState.animate && loopState.paramAnimations) {
        const keyMap: Record<string, { u: keyof TslUniforms; scale?: number }> = {
          scale: { u: "u_scale" },
          intensity: { u: "u_intensity" },
          factor: { u: "u_factor" },
          speed: { u: "u_speed" },
          distortion: { u: "u_distortion" },
          detail: { u: "u_detail" },
          p1: { u: "u_p1" },
          p2: { u: "u_p2" },
          p3: { u: "u_p3" },
          "transform.angle": { u: "u_angle", scale: Math.PI / 180 },
        };

        Object.entries(loopState.paramAnimations).forEach(([key, value]) => {
          const config = value as AnimationConfig;
          if (config && config.enabled) {
            const map = keyMap[key];
            if (map) {
              let val = calculateAnimatedValue(state.clock.elapsedTime, config);
              if (map.scale) val *= map.scale;
              (u[map.u] as { value: number }).value = val;
            }
          }
        });
      }

      // Preview Rotation - NOW ENABLED FOR ALL GEOMETRIES
      const targetRef = instanceRef.current || meshRef.current;
      if (targetRef) {
        if (isBackgroundGeometry) {
          targetRef.rotation.set(0, 0, 0);
          targetRef.position.set(0, 0, -0.05);
          return;
        }

        const anim = loopState.environment.animation;
        const speed = loopState.environment.animationSpeed;
        const t = state.clock.elapsedTime;

        targetRef.rotation.set(0, 0, 0);
        targetRef.position.set(0, 0, 0);
        targetRef.scale.set(1, 1, 1);

        if (anim === PreviewAnimation.TURNTABLE) targetRef.rotation.y = t * speed * 0.5;
        else if (anim === PreviewAnimation.TUMBLE) {
          targetRef.rotation.x = t * speed * 0.3;
          targetRef.rotation.y = t * speed * 0.5;
        } else if (anim === PreviewAnimation.HOVER) {
          targetRef.rotation.y = t * speed * 0.1;
          targetRef.position.y = Math.sin(t * speed * 2.0) * 0.1;
        } else if (anim === PreviewAnimation.HEARTBEAT) {
          const s = 1.0 + Math.sin(t * speed * 5.0) * 0.05;
          targetRef.scale.set(s, s, s);
        } else if (anim === PreviewAnimation.SHAKE) {
          targetRef.position.x = Math.sin(t * speed * 20.0) * 0.02;
          targetRef.rotation.z = Math.cos(t * speed * 15.0) * 0.02;
        }
      }
    } catch (e) {
      console.warn("Frame update error:", e);
    }
  });

  const isTiling =
    (appState.tileMode || appState.tilingPreview) && appState.geometry === GeometryType.PLANE;
  const backgroundScale = isBackgroundGeometry
    ? ([viewport.width / 2, viewport.height / 2, 1] as [number, number, number])
    : undefined;

  // Tiling Layout Logic
  useLayoutEffect(() => {
    if (!instanceRef.current || !isTiling) return;

    let i = 0;
    for (let y = -1; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        tempObject.position.set(x * 2.0, y * 2.0, 0);
        const sx = appState.tiling.mirror && Math.abs(x) % 2 === 1 ? -1 : 1;
        const sy = appState.tiling.mirror && Math.abs(y) % 2 === 1 ? -1 : 1;
        tempObject.scale.set(sx, sy, 1);
        tempObject.rotation.set(0, 0, 0);
        tempObject.updateMatrix();
        instanceRef.current.setMatrixAt(i, tempObject.matrix);
        i++;
      }
    }
    instanceRef.current.instanceMatrix.needsUpdate = true;
  }, [isTiling, appState.tiling.mirror, tempObject]);

  const meshKey = isTiling
    ? `instanced-${appState.geometry}-${appState.textureType}-${appState.viewMode}`
    : `single-${appState.geometry}-${appState.textureType}-${appState.viewMode}`;

  if (isTiling) {
    return (
      <instancedMesh
        key={meshKey}
        ref={instanceRef}
        args={[geometry, material, 9]}
        frustumCulled={false}
        castShadow
        receiveShadow
        dispose={null}
      />
    );
  }

  return (
    <mesh
      key={meshKey}
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={isBackgroundGeometry ? [0, 0, -0.05] : undefined}
      scale={backgroundScale ?? [1, 1, 1]}
      renderOrder={isBackgroundGeometry ? -1 : 0}
      frustumCulled={false}
      castShadow={!isBackgroundGeometry}
      receiveShadow={!isBackgroundGeometry}
      dispose={null}
    />
  );
});
