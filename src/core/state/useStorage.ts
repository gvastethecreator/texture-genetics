
import { useState, useEffect } from 'react';
import { AppState } from '../types/types';
import { get, set, del } from 'idb-keyval';

const STORAGE_KEY = 'effect_gen_v3_release';
const STATE_VERSION = 2;

// Keys of properties that contain heavy base64 strings
const HEAVY_ASSETS = [
    { path: ['baseTexture', 'texture'], key: 'asset_base_texture' },
    { path: ['sticker', 'texture'], key: 'asset_sticker_texture' },
    { path: ['imageAlpha', 'maskTexture'], key: 'asset_mask_texture' },
    { path: ['customModel'], key: 'asset_custom_model' }
];

// --- SAFETY UTILS ---

const isUnsafeObject = (value: any): boolean => {
    try {
        if (!value || typeof value !== 'object') return false;
        if ('nodeType' in value) return true;
        if ('_reactInternals' in value) return true;
        if ('_reactFiber' in value) return true;
        return false;
    } catch (e) {
        return true;
    }
};

export const sanitizeValue = <T>(value: T): T | undefined => {
    if (value === undefined) return undefined;
    if (isUnsafeObject(value)) return undefined;
    return value;
};

export const safeReplacer = () => {
    const seen = new WeakSet();
    return (key: string, value: any) => {
        if (typeof value !== 'object' || value === null) return value;
        if (key.startsWith('_') || key === 'ref' || key === 'updater') return undefined;
        if (isUnsafeObject(value)) return undefined;
        if (seen.has(value)) return undefined;
        seen.add(value);
        return value;
    };
};

export const useStorage = (initialState: AppState, onLoaded: (s: AppState) => void) => {
    const [isInitialized, setIsInitialized] = useState(false);

    // Load Strategy: LocalStorage (Sync) -> IndexedDB (Async)
    useEffect(() => {
        const load = async () => {
            try {
                // 1. Load Light State from LocalStorage
                const savedStateIdx = localStorage.getItem(STORAGE_KEY);
                let mergedState = { ...initialState };

                if (savedStateIdx) {
                    const parsed = JSON.parse(savedStateIdx);
                    mergedState = { ...initialState, ...parsed };
                    
                    // Deep merge vital sections to prevent crashes from missing keys
                    mergedState.postProcess = { ...initialState.postProcess, ...parsed.postProcess };
                    mergedState.environment = { ...initialState.environment, ...parsed.environment };
                    mergedState.settings = { ...initialState.settings, ...parsed.settings };
                    mergedState.blending = { ...initialState.blending, ...parsed.blending };
                    mergedState.sticker = { ...initialState.sticker, ...parsed.sticker };
                    
                    // CRITICAL: Deep merge colorBalance to avoid undefined 'hue'/'sat' on older saves
                    mergedState.colorBalance = { 
                        ...initialState.colorBalance, 
                        ...parsed.colorBalance,
                        shadows: { ...initialState.colorBalance.shadows, ...parsed.colorBalance?.shadows },
                        midtones: { ...initialState.colorBalance.midtones, ...parsed.colorBalance?.midtones },
                        highlights: { ...initialState.colorBalance.highlights, ...parsed.colorBalance?.highlights },
                    };
                }

                // 2. Load Heavy Assets from IndexedDB
                const assetPromises = HEAVY_ASSETS.map(async (asset) => {
                    const val = await get(asset.key);
                    if (val) {
                        // Re-inject into state
                        if (asset.path.length === 2) {
                            // @ts-ignore
                            if (!mergedState[asset.path[0]]) mergedState[asset.path[0]] = {};
                            // @ts-ignore
                            mergedState[asset.path[0]][asset.path[1]] = val;
                        } else {
                            // @ts-ignore
                            mergedState[asset.path[0]] = val;
                        }
                    }
                });

                await Promise.all(assetPromises);
                
                onLoaded(mergedState);
            } catch (e) {
                console.error("Failed to load state", e);
                localStorage.removeItem(STORAGE_KEY);
                onLoaded(initialState);
            } finally {
                setIsInitialized(true);
            }
        };

        load();
    }, []);

    // Save Strategy: Split Light & Heavy
    const saveState = async (state: AppState) => {
        if (!isInitialized) return;
        try {
            // 1. Extract and Save Heavy Assets to IDB
            const assetsToSave = [];
            
            // Helper to get value
            const getValue = (path: string[]) => {
                // @ts-ignore
                if (path.length === 1) return state[path[0]];
                // @ts-ignore
                return state[path[0]]?.[path[1]];
            };

            for (const asset of HEAVY_ASSETS) {
                const val = getValue(asset.path);
                if (val && typeof val === 'string' && val.length > 100) {
                    assetsToSave.push(set(asset.key, val));
                } else {
                    // If null or empty, remove from IDB to clean up
                    assetsToSave.push(del(asset.key));
                }
            }
            
            // Fire and forget IDB writes (don't block UI)
            Promise.all(assetsToSave).catch(e => console.warn("IDB Save Error", e));

            // 2. Create Light State for LocalStorage (Strip Heavy Assets)
            const stateToSave = { 
                ...state, 
                _version: STATE_VERSION,
                imageAlpha: { ...state.imageAlpha, maskTexture: null }, // Stripped
                baseTexture: { ...state.baseTexture, texture: null }, // Stripped
                sticker: { ...state.sticker, texture: null }, // Stripped
                customModel: null // Stripped
            };
            
            const json = JSON.stringify(stateToSave, safeReplacer());
            localStorage.setItem(STORAGE_KEY, json);
            
        } catch (e) {
            console.warn("State Save Failed:", e);
        }
    };

    return { isInitialized, saveState };
};
