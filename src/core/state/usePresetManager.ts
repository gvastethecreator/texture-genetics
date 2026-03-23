
import { useState, useCallback, useEffect } from 'react';
import { AppState, UserPreset } from '../types/types';
import { safeReplacer } from './useAppState';

const PRESETS_STORAGE_KEY = 'effect_gen_v3_user_presets';

interface PresetManagerProps {
    initialState: AppState;
    onLoadPreset: (state: Partial<AppState>) => void;
    addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const usePresetManager = ({ initialState, onLoadPreset, addToast }: PresetManagerProps) => {
    const [userPresets, setUserPresets] = useState<UserPreset[]>([]);

    useEffect(() => {
        try {
            const savedPresets = localStorage.getItem(PRESETS_STORAGE_KEY);
            if (savedPresets) {
                setUserPresets(JSON.parse(savedPresets));
            }
        } catch (e) {
            console.error("Failed to load presets", e);
        }
    }, []);

    const saveUserPreset = useCallback((name: string) => {
        try {
            const newPreset: UserPreset = {
                id: Date.now().toString(),
                name,
                date: Date.now(),
                // Use a sanitized state snapshot
                state: { 
                    ...initialState, 
                    imageAlpha: { ...initialState.imageAlpha, maskTexture: null },
                    baseTexture: { ...initialState.baseTexture, texture: null },
                    sticker: { ...initialState.sticker, texture: null },
                    customModel: null
                }
            };
            const updated = [...userPresets, newPreset];
            setUserPresets(updated);
            
            // Use safeReplacer to prevent circular structure errors
            localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated, safeReplacer()));
            addToast('success', `Preset "${name}" saved!`);
        } catch (e) {
            console.error("Failed to save preset", e);
            addToast('error', 'Failed to save preset (Storage/JSON Error)');
        }
    }, [initialState, userPresets, addToast]);

    const deleteUserPreset = useCallback((id: string) => {
        try {
            const updated = userPresets.filter(p => p.id !== id);
            setUserPresets(updated);
            localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated, safeReplacer()));
            addToast('info', 'Preset deleted');
        } catch (e) {
            addToast('error', 'Failed to delete preset');
        }
    }, [userPresets, addToast]);

    const exportPresets = useCallback(() => {
        if (userPresets.length === 0) {
            addToast('info', 'No presets to export.');
            return;
        }
        try {
            // Use safeReplacer for export as well
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userPresets, safeReplacer(), 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "effect_gen_presets.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            addToast('success', 'Presets exported to JSON');
        } catch (e) {
            addToast('error', 'Failed to export presets');
        }
    }, [userPresets, addToast]);

    const importPresets = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (Array.isArray(json)) {
                    const valid = json.every(p => p.id && p.name && p.state);
                    if (valid) {
                         const merged = [...userPresets, ...json];
                         const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
                         setUserPresets(unique);
                         localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(unique, safeReplacer()));
                         addToast('success', `Imported ${json.length} presets`);
                    } else {
                        throw new Error("Invalid preset format");
                    }
                }
            } catch (e) {
                console.error(e);
                addToast('error', 'Failed to import presets. Invalid JSON or Circular Ref.');
            }
        };
        reader.readAsText(file);
    }, [userPresets, addToast]);

    const actions = {
        loadPreset: onLoadPreset,
        saveUserPreset,
        deleteUserPreset,
        exportPresets,
        importPresets
    };

    return { userPresets, actions };
};
