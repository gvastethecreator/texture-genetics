import { useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "../types/types";
import { get, set, del } from "idb-keyval";
import {
  ASSET_BUNDLE_PREFIX,
  ASSET_BUNDLE_VERSION,
  HEAVY_ASSETS,
  LEGACY_STORAGE_SOURCES,
  STORAGE_KEY,
  applyHeavyAsset,
  assetFingerprint,
  getHeavyAssetValue,
  getStoredStateSource,
  parseStoredDocument,
  serializePersistedDocument,
  type AssetBundle,
  type PersistedStateMetadata,
  type StoredAsset,
} from "./documentPersistence";

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

const isUnsafeObject = (value: object): boolean => {
  try {
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
  if (value !== null && typeof value === "object" && isUnsafeObject(value)) return undefined;
  return value;
};

export const safeReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: unknown) => {
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
  const assetFingerprintRef = useRef<string>("");
  const assetRevisionRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      let mergedState = { ...initialState };
      let metadata: PersistedStateMetadata = {};
      const storedSource = getStoredStateSource();
      const savedState = storedSource?.savedState;
      const sourceAssetPrefix = storedSource?.assetPrefix ?? ASSET_BUNDLE_PREFIX;

      if (savedState) {
        try {
          const parsed = parseStoredDocument(initialState, savedState);
          mergedState = parsed.document;
          metadata = parsed.metadata;
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
      assetFingerprintRef.current = assetFingerprint(mergedState);
      assetRevisionRef.current = metadata._assetRevision;
      onLoaded(mergedState);
      setIsInitialized(true);
    };

    void load();
  }, []);

  const saveState = useCallback(
    (state: AppState): Promise<boolean> => {
      if (!isInitialized) return Promise.resolve(false);

      const operation = saveQueueRef.current.then(async () => {
        const nextFingerprint = assetFingerprint(state);
        const previousSource = getStoredStateSource();
        const previousState = previousSource?.savedState;
        const previousAssetPrefix = previousSource?.assetPrefix ?? ASSET_BUNDLE_PREFIX;
        let previousRevision: string | undefined = assetRevisionRef.current;
        if (previousState && !previousRevision) {
          try {
            previousRevision = (JSON.parse(previousState) as PersistedStateMetadata)._assetRevision;
          } catch {
            previousRevision = undefined;
          }
        }

        const migratingSource = Boolean(
          previousSource && previousSource.assetPrefix !== ASSET_BUNDLE_PREFIX,
        );
        const assetsUnchanged =
          nextFingerprint === assetFingerprintRef.current &&
          Boolean(previousRevision) &&
          !migratingSource;
        const revision = assetsUnchanged ? previousRevision! : createRevision();
        const bundleKey = `${ASSET_BUNDLE_PREFIX}${revision}`;

        if (!assetsUnchanged) {
          const assets: Record<string, StoredAsset> = {};
          for (const asset of HEAVY_ASSETS) {
            const value = getHeavyAssetValue(state, asset);
            if (value) assets[asset.key] = await serializeAsset(value);
          }
          await set(bundleKey, { version: ASSET_BUNDLE_VERSION, assets } satisfies AssetBundle);
        }

        const stateToSave = serializePersistedDocument(state, revision);

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave, safeReplacer()));
          LEGACY_STORAGE_SOURCES.forEach(({ stateKey }) => localStorage.removeItem(stateKey));
        } catch (error) {
          if (!assetsUnchanged) await del(bundleKey).catch(() => undefined);
          throw error;
        }

        assetFingerprintRef.current = nextFingerprint;
        assetRevisionRef.current = revision;

        if (!assetsUnchanged && previousRevision && previousRevision !== revision) {
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
