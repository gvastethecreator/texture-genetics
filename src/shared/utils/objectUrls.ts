import { AppState } from "../../core/types/types";

const isObjectUrl = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.startsWith("blob:");

export const collectStateObjectUrls = (state: AppState): Set<string> =>
  new Set(
    [
      state.baseTexture.texture,
      state.sticker.texture,
      state.imageAlpha.maskTexture,
      state.customModel,
      state.svg.url,
    ].filter(isObjectUrl),
  );

export const revokeReplacedObjectUrls = (
  previous: ReadonlySet<string>,
  current: ReadonlySet<string>,
  revoke: (url: string) => void = URL.revokeObjectURL,
): void => {
  previous.forEach((url) => {
    if (!current.has(url)) revoke(url);
  });
};
