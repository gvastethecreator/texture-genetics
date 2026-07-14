import { useState, useCallback, useEffect, useRef } from "react";
import { AppState, TextureType, AnimationConfig, ViewMode, GeometryType } from "../types/types";
import { DEFAULTS } from "../constants";
import { useStorage, sanitizeValue } from "./useStorage";
import { createDefaultAppState } from "./defaultState";
import {
  generateSmartRandomState,
  generateHarmoniousPalette,
  generateRandomParams,
} from "../logic/randomizer";

const VALID_VIEW_MODES = new Set<number>(
  Object.values(ViewMode).filter((value): value is number => typeof value === "number"),
);
const VALID_GEOMETRIES = new Set<string>(Object.values(GeometryType));

const isValidViewMode = (value: unknown): value is ViewMode =>
  typeof value === "number" && VALID_VIEW_MODES.has(value);
const isValidGeometryType = (value: unknown): value is GeometryType =>
  typeof value === "string" && VALID_GEOMETRIES.has(value);
const CAMERA_ANIMATION_TYPES = ["TURNTABLE", "TUMBLE", "HOVER", "HEARTBEAT", "SHAKE"];

// --- INITIAL STATE DEFINITION ---
const INITIAL_STATE: AppState = createDefaultAppState();

// Re-export safeReplacer for other consumers (like PresetManager)
export { safeReplacer } from "./useStorage";

export const useAppState = (props: {
  onStateChangeForHistory: (s: AppState) => void;
  onStorageWarning?: (message: string) => void;
}) => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const stateRef = useRef(state);

  // Keep ref in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Use separated storage logic
  const { isInitialized, saveState } = useStorage(
    INITIAL_STATE,
    (loadedState) => {
      // Validation for camera prop if loading old/corrupt state
      if (
        !loadedState.camera ||
        !Array.isArray(loadedState.camera.position) ||
        !Array.isArray(loadedState.camera.target)
      ) {
        loadedState.camera = { ...DEFAULTS.CAMERA };
      }

      if (!isValidViewMode(loadedState.viewMode)) {
        loadedState.viewMode = DEFAULTS.VIEW_MODE;
      }

      if (!isValidGeometryType(loadedState.geometry)) {
        loadedState.geometry = DEFAULTS.GEOMETRY;
      }

      setState(loadedState);
      props.onStateChangeForHistory(loadedState);
    },
    props.onStorageWarning,
  );

  // Auto-Save
  useEffect(() => {
    const timer = setTimeout(() => saveState(state), 1000);
    return () => clearTimeout(timer);
  }, [state, isInitialized, saveState]);

  // --- ACTIONS ---

  const updateState = useCallback((partial: Partial<AppState>) => {
    const cleanPartial = sanitizeValue(partial);
    if (cleanPartial == null) return;

    setState((prev) => {
      const next = { ...prev, ...cleanPartial };
      // Texture prop safety checks
      if (
        cleanPartial.sticker &&
        typeof cleanPartial.sticker.texture !== "string" &&
        cleanPartial.sticker.texture !== null
      ) {
        next.sticker = { ...prev.sticker, texture: null };
      }
      if (
        cleanPartial.baseTexture &&
        typeof cleanPartial.baseTexture.texture !== "string" &&
        cleanPartial.baseTexture.texture !== null
      ) {
        next.baseTexture = { ...prev.baseTexture, texture: null };
      }
      if (
        cleanPartial.imageAlpha &&
        typeof cleanPartial.imageAlpha.maskTexture !== "string" &&
        cleanPartial.imageAlpha.maskTexture !== null
      ) {
        next.imageAlpha = { ...prev.imageAlpha, maskTexture: null };
      }
      return next;
    });
  }, []);

  const replaceState = useCallback((newState: AppState) => {
    // Used for History/Undo synchronization.
    // We trust the history state is valid, so minimal sanitization.
    setState(newState);
  }, []);

  const updateParams = useCallback((partial: Partial<AppState["params"]>) => {
    const clean = sanitizeValue(partial);
    if (clean) {
      setState((prev) => ({ ...prev, params: { ...prev.params, ...clean } }));
    }
  }, []);

  const updateParamAnimation = useCallback((key: string, config: AnimationConfig) => {
    const cleanConfig = sanitizeValue(config);
    if (cleanConfig) {
      setState((prev) => ({
        ...prev,
        paramAnimations: { ...prev.paramAnimations, [key]: cleanConfig },
      }));
    }
  }, []);

  const selectTexture = useCallback((type: TextureType) => {
    setState((prev) => ({ ...prev, textureType: type }));
  }, []);

  const randomize = useCallback(() => {
    // Preserve camera when randomizing
    setState((prev) => {
      const randomState = generateSmartRandomState(prev);
      return {
        ...randomState,
        camera: prev.camera,
      };
    });
  }, []);

  const randomizeParams = useCallback(() => {
    setState((prev) => ({
      ...prev,
      params: { ...prev.params, ...generateRandomParams() },
    }));
  }, []);

  const randomizePalette = useCallback(() => {
    setState((prev) => ({
      ...prev,
      params: { ...prev.params, palette: generateHarmoniousPalette() },
    }));
  }, []);

  const randomizePatternSelection = useCallback(() => {
    const allTypes = Object.values(TextureType);
    const validTypes = allTypes.filter(
      (t) => typeof t === "string" && !CAMERA_ANIMATION_TYPES.includes(t),
    );
    const randomType = validTypes[Math.floor(Math.random() * validTypes.length)];
    setState((prev) => ({ ...prev, textureType: randomType }));
  }, []);

  const loadPreset = useCallback((presetState: Partial<AppState>) => {
    const cleanPreset = sanitizeValue(presetState);
    if (cleanPreset == null) return;

    // Legacy Color Migration
    if (cleanPreset.params) {
      if (!cleanPreset.params.palette || cleanPreset.params.palette.length === 0) {
        const c1 = cleanPreset.params.color1 || "#ffffff";
        const c2 = cleanPreset.params.color2 || "#000000";
        cleanPreset.params.palette = [
          { color: c1, enabled: true },
          { color: c2, enabled: true },
          { color: "#10B981", enabled: false },
          { color: "#F59E0B", enabled: false },
          { color: "#EF4444", enabled: false },
          { color: "#EC4899", enabled: false },
          { color: "#6366F1", enabled: false },
          { color: "#ffffff", enabled: false },
        ];
      }
    }

    // We explicitly do NOT load camera state from presets by default to keep user context
    setState((prev) => ({
      ...INITIAL_STATE,
      ...cleanPreset,
      viewMode: prev.viewMode,
      geometry: prev.geometry,
      customModel: prev.customModel,
      isSidebarOpen: prev.isSidebarOpen,
      settings: prev.settings,
      camera: prev.camera,
      environment: { ...prev.environment, ...cleanPreset.environment },
      sticker: { ...prev.sticker, ...cleanPreset.sticker },
      geometryConfig: { ...INITIAL_STATE.geometryConfig, ...cleanPreset.geometryConfig },
      params: { ...INITIAL_STATE.params, ...cleanPreset.params },
      normalMap: { ...INITIAL_STATE.normalMap, ...cleanPreset.normalMap },
      displacement: { ...INITIAL_STATE.displacement, ...cleanPreset.displacement },
      ao: { ...INITIAL_STATE.ao, ...cleanPreset.ao },
      tiling: { ...INITIAL_STATE.tiling, ...cleanPreset.tiling },
      symmetry: { ...INITIAL_STATE.symmetry, ...cleanPreset.symmetry },
      transform: { ...INITIAL_STATE.transform, ...cleanPreset.transform },
      colorBalance: {
        ...INITIAL_STATE.colorBalance,
        ...cleanPreset.colorBalance,
        shadows: { ...INITIAL_STATE.colorBalance.shadows, ...cleanPreset.colorBalance?.shadows },
        midtones: { ...INITIAL_STATE.colorBalance.midtones, ...cleanPreset.colorBalance?.midtones },
        highlights: {
          ...INITIAL_STATE.colorBalance.highlights,
          ...cleanPreset.colorBalance?.highlights,
        },
      },
      blending: { ...INITIAL_STATE.blending, ...cleanPreset.blending },
      postProcess: { ...INITIAL_STATE.postProcess, ...cleanPreset.postProcess },
      baseTexture: { ...INITIAL_STATE.baseTexture, ...cleanPreset.baseTexture },
      imageAlpha: { ...INITIAL_STATE.imageAlpha, ...cleanPreset.imageAlpha },
      spriteSheet: { ...INITIAL_STATE.spriteSheet, ...cleanPreset.spriteSheet },
      mouse: { ...INITIAL_STATE.mouse, ...cleanPreset.mouse },
      svg: { ...INITIAL_STATE.svg, ...cleanPreset.svg },
      text: { ...INITIAL_STATE.text, ...cleanPreset.text },
    }));
  }, []);

  const resetState = useCallback(() => {
    props.onStateChangeForHistory(stateRef.current);
    setState((prev) => ({
      ...INITIAL_STATE,
      isSidebarOpen: prev.isSidebarOpen,
      settings: prev.settings,
      camera: prev.camera, // Keep camera
    }));
  }, [props.onStateChangeForHistory]);

  return {
    state,
    isBusy: false,
    actions: {
      updateState,
      replaceState,
      updateParams,
      updateParamAnimation,
      selectTexture,
      randomize,
      randomizeParams,
      randomizePalette,
      randomizePatternSelection,
      loadPreset,
      resetState,
    },
  };
};
