import { useEffect, useState } from "react";
import { PhonePreview } from "@/components/preview/PreviewStage";
import { Badge } from "@/components/ui/badge";
import { revokeIfBlob } from "@/lib/media";
import { canvasToImage, drawFixedCreative, drawSampleCreative } from "@/lib/sampleCreative";

export function GoodBadExamples() {
  const [badUrl, setBadUrl] = useState<string | null>(null);
  const [goodUrl, setGoodUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];

    void (async () => {
      try {
        const [badSample, goodSample] = await Promise.all([
          canvasToImage(drawSampleCreative, "sample-glow-bad.png"),
          canvasToImage(drawFixedCreative, "sample-glow-good.png"),
        ]);
        urls.push(badSample.url, goodSample.url);
        if (cancelled) {
          urls.forEach(revokeIfBlob);
          return;
        }
        setBadUrl(badSample.url);
        setGoodUrl(goodSample.url);
      } catch {
        urls.forEach(revokeIfBlob);
        setBadUrl(null);
        setGoodUrl(null);
      }
    })();

    return () => {
      cancelled = true;
      urls.forEach(revokeIfBlob);
    };
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="examples-heading">
      <h2
        id="examples-heading"
        className="max-w-[40ch] font-display text-4xl tracking-tight text-balance"
      >
        A bad still and a good still
      </h2>
      <p className="mt-4 max-w-[48ch] text-pretty text-lg text-muted-foreground">
        Same serum, same 9:16 frame. The only change is where the 50% off sits.
      </p>
      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <ExampleCard
          url={badUrl}
          badge="Covered"
          badgeVariant="risk"
          title="Bad"
          why="The 50% off sits in the caption band. Instagram draws the caption, shop button and tab bar on top of it. You pay for an impression of a price nobody can read."
        />
        <ExampleCard
          url={goodUrl}
          badge="Ready"
          badgeVariant="ready"
          title="Good"
          why="The 50% off sits in the hole. Likes, caption and shop still appear. The price stays readable."
        />
      </div>
    </section>
  );
}

function ExampleCard({
  url,
  badge,
  badgeVariant,
  title,
  why,
}: {
  url: string | null;
  badge: string;
  badgeVariant: "risk" | "ready";
  title: string;
  why: string;
}) {
  return (
    <figure>
      <div className="flex items-center gap-2">
        <h3 className="text-base/7 font-semibold sm:text-sm/6">{title}</h3>
        <Badge variant={badgeVariant}>{badge}</Badge>
      </div>
      <div className="mt-3">
        {url ? (
          <PhonePreview url={url} placementId="meta_reels" />
        ) : (
          <div className="mx-auto aspect-9/16 w-full max-w-[18rem] rounded-[min(6vw,1.75rem)] bg-muted ring-1 ring-zinc-950/10" />
        )}
      </div>
      <figcaption className="mt-3 max-w-[40ch] text-pretty text-base/7 text-muted-foreground sm:text-sm/6">
        {why}
      </figcaption>
    </figure>
  );
}
