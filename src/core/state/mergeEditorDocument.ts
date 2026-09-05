import type { AppState } from "../types/types";
import { createDefaultAppState } from "./defaultState";
import { sanitizeStateAssets } from "./sanitizeAssets";
import { SESSION_UI_KEYS, sessionUiFrom } from "./sessionUi";

const OBJECT_KEYS = [
  "params",
  "environment",
  "settings",
  "blending",
  "sticker",
  "svg",
  "text",
  "geometryConfig",
  "normalMap",
  "displacement",
  "ao",
  "tiling",
  "symmetry",
  "transform",
  "postProcess",
  "baseTexture",
  "imageAlpha",
  "spriteSheet",
  "mouse",
  "camera",
] as const satisfies readonly (keyof AppState)[];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const mergeObject = <T extends Record<string, unknown>>(base: T, patch: unknown): T => {
  if (!isPlainObject(patch)) return base;
  return { ...base, ...patch };
};

export const mergeEditorDocument = (
  base: AppState,
  patch: Partial<AppState>,
  options: { preserveSessionUi?: boolean } = {},
): AppState => {
  const preserveSessionUi = options.preserveSessionUi ?? true;
  const session = sessionUiFrom(base);
  const merged = sanitizeStateAssets({ ...base, ...patch }, patch);

  for (const key of OBJECT_KEYS) {
    if (key in patch) {
      const mergedRecord = merged as unknown as Record<string, unknown>;
      mergedRecord[key] = mergeObject(base[key] as unknown as Record<string, unknown>, patch[key]);
    }
  }

  merged.colorBalance = {
    ...base.colorBalance,
    ...patch.colorBalance,
    shadows: { ...base.colorBalance.shadows, ...patch.colorBalance?.shadows },
    midtones: { ...base.colorBalance.midtones, ...patch.colorBalance?.midtones },
    highlights: { ...base.colorBalance.highlights, ...patch.colorBalance?.highlights },
  };

  if (patch.params) {
    merged.params = {
      ...base.params,
      ...patch.params,
      palette: patch.params.palette?.length
        ? patch.params.palette.map((entry) => ({ ...entry }))
        : base.params.palette.map((entry) => ({ ...entry })),
    };
  }

  if (preserveSessionUi) {
    for (const key of SESSION_UI_KEYS) {
      merged[key] = session[key];
    }
  }

  return merged;
};

export const mergeEditorDocumentFromDefaults = (patch: Partial<AppState>): AppState =>
  mergeEditorDocument(createDefaultAppState(), patch, { preserveSessionUi: false });
