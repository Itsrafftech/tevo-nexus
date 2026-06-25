export const allowedImageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const maxImageSizeBytes = 5 * 1024 * 1024;

export function getAssetBaseUrl() {
  return process.env.ASSET_BASE_URL ?? "http://localhost:3000/assets";
}

export function getLocalAssetRoot() {
  return process.env.LOCAL_ASSET_ROOT ?? "./uploads";
}

export function isAllowedImage(file: { type: string; size: number }) {
  return (
    allowedImageMimeTypes.includes(
      file.type as (typeof allowedImageMimeTypes)[number],
    ) && file.size <= maxImageSizeBytes
  );
}
