import { describe, expect, it } from "vitest";
import {
  describePlacementIssue,
  describeReportHint,
  estimateOverlayOccupancy,
  estimateRegionOccupancy,
  getOverlay,
  gradeFromScore,
  parsePlatformSearch,
  scoreCreative,
  scorePlacement,
} from "../src/index";

describe("scoreCreative", () => {
  it("scores a clean 9:16 still highly when occupancy is empty", () => {
    const report = scoreCreative({
      width: 1080,
      height: 1920,
      occupancy: {
        meta_reels: { top: 0, bottom: 0, left: 0, right: 0, rail: 0 },
      },
      placementIds: ["meta_reels"],
    });
    expect(report.overall).toBe(100);
    expect(report.grade).toBe("ready");
    expect(report.placements[0]?.confidence).toBe("high");
    expect(report.placements[0]?.aspectFit).toBe(true);
  });

  it("marks aspect-only reports as low confidence", () => {
    const report = scoreCreative({
      width: 1080,
      height: 1920,
      placementIds: ["meta_reels"],
    });
    expect(report.overall).toBe(100);
    expect(report.placements[0]?.confidence).toBe("low");
  });

  it("penalises offer text sitting in the Reels bottom band", () => {
    const clean = scorePlacement(1080, 1920, "meta_reels", {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });
    const crowded = scorePlacement(1080, 1920, "meta_reels", {
      top: 0,
      bottom: 0.8,
      left: 0,
      right: 0,
    });
    expect(crowded.score).toBeLessThan(clean.score);
    expect(crowded.score).toBeLessThan(70);
    expect(crowded.grade).toBe("at_risk");
  });

  it("applies an aspect-ratio penalty to a landscape still on Shorts", () => {
    const report = scoreCreative({
      width: 1920,
      height: 1080,
      occupancy: {
        youtube_shorts: { top: 0, bottom: 0, left: 0, right: 0 },
      },
      placementIds: ["youtube_shorts"],
    });
    expect(report.placements[0]?.aspectFit).toBe(false);
    expect(report.overall).toBeLessThan(70);
  });

  it("does not let Feed shape drag down a 9:16 still", () => {
    const report = scoreCreative({
      width: 1080,
      height: 1920,
      occupancy: {
        combined: { top: 0, bottom: 0, left: 0, right: 0, rail: 0 },
        meta_reels: { top: 0, bottom: 0, left: 0, right: 0, rail: 0 },
        meta_stories: { top: 0, bottom: 0, left: 0, right: 0, rail: 0 },
        meta_feed_4x5: { top: 0, bottom: 0, left: 0, right: 0, rail: 0 },
        meta_feed_1x1: { top: 0, bottom: 0, left: 0, right: 0, rail: 0 },
        youtube_shorts: { top: 0, bottom: 0, left: 0, right: 0, rail: 0 },
        tiktok_infeed: { top: 0, bottom: 0, left: 0, right: 0, rail: 0 },
      },
    });
    const feed = report.placements.find((p) => p.placementId === "meta_feed_1x1");
    expect(feed?.aspectFit).toBe(false);
    expect(feed?.score).toBeLessThan(85);
    expect(report.overall).toBe(100);
    expect(report.grade).toBe("ready");
  });

  it("uses the minimum placement score as overall", () => {
    const report = scoreCreative({
      width: 1080,
      height: 1920,
      occupancy: {
        meta_reels: { top: 0, bottom: 0, left: 0, right: 0 },
        tiktok_infeed: { top: 0, bottom: 0.9, left: 0, right: 0, rail: 0.5 },
      },
      placementIds: ["meta_reels", "tiktok_infeed"],
    });
    const reels = report.placements.find((p) => p.placementId === "meta_reels");
    const tiktok = report.placements.find((p) => p.placementId === "tiktok_infeed");
    expect(report.overall).toBe(tiktok?.score);
    expect(report.overall).toBeLessThan(reels?.score ?? 0);
  });

  it("grades the documented thresholds", () => {
    expect(gradeFromScore(85)).toBe("ready");
    expect(gradeFromScore(84)).toBe("caution");
    expect(gradeFromScore(70)).toBe("caution");
    expect(gradeFromScore(69)).toBe("at_risk");
  });

  it("rejects non-positive dimensions", () => {
    expect(() => scoreCreative({ width: 0, height: 100 })).toThrow(/positive/);
  });
});

describe("platform deep link", () => {
  it("maps metasafezone ?platform=meta to Meta Reels", () => {
    expect(parsePlatformSearch("?platform=meta")).toBe("meta_reels");
    expect(parsePlatformSearch("platform=stories")).toBe("meta_stories");
    expect(parsePlatformSearch("?platform=youtube")).toBe("youtube_shorts");
    expect(parsePlatformSearch("")).toBe("combined");
  });
});

describe("buyer-facing copy", () => {
  it("names the covered area instead of printing a penalty", () => {
    const crowded = scorePlacement(1080, 1920, "meta_reels", {
      top: 0,
      bottom: 0.8,
      left: 0,
      right: 0,
    });
    expect(describePlacementIssue(crowded)).toBe("Text sits under the caption and buttons");
    expect(describePlacementIssue(crowded)).not.toMatch(/ink|chrome|occupancy/i);
  });

  it("says the still is clear when the score is high", () => {
    const clean = scorePlacement(1080, 1920, "meta_reels", {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });
    expect(describePlacementIssue(clean)).toBe("Looks clear here");
  });

  it("names the app a buyer would recognise", () => {
    const report = scoreCreative({
      width: 1080,
      height: 1920,
      occupancy: {
        combined: { top: 0, bottom: 0.8, left: 0, right: 0, rail: 0 },
        meta_reels: { top: 0, bottom: 0.8, left: 0, right: 0, rail: 0 },
        tiktok_infeed: { top: 0, bottom: 0.1, left: 0, right: 0, rail: 0 },
      },
      placementIds: ["combined", "meta_reels", "tiktok_infeed"],
    });
    const hint = describeReportHint(report);
    expect(hint).toMatch(/Instagram Reels will cover it/);
    expect(hint).toMatch(/caption and buttons/);
    expect(hint).not.toMatch(/ink|chrome|occupancy|strictest|guardrail/i);
  });
});

describe("occupancy heuristic", () => {
  it("treats a flat field as empty and a high-contrast block as ink", () => {
    const width = 40;
    const height = 40;
    const flat = new Uint8ClampedArray(width * height).fill(40);
    const busy = new Uint8ClampedArray(width * height).fill(40);
    for (let y = 8; y < 32; y += 1) {
      for (let x = 8; x < 32; x += 1) {
        busy[y * width + x] = (x + y) % 2 === 0 ? 255 : 0;
      }
    }
    const rect = { x: 8, y: 8, width: 24, height: 24 };
    const empty = estimateRegionOccupancy({ data: flat, width, height, channels: 1 }, rect);
    const ink = estimateRegionOccupancy({ data: busy, width, height, channels: 1 }, rect);
    expect(empty).toBeLessThan(0.15);
    expect(ink).toBeGreaterThan(0.5);
  });

  it("does not mark a 9:16 still Ready when a headline sits in the Reels caption band", () => {
    const width = 108;
    const height = 192;
    const data = new Uint8ClampedArray(width * height).fill(22);
    const y0 = Math.round(height * 0.82);
    const y1 = Math.round(height * 0.9);
    const x0 = Math.round(width * 0.18);
    const x1 = Math.round(width * 0.82);
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        data[y * width + x] = 240;
      }
    }
    const overlay = getOverlay("meta_reels", width, height);
    const occupancy = estimateOverlayOccupancy({ data, width, height, channels: 1 }, overlay);
    const scored = scorePlacement(1080, 1920, "meta_reels", occupancy);
    expect(occupancy.bottom ?? 0).toBeGreaterThan(0.3);
    expect(scored.score).toBeLessThan(70);
    expect(scored.grade).toBe("at_risk");
    expect(describePlacementIssue(scored)).toBe("Text sits under the caption and buttons");
  });
});
