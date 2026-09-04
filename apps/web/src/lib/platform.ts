import { parsePlatformSearch } from "@safezone-ready/safezone-specs";
import type { PlacementId } from "@safezone-ready/safezone-specs";

export function placementFromSearch(search: string): PlacementId {
  return parsePlatformSearch(search);
}

export function platformDeepLinkLabel(search: string): string | null {
  const raw = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
    .get("platform")
    ?.trim()
    .toLowerCase();
  if (!raw) {
    return null;
  }
  if (["meta", "reels", "meta_reels", "stories", "feed", "meta_stories", "meta_feed_4x5", "meta_feed_1x1"].includes(raw)) {
    return "Meta placements (from the metasafezone.com link)";
  }
  return null;
}
