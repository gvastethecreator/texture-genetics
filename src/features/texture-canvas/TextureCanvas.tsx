import React, { useRef, useEffect, useState, useCallback, Suspense, lazy } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Hud, OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import { AppState, GeometryType } from "../../core/types/types";
import { initializeRenderer, type CanvasRenderer } from "../../lib/three/rendererFactory";
import { supportsAdvancedWebGLRenderTargets } from "../../lib/three/rendererCapabilities";
import { Loader2 } from "lucide-react";
import { ViewportChrome } from "./ViewportChrome";
import { ingestUserFile } from "../../shared/utils/ingest";
import { useContainerDimensions } from "../../shared/hooks/useContainerDimensions";
import { hasActiveSceneEffects, requiresContinuousRendering } from "./renderPolicy";

// Modular Components
import { SceneLighting } from "./components/SceneLighting";
import { CameraRig, CameraHandler } from "./components/CameraRig";
import { MainMesh } from "./components/MainMesh";
import { MiniatureScene } from "./components/MiniatureScene";
import { StickerGizmo } from "./components/StickerGizmo";
import { StageFloor } from "./components/StageFloor";
import { ParticleSystem } from "./components/ParticleSystem";
import { SmokeSystem } from "./components/SmokeSystem";

const SceneEffects = lazy(() =>
  import("./components/SceneEffects").then((module) => ({ default: module.SceneEffects })),
);

// --- SCENE COMPOSITION ---
interface SceneCompositionProps {
  appState: AppState;
  stateRef: React.MutableRefObject<AppState>;
  controlsHandle: React.MutableRefObject<CameraHandler | null>;
  updateState: (s: Partial<AppState>) => void;
  onLoadingChange: (loading: boolean) => void;
  onAssetError: (message: string | null) => void;
  onZoomChange: (zoom: number) => void;
  orbitEnabled: boolean;
  setOrbitEnabled: (enabled: boolean) => void;
}

const SceneComposition: React.FC<SceneCompositionProps> = ({
  appState,
  stateRef,
  controlsHandle,
  updateState,
  onLoadingChange,
  onAssetError,
  onZoomChange,
  orbitEnabled,
  setOrbitEnabled,
}) => {
  const { size, scene, gl, invalidate } = useThree();
  const isBackgroundGeometry = appState.geometry === GeometryType.BACKGROUND;

  const supportsAdvancedWebGlTargets = React.useMemo(() => {
    return supportsAdvancedWebGLRenderTargets(gl as CanvasRenderer);
  }, [gl]);

  // Global Fog & Background Management
  useEffect(() => {
    if (appState.environment.fogEnabled) {
      const color = new THREE.Color(appState.environment.fogColor || "#000000");
      const density = appState.environment.fogDensity;
      const far = 20 - density * 100;
      scene.fog = new THREE.Fog(color, 2, Math.max(5, far));
    } else {
      scene.fog = null;
    }

    if (appState.environment.envBackground) {
      scene.background = null;
    } else {
      if (appState.environment.bgEnabled) {
        scene.background = new THREE.Color(appState.environment.bgColor);
      } else {
        scene.background = null;
      }
    }
    invalidate();
  }, [
    appState.environment.fogEnabled,
    appState.environment.fogDensity,
    appState.environment.fogColor,
    appState.environment.bgEnabled,
    appState.environment.bgColor,
    appState.environment.envBackground,
    invalidate,
    scene,
  ]);

  return (
    <>
      <SceneLighting appState={appState} />

      <CameraRig
        appState={appState}
        controlsHandle={controlsHandle}
        onZoomChange={onZoomChange}
        updateState={updateState}
        enabled={!isBackgroundGeometry && orbitEnabled}
      />

      <group>
        <MainMesh
          appState={appState}
          stateRef={stateRef}
          onLoadingChange={onLoadingChange}
          onAssetError={onAssetError}
        />
        {supportsAdvancedWebGlTargets &&
          !isBackgroundGeometry &&
          appState.environment.stageEnabled && <StageFloor appState={appState} />}
      </group>

      {appState.environment.particlesEnabled && (
        <ParticleSystem
          count={appState.environment.particleCount}
          speed={appState.environment.particleSpeed}
          size={appState.environment.particleSize}
        />
      )}

      {appState.environment.smokeEnabled && <SmokeSystem appState={appState} />}

      {hasActiveSceneEffects(appState) && (
        <Suspense fallback={null}>
          <SceneEffects appState={appState} />
        </Suspense>
      )}

      <StickerGizmo
        state={appState}
        updateState={updateState}
        visible={appState.sticker.enabled}
        setControlsEnabled={setOrbitEnabled}
      />

      {/* HUD: Miniature Map Preview (Top Left) - WebGL only */}
      {supportsAdvancedWebGlTargets && !isBackgroundGeometry && (
        <Hud renderPriority={2}>
          <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={1} />
          <ambientLight intensity={1} />
          <group position={[-size.width / 2 + 60, size.height / 2 - 60, 0]}>
            <MiniatureScene appState={appState} size={100} />
          </group>
        </Hud>
      )}
    </>
  );
};

const LoadingScreen = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div className="flex flex-col items-center gap-2 text-accent-primary">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="text-[10px] font-mono tracking-widest opacity-70">INITIALIZING GPU...</span>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
export const TextureCanvas: React.FC<{
  appState: AppState;
  setGlRef: (gl: CanvasRenderer) => void;
  updateState: (s: Partial<AppState>) => void;
}> = ({ appState, setGlRef, updateState }) => {
  const controlsHandle = useRef<CameraHandler | null>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const contextCleanupRef = useRef<(() => void) | null>(null);
  const stateRef = useRef(appState);
  const [isLoading, setIsLoading] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const rendererDpr =
    typeof appState.settings.renderDpr === "number" && appState.settings.renderDpr > 0
      ? appState.settings.renderDpr
      : 2;

  const { ref: containerRef, dimensions } = useContainerDimensions();
  const isReady = dimensions.width > 0 && dimensions.height > 0;

  // The render loop must observe the same snapshot being committed to child
  // effects; parent effects run after child effects and would otherwise lag once.
  stateRef.current = appState;

  useEffect(() => {
    setOrbitEnabled(appState.geometry !== GeometryType.BACKGROUND);
  }, [appState.geometry]);

  useEffect(() => {
    return () => {
      contextCleanupRef.current?.();
      contextCleanupRef.current = null;
    };
  }, []);

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAssetError(null);
      const outcome = ingestUserFile(file, appState);
      if (outcome.ok && outcome.patch && Object.keys(outcome.patch).length > 0) {
        updateState(outcome.patch);
      } else if (!outcome.ok) {
        setAssetError(outcome.toast.message);
      }
    }
    e.target.value = "";
  };

  const handleCanvasContextLost = useCallback((event: Event) => {
    event.preventDefault();
    setContextLost(true);
  }, []);

  const onCreated = useCallback(
    (state: any) => {
      const renderer = state.gl;
      setGlRef(renderer);

      // Context loss handling (WebGL backend)
      if (!(renderer as { isWebGPURenderer?: boolean })?.isWebGPURenderer && renderer.domElement) {
        contextCleanupRef.current?.();
        renderer.domElement.addEventListener("webglcontextlost", handleCanvasContextLost, false);
        const handleRestored = () => setContextLost(false);
        renderer.domElement.addEventListener("webglcontextrestored", handleRestored, false);
        contextCleanupRef.current = () => {
          renderer.domElement.removeEventListener(
            "webglcontextlost",
            handleCanvasContextLost,
            false,
          );
          renderer.domElement.removeEventListener("webglcontextrestored", handleRestored, false);
        };
      }

      if ("shadowMap" in renderer) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
      if ("toneMapping" in renderer) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
      }

      return undefined;
    },
    [setGlRef, handleCanvasContextLost],
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full absolute inset-0 group bg-[#111216] overflow-hidden"
    >
      {contextLost && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center gap-3 text-white">
            <span className="text-sm font-bold">GPU context lost</span>
            <button
              type="button"
              className="rounded-lg bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-black"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
            <span className="text-xs font-mono text-white/80">PROCESSING ASSET...</span>
          </div>
        </div>
      )}

      {isReady ? (
        <Canvas
          key={`aa-${appState.settings.antialias}`}
          onCreated={onCreated}
          className="w-full h-full block"
          frameloop={requiresContinuousRendering(appState) ? "always" : "demand"}
          gl={async (props: any) => {
            try {
              const renderer = await initializeRenderer({
                canvas: props.canvas,
                antialias: appState.settings.antialias,
                alpha: false,
                dpr: rendererDpr,
              });
              return renderer as any;
            } catch (error) {
              console.error("[Canvas] Renderer initialization failed:", error);
              throw error;
            }
          }}
          dpr={appState.settings.renderDpr || [1, 2]}
          camera={{ position: [0, 0, 4], fov: 45, near: 0.1, far: 1000 }}
          resize={{ scroll: false, debounce: 0 }}
          shadows
        >
          <Suspense fallback={null}>
            <SceneComposition
              appState={appState}
              stateRef={stateRef}
              controlsHandle={controlsHandle}
              updateState={updateState}
              onLoadingChange={setIsLoading}
              onAssetError={setAssetError}
              onZoomChange={setZoomLevel}
              orbitEnabled={orbitEnabled}
              setOrbitEnabled={setOrbitEnabled}
            />
          </Suspense>
        </Canvas>
      ) : (
        <LoadingScreen />
      )}

      {assetError && (
        <div
          role="alert"
          className="absolute top-4 left-1/2 z-50 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 rounded-lg border border-red-400/40 bg-red-950/90 px-4 py-3 text-sm text-red-100 shadow-2xl backdrop-blur"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">Model import failed</p>
              <p className="mt-1 text-xs text-red-100/80">{assetError}</p>
            </div>
            <button
              type="button"
              onClick={() => setAssetError(null)}
              className="shrink-0 rounded border border-red-200/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide hover:bg-white/10"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <ViewportChrome
        appState={appState}
        updateState={updateState}
        zoomLevel={zoomLevel}
        controlsHandle={controlsHandle}
        modelInputRef={modelInputRef}
        onModelUpload={handleModelUpload}
      />
    </div>
  );
};
