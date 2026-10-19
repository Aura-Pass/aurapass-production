/**
 * Browser-side image compression for event banners.
 *
 * WhatsApp / Facebook silently ignore link-preview images over ~300 KB, and fall
 * back to the generic site image. Banners are uploaded straight to storage, so we
 * shrink them here: max 1400px on the long edge, JPEG, stepping quality down until
 * the file is small enough. If anything fails we return the original file.
 */
const MAX_EDGE = 1400;
const TARGET_BYTES = 260 * 1024;

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function compressImage(file: File): Promise<File> {
  try {
    if (typeof document === "undefined" || typeof createImageBitmap === "undefined") return file;
    if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
      return file;
    }

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff"; // flatten transparency (PNG) onto white
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    let quality = 0.85;
    let blob = await toBlob(canvas, quality);
    while (blob && blob.size > TARGET_BYTES && quality > 0.4) {
      quality -= 0.1;
      blob = await toBlob(canvas, quality);
    }
    if (!blob || blob.size >= file.size) return file; // never make it bigger

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
