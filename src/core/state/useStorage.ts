
import { useState, useEffect } from 'react';
import { AppState } from '../types/types';
import { get, set, del } from 'idb-keyval';

const STORAGE_KEY = 'effect_gen_v3_release';
const STATE_VERSION = 2;

// Keys of properties that contain heavy base64 strings
type HeavyAssetDescriptor = {
    key: string;
    path: ['baseTexture', 'texture'] | ['sticker', 'texture'] | ['imageAlpha', 'maskTexture'] | ['customModel'];
};

const HEAVY_ASSETS: readonly HeavyAssetDescriptor[] = [
    { path: ['baseTexture', 'texture'], key: 'asset_base_texture' },
    { path: ['sticker', 'texture'], key: 'asset_sticker_texture' },
    { path: ['imageAlpha', 'maskTexture'], key: 'asset_mask_texture' },
    { path: ['customModel'], key: 'asset_custom_model' }
] as const;

const applyHeavyAsset = (state: AppState, asset: HeavyAssetDescriptor, value: string) => {
    switch (asset.key) {
        case 'asset_base_texture':
            state.baseTexture = { ...state.baseTexture, texture: value };
            return;
        case 'asset_sticker_texture':
            state.sticker = { ...state.sticker, texture: value };
            return;
        case 'asset_mask_texture':
            state.imageAlpha = { ...state.imageAlpha, maskTexture: value };
            return;
        case 'asset_custom_model':
            state.customModel = value;
            return;
    }
};

const getHeavyAssetValue = (state: AppState, asset: HeavyAssetDescriptor): string | null => {
    switch (asset.key) {
        case 'asset_base_texture':
            return state.baseTexture.texture;
        case 'asset_sticker_texture':
            return state.sticker.texture;
        case 'asset_mask_texture':
            return state.imageAlpha.maskTexture;
        case 'asset_custom_model':
            return state.customModel;
    }

    return null;
};

// --- SAFETY UTILS ---

const isUnsafeObject = (value: any): boolean => {
    try {
        if (!value || typeof value !== 'object') return false;
        if ('nodeType' in value) return true;
        if ('_reactInternals' in value) return true;
        if ('_reactFiber' in value) return true;
        return false;
    } catch {
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
                    if (typeof val === 'string' && val.length > 0) {
                        applyHeavyAsset(mergedState, asset, val);
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

            for (const asset of HEAVY_ASSETS) {
                const val = getHeavyAssetValue(state, asset);
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
