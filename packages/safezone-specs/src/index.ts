export { specPack, SPEC_VERSION, DEFAULT_PLACEMENT_IDS, listPlacements, getPlacement, getOverlay } from "./placements";
export { scoreCreative, scorePlacement, gradeFromScore, aspectPenalty, occupancyPenalty } from "./scorer";
export { estimateRegionOccupancy, estimateOverlayOccupancy } from "./occupancy";
export { parsePlatformParam, parsePlatformSearch } from "./platform";
export type {
  PlatformId,
  PlacementId,
  Grade,
  RegionId,
  Margins,
  RailSpec,
  RegionWeights,
  PlacementSpec,
  SpecPack,
  PixelRect,
  NormalisedRect,
  OverlayRegion,
  OverlaySpec,
  OccupancyMap,
  ScoreCreativeInput,
  PlacementScore,
  ScoreReport,
  LumaImage,
} from "./types";
