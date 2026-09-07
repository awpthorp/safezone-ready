const ASSETS_PREFIX = "assets/";
const OUTPUTS_PREFIX = "outputs/";
const SEGMENT = /^[A-Za-z0-9_-]+$/;
const EXT = /^(png|jpg|jpeg|webp)$/;

function assertSafeSegment(value: string, label: string): string {
  if (!value || !SEGMENT.test(value)) {
    throw new Error(`invalid_r2_${label}`);
  }
  return value;
}

export function isAllowedR2Key(key: string): boolean {
  if (!key.startsWith(ASSETS_PREFIX) && !key.startsWith(OUTPUTS_PREFIX)) {
    return false;
  }
  if (key.includes("..") || key.includes("//") || key.startsWith("/") || key.includes("\\")) {
    return false;
  }
  return true;
}

export function assertAllowedR2Key(key: string): string {
  if (!isAllowedR2Key(key)) {
    throw new Error("invalid_r2_key");
  }
  return key;
}

export function assetKey(userId: string, id: string, ext: string): string {
  const safeExt = ext.toLowerCase();
  if (!EXT.test(safeExt)) {
    throw new Error("invalid_r2_ext");
  }
  const normalised = safeExt === "jpeg" ? "jpg" : safeExt;
  return `${ASSETS_PREFIX}${assertSafeSegment(userId, "user")}/${assertSafeSegment(id, "id")}.${normalised}`;
}

export function outputKey(userId: string, jobId: string): string {
  return `${OUTPUTS_PREFIX}${assertSafeSegment(userId, "user")}/${assertSafeSegment(jobId, "job")}.png`;
}
