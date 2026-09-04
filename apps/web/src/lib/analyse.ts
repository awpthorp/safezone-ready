import {
  DEFAULT_PLACEMENT_IDS,
  estimateOverlayOccupancy,
  getOverlay,
  scoreCreative,
  type OccupancyMap,
  type PlacementId,
  type ScoreReport,
} from "@safezone-ready/safezone-specs";

const MAX_SAMPLE = 360;

export interface AnalysedCreative {
  report: ScoreReport;
  occupancy: Partial<Record<PlacementId, OccupancyMap>>;
}

export function analyseImage(
  image: HTMLImageElement,
  placementIds: PlacementId[] = DEFAULT_PLACEMENT_IDS,
): AnalysedCreative {
  const scale = Math.min(1, MAX_SAMPLE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Canvas is not available in this browser.");
  }
  ctx.drawImage(image, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height);
  const luma = { data: pixels.data, width, height, channels: 4 as const };

  const occupancy: Partial<Record<PlacementId, OccupancyMap>> = {};
  for (const id of placementIds) {
    const overlay = getOverlay(id, width, height);
    occupancy[id] = estimateOverlayOccupancy(luma, overlay);
  }

  return {
    occupancy,
    report: scoreCreative({
      width: image.width,
      height: image.height,
      occupancy,
      placementIds,
    }),
  };
}

export function validateFile(file: File): string | null {
  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.type)) {
    return "Images only for now: PNG, JPEG, or WebP. Video is not supported yet.";
  }
  if (file.size > 20 * 1024 * 1024) {
    return "That file is over 20 MB. Compress it and try again.";
  }
  return null;
}

export function validateImageSize(width: number, height: number): string | null {
  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);
  if (shortEdge < 320) {
    return "That image is too small. Use at least 320 pixels on the short edge.";
  }
  if (longEdge > 8192) {
    return "That image is over 8192 pixels on the long edge.";
  }
  return null;
}
