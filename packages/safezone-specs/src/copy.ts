import type { OccupancyMap, PlacementId, PlacementScore, ScoreReport } from "./types";

const REGION_COPY: Record<string, string> = {
  bottom: "Text sits under the caption and buttons",
  rail: "Text sits behind the like and share buttons",
  top: "Logo or headline sits under the profile row",
  right: "Content is too close to the right-hand buttons",
  left: "Content is too close to the left edge",
};

const BUYER_PLACEMENT_LABEL: Record<PlacementId, string> = {
  combined: "Every app",
  meta_reels: "Instagram Reels",
  meta_stories: "Stories",
  meta_stories_disclaimer: "Stories disclaimer",
  meta_feed_4x5: "Feed 4:5",
  meta_feed_1x1: "Feed square",
  youtube_shorts: "YouTube Shorts",
  tiktok_infeed: "TikTok",
};

export function buyerPlacementLabel(id: PlacementId): string {
  return BUYER_PLACEMENT_LABEL[id] ?? id;
}

export function busiestRegion(occupancy: OccupancyMap): keyof typeof REGION_COPY | null {
  const ranked = (["bottom", "rail", "top", "right", "left"] as const)
    .map((id) => ({ id, v: occupancy[id] ?? 0 }))
    .sort((a, b) => b.v - a.v);
  const top = ranked[0];
  if (!top || top.v < 0.08) {
    return null;
  }
  return top.id;
}

/** One line a media buyer can act on. Never mention ink, chrome, occupancy, or spec versions. */
export function describePlacementIssue(score: PlacementScore): string {
  if (score.score >= 85) {
    return "Looks clear here";
  }
  if (!score.aspectFit && score.occupancyPenalty < 15) {
    return "Wrong shape for this app";
  }
  const region = busiestRegion(score.occupancy);
  if (region) {
    return REGION_COPY[region];
  }
  if (score.score >= 70) {
    return "A bit tight at the edges";
  }
  return "Something important sits in the covered area";
}

/** One line under the still. Names the app that will hide the offer. */
export function describeReportHint(report: ScoreReport): string {
  const named = report.placements.filter((p) => p.placementId !== "combined");
  const pool = named.length ? named : report.placements;
  const worst = [...pool].sort((a, b) => a.score - b.score)[0];
  if (!worst || worst.score >= 85) {
    return "Looks clear on this still. Preview it in the ads manager before you spend.";
  }
  const issue = describePlacementIssue(worst);
  return `${buyerPlacementLabel(worst.placementId)} will cover it. ${issue}.`;
}
