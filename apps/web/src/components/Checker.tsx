import {
  DEFAULT_PLACEMENT_IDS,
  describeReportHint,
  type PlacementId,
  type ScoreReport,
} from "@safezone-ready/safezone-specs";
import { useCallback, useMemo, useRef, useState } from "react";
import { FixPanel, type FixPhase } from "@/components/FixPanel";
import { PreviewStage } from "@/components/preview/PreviewStage";
import { ScoreRail } from "@/components/ScoreRail";
import { Alert, AlertError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  analyseImage,
  analyseVideo,
  isVideoFile,
  validateFile,
  validateImageSize,
  validateVideoMeta,
} from "@/lib/analyse";
import { createObjectUrl, loadVideo, revokeIfBlob } from "@/lib/media";
import { placementFromSearch, platformDeepLinkLabel } from "@/lib/platform";
import {
  canvasToImage,
  drawFixedCreative,
  drawSampleCreative,
  loadImage,
} from "@/lib/sampleCreative";

type LoadedCreative = {
  url: string;
  fileName: string;
  report: ScoreReport;
} & (
  | { kind: "image"; image: HTMLImageElement }
  | { kind: "video"; video: HTMLVideoElement }
);

function resolvePlacement(fallback: PlacementId): PlacementId {
  if (typeof window === "undefined") {
    return fallback;
  }
  const raw = new URLSearchParams(window.location.search).get("platform");
  if (raw) {
    return placementFromSearch(window.location.search);
  }
  return fallback;
}

export function Checker({ defaultPlacement }: { defaultPlacement: PlacementId }) {
  const [creative, setCreative] = useState<LoadedCreative | null>(null);
  const [fixed, setFixed] = useState<LoadedCreative | null>(null);
  const [activeId, setActiveId] = useState<PlacementId>(() => resolvePlacement(defaultPlacement));
  const deepLinkLabel = platformDeepLinkLabel(typeof window === "undefined" ? "" : window.location.search);
  const [showOverlay, setShowOverlay] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyKind, setBusyKind] = useState<"image" | "video">("image");
  const [phase, setPhase] = useState<FixPhase>("idle");
  const [credits, setCredits] = useState(2);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const creativeRef = useRef<LoadedCreative | null>(null);
  const fixedRef = useRef<LoadedCreative | null>(null);
  creativeRef.current = creative;
  fixedRef.current = fixed;

  const display = fixed ?? creative;
  const displayReport = display?.report;

  const dropLoaded = useCallback((item: LoadedCreative | null) => {
    revokeIfBlob(item?.url);
  }, []);

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file || busyRef.current) {
        return;
      }
      const typeError = validateFile(file);
      if (typeError) {
        setError(typeError);
        return;
      }
      const videoFile = isVideoFile(file);
      busyRef.current = true;
      setBusy(true);
      setBusyKind(videoFile ? "video" : "image");
      setError(null);
      setFixed(null);
      setPhase("idle");
      const url = createObjectUrl(file);
      try {
        if (videoFile) {
          const video = await loadVideo(url);
          const metaError = validateVideoMeta(video);
          if (metaError) {
            revokeIfBlob(url);
            setError(metaError);
            return;
          }
          const { report } = await analyseVideo(video, DEFAULT_PLACEMENT_IDS);
          dropLoaded(creativeRef.current);
          dropLoaded(fixedRef.current);
          setCreative({ kind: "video", video, url, fileName: file.name, report });
        } else {
          const image = await loadImage(url);
          const sizeError = validateImageSize(image.width, image.height);
          if (sizeError) {
            revokeIfBlob(url);
            setError(sizeError);
            return;
          }
          const { report } = analyseImage(image, DEFAULT_PLACEMENT_IDS);
          dropLoaded(creativeRef.current);
          dropLoaded(fixedRef.current);
          setCreative({ kind: "image", image, url, fileName: file.name, report });
        }
        setActiveId(resolvePlacement(defaultPlacement));
      } catch (err) {
        revokeIfBlob(url);
        setError(err instanceof Error ? err.message : "Could not read that file.");
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [defaultPlacement, dropLoaded],
  );

  const loadSample = useCallback(
    async (kind: "bad" | "good") => {
      if (busyRef.current) {
        return;
      }
      busyRef.current = true;
      setBusy(true);
      setBusyKind("image");
      setError(null);
      setFixed(null);
      setPhase("idle");
      try {
        const sample = await canvasToImage(
          kind === "good" ? drawFixedCreative : drawSampleCreative,
          kind === "good" ? "sample-glow-good.png" : "sample-glow-bad.png",
        );
        try {
          const { report } = analyseImage(sample.image, DEFAULT_PLACEMENT_IDS);
          dropLoaded(creativeRef.current);
          dropLoaded(fixedRef.current);
          setCreative({ kind: "image", image: sample.image, url: sample.url, fileName: sample.fileName, report });
          setActiveId(resolvePlacement(defaultPlacement));
        } catch (err) {
          revokeIfBlob(sample.url);
          throw err;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not build the sample still.");
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [defaultPlacement, dropLoaded],
  );

  const startFix = useCallback(async () => {
    if (!creative || creative.kind === "video") {
      return;
    }
    if (credits <= 0) {
      setPhase("paywall");
      return;
    }
    setPhase("auth");
    await wait(700);
    setPhase("running");
    await wait(1100);
    try {
      const sample = await canvasToImage(drawFixedCreative);
      try {
        const { report } = analyseImage(sample.image, DEFAULT_PLACEMENT_IDS);
        dropLoaded(fixedRef.current);
        setFixed({ kind: "image", image: sample.image, url: sample.url, fileName: sample.fileName, report });
        setCredits((n) => n - 1);
        setPhase("done");
      } catch (err) {
        revokeIfBlob(sample.url);
        throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The edit failed. Try another still.");
      setPhase("idle");
    }
  }, [creative, credits, dropLoaded]);

  const downloadFixed = useCallback(() => {
    if (!fixed || fixed.kind !== "image") {
      return;
    }
    const link = document.createElement("a");
    link.href = fixed.url;
    link.download = "safezone-ready.png";
    link.click();
  }, [fixed]);

  const reset = useCallback(() => {
    dropLoaded(creativeRef.current);
    dropLoaded(fixedRef.current);
    creativeRef.current = null;
    fixedRef.current = null;
    setCreative(null);
    setFixed(null);
    setPhase("idle");
    setError(null);
  }, [dropLoaded]);

  const hint = useMemo(() => (displayReport ? describeReportHint(displayReport) : null), [displayReport]);
  const busyText = busyKind === "video" ? "Reading the clip…" : "Reading the still…";

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        {!creative ? (
          <div
            className={`flex min-h-[22rem] flex-col items-center justify-center gap-4 rounded-(--radius) px-6 py-10 text-center ring-1 ring-zinc-950/10 ${
              dragOver ? "bg-muted" : "bg-white"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void onFile(e.dataTransfer.files[0]);
            }}
          >
            <div>
              <p className="text-lg font-medium">Drop the still or clip</p>
              <p className="mt-2 max-w-[40ch] text-pretty text-base/7 text-muted-foreground sm:text-sm/6">
                See Instagram, TikTok and YouTube chrome on the offer. The file stays in this tab.
              </p>
            </div>
            <input
              ref={fileInputRef}
              id="creative-file"
              name="creative"
              type="file"
              accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,video/x-m4v,video/ogg,video/3gpp,.mp4,.m4v,.mov,.webm,.ogv,.ogg,.3gp,.3gpp"
              className="sr-only"
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap justify-center gap-2">
              <Button disabled={busy} onClick={() => fileInputRef.current?.click()}>
                Choose a file
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => void loadSample("bad")}>
                Try a bad example
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => void loadSample("good")}>
                Try a good example
              </Button>
            </div>
            <p className="text-base/7 text-muted-foreground sm:text-sm/6">
              {busy ? busyText : "PNG, JPEG, WebP, MP4, WebM, MOV or M4V."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 truncate text-base/7 text-muted-foreground sm:text-sm/6">
                {creative.fileName}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowOverlay((v) => !v)}>
                  {showOverlay ? "Hide cover" : "Show cover"}
                </Button>
                <Button size="sm" variant="ghost" onClick={reset}>
                  Start over
                </Button>
              </div>
            </div>
            {display ? (
              <PreviewStage
                url={display.url}
                kind={display.kind}
                placementId={activeId}
                showOverlay={showOverlay}
              />
            ) : null}
            {hint ? (
              <p className="text-pretty text-base/7 text-muted-foreground sm:text-sm/6">{hint}</p>
            ) : null}
          </>
        )}

        {deepLinkLabel && !creative ? <Alert>{deepLinkLabel}</Alert> : null}
        {error ? <AlertError>{error}</AlertError> : null}
        {busy && creative ? <Alert>{busyText}</Alert> : null}
      </div>

      <aside className="flex flex-col gap-4">
        {displayReport ? (
          <ScoreRail report={displayReport} activeId={activeId} onSelect={setActiveId} />
        ) : (
          <Alert>Scoring runs in your browser. The file is not uploaded unless you ask for an AI edit.</Alert>
        )}

        {creative ? (
          <FixPanel
            kind={creative.kind}
            phase={phase}
            credits={credits}
            before={creative.report}
            after={fixed?.report}
            onStart={() => void startFix()}
            onDownload={downloadFixed}
            onReset={reset}
          />
        ) : null}
      </aside>
    </section>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
