import { AppState } from "../../core/types/types";

const isObjectUrl = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.startsWith("blob:");

const refCounts = new Map<string, number>();

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

export const retainObjectUrls = (urls: Iterable<string>): void => {
  for (const url of urls) {
    if (!isObjectUrl(url)) continue;
    refCounts.set(url, (refCounts.get(url) ?? 0) + 1);
  }
};

export const releaseObjectUrls = (
  urls: Iterable<string>,
  revoke: (url: string) => void = URL.revokeObjectURL,
): void => {
  for (const url of urls) {
    if (!isObjectUrl(url)) continue;
    const next = (refCounts.get(url) ?? 0) - 1;
    if (next <= 0) {
      refCounts.delete(url);
      revoke(url);
    } else {
      refCounts.set(url, next);
    }
  }
};

export const syncLiveObjectUrls = (
  previous: ReadonlySet<string>,
  current: ReadonlySet<string>,
  revoke: (url: string) => void = URL.revokeObjectURL,
): void => {
  const added: string[] = [];
  const removed: string[] = [];
  current.forEach((url) => {
    if (!previous.has(url)) added.push(url);
  });
  previous.forEach((url) => {
    if (!current.has(url)) removed.push(url);
  });
  retainObjectUrls(added);
  releaseObjectUrls(removed, revoke);
};

export const resetObjectUrlRegistry = (): void => {
  refCounts.clear();
};
