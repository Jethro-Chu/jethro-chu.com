import type * as Phaser from "phaser";

export const ASSET_TIMEOUT_MS = 3500;

export interface VillageAsset {
  key: string;
  url: string;
  required?: boolean;
  frameConfig?: { frameWidth: number; frameHeight: number };
}

/** Observe Phaser's real load/decode results, including decode-only failures. */
export function queueVillageAssets(scene: Phaser.Scene, assets: VillageAsset[]) {
  return Promise.allSettled(assets.map((asset) => {
    let cleanup = () => {};
    return new Promise<void>((resolve, reject) => {
      const complete = (key: string) => {
        if (key === asset.key) resolve();
      };
      const failed = (file: Phaser.Loader.File) => {
        if (file.key === asset.key) reject(new Error(`Could not load ${asset.url}`));
      };
      // Phaser does not emit loaderror for image decoding failures.
      const processed = () => {
        if (scene.textures.exists(asset.key)) resolve();
        else reject(new Error(`Could not decode ${asset.url}`));
      };
      const cancelled = () => reject(new DOMException("Village unmounted", "AbortError"));
      const timeout = window.setTimeout(() => {
        reject(new Error(`Asset timed out: ${asset.url}`));
      }, ASSET_TIMEOUT_MS + 500);
      cleanup = () => {
        clearTimeout(timeout);
        scene.load.off("filecomplete", complete);
        scene.load.off("loaderror", failed);
        scene.load.off("complete", processed);
        scene.events.off("shutdown", cancelled);
        scene.events.off("destroy", cancelled);
      };
      scene.load.on("filecomplete", complete);
      scene.load.on("loaderror", failed);
      scene.load.once("complete", processed);
      scene.events.once("shutdown", cancelled);
      scene.events.once("destroy", cancelled);

      // Phaser's per-file defaults override the global loader timeout with 0.
      const xhrSettings = { timeout: ASSET_TIMEOUT_MS, responseType: "blob" as const };
      if (asset.frameConfig) {
        scene.load.spritesheet(asset.key, asset.url, asset.frameConfig, xhrSettings);
      } else {
        scene.load.image(asset.key, asset.url, xhrSettings);
      }
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.warn(`[village] Failed asset: ${asset.url}`, error);
      }
      throw error;
    }).finally(() => cleanup());
  }));
}
