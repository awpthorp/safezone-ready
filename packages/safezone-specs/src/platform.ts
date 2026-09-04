import type { PlacementId } from "./types";

const ALIASES: Record<string, PlacementId> = {
  meta: "meta_reels",
  reels: "meta_reels",
  meta_reels: "meta_reels",
  stories: "meta_stories",
  meta_stories: "meta_stories",
  feed: "meta_feed_4x5",
  meta_feed_4x5: "meta_feed_4x5",
  meta_feed_1x1: "meta_feed_1x1",
  youtube: "youtube_shorts",
  shorts: "youtube_shorts",
  youtube_shorts: "youtube_shorts",
  tiktok: "tiktok_infeed",
  tiktok_infeed: "tiktok_infeed",
  combined: "combined",
};

/** Map `?platform=` from metasafezone.com (and future satellites) to a placement. */
export function parsePlatformParam(value: string | null | undefined): PlacementId {
  const raw = value?.trim().toLowerCase() ?? "";
  return ALIASES[raw] ?? "combined";
}

export function parsePlatformSearch(search: string): PlacementId {
  const q = search.startsWith("?") ? search.slice(1) : search;
  const part = q.split("&").find((item) => item.startsWith("platform="));
  const value = part ? decodeURIComponent(part.slice("platform=".length).replace(/\+/g, " ")) : null;
  return parsePlatformParam(value);
}
