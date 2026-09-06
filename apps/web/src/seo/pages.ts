export const SITE_ORIGIN = "https://safezoneready.com";
export const SITE_NAME = "Safe Zone Ready";
export const OG_IMAGE = `${SITE_ORIGIN}/og.png`;
export const OG_IMAGE_ALT = "Safe Zone Ready checker with a 9:16 ad still and platform cover over the offer.";

export type CheckerPlacement = "combined" | "meta_reels" | "youtube_shorts" | "tiktok_infeed";

export type PageKind = "home" | "platform" | "legal" | "error";

export type PageId = "home" | "meta" | "youtube-shorts" | "tiktok" | "privacy" | "terms" | "not-found";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface PageDef {
  id: PageId;
  path: string;
  title: string;
  description: string;
  h1: string;
  ogTitle: string;
  kind: PageKind;
  subline?: string;
  paragraphs: string[];
  covers?: string[];
  faq?: FaqItem[];
  placement?: CheckerPlacement;
}

export function canonicalUrl(path: string): string {
  if (path === "/") {
    return `${SITE_ORIGIN}/`;
  }
  const trimmed = path.endsWith("/") ? path.slice(0, -1) : path;
  return `${SITE_ORIGIN}${trimmed}`;
}

export const HOME_FAQ: FaqItem[] = [
  {
    question: "Why does the safe zone matter for ads?",
    answer:
      "Likes, captions and shop buttons sit on the file. If the price or the logo is in that cover, you pay for an impression of an offer nobody can read.",
  },
  {
    question: "What does a bad still look like?",
    answer:
      "The offer sits where the caption and shop button will land. People still see the ad. They do not see the price. Move the offer into the hole and the same still is good.",
  },
  {
    question: "Will Instagram Reels cover my offer text?",
    answer:
      "Drop the still. Safe Zone Ready shows where the caption, profile row and buttons sit so you can move the offer before you spend.",
  },
  {
    question: "Does my file get uploaded?",
    answer:
      "No. Scoring runs in your browser. The file is only sent if you ask for an AI edit.",
  },
  {
    question: "Can I check TikTok and YouTube Shorts as well?",
    answer:
      "Yes. One still, then tap Instagram Reels, Stories, Feed, YouTube Shorts or TikTok.",
  },
  {
    question: "Can I check a video?",
    answer:
      "Yes. Drop an MP4 or WebM. Scoring samples frames in your browser. AI edits that shift the layout are stills only.",
  },
];

export const PAGES: Record<PageId, PageDef> = {
  home: {
    id: "home",
    path: "/",
    kind: "home",
    placement: "combined",
    title: "Check if Instagram, TikTok or YouTube will cover your ad | Safe Zone Ready",
    description:
      "Drop an ad still or clip. See where captions, buttons and profile rows sit on Instagram, TikTok and YouTube Shorts. Nothing uploads for a check.",
    h1: "Check if Instagram, TikTok or YouTube will cover your ad",
    ogTitle: "Check if Instagram, TikTok or YouTube will cover your ad",
    subline: "Drop a still or a clip. See the cover before you spend.",
    paragraphs: [
      "Safe Zone Ready is a free checker for ad stills and video. Drop a PNG, JPEG, WebP, MP4 or WebM and see where Instagram Reels, Stories, Feed, YouTube Shorts and TikTok place captions, profile rows and buttons on your offer. The file stays in your browser. Nothing uploads for a score.",
      "Media buyers use it as a last look before Ads Manager. Scores are practical overlays from public platform guidance and measured templates. They are not a certification from Meta, Google or TikTok. Always preview in the official ads manager before you spend.",
      "If text sits in a cover band, you can ask for an AI edit that moves the offer without deleting the price, logo or button. That path needs a Google sign-in. Two complimentary edits come with a new account.",
    ],
    faq: HOME_FAQ,
  },
  meta: {
    id: "meta",
    path: "/meta",
    kind: "platform",
    placement: "meta_reels",
    title: "Instagram Reels and Stories safe zone checker | Safe Zone Ready",
    description:
      "See where Instagram Reels captions and buttons, Stories profile rows and Feed 4:5 edges sit on your ad still. Nothing uploads for a check.",
    h1: "Instagram Reels and Stories safe zone checker",
    ogTitle: "Instagram Reels and Stories safe zone checker",
    paragraphs: [
      "Reels puts the caption along the bottom of a 9:16 still and stacks like, comment and send on the right. Offer text in that band is what buyers come here to catch.",
      "Stories places a profile row at the top. A headline that hugs the upper edge sits under the name, timestamp and close control.",
      "Feed 4:5 crops tighter at the edges than a Reel. If the same still has to run in feed, check that frame as well as 9:16.",
      "Links from metasafezone.com land on this page with the Instagram overlays ready. Overlays are approximate guardrails, not a certification from Meta. Always preview in Ads Manager before you spend.",
    ],
    covers: [
      "Reels caption and engagement buttons",
      "Stories profile row at the top",
      "Feed 4:5 edge crop",
    ],
  },
  "youtube-shorts": {
    id: "youtube-shorts",
    path: "/youtube-shorts",
    kind: "platform",
    placement: "youtube_shorts",
    title: "YouTube Shorts safe zone checker | Safe Zone Ready",
    description:
      "See where the YouTube Shorts title, channel row, CTA card and right-hand engagement rail sit on your ad still. Nothing uploads for a check.",
    h1: "YouTube Shorts safe zone checker",
    ogTitle: "YouTube Shorts safe zone checker",
    paragraphs: [
      "Shorts place the title, channel name and the subscribe or CTA card along the bottom of the still. A price or legal line in that strip is easy to lose.",
      "The engagement rail sits on the right. Like, comments and share cover a tall column. Keep logos and offer text out of that stack.",
      "Drop a 9:16 PNG, JPEG or WebP. The file stays in your browser. Nothing uploads for a score.",
      "Overlays are approximate guardrails from public guidance and measured templates. They are not a certification from Google. Always preview in Google Ads or YouTube before you spend.",
    ],
    covers: [
      "Title and channel row",
      "CTA card at the bottom",
      "Engagement rail on the right",
    ],
  },
  tiktok: {
    id: "tiktok",
    path: "/tiktok",
    kind: "platform",
    placement: "tiktok_infeed",
    title: "TikTok in-feed safe zone checker | Safe Zone Ready",
    description:
      "See the standard TikTok in-feed guardrail for captions and the engagement stack on your ad still. Official overlays change with caption length. Nothing uploads for a check.",
    h1: "TikTok in-feed safe zone checker",
    ogTitle: "TikTok in-feed safe zone checker",
    paragraphs: [
      "Official TikTok overlays change with caption length. A long caption climbs the still and covers more of the offer than a short one.",
      "This page uses the standard in-feed guardrail: username, caption, and the right-hand engagement stack. It is a last look, not a live preview of every caption A/B test.",
      "Drop a still. The file stays in your browser. Nothing uploads for a score.",
      "Approximate guardrail, not a TikTok certification. Always preview in TikTok Ads Manager before you spend.",
    ],
    covers: [
      "Username and caption",
      "Engagement stack on the right",
      "Bottom CTA band",
    ],
  },
  privacy: {
    id: "privacy",
    path: "/privacy",
    kind: "legal",
    title: "Privacy | Safe Zone Ready",
    description:
      "How Safe Zone Ready handles local checks, AI edits, cookies and UK GDPR rights. Local checks never upload.",
    h1: "Privacy",
    ogTitle: "Privacy | Safe Zone Ready",
    paragraphs: [],
  },
  terms: {
    id: "terms",
    path: "/terms",
    kind: "legal",
    title: "Terms | Safe Zone Ready",
    description:
      "Terms for using the Safe Zone Ready overlay checker and AI edits. Approximate guardrails, not platform certification.",
    h1: "Terms",
    ogTitle: "Terms | Safe Zone Ready",
    paragraphs: [],
  },
  "not-found": {
    id: "not-found",
    path: "/",
    kind: "error",
    title: "Page not found | Safe Zone Ready",
    description: "That path is not a checker or a legal page on Safe Zone Ready.",
    h1: "Page not found",
    ogTitle: "Page not found | Safe Zone Ready",
    paragraphs: ["That path is not a checker or a legal page. The overlay tool still lives on the home page."],
  },
};

export const INDEXABLE_PAGES: PageDef[] = [
  PAGES.home,
  PAGES.meta,
  PAGES["youtube-shorts"],
  PAGES.tiktok,
  PAGES.privacy,
  PAGES.terms,
];
