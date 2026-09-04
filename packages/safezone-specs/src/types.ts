export type PlatformId = "meta" | "youtube" | "tiktok" | "combined";

export type PlacementId =
  | "meta_stories"
  | "meta_stories_disclaimer"
  | "meta_reels"
  | "meta_feed_1x1"
  | "meta_feed_4x5"
  | "youtube_shorts"
  | "tiktok_infeed"
  | "combined";

export type Grade = "ready" | "caution" | "at_risk";

export type RegionId = "top" | "bottom" | "left" | "right" | "rail";

export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface RailSpec {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RegionWeights {
  top: number;
  bottom: number;
  left: number;
  right: number;
  rail: number;
}

export interface PlacementSpec {
  id: PlacementId;
  label: string;
  platform: PlatformId;
  family: string;
  aspectRatio: number;
  aspectTolerance: number;
  recommendedWidth: number;
  recommendedHeight: number;
  margins: Margins;
  rails: RailSpec[];
  weights: RegionWeights;
  source: string;
  hiddenByDefault?: boolean;
}

export interface SpecPack {
  specVersion: string;
  disclaimer: string;
  notes: string;
  placements: PlacementSpec[];
}

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NormalisedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OverlayRegion {
  id: string;
  kind: RegionId;
  normalised: NormalisedRect;
  pixels: PixelRect;
}

export interface OverlaySpec {
  placement: PlacementSpec;
  canvasWidth: number;
  canvasHeight: number;
  safe: OverlayRegion;
  danger: OverlayRegion[];
}

export type OccupancyMap = Partial<Record<string, number>>;

export interface ScoreCreativeInput {
  width: number;
  height: number;
  occupancy?: Partial<Record<PlacementId, OccupancyMap>>;
  placementIds?: PlacementId[];
}

export interface PlacementScore {
  placementId: PlacementId;
  label: string;
  score: number;
  grade: Grade;
  aspectPenalty: number;
  occupancyPenalty: number;
  aspectFit: boolean;
  confidence: "low" | "high";
  occupancy: OccupancyMap;
}

export interface ScoreReport {
  specVersion: string;
  width: number;
  height: number;
  actualRatio: number;
  overall: number;
  grade: Grade;
  placements: PlacementScore[];
}

export interface LumaImage {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
  channels?: 1 | 3 | 4;
}
