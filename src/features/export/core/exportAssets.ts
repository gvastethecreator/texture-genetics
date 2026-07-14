import * as THREE from "three";
import { AppState } from "../../../core/types/types";

interface ExportTextureResource {
  colorSpace: string;
  dispose: () => void;
}

type ExportTextureLoader<T extends ExportTextureResource> = (url: string) => Promise<T>;

interface ExportTextures<T extends ExportTextureResource> {
  maskTexture: T | null;
  baseTexture: T | null;
  stickerTexture: T | null;
  resources: T[];
}

const defaultTextureLoader: ExportTextureLoader<THREE.Texture> = (url) =>
  new THREE.TextureLoader().loadAsync(url);

export const loadRequiredExportTextures = async <T extends ExportTextureResource = THREE.Texture>(
  state: AppState,
  loadTexture: ExportTextureLoader<T> = defaultTextureLoader as unknown as ExportTextureLoader<T>,
): Promise<ExportTextures<T>> => {
  const requests: Array<{
    label: string;
    slot: "maskTexture" | "baseTexture" | "stickerTexture";
    url: string;
  }> = [];

  if (state.imageAlpha.maskEnabled && state.imageAlpha.maskTexture) {
    requests.push({
      label: "Alpha mask",
      slot: "maskTexture",
      url: state.imageAlpha.maskTexture,
    });
  }
  if (state.baseTexture.enabled && state.baseTexture.texture) {
    requests.push({
      label: "Base texture",
      slot: "baseTexture",
      url: state.baseTexture.texture,
    });
  }
  if (state.sticker.enabled && state.sticker.texture) {
    requests.push({ label: "Sticker texture", slot: "stickerTexture", url: state.sticker.texture });
  }

  const results = await Promise.allSettled(
    requests.map(async (request) => {
      const texture = await loadTexture(request.url);
      texture.colorSpace = THREE.SRGBColorSpace;
      return { ...request, texture };
    }),
  );
  const resources = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value.texture] : [],
  );
  const failedIndex = results.findIndex((result) => result.status === "rejected");
  if (failedIndex >= 0) {
    resources.forEach((texture) => texture.dispose());
    const failure = results[failedIndex] as PromiseRejectedResult;
    const reason =
      failure.reason instanceof Error ? failure.reason.message : String(failure.reason);
    throw new Error(`${requests[failedIndex].label} could not be loaded: ${reason}`);
  }

  const textures: ExportTextures<T> = {
    maskTexture: null,
    baseTexture: null,
    stickerTexture: null,
    resources,
  };
  results.forEach((result) => {
    if (result.status === "fulfilled") textures[result.value.slot] = result.value.texture;
  });
  return textures;
};
