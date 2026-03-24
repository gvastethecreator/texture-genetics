
import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, TextureType, AnimationConfig, BlendMode, ViewMode, GeometryType } from '../types/types';
import { DEFAULTS } from '../constants';
import { useStorage, sanitizeValue } from './useStorage';
import { generateSmartRandomState, generateHarmoniousPalette, generateRandomParams } from '../logic/randomizer';

// --- INITIAL STATE DEFINITION ---
const INITIAL_STATE: AppState = {
  resolution: DEFAULTS.RESOLUTION,
  textureType: DEFAULTS.TEXTURE_TYPE,
  geometry: DEFAULTS.GEOMETRY,
  geometryConfig: { ...DEFAULTS.GEOMETRY_CONFIG },
  viewMode: DEFAULTS.VIEW_MODE,
  animate: DEFAULTS.ANIMATE,
  time: DEFAULTS.TIME,
  isFullscreen: false,
  tilingPreview: false,
  tileMode: DEFAULTS.TILE_MODE,
  gridOverlay: false,
  isSidebarOpen: true,
  isSettingsOpen: false,
  isCodeOpen: DEFAULTS.IS_CODE_OPEN,
  isShortcutsOpen: DEFAULTS.IS_SHORTCUTS_OPEN,
  params: { ...DEFAULTS.PARAMS },
  paramAnimations: { ...DEFAULTS.PARAM_ANIMATIONS },
  blending: { ...DEFAULTS.BLENDING },
  baseTexture: { ...DEFAULTS.BASE_TEXTURE },
  sticker: { ...DEFAULTS.STICKER },
  transform: { ...DEFAULTS.TRANSFORM },
  symmetry: { ...DEFAULTS.SYMMETRY },
  tiling: { ...DEFAULTS.TILING },
  postProcess: { ...DEFAULTS.POST_PROCESS },
  normalMap: { ...DEFAULTS.NORMAL_MAP },
  displacement: { ...DEFAULTS.DISPLACEMENT }, 
  ao: { ...DEFAULTS.AO },
  colorBalance: { ...DEFAULTS.COLOR_BALANCE },
  imageAlpha: { ...DEFAULTS.IMAGE_ALPHA },
  spriteSheet: { ...DEFAULTS.SPRITE_SHEET },
  mouse: { ...DEFAULTS.MOUSE },
  environment: { ...DEFAULTS.ENVIRONMENT },
  settings: { ...DEFAULTS.SETTINGS },
  camera: { ...DEFAULTS.CAMERA }, 
  customModel: DEFAULTS.CUSTOM_MODEL,
  svg: { ...DEFAULTS.SVG },
  text: { ...DEFAULTS.TEXT }
};

// Re-export safeReplacer for other consumers (like PresetManager)
export { safeReplacer } from './useStorage';

export const useAppState = (props: { onStateChangeForHistory: (s: AppState) => void }) => {
    const [state, setState] = useState<AppState>(INITIAL_STATE);
    const stateRef = useRef(state);
    
    // Keep ref in sync
    useEffect(() => { stateRef.current = state; }, [state]);

    // Use separated storage logic
    const { isInitialized, saveState } = useStorage(INITIAL_STATE, (loadedState) => {
        // Validation for camera prop if loading old/corrupt state
        if (
            !loadedState.camera || 
            !Array.isArray(loadedState.camera.position) || 
            !Array.isArray(loadedState.camera.target)
        ) {
            loadedState.camera = { ...DEFAULTS.CAMERA };
        }
        setState(loadedState);
        props.onStateChangeForHistory(loadedState);
    });

    // Auto-Save
    useEffect(() => {
        const timer = setTimeout(() => saveState(state), 1000);
        return () => clearTimeout(timer);
    }, [state, isInitialized, saveState]);

    // --- ACTIONS ---

    const updateState = useCallback((partial: Partial<AppState>) => {
        const cleanPartial = sanitizeValue(partial);
        if (!cleanPartial) return;

        setState(prev => {
            const next = { ...prev, ...cleanPartial };
            // Texture prop safety checks
            if (cleanPartial.sticker && typeof cleanPartial.sticker.texture !== 'string' && cleanPartial.sticker.texture !== null) {
                next.sticker = { ...prev.sticker, texture: null };
            }
            if (cleanPartial.baseTexture && typeof cleanPartial.baseTexture.texture !== 'string' && cleanPartial.baseTexture.texture !== null) {
                next.baseTexture = { ...prev.baseTexture, texture: null };
            }
            return next;
        });
    }, []);

    const replaceState = useCallback((newState: AppState) => {
        // Used for History/Undo synchronization.
        // We trust the history state is valid, so minimal sanitization.
        setState(newState);
    }, []);

    const updateParams = useCallback((partial: Partial<AppState['params']>) => {
        const clean = sanitizeValue(partial);
        if (clean) {
            setState(prev => ({ ...prev, params: { ...prev.params, ...clean } }));
        }
    }, []);
    
    const updateParamAnimation = useCallback((key: string, config: AnimationConfig) => {
        const cleanConfig = sanitizeValue(config);
        if(cleanConfig) {
            setState(prev => ({
                ...prev,
                paramAnimations: { ...prev.paramAnimations, [key]: cleanConfig }
            }));
        }
    }, []);

    const selectTexture = useCallback((type: TextureType) => {
        setState(prev => ({ ...prev, textureType: type }));
    }, []);

    const randomize = useCallback(() => {
        // Preserve camera when randomizing
        setState(prev => {
            const randomState = generateSmartRandomState(prev);
            return {
                ...randomState,
                camera: prev.camera
            };
        });
    }, []);

    const randomizeParams = useCallback(() => {
        setState(prev => ({
            ...prev,
            params: { ...prev.params, ...generateRandomParams() }
        }));
    }, []);

    const randomizePalette = useCallback(() => {
        setState(prev => ({
            ...prev,
            params: { ...prev.params, palette: generateHarmoniousPalette() }
        }));
    }, []);

    const randomizePatternSelection = useCallback(() => {
        const categories = Object.values(TextureType);
        const randomType = categories[Math.floor(Math.random() * categories.length)];
        setState(prev => ({ ...prev, textureType: randomType }));
    }, []);
    
    const loadPreset = useCallback((presetState: Partial<AppState>) => {
        const cleanPreset = sanitizeValue(presetState);
        if (!cleanPreset) return;

        // Legacy Color Migration
        if (cleanPreset.params) {
            if (!cleanPreset.params.palette || cleanPreset.params.palette.length === 0) {
                const c1 = cleanPreset.params.color1 || '#ffffff';
                const c2 = cleanPreset.params.color2 || '#000000';
                cleanPreset.params.palette = [
                    { color: c1, enabled: true },
                    { color: c2, enabled: true },
                    { color: '#10B981', enabled: false },
                    { color: '#F59E0B', enabled: false },
                    { color: '#EF4444', enabled: false },
                    { color: '#EC4899', enabled: false },
                    { color: '#6366F1', enabled: false },
                    { color: '#ffffff', enabled: false }
                ];
            }
        }

        // We explicitly do NOT load camera state from presets by default to keep user context
        setState(prev => ({ 
            ...INITIAL_STATE, 
            ...cleanPreset, 
            viewMode: prev.viewMode, 
            geometry: prev.geometry,
            customModel: prev.customModel,
            isSidebarOpen: prev.isSidebarOpen,
            settings: prev.settings,
            camera: prev.camera, // Keep user's camera
            environment: { ...prev.environment, ...cleanPreset.environment },
            sticker: { ...prev.sticker, ...cleanPreset.sticker }
        }));
    }, []);

    const resetState = useCallback(() => {
        props.onStateChangeForHistory(stateRef.current);
        setState(prev => ({ 
            ...INITIAL_STATE, 
            isSidebarOpen: prev.isSidebarOpen, 
            settings: prev.settings,
            camera: prev.camera // Keep camera
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
        }
    };
};
