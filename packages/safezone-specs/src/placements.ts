import pack from "../data/placements.json";
import type {
  OverlayRegion,
  OverlaySpec,
  PlacementId,
  PlacementSpec,
  SpecPack,
} from "./types";

export const specPack = pack as SpecPack;

export const SPEC_VERSION = specPack.specVersion;

export const DEFAULT_PLACEMENT_IDS: PlacementId[] = [
  "combined",
  "meta_reels",
  "meta_stories",
  "meta_feed_4x5",
  "meta_feed_1x1",
  "youtube_shorts",
  "tiktok_infeed",
];

export function listPlacements(includeHidden = false): PlacementSpec[] {
  return specPack.placements.filter((p) => includeHidden || !p.hiddenByDefault);
}

export function getPlacement(id: PlacementId): PlacementSpec {
  const found = specPack.placements.find((p) => p.id === id);
  if (!found) {
    throw new Error(`Unknown placement: ${id}`);
  }
  return found;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function getOverlay(
  placementId: PlacementId,
  canvasWidth: number,
  canvasHeight: number,
): OverlaySpec {
  if (canvasWidth <= 0 || canvasHeight <= 0) {
    throw new Error("Canvas size must be positive");
  }
  const placement = getPlacement(placementId);
  const { top, bottom, left, right } = placement.margins;

  const safeNorm = {
    x: clamp01(left),
    y: clamp01(top),
    width: clamp01(1 - left - right),
    height: clamp01(1 - top - bottom),
  };

  const danger: OverlayRegion[] = [
    region("top", "top", { x: 0, y: 0, width: 1, height: top }, canvasWidth, canvasHeight),
    region(
      "bottom",
      "bottom",
      { x: 0, y: 1 - bottom, width: 1, height: bottom },
      canvasWidth,
      canvasHeight,
    ),
    region(
      "left",
      "left",
      { x: 0, y: top, width: left, height: clamp01(1 - top - bottom) },
      canvasWidth,
      canvasHeight,
    ),
    region(
      "right",
      "right",
      { x: 1 - right, y: top, width: right, height: clamp01(1 - top - bottom) },
      canvasWidth,
      canvasHeight,
    ),
  ];

  for (const rail of placement.rails) {
    danger.push(
      region(
        rail.id,
        "rail",
        { x: rail.x, y: rail.y, width: rail.width, height: rail.height },
        canvasWidth,
        canvasHeight,
      ),
    );
  }

  return {
    placement,
    canvasWidth,
    canvasHeight,
    safe: region("safe", "top", safeNorm, canvasWidth, canvasHeight),
    danger,
  };
}

function region(
  id: string,
  kind: OverlayRegion["kind"],
  normalised: OverlayRegion["normalised"],
  canvasWidth: number,
  canvasHeight: number,
): OverlayRegion {
  return {
    id,
    kind,
    normalised,
    pixels: {
      x: Math.round(normalised.x * canvasWidth),
      y: Math.round(normalised.y * canvasHeight),
      width: Math.round(normalised.width * canvasWidth),
      height: Math.round(normalised.height * canvasHeight),
    },
  };
}
