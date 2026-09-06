import { buyerPlacementLabel, type PlacementId } from "@safezone-ready/safezone-specs";
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react";
import { PlatformChrome } from "@/components/preview/PlatformChrome";

interface PreviewStageProps {
  url: string;
  kind: "image" | "video";
  placementId: PlacementId;
  showOverlay: boolean;
}

export function PreviewStage({ url, kind, placementId, showOverlay }: PreviewStageProps) {
  const isFeed = placementId === "meta_feed_1x1" || placementId === "meta_feed_4x5";
  const label = buyerPlacementLabel(placementId);

  return (
    <figure className="mx-auto w-full max-w-md">
      {isFeed ? (
        <FeedFrame url={url} kind={kind} placementId={placementId} showOverlay={showOverlay} />
      ) : (
        <PhoneFrame url={url} kind={kind} placementId={placementId} showOverlay={showOverlay} />
      )}
      <figcaption className="mt-3 text-pretty text-base/7 text-muted-foreground sm:text-sm/6">
        {stageCaption(placementId, label, kind)}
      </figcaption>
    </figure>
  );
}

function stageCaption(placementId: PlacementId, label: string, kind: "image" | "video"): string {
  if (kind === "video") {
    if (placementId === "combined") {
      return "A measurement overlay of the strictest cover across Instagram, Shorts and TikTok, drawn on the playing clip. Scored across sampled frames; the worst cover wins. Caption length and device size can still move the real controls.";
    }
    return `A practical mock of ${label} on the playing clip, scored across sampled frames. The worst cover wins. Caption length and device size can still move the real controls.`;
  }
  if (placementId === "combined") {
    return "A measurement overlay of the strictest cover across Instagram, Shorts and TikTok, drawn to the same guardrails as the score. Caption length and device size can still move the real controls.";
  }
  return `A practical mock of ${label}, drawn to the same guardrails as the score. Caption length and device size can still move the real controls.`;
}

function PreviewMedia({ url, kind }: { url: string; kind: "image" | "video" }) {
  if (kind === "video") {
    return (
      <video
        src={url}
        className="absolute inset-0 size-full object-cover"
        muted
        playsInline
        loop
        autoPlay
        disablePictureInPicture
        aria-hidden="true"
        onLoadedMetadata={(event) => {
          const el = event.currentTarget;
          el.muted = true;
          void el.play().catch(() => undefined);
        }}
      />
    );
  }
  return <img src={url} alt="" className="absolute inset-0 size-full object-cover" />;
}

function PhoneFrame({ url, kind, placementId, showOverlay }: PreviewStageProps) {
  return (
    <div className="relative mx-auto aspect-9/16 w-full max-w-[22rem] overflow-hidden rounded-[min(6vw,1.75rem)] bg-black shadow-xl ring-1 ring-zinc-950/10">
      <PreviewMedia url={url} kind={kind} />
      {showOverlay ? <PlatformChrome placementId={placementId} /> : null}
    </div>
  );
}

function FeedFrame({ url, kind, placementId, showOverlay }: PreviewStageProps) {
  const portrait = placementId === "meta_feed_4x5";
  return (
    <div className="overflow-hidden rounded-[min(2vw,12px)] bg-white shadow-xl ring-1 ring-zinc-950/10">
      <div className="flex items-center gap-2 px-3 py-2" aria-hidden="true">
        <span className="size-8 shrink-0 rounded-full bg-linear-to-br from-amber-300 via-fuchsia-500 to-rose-500" />
        <div className="min-w-0">
          <p className="truncate text-base/6 font-semibold sm:text-sm/5">brand.account</p>
          <p className="text-base/6 text-muted-foreground sm:text-sm/5">Sponsored</p>
        </div>
        <MoreHorizontal className="ml-auto size-4 shrink-0" />
      </div>
      <div className={`relative bg-zinc-100 ${portrait ? "aspect-4/5" : "aspect-square"}`}>
        <PreviewMedia url={url} kind={kind} />
        {showOverlay ? <PlatformChrome placementId={placementId} /> : null}
      </div>
      <div className="flex flex-col gap-1 px-3 pb-3">
        <div className="flex items-center gap-3 py-2" aria-hidden="true">
          <Heart className="size-6 shrink-0" />
          <MessageCircle className="size-6 shrink-0" />
          <Send className="size-6 shrink-0" />
          <Bookmark className="ml-auto size-6 shrink-0" />
        </div>
        <p className="text-base/6 font-medium sm:text-sm/5">24,184 likes</p>
        <p className="text-pretty text-base/6 sm:text-sm/5">
          <span className="font-semibold">brand.account</span> Offer text near the edge sits under
          likes, caption and the next post.
        </p>
      </div>
    </div>
  );
}
