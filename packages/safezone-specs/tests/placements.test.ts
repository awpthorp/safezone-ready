import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLACEMENT_IDS,
  SPEC_VERSION,
  getOverlay,
  getPlacement,
  listPlacements,
} from "../src/index";

describe("placement pack", () => {
  it("exposes a dated spec version", () => {
    expect(SPEC_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("lists default placements without the disclaimer preset", () => {
    const ids = listPlacements().map((p) => p.id);
    expect(ids).toContain("meta_reels");
    expect(ids).toContain("tiktok_infeed");
    expect(ids).toContain("youtube_shorts");
    expect(ids).toContain("combined");
    expect(ids).not.toContain("meta_stories_disclaimer");
    expect(listPlacements(true).map((p) => p.id)).toContain("meta_stories_disclaimer");
  });

  it("keeps default ids aligned with visible placements", () => {
    const visible = new Set(listPlacements().map((p) => p.id));
    for (const id of DEFAULT_PLACEMENT_IDS) {
      expect(visible.has(id)).toBe(true);
    }
  });

  it("uses practical Meta Reels margins of 14/30/6", () => {
    const reels = getPlacement("meta_reels");
    expect(reels.margins.top).toBeCloseTo(0.14);
    expect(reels.margins.bottom).toBeCloseTo(0.30);
    expect(reels.margins.left).toBeCloseTo(0.06);
    expect(reels.margins.right).toBeCloseTo(0.06);
  });

  it("builds pixel overlays on a 1080x1920 canvas", () => {
    const overlay = getOverlay("meta_reels", 1080, 1920);
    const top = overlay.danger.find((r) => r.id === "top");
    const bottom = overlay.danger.find((r) => r.id === "bottom");
    expect(top?.pixels.height).toBe(269);
    expect(bottom?.pixels.height).toBe(576);
    expect(overlay.safe.pixels.width).toBe(950);
    expect(overlay.safe.pixels.height).toBe(1075);
  });

  it("makes combined stricter than any single 9:16 edge", () => {
    const combined = getPlacement("combined");
    const reels = getPlacement("meta_reels");
    const shorts = getPlacement("youtube_shorts");
    const tiktok = getPlacement("tiktok_infeed");
    expect(combined.margins.top).toBeGreaterThanOrEqual(
      Math.max(reels.margins.top, shorts.margins.top, tiktok.margins.top),
    );
    expect(combined.margins.bottom).toBeGreaterThanOrEqual(
      Math.max(reels.margins.bottom, shorts.margins.bottom, tiktok.margins.bottom),
    );
    expect(combined.margins.left).toBeGreaterThanOrEqual(
      Math.max(reels.margins.left, shorts.margins.left, tiktok.margins.left),
    );
    expect(combined.margins.right).toBeGreaterThanOrEqual(
      Math.max(reels.margins.right, shorts.margins.right, tiktok.margins.right),
    );
  });

  it("rejects unknown placements and empty canvases", () => {
    expect(() => getPlacement("not_a_placement" as never)).toThrow(/Unknown placement/);
    expect(() => getOverlay("meta_reels", 0, 1920)).toThrow(/positive/);
  });
});
