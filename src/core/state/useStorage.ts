import { useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "../types/types";
import { get, set, del } from "idb-keyval";

const STORAGE_KEY = "texture_genetics_v4_release";
// Version for future state migrations. Increment when state format changes
// and add migration logic in the load path to handle older saves
const STATE_VERSION = 4;
const ASSET_BUNDLE_VERSION = 1;
const ASSET_BUNDLE_PREFIX = "texture_genetics_v4_assets_";
const LEGACY_STORAGE_SOURCES = [
  { stateKey: "effect_gen_v4_release", assetPrefix: "effect_gen_v4_assets_" },
  { stateKey: "effect_gen_v3_release", assetPrefix: "effect_gen_v3_assets_" },
] as const;

type StoredStateSource = {
  savedState: string;
  stateKey: string;
  assetPrefix: string;
};

const getStoredStateSource = (): StoredStateSource | null => {
  const currentSavedState = localStorage.getItem(STORAGE_KEY);
  if (currentSavedState) {
    return {
      savedState: currentSavedState,
      stateKey: STORAGE_KEY,
      assetPrefix: ASSET_BUNDLE_PREFIX,
    };
  }

  for (const source of LEGACY_STORAGE_SOURCES) {
    const savedState = localStorage.getItem(source.stateKey);
    if (savedState) return { savedState, ...source };
  }

  return null;
};

// Keys of properties that contain heavy base64 strings
type HeavyAssetDescriptor = {
  key: string;
  path:
    | ["baseTexture", "texture"]
    | ["sticker", "texture"]
    | ["imageAlpha", "maskTexture"]
    | ["customModel"]
    | ["svg", "url"];
};

const HEAVY_ASSETS: readonly HeavyAssetDescriptor[] = [
  { path: ["baseTexture", "texture"], key: "asset_base_texture" },
  { path: ["sticker", "texture"], key: "asset_sticker_texture" },
  { path: ["imageAlpha", "maskTexture"], key: "asset_mask_texture" },
  { path: ["customModel"], key: "asset_custom_model" },
  { path: ["svg", "url"], key: "asset_svg" },
] as const;

type StoredAsset = string | Blob;

interface AssetBundle {
  version: typeof ASSET_BUNDLE_VERSION;
  assets: Record<string, StoredAsset>;
}

interface PersistedStateMetadata {
  _version?: number;
  _assetRevision?: string;
}

const applyHeavyAsset = (state: AppState, asset: HeavyAssetDescriptor, value: string) => {
  switch (asset.key) {
    case "asset_base_texture":
      state.baseTexture = { ...state.baseTexture, texture: value };
      return;
    case "asset_sticker_texture":
      state.sticker = { ...state.sticker, texture: value };
      return;
    case "asset_mask_texture":
      state.imageAlpha = { ...state.imageAlpha, maskTexture: value };
      return;
    case "asset_custom_model":
      state.customModel = value;
      return;
    case "asset_svg":
      state.svg = { ...state.svg, url: value };
      return;
  }
};

const getHeavyAssetValue = (state: AppState, asset: HeavyAssetDescriptor): string | null => {
  switch (asset.key) {
    case "asset_base_texture":
      return state.baseTexture.texture;
    case "asset_sticker_texture":
      return state.sticker.texture;
    case "asset_mask_texture":
      return state.imageAlpha.maskTexture;
    case "asset_custom_model":
      return state.customModel;
    case "asset_svg":
      return state.svg.url;
  }

  return null;
};

const isStoredAsset = (value: unknown): value is StoredAsset =>
  typeof value === "string" || (typeof Blob !== "undefined" && value instanceof Blob);

const isAssetBundle = (value: unknown): value is AssetBundle => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const bundle = value as Partial<AssetBundle>;
  if (bundle.version !== ASSET_BUNDLE_VERSION || !bundle.assets) return false;
  return Object.values(bundle.assets).every(isStoredAsset);
};

const materializeStoredAsset = (value: StoredAsset): string =>
  typeof value === "string" ? value : URL.createObjectURL(value);

const serializeAsset = async (value: string): Promise<StoredAsset> => {
  if (!value.startsWith("blob:")) return value;
  const response = await fetch(value);
  if (!response.ok) throw new Error(`asset blob could not be read (HTTP ${response.status})`);
  return response.blob();
};

const createRevision = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

// --- SAFETY UTILS ---

const isUnsafeObject = (value: any): boolean => {
  try {
    if (!value || typeof value !== "object") return false;
    if ("nodeType" in value) return true;
    if ("_reactInternals" in value) return true;
    if ("_reactFiber" in value) return true;
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
    if (typeof value !== "object" || value === null) return value;
    if (key.startsWith("_") || key === "ref" || key === "updater") return undefined;
    if (isUnsafeObject(value)) return undefined;
    if (seen.has(value)) return undefined;
    seen.add(value);
    return value;
  };
};

export const useStorage = (
  initialState: AppState,
  onLoaded: (s: AppState) => void,
  onWarning?: (message: string) => void,
) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const load = async () => {
      let mergedState = { ...initialState };
      let metadata: PersistedStateMetadata = {};
      const storedSource = getStoredStateSource();
      const savedState = storedSource?.savedState;
      const sourceAssetPrefix = storedSource?.assetPrefix ?? ASSET_BUNDLE_PREFIX;

      if (savedState) {
        try {
          const parsed = JSON.parse(savedState) as Partial<AppState> & PersistedStateMetadata;
          metadata = parsed;
          mergedState = { ...initialState, ...parsed };
          mergedState.postProcess = { ...initialState.postProcess, ...parsed.postProcess };
          mergedState.environment = { ...initialState.environment, ...parsed.environment };
          mergedState.settings = { ...initialState.settings, ...parsed.settings };
          mergedState.blending = { ...initialState.blending, ...parsed.blending };
          mergedState.sticker = { ...initialState.sticker, ...parsed.sticker };
          mergedState.svg = { ...initialState.svg, ...parsed.svg };
          mergedState.colorBalance = {
            ...initialState.colorBalance,
            ...parsed.colorBalance,
            shadows: { ...initialState.colorBalance.shadows, ...parsed.colorBalance?.shadows },
            midtones: { ...initialState.colorBalance.midtones, ...parsed.colorBalance?.midtones },
            highlights: {
              ...initialState.colorBalance.highlights,
              ...parsed.colorBalance?.highlights,
            },
          };
        } catch (error) {
          console.error("Stored editor state is invalid", error);
          onWarning?.(
            "Saved editor settings were invalid; defaults were loaded without deleting them.",
          );
        }
      }

      try {
        if (metadata._assetRevision) {
          const storedBundle = await get(`${sourceAssetPrefix}${metadata._assetRevision}`);
          if (!isAssetBundle(storedBundle)) throw new Error("asset bundle is missing or invalid");
          HEAVY_ASSETS.forEach((asset) => {
            const value = storedBundle.assets[asset.key];
            if (isStoredAsset(value))
              applyHeavyAsset(mergedState, asset, materializeStoredAsset(value));
          });
        } else {
          const legacyResults = await Promise.allSettled(
            HEAVY_ASSETS.map(async (asset) => ({ asset, value: await get(asset.key) })),
          );
          let failedAssets = 0;
          legacyResults.forEach((result) => {
            if (result.status === "rejected") {
              failedAssets += 1;
              return;
            }
            const { asset, value } = result.value;
            if (isStoredAsset(value)) {
              applyHeavyAsset(mergedState, asset, materializeStoredAsset(value));
            }
          });
          if (failedAssets > 0) {
            onWarning?.(
              `${failedAssets} saved asset${failedAssets === 1 ? "" : "s"} could not be restored; editor settings were preserved.`,
            );
          }
        }
      } catch (error) {
        console.error("Failed to restore saved assets", error);
        onWarning?.("Saved assets could not be restored; editor settings were preserved.");
      }

      if (mergedState.svg.url?.startsWith("blob:") && !metadata._assetRevision) {
        mergedState.svg = { ...mergedState.svg, url: null };
      }
      onLoaded(mergedState);
      setIsInitialized(true);
    };

    void load();
  }, []);

  const saveState = useCallback(
    (state: AppState): Promise<boolean> => {
      if (!isInitialized) return Promise.resolve(false);

      const operation = saveQueueRef.current.then(async () => {
        const revision = createRevision();
        const bundleKey = `${ASSET_BUNDLE_PREFIX}${revision}`;
        const assets: Record<string, StoredAsset> = {};

        for (const asset of HEAVY_ASSETS) {
          const value = getHeavyAssetValue(state, asset);
          if (value) assets[asset.key] = await serializeAsset(value);
        }

        const previousSource = getStoredStateSource();
        const previousState = previousSource?.savedState;
        const previousAssetPrefix = previousSource?.assetPrefix ?? ASSET_BUNDLE_PREFIX;
        let previousRevision: string | undefined;
        if (previousState) {
          try {
            previousRevision = (JSON.parse(previousState) as PersistedStateMetadata)._assetRevision;
          } catch {
            // Preserve invalid source data; the new revision becomes authoritative after commit.
          }
        }

        await set(bundleKey, { version: ASSET_BUNDLE_VERSION, assets } satisfies AssetBundle);

        const stateToSave = {
          ...state,
          _version: STATE_VERSION,
          _assetRevision: revision,
          imageAlpha: { ...state.imageAlpha, maskTexture: null },
          baseTexture: { ...state.baseTexture, texture: null },
          sticker: { ...state.sticker, texture: null },
          customModel: null,
          svg: { ...state.svg, url: null },
        };

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave, safeReplacer()));
          LEGACY_STORAGE_SOURCES.forEach(({ stateKey }) => localStorage.removeItem(stateKey));
        } catch (error) {
          await del(bundleKey).catch(() => undefined);
          throw error;
        }

        if (previousRevision && previousRevision !== revision) {
          await del(`${previousAssetPrefix}${previousRevision}`).catch((error) => {
            console.warn("Failed to remove superseded asset bundle", error);
          });
        }
      });

      saveQueueRef.current = operation.then(
        () => undefined,
        () => undefined,
      );
      return operation.then(
        () => true,
        (error) => {
          console.warn("State save failed", error);
          onWarning?.("Editor changes could not be saved; the previous saved version is intact.");
          return false;
        },
      );
    },
    [isInitialized, onWarning],
  );

  return { isInitialized, saveState };
};
