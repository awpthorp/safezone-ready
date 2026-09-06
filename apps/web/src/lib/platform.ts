import { parsePlatformSearch } from "@safezone-ready/safezone-specs";
import type { PlacementId } from "@safezone-ready/safezone-specs";

const PRETTY_PATH: Record<string, string> = {
  meta: "/meta",
  reels: "/meta",
  meta_reels: "/meta",
  youtube: "/youtube-shorts",
  shorts: "/youtube-shorts",
  youtube_shorts: "/youtube-shorts",
  tiktok: "/tiktok",
  tiktok_infeed: "/tiktok",
};

export function placementFromSearch(search: string): PlacementId {
  return parsePlatformSearch(search);
}

export function prettyPathFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
    .get("platform")
    ?.trim()
    .toLowerCase();
  if (!raw) {
    return null;
  }
  return PRETTY_PATH[raw] ?? null;
}

export function placementFromPathname(pathname: string): PlacementId {
  const path = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  if (path === "/meta") {
    return "meta_reels";
  }
  if (path === "/youtube-shorts") {
    return "youtube_shorts";
  }
  if (path === "/tiktok") {
    return "tiktok_infeed";
  }
  return "combined";
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
    return "Opened on Instagram and Facebook placements. Drop a still to see Reels and Stories first.";
  }
  return null;
}
