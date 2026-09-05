import type { AppState } from "../types/types";
import { mergeEditorDocument } from "./mergeEditorDocument";
import { stripSessionUi } from "./sessionUi";

export const STORAGE_KEY = "texture_genetics_v4_release";
export const STATE_VERSION = 4;
export const ASSET_BUNDLE_VERSION = 1;
export const ASSET_BUNDLE_PREFIX = "texture_genetics_v4_assets_";
export const LEGACY_STORAGE_SOURCES = [
  { stateKey: "effect_gen_v4_release", assetPrefix: "effect_gen_v4_assets_" },
  { stateKey: "effect_gen_v3_release", assetPrefix: "effect_gen_v3_assets_" },
] as const;

export type HeavyAssetDescriptor = {
  key: string;
  path:
    | ["baseTexture", "texture"]
    | ["sticker", "texture"]
    | ["imageAlpha", "maskTexture"]
    | ["customModel"]
    | ["svg", "url"];
};

export const HEAVY_ASSETS: readonly HeavyAssetDescriptor[] = [
  { path: ["baseTexture", "texture"], key: "asset_base_texture" },
  { path: ["sticker", "texture"], key: "asset_sticker_texture" },
  { path: ["imageAlpha", "maskTexture"], key: "asset_mask_texture" },
  { path: ["customModel"], key: "asset_custom_model" },
  { path: ["svg", "url"], key: "asset_svg" },
] as const;

export type StoredAsset = string | Blob;

export interface AssetBundle {
  version: typeof ASSET_BUNDLE_VERSION;
  assets: Record<string, StoredAsset>;
}

export interface PersistedStateMetadata {
  _version?: number;
  _assetRevision?: string;
}

export type StoredStateSource = {
  savedState: string;
  stateKey: string;
  assetPrefix: string;
};

export const getHeavyAssetValue = (state: AppState, asset: HeavyAssetDescriptor): string | null => {
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

export const applyHeavyAsset = (state: AppState, asset: HeavyAssetDescriptor, value: string) => {
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
  }
};

export const assetFingerprint = (state: AppState): string =>
  HEAVY_ASSETS.map((asset) => getHeavyAssetValue(state, asset) ?? "").join("\u0000");

export const serializePersistedDocument = (
  state: AppState,
  revision: string,
): Record<string, unknown> => ({
  ...stripSessionUi(state),
  _version: STATE_VERSION,
  _assetRevision: revision,
  imageAlpha: { ...state.imageAlpha, maskTexture: null },
  baseTexture: { ...state.baseTexture, texture: null },
  sticker: { ...state.sticker, texture: null },
  customModel: null,
  svg: { ...state.svg, url: null },
});

export const parseStoredDocument = (
  initialState: AppState,
  raw: string,
): { document: AppState; metadata: PersistedStateMetadata } => {
  const parsed = JSON.parse(raw) as Partial<AppState> & PersistedStateMetadata;
  const metadata: PersistedStateMetadata = {
    _version: parsed._version,
    _assetRevision: parsed._assetRevision,
  };
  return {
    document: mergeEditorDocument(initialState, parsed, { preserveSessionUi: true }),
    metadata,
  };
};

export const getStoredStateSource = (
  storage: Pick<Storage, "getItem"> = localStorage,
): StoredStateSource | null => {
  const currentSavedState = storage.getItem(STORAGE_KEY);
  if (currentSavedState) {
    return {
      savedState: currentSavedState,
      stateKey: STORAGE_KEY,
      assetPrefix: ASSET_BUNDLE_PREFIX,
    };
  }

  for (const source of LEGACY_STORAGE_SOURCES) {
    const savedState = storage.getItem(source.stateKey);
    if (savedState) return { savedState, ...source };
  }

  return null;
};
