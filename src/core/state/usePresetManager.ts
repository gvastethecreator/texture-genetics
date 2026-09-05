import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { del, get, set } from "idb-keyval";
import { AppState, UserPreset } from "../types/types";
import { readTextFile } from "../../shared/utils/fileLoaders";
import {
  createPresetDocument,
  parsePresetDocument,
  PresetDocumentError,
  recoverStoredPresetCollection,
} from "./presetFile";

const PRESETS_STORAGE_KEY = "texture_genetics_v4_user_presets";
const LEGACY_PRESETS_STORAGE_KEYS = [
  "effect_gen_v4_user_presets",
  "effect_gen_v3_user_presets",
] as const;
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
  const stateRef = useRef(initialState);
  const onLoadPresetRef = useRef(onLoadPreset);
  const addToastRef = useRef(addToast);
  stateRef.current = initialState;
  onLoadPresetRef.current = onLoadPreset;
  addToastRef.current = addToast;

  useEffect(() => {
    const load = async () => {
      try {
        const currentPresets = await get<unknown>(PRESETS_STORAGE_KEY);
        let savedPresets = currentPresets;
        let legacyStorageKey: (typeof LEGACY_PRESETS_STORAGE_KEYS)[number] | undefined;

        if (savedPresets == null) {
          for (const key of LEGACY_PRESETS_STORAGE_KEYS) {
            const candidate = await get<unknown>(key);
            if (candidate != null) {
              savedPresets = candidate;
              legacyStorageKey = key;
              break;
            }
          }
        }
        if (savedPresets != null) {
          const recovered = recoverStoredPresetCollection(savedPresets);
          userPresetsRef.current = recovered.presets;
          setUserPresets(recovered.presets);
          if (recovered.rejectedCount > 0) {
            const loadedLabel = `${recovered.presets.length} saved preset${recovered.presets.length === 1 ? "" : "s"}`;
            const skippedLabel = `${recovered.rejectedCount} invalid preset${recovered.rejectedCount === 1 ? "" : "s"}`;
            addToastRef.current(
              "error",
              `Loaded ${loadedLabel}; skipped ${skippedLabel}. Original storage was left unchanged.`,
            );
          }
          if (legacyStorageKey && recovered.rejectedCount === 0) {
            try {
              await set(PRESETS_STORAGE_KEY, recovered.presets);
              await del(legacyStorageKey);
            } catch (migrationError) {
              console.warn("Preset storage migration deferred", migrationError);
              addToastRef.current(
                "info",
                "Saved presets loaded; storage migration will retry later",
              );
            }
          }
        }
      } catch (e) {
        console.error("Failed to load presets", e);
        addToastRef.current(
          "error",
          "Saved presets could not be loaded because their data is invalid",
        );
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
      const document = stateRef.current;
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
            ...document,
            imageAlpha: { ...document.imageAlpha, maskTexture: null },
            baseTexture: { ...document.baseTexture, texture: null },
            sticker: { ...document.sticker, texture: null },
            customModel: null,
          },
        };
        try {
          await persistMutation((current) => [...current, newPreset]);
          const droppedAssets =
            Boolean(document.baseTexture?.texture) ||
            Boolean(document.sticker?.texture) ||
            Boolean(document.imageAlpha?.maskTexture) ||
            Boolean(document.customModel);
          addToast(
            "success",
            droppedAssets
              ? `Preset "${normalizedName}" saved. Images and custom models are not stored in presets.`
              : `Preset "${normalizedName}" saved!`,
          );
          return newPreset.id;
        } catch (idbError) {
          console.error("IDB preset save error", idbError);
          addToast("error", "Preset could not be saved; no changes were applied");
        }
      } catch (e) {
        console.error("Failed to save preset", e);
        addToast("error", "Failed to save preset (Storage/JSON Error)");
      }
    },
    [persistMutation, addToast],
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
    try {
      const documentState = stateRef.current;
      const stored = userPresetsRef.current;
      const source =
        stored.length > 0
          ? stored
          : [
              {
                id: createPresetId(),
                name: "Current work",
                date: Date.now(),
                state: {
                  ...documentState,
                  imageAlpha: { ...documentState.imageAlpha, maskTexture: null },
                  baseTexture: { ...documentState.baseTexture, texture: null },
                  sticker: { ...documentState.sticker, texture: null },
                  customModel: null,
                },
              },
            ];
      const presetDocument = createPresetDocument(parsePresetDocument(source));
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(presetDocument, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "texture-genetics-presets.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      addToast("success", "Presets exported to JSON");
    } catch (e) {
      console.error("Failed to export presets", e);
      addToast("error", "Failed to export presets");
    }
  }, [addToast]);

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

  const loadPreset = useCallback((presetState: Partial<AppState>) => {
    onLoadPresetRef.current(presetState);
  }, []);

  const actions = useMemo(
    () => ({
      loadPreset,
      saveUserPreset,
      deleteUserPreset,
      exportPresets,
      importPresets,
    }),
    [loadPreset, saveUserPreset, deleteUserPreset, exportPresets, importPresets],
  );

  return { userPresets, actions };
};
