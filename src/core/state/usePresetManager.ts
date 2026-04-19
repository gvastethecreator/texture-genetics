import { useState, useCallback, useEffect } from "react";
import { get, set } from "idb-keyval";
import { AppState, UserPreset } from "../types/types";
import { safeReplacer } from "./useAppState";

const PRESETS_STORAGE_KEY = "effect_gen_v3_user_presets";

interface PresetManagerProps {
  initialState: AppState;
  onLoadPreset: (state: Partial<AppState>) => void;
  addToast: (type: "success" | "error" | "info", message: string) => void;
}

export const usePresetManager = ({ initialState, onLoadPreset, addToast }: PresetManagerProps) => {
  const [userPresets, setUserPresets] = useState<UserPreset[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const savedPresets = await get<UserPreset[]>(PRESETS_STORAGE_KEY);
        if (savedPresets) {
          setUserPresets(savedPresets);
        }
      } catch (e) {
        console.error("Failed to load presets", e);
      }
    };
    load();
  }, []);

  const saveUserPreset = useCallback(
    async (name: string) => {
      try {
        const newPreset: UserPreset = {
          id: Date.now().toString(),
          name,
          date: Date.now(),
          state: {
            ...initialState,
            imageAlpha: { ...initialState.imageAlpha, maskTexture: null },
            baseTexture: { ...initialState.baseTexture, texture: null },
            sticker: { ...initialState.sticker, texture: null },
            customModel: null,
          },
        };
        const updated = [...userPresets, newPreset];
        setUserPresets(updated);

        try {
          await set(PRESETS_STORAGE_KEY, JSON.parse(JSON.stringify(updated, safeReplacer())));
          addToast("success", `Preset "${name}" saved!`);
        } catch (idbError) {
          console.error("IDB preset save error", idbError);
          addToast("error", "Preset saved locally but failed to persist to storage");
        }
      } catch (e) {
        console.error("Failed to save preset", e);
        addToast("error", "Failed to save preset (Storage/JSON Error)");
      }
    },
    [initialState, userPresets, addToast],
  );

  const deleteUserPreset = useCallback(
    async (id: string) => {
      try {
        const updated = userPresets.filter((p) => p.id !== id);
        setUserPresets(updated);

        try {
          await set(PRESETS_STORAGE_KEY, JSON.parse(JSON.stringify(updated, safeReplacer())));
          addToast("info", "Preset deleted");
        } catch (idbError) {
          console.error("IDB preset delete error", idbError);
          addToast("error", "Preset removed locally but failed to update storage");
        }
      } catch (e) {
        console.error("Failed to delete preset", e);
        addToast("error", "Failed to delete preset");
      }
    },
    [userPresets, addToast],
  );

  const exportPresets = useCallback(() => {
    if (userPresets.length === 0) {
      addToast("info", "No presets to export.");
      return;
    }
    try {
      // Use safeReplacer for export as well
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(userPresets, safeReplacer(), 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "effect_gen_presets.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      addToast("success", "Presets exported to JSON");
    } catch (e) {
      console.error("Failed to export presets", e);
      addToast("error", "Failed to export presets");
    }
  }, [userPresets, addToast]);

  const importPresets = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (Array.isArray(json)) {
            const valid = json.every((p) => p.id && p.name && p.state);
            if (valid) {
              const merged = [...userPresets, ...json];
              const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());
              setUserPresets(unique);

              try {
                await set(PRESETS_STORAGE_KEY, JSON.parse(JSON.stringify(unique, safeReplacer())));
                addToast("success", `Imported ${json.length} presets`);
              } catch (idbError) {
                console.error("IDB preset import error", idbError);
                addToast("error", `Imported ${json.length} presets locally but failed to persist`);
              }
            } else {
              throw new Error("Invalid preset format");
            }
          }
        } catch (e) {
          console.error(e);
          addToast("error", "Failed to import presets. Invalid JSON or Circular Ref.");
        }
      };
      reader.readAsText(file);
    },
    [userPresets, addToast],
  );

  const actions = {
    loadPreset: onLoadPreset,
    saveUserPreset,
    deleteUserPreset,
    exportPresets,
    importPresets,
  };

  return { userPresets, actions };
};
