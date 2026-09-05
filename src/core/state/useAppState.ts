import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { AppState, TextureType, AnimationConfig, ViewMode, GeometryType } from "../types/types";
import { DEFAULTS } from "../constants";
import { useStorage, sanitizeValue } from "./useStorage";
import { createDefaultAppState } from "./defaultState";
import { mergeEditorDocument } from "./mergeEditorDocument";
import { sanitizeNestedAssets, sanitizeStateAssets } from "./sanitizeAssets";
import {
  generateSmartRandomState,
  generateHarmoniousPalette,
  generateRandomParams,
  catalogTextureTypes,
} from "../logic/randomizer";

const VALID_VIEW_MODES = new Set<number>(
  Object.values(ViewMode).filter((value): value is number => typeof value === "number"),
);
const VALID_GEOMETRIES = new Set<string>(Object.values(GeometryType));

const isValidViewMode = (value: unknown): value is ViewMode =>
  typeof value === "number" && VALID_VIEW_MODES.has(value);
const isValidGeometryType = (value: unknown): value is GeometryType =>
  typeof value === "string" && VALID_GEOMETRIES.has(value);

// --- INITIAL STATE DEFINITION ---
const INITIAL_STATE: AppState = createDefaultAppState();

export const useAppState = (props: {
  onStateChangeForHistory: (s: AppState) => void;
  onStorageWarning?: (message: string) => void;
}) => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const stateRef = useRef(state);
  const onHistoryRef = useRef(props.onStateChangeForHistory);
  const onStorageWarningRef = useRef(props.onStorageWarning);
  stateRef.current = state;
  onHistoryRef.current = props.onStateChangeForHistory;
  onStorageWarningRef.current = props.onStorageWarning;

  const handleStorageWarning = useCallback((message: string) => {
    onStorageWarningRef.current?.(message);
  }, []);

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
      onHistoryRef.current(loadedState);
    },
    handleStorageWarning,
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

    setState((prev) => sanitizeStateAssets(prev, cleanPartial));
  }, []);

  const patchGroup = useCallback(
    <K extends keyof AppState>(key: K, values: Partial<AppState[K]>) => {
      const cleanValues = sanitizeValue(values);
      if (cleanValues == null) return;
      setState((prev) => ({
        ...prev,
        [key]: sanitizeNestedAssets(key, prev[key], cleanValues),
      }));
    },
    [],
  );

  const replaceState = useCallback((newState: AppState) => {
    setState((prev) =>
      mergeEditorDocument(
        newState,
        {
          isSettingsOpen: prev.isSettingsOpen,
          isCodeOpen: prev.isCodeOpen,
          isShortcutsOpen: prev.isShortcutsOpen,
          isFullscreen: prev.isFullscreen,
        },
        { preserveSessionUi: false },
      ),
    );
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
    setState((prev) => {
      onHistoryRef.current(prev);
      const randomState = generateSmartRandomState(prev);
      return {
        ...randomState,
        camera: prev.camera,
        isSettingsOpen: prev.isSettingsOpen,
        isCodeOpen: prev.isCodeOpen,
        isShortcutsOpen: prev.isShortcutsOpen,
        isFullscreen: prev.isFullscreen,
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
    const validTypes = catalogTextureTypes();
    const randomType = validTypes[Math.floor(Math.random() * validTypes.length)];
    setState((prev) => ({ ...prev, textureType: randomType }));
  }, []);

  const loadPreset = useCallback((presetState: Partial<AppState>) => {
    const cleanPreset = sanitizeValue(presetState);
    if (cleanPreset == null) return;

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

    setState((prev) => {
      onHistoryRef.current(prev);
      const merged = mergeEditorDocument(INITIAL_STATE, cleanPreset, {
        preserveSessionUi: false,
      });
      return {
        ...merged,
        viewMode: prev.viewMode,
        geometry: prev.geometry,
        customModel: prev.customModel,
        settings: prev.settings,
        camera: prev.camera,
        isSettingsOpen: prev.isSettingsOpen,
        isCodeOpen: prev.isCodeOpen,
        isShortcutsOpen: prev.isShortcutsOpen,
        isFullscreen: prev.isFullscreen,
      };
    });
  }, []);

  const resetState = useCallback(() => {
    onHistoryRef.current(stateRef.current);
    setState((prev) => ({
      ...INITIAL_STATE,
      settings: prev.settings,
      camera: prev.camera, // Keep camera
    }));
  }, []);

  const actions = useMemo(
    () => ({
      updateState,
      patchGroup,
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
    }),
    [
      updateState,
      patchGroup,
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
    ],
  );

  return {
    state,
    actions,
  };
};
