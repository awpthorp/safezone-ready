import { DEFAULT_PLACEMENT_IDS, SPEC_VERSION, getPlacement, listPlacements } from "./placements";
import type {
  Grade,
  OccupancyMap,
  PlacementId,
  PlacementScore,
  PlacementSpec,
  ScoreCreativeInput,
  ScoreReport,
} from "./types";

const OCCUPANCY_CAP = 70;
const ASPECT_CAP = 40;
const ASPECT_SCALE = 400;

export function gradeFromScore(score: number): Grade {
  if (score >= 85) {
    return "ready";
  }
  if (score >= 70) {
    return "caution";
  }
  return "at_risk";
}

export function aspectPenalty(actualRatio: number, placement: PlacementSpec): number {
  const delta = Math.abs(actualRatio - placement.aspectRatio);
  if (delta <= placement.aspectTolerance) {
    return 0;
  }
  return Math.min(ASPECT_CAP, ASPECT_SCALE * (delta - placement.aspectTolerance));
}

export function occupancyPenalty(occupancy: OccupancyMap, placement: PlacementSpec): number {
  const w = placement.weights;
  const raw =
    (occupancy.top ?? 0) * w.top +
    (occupancy.bottom ?? 0) * w.bottom +
    (occupancy.left ?? 0) * w.left +
    (occupancy.right ?? 0) * w.right +
    (occupancy.rail ?? 0) * w.rail;
  return Math.min(OCCUPANCY_CAP, raw * 100);
}

function clampScore(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)));
}

function hasOccupancy(occupancy: OccupancyMap | undefined): boolean {
  if (!occupancy) {
    return false;
  }
  return Object.values(occupancy).some((v) => typeof v === "number");
}

export function scorePlacement(
  width: number,
  height: number,
  placementId: PlacementId,
  occupancy?: OccupancyMap,
): PlacementScore {
  const placement = getPlacement(placementId);
  const actualRatio = width / height;
  const a = aspectPenalty(actualRatio, placement);
  const measured = hasOccupancy(occupancy);
  const o = measured ? occupancyPenalty(occupancy ?? {}, placement) : 0;
  const score = clampScore(100 - a - o);
  return {
    placementId,
    label: placement.label,
    score,
    grade: gradeFromScore(score),
    aspectPenalty: Math.round(a * 10) / 10,
    occupancyPenalty: Math.round(o * 10) / 10,
    aspectFit: a === 0,
    confidence: measured ? "high" : "low",
    occupancy: occupancy ?? {},
  };
}

export function scoreCreative(input: ScoreCreativeInput): ScoreReport {
  if (input.width <= 0 || input.height <= 0) {
    throw new Error("Image size must be positive");
  }

  const ids = input.placementIds?.length
    ? input.placementIds
    : DEFAULT_PLACEMENT_IDS.filter((id) => listPlacements().some((p) => p.id === id));

  const placements = ids.map((id) =>
    scorePlacement(input.width, input.height, id, input.occupancy?.[id]),
  );

  const fitting = placements.filter((placement) => placement.aspectFit);
  const pool = fitting.length ? fitting : placements;
  const overall = pool.length ? Math.min(...pool.map((p) => p.score)) : 0;

  return {
    specVersion: SPEC_VERSION,
    width: input.width,
    height: input.height,
    actualRatio: input.width / input.height,
    overall,
    grade: gradeFromScore(overall),
    placements,
  };
}
