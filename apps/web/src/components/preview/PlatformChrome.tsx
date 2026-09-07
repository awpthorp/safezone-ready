import {
  getPlacement,
  type PlacementId,
  type PlacementSpec,
  type RailSpec,
} from "@safezone-ready/safezone-specs";
import {
  Bookmark,
  Camera,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Repeat2,
  Search,
  Send,
  Share2,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import {
  AudioCover,
  GradientAvatar,
  HomeIndicator,
  IgAvatar,
  InstagramTabBar,
  RailIcon,
  ShortsTabBar,
  SpinningDisc,
  StatusBar,
  TikTokFollowAvatar,
  TikTokTabBar,
} from "@/components/preview/chromeBits";

export function PlatformChrome({ placementId }: { placementId: PlacementId }) {
  const placement = getPlacement(placementId);
  switch (placementId) {
    case "meta_reels":
      return <ReelsChrome placement={placement} />;
    case "meta_stories":
    case "meta_stories_disclaimer":
      return <StoriesChrome placement={placement} />;
    case "meta_feed_1x1":
    case "meta_feed_4x5":
      return <FeedChrome placement={placement} />;
    case "youtube_shorts":
      return <ShortsChrome placement={placement} />;
    case "tiktok_infeed":
      return <TikTokChrome placement={placement} />;
    case "combined":
      return <CombinedChrome placement={placement} />;
    default: {
      const _exhaustive: never = placementId;
      void _exhaustive;
      return null;
    }
  }
}

function pctVars(placement: ReturnType<typeof getPlacement>): CSSProperties {
  const { top, bottom, left, right } = placement.margins;
  const rail = placement.rails[0];
  const coverRight = rail ? Math.max(right, 1 - rail.x) : right;
  return {
    "--m-top": `${top * 100}%`,
    "--m-bottom": `${bottom * 100}%`,
    "--m-left": `${left * 100}%`,
    "--m-right": `${right * 100}%`,
    "--c-right": `${coverRight * 100}%`,
  } as CSSProperties;
}

function railVars(rail: RailSpec | undefined): CSSProperties {
  if (!rail) {
    return {};
  }
  return {
    "--rail-x": `${rail.x * 100}%`,
    "--rail-y": `${rail.y * 100}%`,
    "--rail-w": `${rail.width * 100}%`,
    "--rail-h": `${rail.height * 100}%`,
  } as CSSProperties;
}

function ChromeRoot({
  placement,
  children,
}: {
  placement: PlacementSpec;
  children: ReactNode;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 text-white"
      aria-hidden="true"
      style={{ ...pctVars(placement), ...railVars(placement.rails[0]) }}
    >
      {children}
    </div>
  );
}

function CoverHatch() {
  return (
    <>
      <div className="absolute inset-x-0 top-0 h-(--m-top) cover-hatch" />
      <div className="absolute inset-x-0 bottom-0 h-(--m-bottom) cover-hatch" />
      <div className="absolute top-(--m-top) bottom-(--m-bottom) left-0 w-(--m-left) cover-hatch" />
      <div className="absolute top-(--m-top) bottom-(--m-bottom) right-0 w-(--c-right) cover-hatch" />
      <div className="absolute top-(--m-top) right-(--c-right) bottom-(--m-bottom) left-(--m-left) border-2 border-dashed border-white/75" />
    </>
  );
}

function ReelsChrome({ placement }: { placement: PlacementSpec }) {
  return (
    <ChromeRoot placement={placement}>
      <CoverHatch />
      <div className="absolute inset-x-0 top-0 flex h-(--m-top) flex-col gap-1">
        <StatusBar />
        <div className="flex items-center gap-1.5 px-3">
          <IgAvatar />
          <div className="min-w-0">
            <p className="truncate text-[0.65rem] font-semibold">brand.account</p>
            <p className="text-[0.55rem] text-white/80">Sponsored</p>
          </div>
          <span className="rounded-md px-2 py-0.5 text-[0.55rem] font-semibold ring-1 ring-white/50">
            Follow
          </span>
          <MoreHorizontal className="ml-auto size-3.5 shrink-0" />
          <X className="size-3.5 shrink-0" />
        </div>
      </div>

      <div className="absolute top-(--rail-y) left-(--rail-x) flex h-(--rail-h) w-(--rail-w) flex-col items-center justify-between py-0.5">
        <RailIcon icon={<Heart className="size-5 shrink-0" />} label="24.1k" />
        <RailIcon icon={<MessageCircle className="size-5 shrink-0" />} label="812" />
        <RailIcon icon={<Send className="size-5 shrink-0" />} label="Share" />
        <RailIcon icon={<Bookmark className="size-5 shrink-0" />} />
        <RailIcon icon={<MoreHorizontal className="size-5 shrink-0" />} />
        <AudioCover />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex h-(--m-bottom) flex-col justify-end">
        <div className="flex min-h-0 flex-col gap-1 px-3 pb-1 pr-[calc(var(--rail-w)+0.4rem)]">
          <p className="text-[0.68rem] font-semibold">brand.account</p>
          <p className="line-clamp-2 text-[0.62rem]">
            50% off this week. Offer sits in the caption band on Reels.
          </p>
          <p className="flex items-center gap-1 text-[0.55rem] text-white/80">
            <Music2 className="size-3 shrink-0" />
            Original audio
          </p>
          <div className="flex h-7 items-center justify-center rounded-lg bg-white text-[0.7rem] font-semibold text-zinc-950">
            Shop now
          </div>
        </div>
        <InstagramTabBar />
        <HomeIndicator />
      </div>
    </ChromeRoot>
  );
}

function StoriesChrome({ placement }: { placement: PlacementSpec }) {
  return (
    <ChromeRoot placement={placement}>
      <CoverHatch />
      <div className="absolute inset-x-0 top-0 flex h-(--m-top) flex-col gap-1">
        <StatusBar />
        <div className="flex gap-1 px-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-0.5 grow rounded-full ${i === 0 ? "bg-white" : "bg-white/35"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5 px-3">
          <GradientAvatar />
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold">brand.account</p>
            <p className="text-[0.55rem] text-white/75">Sponsored · 3h</p>
          </div>
          <MoreHorizontal className="ml-auto size-3.5 shrink-0" />
          <X className="size-3.5 shrink-0" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-(--m-bottom) flex-col justify-end gap-1.5 px-3">
        <span className="self-start rounded-full bg-white px-3 py-1 text-[0.62rem] font-semibold text-zinc-950">
          Shop now
        </span>
        <div className="flex items-center gap-2">
          <div className="flex h-8 grow items-center rounded-full px-3 text-[0.7rem] text-white/80 ring-1 ring-white/40">
            Send message
          </div>
          <Heart className="size-5 shrink-0" />
          <Send className="size-5 shrink-0" />
        </div>
        <HomeIndicator />
      </div>
    </ChromeRoot>
  );
}

function FeedChrome({ placement }: { placement: PlacementSpec }) {
  return (
    <ChromeRoot placement={placement}>
      <CoverHatch />
    </ChromeRoot>
  );
}

function ShortsChrome({ placement }: { placement: PlacementSpec }) {
  return (
    <ChromeRoot placement={placement}>
      <CoverHatch />
      <div className="absolute inset-x-0 top-0 flex h-(--m-top) flex-col">
        <StatusBar />
        <div className="flex items-center px-3 pt-1">
          <Search className="size-4 shrink-0" />
          <p className="mx-auto text-[0.75rem] font-semibold">Shorts</p>
          <Camera className="size-4 shrink-0" />
        </div>
      </div>

      <div className="absolute top-(--m-top) right-0 bottom-(--m-bottom) flex w-(--m-right) flex-col items-center justify-end gap-2.5 pb-2">
        <RailIcon icon={<ThumbsUp className="size-5 shrink-0" />} label="18k" />
        <RailIcon icon={<ThumbsDown className="size-5 shrink-0" />} label="Dislike" />
        <RailIcon icon={<MessageCircle className="size-5 shrink-0" />} label="642" />
        <RailIcon icon={<Share2 className="size-5 shrink-0" />} label="Share" />
        <RailIcon icon={<Repeat2 className="size-5 shrink-0" />} label="Remix" />
        <span className="size-7 overflow-hidden rounded-full ring-2 ring-white/30">
          <span className="block size-full bg-linear-to-br from-red-500 to-rose-700" />
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex h-(--m-bottom) flex-col justify-end">
        <div className="flex min-h-0 flex-col gap-1 px-3 pb-1 pr-[calc(var(--m-right)+0.4rem)]">
          <p className="text-[0.75rem] font-semibold">50% off this week</p>
          <p className="text-[0.62rem]">
            @brand.channel
            <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-[0.55rem] font-semibold">
              Subscribe
            </span>
          </p>
          <p className="line-clamp-1 text-[0.58rem] text-white/85">
            Offer text in this band sits under the title and CTA card.
          </p>
          <div className="flex h-7 items-center justify-between rounded-lg bg-white/95 px-3 text-[0.68rem] font-semibold text-zinc-950">
            Shop now
            <span className="font-medium text-zinc-500">Learn more</span>
          </div>
        </div>
        <ShortsTabBar />
        <HomeIndicator />
      </div>
    </ChromeRoot>
  );
}

function TikTokChrome({ placement }: { placement: PlacementSpec }) {
  return (
    <ChromeRoot placement={placement}>
      <CoverHatch />
      <div className="absolute inset-x-0 top-0 flex h-(--m-top) flex-col">
        <StatusBar />
        <div className="relative flex items-center justify-center gap-4 pt-0.5 text-[0.75rem] font-semibold">
          <span className="text-white/70">Following</span>
          <span className="underline decoration-white decoration-2 underline-offset-4">For You</span>
          <Search className="absolute right-3 size-4 shrink-0" />
        </div>
      </div>

      <div className="absolute top-(--rail-y) right-0 flex h-(--rail-h) w-(--rail-w) flex-col items-center justify-between py-0.5">
        <TikTokFollowAvatar />
        <RailIcon icon={<Heart className="size-5 shrink-0 fill-white" />} label="128.4k" />
        <RailIcon icon={<MessageCircle className="size-5 shrink-0" />} label="2116" />
        <RailIcon icon={<Bookmark className="size-5 shrink-0" />} label="940" />
        <RailIcon icon={<Share2 className="size-5 shrink-0" />} label="Share" />
        <SpinningDisc />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex h-(--m-bottom) flex-col justify-end">
        <div className="flex min-h-0 flex-col gap-0.5 px-3 pb-1 pr-[calc(var(--rail-w)+0.5rem)]">
          <p className="text-[0.75rem] font-semibold">@brand.account</p>
          <p className="line-clamp-2 text-[0.62rem]">
            Caption length changes this overlay. Official TikTok templates shrink as the caption
            grows.
          </p>
          <p className="flex items-center gap-1 text-[0.55rem] text-white/85">
            <Music2 className="size-3 shrink-0" />
            original sound - brand.account
          </p>
        </div>
        <div className="flex h-7 items-center justify-center bg-[#fe2c55] text-[0.7rem] font-semibold">
          Shop now
        </div>
        <TikTokTabBar />
        <HomeIndicator />
      </div>
    </ChromeRoot>
  );
}

function CombinedChrome({ placement }: { placement: PlacementSpec }) {
  return (
    <ChromeRoot placement={placement}>
      <CoverHatch />
      <div className="absolute inset-x-3 bottom-3 rounded-md bg-black/70 px-2 py-1.5 text-center text-[0.65rem] font-medium text-white">
        Strictest cover: Shorts rail, Reels caption, TikTok sides.
      </div>
    </ChromeRoot>
  );
}
