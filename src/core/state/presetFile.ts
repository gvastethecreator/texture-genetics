import { DEFAULTS } from "../constants";
import {
  AppState,
  BaseEffectType,
  BlendMode,
  GeometryType,
  MouseInteractionType,
  PreviewAnimation,
  TextureType,
  UserPreset,
  ViewMode,
  WaveType,
} from "../types/types";
import { DEFAULT_APP_STATE } from "./defaultState";

const PRESET_DOCUMENT_FORMAT = "texture-genetics-presets";
const LEGACY_PRESET_DOCUMENT_FORMATS = new Set(["effecttexturegen-presets"]);
const PRESET_DOCUMENT_VERSION = 1;

const MAX_PRESETS_PER_DOCUMENT = 500;
const MAX_ID_LENGTH = 128;
const MAX_NAME_LENGTH = 120;
const MAX_STRING_LENGTH = 4096;
const MAX_ASSET_STRING_LENGTH = 1_000_000;
const MAX_PARAM_ANIMATIONS = 32;

const PRESET_STATE_KEYS = [
  "resolution",
  "textureType",
  "geometryConfig",
  "animate",
  "tilingPreview",
  "tileMode",
  "gridOverlay",
  "params",
  "paramAnimations",
  "blending",
  "baseTexture",
  "sticker",
  "transform",
  "symmetry",
  "tiling",
  "postProcess",
  "normalMap",
  "displacement",
  "ao",
  "colorBalance",
  "imageAlpha",
  "spriteSheet",
  "mouse",
  "environment",
  "svg",
  "text",
] as const satisfies readonly (keyof AppState)[];

const ANIMATABLE_PARAM_PATTERN =
  /^(scale|intensity|speed|factor|distortion|detail|seed|p(?:[1-9]|1[0-5]))$/;

const STRING_ENUMS: ReadonlyArray<readonly [suffix: string, values: ReadonlySet<string>]> = [
  [".textureType", new Set(Object.values(TextureType))],
  [".blending.type", new Set(Object.values(TextureType))],
  [".geometry", new Set(Object.values(GeometryType))],
];
const WAVE_TYPES = new Set<string>(Object.values(WaveType));

const NUMBER_ENUMS: ReadonlyArray<readonly [suffix: string, values: ReadonlySet<number>]> = [
  [".viewMode", new Set(Object.values(ViewMode).filter((value) => typeof value === "number"))],
  [
    ".blending.mode",
    new Set(Object.values(BlendMode).filter((value) => typeof value === "number")),
  ],
  [
    ".baseTexture.blendMode",
    new Set(Object.values(BlendMode).filter((value) => typeof value === "number")),
  ],
  [
    ".baseTexture.effectType",
    new Set(Object.values(BaseEffectType).filter((value) => typeof value === "number")),
  ],
  [
    ".sticker.blendMode",
    new Set(Object.values(BlendMode).filter((value) => typeof value === "number")),
  ],
  [
    ".mouse.type",
    new Set(Object.values(MouseInteractionType).filter((value) => typeof value === "number")),
  ],
  [
    ".environment.animation",
    new Set(Object.values(PreviewAnimation).filter((value) => typeof value === "number")),
  ],
];

interface NumberConstraint {
  suffix: string;
  min: number;
  max: number;
  integer?: boolean;
}

const NUMBER_CONSTRAINTS: readonly NumberConstraint[] = [
  { suffix: ".resolution", min: 16, max: 4096, integer: true },
  { suffix: ".geometryConfig.bevelSegments", min: 1, max: 10, integer: true },
  { suffix: ".geometryConfig.smoothness", min: 8, max: 128, integer: true },
  { suffix: ".symmetry.segments", min: 2, max: 16, integer: true },
  { suffix: ".spriteSheet.columns", min: 1, max: 16, integer: true },
  { suffix: ".spriteSheet.rows", min: 1, max: 16, integer: true },
  { suffix: ".spriteSheet.totalFrames", min: 1, max: 64, integer: true },
  { suffix: ".spriteSheet.duration", min: 0.1, max: 60 },
  { suffix: ".environment.particleCount", min: 0, max: 2000, integer: true },
  { suffix: ".text.curveSegments", min: 1, max: 128, integer: true },
  { suffix: ".postProcess.toonLevels", min: 2, max: 32, integer: true },
  { suffix: ".postProcess.posterizeLevels", min: 2, max: 32, integer: true },
  { suffix: ".postProcess.pixelDensity", min: 1, max: 512, integer: true },
  { suffix: ".date", min: 0, max: Number.MAX_SAFE_INTEGER, integer: true },
];

const MAX_ABSOLUTE_PRESET_NUMBER = 1_000_000;

type UnknownRecord = Record<string, unknown>;

export interface PresetDocumentV1 {
  format: typeof PRESET_DOCUMENT_FORMAT;
  version: typeof PRESET_DOCUMENT_VERSION;
  presets: UserPreset[];
}

export interface PresetRecoveryResult {
  presets: UserPreset[];
  rejectedCount: number;
}

export class PresetDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PresetDocumentError";
  }
}

const isPlainRecord = (value: unknown): value is UnknownRecord => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const hasOwn = (value: UnknownRecord, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

function fail(path: string, expectation: string): never {
  throw new PresetDocumentError(`${path} ${expectation}`);
}

const enumValuesForPath = <T>(
  path: string,
  definitions: ReadonlyArray<readonly [suffix: string, values: ReadonlySet<T>]>,
): ReadonlySet<T> | undefined => definitions.find(([suffix]) => path.endsWith(suffix))?.[1];

const sanitizeString = (value: unknown, path: string, maxLength = MAX_STRING_LENGTH): string => {
  if (typeof value !== "string") fail(path, "must be a string");
  if (value.length > maxLength) fail(path, `must contain at most ${maxLength} characters`);

  const allowedValues =
    path.includes(".paramAnimations.") && path.endsWith(".type")
      ? WAVE_TYPES
      : enumValuesForPath(path, STRING_ENUMS);
  if (allowedValues && !allowedValues.has(value)) fail(path, "contains an unsupported value");
  return value;
};

const sanitizeNumber = (value: unknown, path: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(path, "must be a finite number");
  }

  const allowedValues = enumValuesForPath(path, NUMBER_ENUMS);
  if (allowedValues && !allowedValues.has(value)) fail(path, "contains an unsupported value");

  const constraint = NUMBER_CONSTRAINTS.find(({ suffix }) => path.endsWith(suffix));
  if (constraint) {
    if (constraint.integer && !Number.isInteger(value)) fail(path, "must be an integer");
    if (value < constraint.min) fail(path, `must be at least ${constraint.min}`);
    if (value > constraint.max) fail(path, `must be at most ${constraint.max}`);
  } else if (Math.abs(value) > MAX_ABSOLUTE_PRESET_NUMBER) {
    fail(path, `must be between -${MAX_ABSOLUTE_PRESET_NUMBER} and ${MAX_ABSOLUTE_PRESET_NUMBER}`);
  }
  return value;
};

const cloneTemplate = (template: unknown): unknown => {
  if (Array.isArray(template)) return template.map(cloneTemplate);
  if (isPlainRecord(template)) {
    const clone: UnknownRecord = {};
    for (const [key, value] of Object.entries(template)) clone[key] = cloneTemplate(value);
    return clone;
  }
  return template;
};

const sanitizeParamAnimations = (value: unknown, path: string): UnknownRecord => {
  if (!isPlainRecord(value)) fail(path, "must be an object");
  const entries = Object.entries(value);
  if (entries.length > MAX_PARAM_ANIMATIONS) {
    fail(path, `must contain at most ${MAX_PARAM_ANIMATIONS} entries`);
  }

  const animations: UnknownRecord = {};
  for (const [key, animation] of entries) {
    if (!ANIMATABLE_PARAM_PATTERN.test(key)) fail(`${path}.${key}`, "is not animatable");
    animations[key] = sanitizeByTemplate(animation, DEFAULTS.ANIMATION_DEFAULT, `${path}.${key}`);
  }
  return animations;
};

const sanitizeByTemplate = (value: unknown, template: unknown, path: string): unknown => {
  if (typeof template === "number") return sanitizeNumber(value, path);
  if (typeof template === "string") return sanitizeString(value, path);
  if (typeof template === "boolean") {
    if (typeof value !== "boolean") fail(path, "must be a boolean");
    return value;
  }

  if (template === null) {
    if (value === null) return null;
    return sanitizeString(value, path, MAX_ASSET_STRING_LENGTH);
  }

  if (Array.isArray(template)) {
    if (!Array.isArray(value)) fail(path, "must be an array");
    const maxLength = path.endsWith(".palette") ? 8 : template.length;
    if (value.length > maxLength) fail(path, `must contain at most ${maxLength} entries`);
    if (template.length === 0 && value.length > 0) fail(path, "does not accept entries");
    return value.map((entry, index) =>
      sanitizeByTemplate(
        entry,
        template[Math.min(index, template.length - 1)],
        `${path}[${index}]`,
      ),
    );
  }

  if (!isPlainRecord(template) || !isPlainRecord(value)) fail(path, "must be an object");
  if (path.endsWith(".paramAnimations")) return sanitizeParamAnimations(value, path);

  const normalized: UnknownRecord = {};
  for (const [key, defaultValue] of Object.entries(template)) {
    normalized[key] = hasOwn(value, key)
      ? sanitizeByTemplate(value[key], defaultValue, `${path}.${key}`)
      : cloneTemplate(defaultValue);
  }
  return normalized;
};

const sanitizePresetState = (value: unknown, path: string): Partial<AppState> => {
  if (!isPlainRecord(value)) fail(path, "must be an object");

  const normalized: UnknownRecord = {};
  for (const key of PRESET_STATE_KEYS) {
    if (!hasOwn(value, key)) continue;
    normalized[key] = sanitizeByTemplate(value[key], DEFAULT_APP_STATE[key], `${path}.${key}`);
  }

  if (Object.keys(normalized).length === 0)
    fail(path, "must contain at least one supported state field");

  if (isPlainRecord(normalized.baseTexture)) normalized.baseTexture.texture = null;
  if (isPlainRecord(normalized.sticker)) normalized.sticker.texture = null;
  if (isPlainRecord(normalized.imageAlpha)) normalized.imageAlpha.maskTexture = null;
  if (isPlainRecord(normalized.spriteSheet)) {
    const capacity =
      (normalized.spriteSheet.columns as number) * (normalized.spriteSheet.rows as number);
    if ((normalized.spriteSheet.totalFrames as number) > capacity) {
      fail(`${path}.spriteSheet.totalFrames`, `must not exceed columns x rows (${capacity})`);
    }
  }

  return normalized as Partial<AppState>;
};

const readRequiredText = (
  record: UnknownRecord,
  key: string,
  path: string,
  max: number,
): string => {
  const value = sanitizeString(record[key], `${path}.${key}`, max).trim();
  if (value.length === 0) fail(`${path}.${key}`, "must not be empty");
  return value;
};

const normalizePreset = (value: unknown, index: number): UserPreset => {
  const path = `presets[${index}]`;
  if (!isPlainRecord(value)) fail(path, "must be an object");

  const date = hasOwn(value, "date") ? sanitizeNumber(value.date, `${path}.date`) : 0;
  if (date < 0) fail(`${path}.date`, "must not be negative");

  return {
    id: readRequiredText(value, "id", path, MAX_ID_LENGTH),
    name: readRequiredText(value, "name", path, MAX_NAME_LENGTH),
    date,
    state: sanitizePresetState(value.state, `${path}.state`),
  };
};

const readPresetArray = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) fail("presets", "must be an array");
  if (value.length > MAX_PRESETS_PER_DOCUMENT) {
    fail("presets", `must contain at most ${MAX_PRESETS_PER_DOCUMENT} entries`);
  }
  return value;
};

const readPresetEntries = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return readPresetArray(value);
  }

  if (!isPlainRecord(value)) fail("document", "must be an object or legacy preset array");
  if (
    value.format !== PRESET_DOCUMENT_FORMAT &&
    !LEGACY_PRESET_DOCUMENT_FORMATS.has(String(value.format))
  ) {
    fail("document.format", "is not supported");
  }
  if (value.version !== PRESET_DOCUMENT_VERSION) fail("document.version", "is not supported");
  return readPresetArray(value.presets);
};

export const parsePresetDocument = (value: unknown): UserPreset[] => {
  const presets = readPresetEntries(value);

  const normalized = presets.map(normalizePreset);
  const firstIndexById = new Map<string, number>();
  normalized.forEach((preset, index) => {
    const firstIndex = firstIndexById.get(preset.id);
    if (firstIndex !== undefined) {
      fail(`presets[${index}].id`, `duplicates presets[${firstIndex}].id`);
    }
    firstIndexById.set(preset.id, index);
  });

  return normalized;
};

export const recoverStoredPresetCollection = (value: unknown): PresetRecoveryResult => {
  const entries = readPresetEntries(value);
  const presets: UserPreset[] = [];
  const ids = new Set<string>();
  let rejectedCount = 0;

  entries.forEach((entry, index) => {
    try {
      const preset = normalizePreset(entry, index);
      if (ids.has(preset.id)) {
        rejectedCount += 1;
        return;
      }
      ids.add(preset.id);
      presets.push(preset);
    } catch (error) {
      if (!(error instanceof PresetDocumentError)) throw error;
      rejectedCount += 1;
    }
  });

  return { presets, rejectedCount };
};

export const createPresetDocument = (presets: UserPreset[]): PresetDocumentV1 => ({
  format: PRESET_DOCUMENT_FORMAT,
  version: PRESET_DOCUMENT_VERSION,
  presets,
});
