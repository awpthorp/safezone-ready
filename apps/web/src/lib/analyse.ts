import {
  DEFAULT_PLACEMENT_IDS,
  estimateOverlayOccupancy,
  getOverlay,
  scoreCreative,
  type OccupancyMap,
  type PlacementId,
  type ScoreReport,
} from "@safezone-ready/safezone-specs";
import { attachVideoForDecode, seekVideo, VIDEO_DECODE_ERROR } from "@/lib/media";

const MAX_SAMPLE = 360;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
const MAX_VIDEO_DURATION_S = 180;
const FRAME_FRACTIONS = [0, 0.25, 0.5, 0.75, 0.95];

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"]);
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".m4v"]);

export interface AnalysedCreative {
  report: ScoreReport;
  occupancy: Partial<Record<PlacementId, OccupancyMap>>;
}

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function isVideoFile(file: File): boolean {
  if (VIDEO_TYPES.has(file.type)) {
    return true;
  }
  return !file.type && VIDEO_EXT.has(fileExtension(file.name));
}

export function isImageFile(file: File): boolean {
  if (IMAGE_TYPES.has(file.type)) {
    return true;
  }
  return !file.type && IMAGE_EXT.has(fileExtension(file.name));
}

export function analyseImage(
  image: HTMLImageElement,
  placementIds: PlacementId[] = DEFAULT_PLACEMENT_IDS,
): AnalysedCreative {
  const occupancy = occupancyFromSource(image, image.width, image.height, placementIds);
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

export async function analyseVideo(
  video: HTMLVideoElement,
  placementIds: PlacementId[] = DEFAULT_PLACEMENT_IDS,
): Promise<AnalysedCreative> {
  const nativeWidth = video.videoWidth;
  const nativeHeight = video.videoHeight;
  if (!nativeWidth || !nativeHeight) {
    throw new Error(VIDEO_DECODE_ERROR);
  }

  const detach = await attachVideoForDecode(video);
  try {
    const frames: Partial<Record<PlacementId, OccupancyMap>>[] = [];
    for (const time of sampleTimes(video.duration)) {
      try {
        await seekVideo(video, time);
      } catch {
        continue;
      }
      frames.push(occupancyFromSource(video, nativeWidth, nativeHeight, placementIds));
    }
    if (frames.length === 0) {
      throw new Error(VIDEO_DECODE_ERROR);
    }

    const occupancy: Partial<Record<PlacementId, OccupancyMap>> = {};
    for (const id of placementIds) {
      occupancy[id] = mergeOccupancy(frames.map((frame) => frame[id] ?? {}));
    }

    return {
      occupancy,
      report: scoreCreative({
        width: nativeWidth,
        height: nativeHeight,
        occupancy,
        placementIds,
      }),
    };
  } finally {
    video.pause();
    detach();
  }
}

export function mergeOccupancy(maps: OccupancyMap[]): OccupancyMap {
  const out: OccupancyMap = {};
  for (const map of maps) {
    for (const [key, value] of Object.entries(map)) {
      if (typeof value !== "number") {
        continue;
      }
      out[key] = Math.max(out[key] ?? 0, value);
    }
  }
  return out;
}

function sampleTimes(duration: number): number[] {
  if (!Number.isFinite(duration) || duration < 1) {
    return [0];
  }
  return FRAME_FRACTIONS.map((fraction) => fraction * duration);
}

export function validateFile(file: File): string | null {
  const image = isImageFile(file);
  const video = isVideoFile(file);
  if (!image && !video) {
    return "Use a PNG, JPEG, WebP, MP4 or WebM.";
  }
  if (video && file.size > MAX_VIDEO_BYTES) {
    return "That file is over 40 MB. Compress it and try again.";
  }
  if (image && file.size > MAX_IMAGE_BYTES) {
    return "That file is over 20 MB. Compress it and try again.";
  }
  return null;
}

export function validateImageSize(width: number, height: number): string | null {
  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);
  if (shortEdge < 320) {
    return "That file is too small. Use at least 320 pixels on the short edge.";
  }
  if (longEdge > 8192) {
    return "That file is over 8192 pixels on the long edge.";
  }
  return null;
}

export function validateVideoMeta(video: HTMLVideoElement): string | null {
  const duration = video.duration;
  if (Number.isFinite(duration) && duration > MAX_VIDEO_DURATION_S) {
    return "That clip is over 3 minutes. Trim it and try again.";
  }
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    return VIDEO_DECODE_ERROR;
  }
  return validateImageSize(width, height);
}

function occupancyFromSource(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  placementIds: PlacementId[],
): Partial<Record<PlacementId, OccupancyMap>> {
  const scale = Math.min(1, MAX_SAMPLE / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Canvas is not available in this browser.");
  }
  ctx.drawImage(source, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height);
  const luma = { data: pixels.data, width, height, channels: 4 as const };

  const occupancy: Partial<Record<PlacementId, OccupancyMap>> = {};
  for (const id of placementIds) {
    const overlay = getOverlay(id, width, height);
    occupancy[id] = estimateOverlayOccupancy(luma, overlay);
  }
  return occupancy;
}
