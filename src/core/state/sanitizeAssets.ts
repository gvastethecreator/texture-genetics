import type { AppState } from "../types/types";

export const isTextureField = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

export const sanitizeTextureField = (value: unknown): string | null =>
  isTextureField(value) ? value : null;

type NestedAssetGroup = "sticker" | "baseTexture" | "imageAlpha";

const TEXTURE_FIELD_BY_GROUP = {
  sticker: "texture",
  baseTexture: "texture",
  imageAlpha: "maskTexture",
} as const satisfies Record<NestedAssetGroup, string>;

export const sanitizeNestedAssets = <K extends keyof AppState>(
  key: K,
  current: AppState[K],
  values: Partial<AppState[K]>,
): AppState[K] => {
  if (current === null || typeof current !== "object" || Array.isArray(current)) {
    return values as AppState[K];
  }

  const merged = { ...(current as object), ...(values as object) } as AppState[K];
  if (key === "sticker" || key === "baseTexture" || key === "imageAlpha") {
    const field = TEXTURE_FIELD_BY_GROUP[key as NestedAssetGroup];
    if (field in (values as object)) {
      const raw = (values as Record<string, unknown>)[field];
      (merged as Record<string, unknown>)[field] = sanitizeTextureField(raw);
    }
  }
  return merged;
};

export const sanitizeStateAssets = (state: AppState, partial: Partial<AppState>): AppState => {
  const next = { ...state, ...partial };
  if (partial.sticker) {
    next.sticker = sanitizeNestedAssets("sticker", state.sticker, partial.sticker);
  }
  if (partial.baseTexture) {
    next.baseTexture = sanitizeNestedAssets("baseTexture", state.baseTexture, partial.baseTexture);
  }
  if (partial.imageAlpha) {
    next.imageAlpha = sanitizeNestedAssets("imageAlpha", state.imageAlpha, partial.imageAlpha);
  }
  return next;
};
