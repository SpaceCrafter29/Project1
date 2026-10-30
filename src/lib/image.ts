// Image helpers: downscale uploads before sending, crop marked regions.

export const MAX_SIDE = 1600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read the image'));
    img.src = src;
  });
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function toJpeg(source: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, maxSide: number, quality = 0.85) {
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

/** Reads an uploaded file and returns a downscaled JPEG data URL. */
export async function fileToDataUrl(file: Blob, maxSide = MAX_SIDE): Promise<string> {
  const img = await loadImage(await readAsDataUrl(file));
  return toJpeg(img, 0, 0, img.naturalWidth, img.naturalHeight, maxSide);
}

export async function downscale(dataUrl: string, maxSide: number): Promise<string> {
  const img = await loadImage(dataUrl);
  return toJpeg(img, 0, 0, img.naturalWidth, img.naturalHeight, maxSide);
}

export async function cropDataUrl(dataUrl: string, box: { x: number; y: number; w: number; h: number }): Promise<string> {
  const img = await loadImage(dataUrl);
  return toJpeg(img, box.x, box.y, box.w, box.h, 1200, 0.9);
}

/**
 * The box through the topmost, bottommost, leftmost and rightmost point of a stroke,
 * with a small margin, clamped to the image. The student can adjust it afterwards.
 */
export function strokeBox(
  stroke: { x: number; y: number }[],
  width: number,
  height: number,
): { x: number; y: number; w: number; h: number } {
  const xs = stroke.map((p) => p.x);
  const ys = stroke.map((p) => p.y);
  const margin = Math.max(8, 0.012 * Math.max(width, height));
  const x0 = Math.max(0, Math.min(...xs) - margin);
  const y0 = Math.max(0, Math.min(...ys) - margin);
  const x1 = Math.min(width, Math.max(...xs) + margin);
  const y1 = Math.min(height, Math.max(...ys) + margin);
  return { x: Math.round(x0), y: Math.round(y0), w: Math.max(1, Math.round(x1 - x0)), h: Math.max(1, Math.round(y1 - y0)) };
}
