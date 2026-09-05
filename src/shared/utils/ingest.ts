import { GeometryType, type AppState } from "../../core/types/types";
import { classifyUserFile, type IngestKind } from "./fileLoaders";

export const ACCEPTED_FILE_KINDS = "JSON, images, models, or SVG";

export type IngestTarget = "auto" | "base" | "sticker" | "mask";

export type IngestToast = { type: "success" | "error" | "info"; message: string };

export type IngestOutcome =
  | {
      ok: true;
      kind: IngestKind;
      patch: Partial<AppState>;
      objectUrl?: string;
      toast: IngestToast;
    }
  | {
      ok: false;
      kind: IngestKind;
      patch: null;
      objectUrl?: undefined;
      toast: IngestToast;
    };

const createAssetUrl = (file: File, createObjectURL: (blob: Blob) => string): string =>
  createObjectURL(file);

export const ingestUserFile = (
  file: File,
  current: AppState,
  options: {
    target?: IngestTarget;
    createObjectURL?: (blob: Blob) => string;
  } = {},
): IngestOutcome => {
  const kind = classifyUserFile(file);
  const createObjectURL = options.createObjectURL ?? URL.createObjectURL;
  const target = options.target ?? "auto";

  if (kind === "unknown") {
    return {
      ok: false,
      kind,
      patch: null,
      toast: {
        type: "error",
        message: `Unsupported file type: ${file.name}. Accepted: ${ACCEPTED_FILE_KINDS}.`,
      },
    };
  }

  if (kind === "json") {
    return {
      ok: true,
      kind,
      patch: {},
      toast: { type: "info", message: "Preset file ready to import" },
    };
  }

  const url = createAssetUrl(file, createObjectURL);

  if (kind === "model") {
    return {
      ok: true,
      kind,
      objectUrl: url,
      patch: { geometry: GeometryType.CUSTOM, customModel: url },
      toast: { type: "success", message: "Custom model loaded" },
    };
  }

  if (kind === "svg") {
    return {
      ok: true,
      kind,
      objectUrl: url,
      patch: { geometry: GeometryType.SVG, svg: { ...current.svg, url } },
      toast: { type: "success", message: "SVG shape loaded" },
    };
  }

  if (target === "sticker") {
    return {
      ok: true,
      kind,
      objectUrl: url,
      patch: { sticker: { ...current.sticker, texture: url, enabled: true } },
      toast: { type: "success", message: "Sticker loaded" },
    };
  }

  if (target === "mask") {
    return {
      ok: true,
      kind,
      objectUrl: url,
      patch: { imageAlpha: { ...current.imageAlpha, maskTexture: url, maskEnabled: true } },
      toast: { type: "success", message: "Mask loaded" },
    };
  }

  return {
    ok: true,
    kind,
    objectUrl: url,
    patch: {
      baseTexture: {
        ...current.baseTexture,
        enabled: true,
        texture: url,
      },
    },
    toast: { type: "success", message: "Base texture loaded" },
  };
};
