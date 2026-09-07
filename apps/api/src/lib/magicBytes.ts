export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_LONG_EDGE = 8192;
export const MIN_SHORT_EDGE = 320;

export const ALLOWED_IMAGE_MIMES = ["image/png", "image/jpeg", "image/webp"] as const;
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];

export interface SniffedImage {
  mime: AllowedImageMime;
  ext: "png" | "jpg" | "webp";
  width: number;
  height: number;
}

export function isAllowedImageMime(value: string): value is AllowedImageMime {
  return (ALLOWED_IMAGE_MIMES as readonly string[]).includes(value);
}

export function sniffImage(bytes: Uint8Array): SniffedImage | null {
  if (isPng(bytes)) {
    const size = pngSize(bytes);
    return size ? { mime: "image/png", ext: "png", ...size } : null;
  }
  if (isJpeg(bytes)) {
    const size = jpegSize(bytes);
    return size ? { mime: "image/jpeg", ext: "jpg", ...size } : null;
  }
  if (isWebp(bytes)) {
    const size = webpSize(bytes);
    return size ? { mime: "image/webp", ext: "webp", ...size } : null;
  }
  return null;
}

export function validateImageDimensions(width: number, height: number): string | null {
  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);
  if (shortEdge < MIN_SHORT_EDGE) {
    return "That still is too small. Use at least 320 pixels on the short edge.";
  }
  if (longEdge > MAX_LONG_EDGE) {
    return "That still is too large. Keep the long edge at 8192 pixels or less.";
  }
  return null;
}

function isPng(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isWebp(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

function pngSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) {
    return null;
  }
  const width = readU32be(bytes, 16);
  const height = readU32be(bytes, 20);
  if (width < 1 || height < 1) {
    return null;
  }
  return { width, height };
}

function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  let offset = 2;
  let guard = 0;
  while (offset + 8 < bytes.length && guard < 4096) {
    guard += 1;
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1] ?? 0;
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const len = ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0);
    if (len < 2) {
      return null;
    }
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      const height = ((bytes[offset + 5] ?? 0) << 8) | (bytes[offset + 6] ?? 0);
      const width = ((bytes[offset + 7] ?? 0) << 8) | (bytes[offset + 8] ?? 0);
      if (width < 1 || height < 1) {
        return null;
      }
      return { width, height };
    }
    offset += 2 + len;
  }
  return null;
}

function webpSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 30) {
    return null;
  }
  const tag = String.fromCharCode(bytes[12] ?? 0, bytes[13] ?? 0, bytes[14] ?? 0, bytes[15] ?? 0);
  if (tag === "VP8X") {
    const width = 1 + ((bytes[24] ?? 0) | ((bytes[25] ?? 0) << 8) | ((bytes[26] ?? 0) << 16));
    const height = 1 + ((bytes[27] ?? 0) | ((bytes[28] ?? 0) << 8) | ((bytes[29] ?? 0) << 16));
    return { width, height };
  }
  if (tag === "VP8 ") {
    const start = 20;
    if (bytes[start] === 0x9d && bytes[start + 1] === 0x01 && bytes[start + 2] === 0x2a) {
      const width = ((bytes[start + 3] ?? 0) | ((bytes[start + 4] ?? 0) << 8)) & 0x3fff;
      const height = ((bytes[start + 5] ?? 0) | ((bytes[start + 6] ?? 0) << 8)) & 0x3fff;
      if (width < 1 || height < 1) {
        return null;
      }
      return { width, height };
    }
  }
  if (tag === "VP8L" && bytes[20] === 0x2f) {
    const b0 = bytes[21] ?? 0;
    const b1 = bytes[22] ?? 0;
    const b2 = bytes[23] ?? 0;
    const b3 = bytes[24] ?? 0;
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }
  return null;
}

function readU32be(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) << 24) |
    ((bytes[offset + 1] ?? 0) << 16) |
    ((bytes[offset + 2] ?? 0) << 8) |
    (bytes[offset + 3] ?? 0)
  ) >>> 0;
}
