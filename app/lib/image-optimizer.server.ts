// app/lib/image-optimizer.server.ts
import "server-only";
import crypto from "node:crypto";
import { mkdir } from "node:fs/promises";

export const GRID_IMAGE_MAX_WIDTH = 800;
export const WEBP_QUALITY = 75;
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export type ImageOptimizationErrorCode =
  | "invalid-image"
  | "optimizer-unavailable"
  | "optimization-failed";

export class ImageOptimizationError extends Error {
  readonly code: ImageOptimizationErrorCode;
  readonly cause?: unknown;

  constructor(code: ImageOptimizationErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "ImageOptimizationError";
    this.code = code;
    this.cause = cause;
  }
}

export function fileSlug(input: string) {
  return input
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/Ä/g, "ae").replace(/Ö/g, "oe").replace(/Ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD").replace(/[^\w\s-]/g, "")
    .toLowerCase().trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function sanitizeFolderPath(folderRaw?: string | null, fallback = "products") {
  const input = (folderRaw || "").trim();
  const parts = input
    .split(/[\\/]+/)
    .map((part) => fileSlug(part))
    .filter(Boolean);

  if (parts.length === 0) return fallback;
  return parts.join("/");
}

export async function ensureDir(folderAbs: string) {
  await mkdir(folderAbs, { recursive: true });
}

export function makeOptimizedFilename({
  nameBase,
  bytes,
}: {
  nameBase: string;
  bytes: Buffer;
}) {
  const base = fileSlug(nameBase) || "bild";
  const hash = crypto.createHash("sha1").update(bytes).digest("hex").slice(0, 10);
  return `${base}-${Date.now()}-${hash}.webp`;
}

export async function optimizeToWebp(
  input: Buffer,
  opts: { width: number; quality: number },
) {
  let sharpFn: (typeof import("sharp"))["default"];
  try {
    const sharpImport = await import("sharp");
    sharpFn = sharpImport.default;
  } catch (error) {
    throw new ImageOptimizationError(
      "optimizer-unavailable",
      "Bild-Optimierung ist auf dem Server nicht verfuegbar.",
      error,
    );
  }

  try {
    return await sharpFn(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: opts.width, fit: "inside", withoutEnlargement: true })
      .webp({ quality: opts.quality, effort: 4 })
      .toBuffer();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/unsupported image|input (buffer|file)|invalid image|corrupt/i.test(message)) {
      throw new ImageOptimizationError(
        "invalid-image",
        "Datei ist kein gueltiges oder unterstuetztes Bildformat.",
        error,
      );
    }
    throw new ImageOptimizationError(
      "optimization-failed",
      "Bild konnte nicht optimiert werden.",
      error,
    );
  }
}
