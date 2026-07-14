import { useState, useCallback, useEffect, useRef } from "react";
import { get, set } from "idb-keyval";
import { AppState, UserPreset } from "../types/types";
import { readTextFile } from "../../shared/utils/fileLoaders";
import {
  createPresetDocument,
  parsePresetDocument,
  PresetDocumentError,
  recoverStoredPresetCollection,
} from "./presetFile";

const PRESETS_STORAGE_KEY = "effect_gen_v3_user_presets";
const MAX_PRESET_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PRESET_NAME_LENGTH = 120;

const createPresetId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function"
      ? crypto.getRandomValues(new Uint32Array(1))[0].toString(16)
      : Math.random().toString(16).slice(2);
  return `${Date.now()}-${randomPart}`;
};

interface PresetManagerProps {
  initialState: AppState;
  onLoadPreset: (state: Partial<AppState>) => void;
  addToast: (type: "success" | "error" | "info", message: string) => void;
}

export const usePresetManager = ({ initialState, onLoadPreset, addToast }: PresetManagerProps) => {
  const [userPresets, setUserPresets] = useState<UserPreset[]>([]);
  const userPresetsRef = useRef<UserPreset[]>([]);
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const load = async () => {
      try {
        const savedPresets = await get<unknown>(PRESETS_STORAGE_KEY);
        if (savedPresets) {
          const recovered = recoverStoredPresetCollection(savedPresets);
          userPresetsRef.current = recovered.presets;
          setUserPresets(recovered.presets);
          if (recovered.rejectedCount > 0) {
            const loadedLabel = `${recovered.presets.length} saved preset${recovered.presets.length === 1 ? "" : "s"}`;
            const skippedLabel = `${recovered.rejectedCount} invalid preset${recovered.rejectedCount === 1 ? "" : "s"}`;
            addToast(
              "error",
              `Loaded ${loadedLabel}; skipped ${skippedLabel}. Original storage was left unchanged.`,
            );
          }
        }
      } catch (e) {
        console.error("Failed to load presets", e);
        addToast("error", "Saved presets could not be loaded because their data is invalid");
      }
    };
    const operation = mutationQueueRef.current.then(load);
    mutationQueueRef.current = operation.then(
      () => undefined,
      () => undefined,
    );
  }, []);

  const persistMutation = useCallback(
    (
      transform: (current: readonly UserPreset[]) => UserPreset[] | null,
    ): Promise<UserPreset[] | null> => {
      const operation = mutationQueueRef.current.then(async () => {
        const candidate = transform(userPresetsRef.current);
        if (candidate === null) return null;

        const normalized = parsePresetDocument(candidate);
        await set(PRESETS_STORAGE_KEY, normalized);
        userPresetsRef.current = normalized;
        setUserPresets(normalized);
        return normalized;
      });
      mutationQueueRef.current = operation.then(
        () => undefined,
        () => undefined,
      );
      return operation;
    },
    [],
  );

  const saveUserPreset = useCallback(
    async (name: string) => {
      try {
        const normalizedName = name.trim();
        if (normalizedName.length === 0 || normalizedName.length > MAX_PRESET_NAME_LENGTH) {
          addToast("error", "Preset name must contain 1 to 120 characters");
          return;
        }

        const newPreset: UserPreset = {
          id: createPresetId(),
          name: normalizedName,
          date: Date.now(),
          state: {
            ...initialState,
            imageAlpha: { ...initialState.imageAlpha, maskTexture: null },
            baseTexture: { ...initialState.baseTexture, texture: null },
            sticker: { ...initialState.sticker, texture: null },
            customModel: null,
          },
        };
        try {
          await persistMutation((current) => [...current, newPreset]);
          addToast("success", `Preset "${normalizedName}" saved!`);
        } catch (idbError) {
          console.error("IDB preset save error", idbError);
          addToast("error", "Preset could not be saved; no changes were applied");
        }
      } catch (e) {
        console.error("Failed to save preset", e);
        addToast("error", "Failed to save preset (Storage/JSON Error)");
      }
    },
    [initialState, persistMutation, addToast],
  );

  const deleteUserPreset = useCallback(
    async (id: string) => {
      try {
        try {
          await persistMutation((current) => current.filter((preset) => preset.id !== id));
          addToast("info", "Preset deleted");
        } catch (idbError) {
          console.error("IDB preset delete error", idbError);
          addToast("error", "Preset could not be deleted; no changes were applied");
        }
      } catch (e) {
        console.error("Failed to delete preset", e);
        addToast("error", "Failed to delete preset");
      }
    },
    [persistMutation, addToast],
  );

  const exportPresets = useCallback(() => {
    if (userPresets.length === 0) {
      addToast("info", "No presets to export.");
      return;
    }
    try {
      const presetDocument = createPresetDocument(parsePresetDocument(userPresets));
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(presetDocument, null, 2));
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
    async (file: File) => {
      let imported: UserPreset[];
      try {
        if (file.size > MAX_PRESET_FILE_BYTES) {
          throw new PresetDocumentError("document exceeds the 10 MB import limit");
        }

        imported = parsePresetDocument(JSON.parse(await readTextFile(file)));
      } catch (error) {
        console.error("Invalid preset file", error);
        const reason =
          error instanceof PresetDocumentError
            ? error.message
            : error instanceof SyntaxError
              ? "invalid JSON"
              : "file could not be read";
        addToast("error", `Invalid preset file: ${reason}`);
        return;
      }

      try {
        let importedCount = 0;
        let skipped = 0;
        const merged = await persistMutation((current) => {
          const existingIds = new Set(current.map((preset) => preset.id));
          const additions = imported.filter((preset) => !existingIds.has(preset.id));
          importedCount = additions.length;
          skipped = imported.length - additions.length;
          return additions.length > 0 ? [...current, ...additions] : null;
        });

        if (merged === null) {
          addToast(
            "info",
            skipped > 0 ? "No presets imported; every ID already exists" : "No presets to import",
          );
          return;
        }

        addToast(
          "success",
          skipped > 0
            ? `Imported ${importedCount} presets; skipped ${skipped} existing IDs`
            : `Imported ${importedCount} presets`,
        );
      } catch (error) {
        console.error("Preset import persistence error", error);
        addToast("error", "Preset import could not be saved; no changes were applied");
      }
    },
    [persistMutation, addToast],
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
