import {
  DEFAULT_PLACEMENT_IDS,
  describeReportHint,
  type PlacementId,
  type ScoreReport,
} from "@safezone-ready/safezone-specs";
import { useCallback, useMemo, useRef, useState } from "react";
import { FixPanel, type FixPhase } from "@/components/FixPanel";
import { OverlayCanvas } from "@/components/OverlayCanvas";
import { ScoreRail } from "@/components/ScoreRail";
import { Alert, AlertError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { analyseImage, validateFile, validateImageSize } from "@/lib/analyse";
import { placementFromSearch, platformDeepLinkLabel } from "@/lib/platform";
import {
  canvasToImage,
  drawFixedCreative,
  drawSampleCreative,
  fileFromReader,
  loadImage,
} from "@/lib/sampleCreative";

interface LoadedCreative {
  image: HTMLImageElement;
  url: string;
  fileName: string;
  report: ScoreReport;
}

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
  const [phase, setPhase] = useState<FixPhase>("idle");
  const [credits, setCredits] = useState(2);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayImage = fixed?.image ?? creative?.image;
  const displayReport = fixed?.report ?? creative?.report;

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file) {
        return;
      }
      const typeError = validateFile(file);
      if (typeError) {
        setError(typeError);
        return;
      }
      setBusy(true);
      setError(null);
      setFixed(null);
      setPhase("idle");
      try {
        const dataUrl = await fileFromReader(file);
        const image = await loadImage(dataUrl);
        const sizeError = validateImageSize(image.width, image.height);
        if (sizeError) {
          setError(sizeError);
          return;
        }
        const { report } = analyseImage(image, DEFAULT_PLACEMENT_IDS);
        setCreative({ image, url: dataUrl, fileName: file.name, report });
        setActiveId(resolvePlacement(defaultPlacement));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not read that image.");
      } finally {
        setBusy(false);
      }
    },
    [defaultPlacement],
  );

  const loadSample = useCallback(async () => {
    setBusy(true);
    setError(null);
    setFixed(null);
    setPhase("idle");
    try {
      const sample = await canvasToImage(drawSampleCreative);
      const { report } = analyseImage(sample.image, DEFAULT_PLACEMENT_IDS);
      setCreative({ ...sample, report });
      setActiveId(resolvePlacement(defaultPlacement));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build the sample still.");
    } finally {
      setBusy(false);
    }
  }, [defaultPlacement]);

  const startFix = useCallback(async () => {
    if (!creative) {
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
      const { report } = analyseImage(sample.image, DEFAULT_PLACEMENT_IDS);
      setFixed({ ...sample, report });
      setCredits((n) => n - 1);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The edit failed. Try another still.");
      setPhase("idle");
    }
  }, [creative, credits]);

  const downloadFixed = useCallback(() => {
    if (!fixed) {
      return;
    }
    const link = document.createElement("a");
    link.href = fixed.url;
    link.download = "safezone-ready.png";
    link.click();
  }, [fixed]);

  const reset = useCallback(() => {
    setCreative(null);
    setFixed(null);
    setPhase("idle");
    setError(null);
  }, []);

  const hint = useMemo(() => (displayReport ? describeReportHint(displayReport) : null), [displayReport]);

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <div className="flex flex-col gap-4">
        {!creative ? (
          <div
            className={`flex min-h-[22rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${
              dragOver ? "border-primary bg-accent" : "border-border bg-card"
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
              <p className="text-base font-medium">Drop the ad still</p>
              <p className="mt-1 text-sm text-muted-foreground">
                See where Instagram, TikTok and YouTube sit on the offer. The file stays in this tab.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => fileInputRef.current?.click()}>
                Choose a file
              </Button>
              <Button type="button" variant="secondary" disabled={busy} onClick={() => void loadSample()}>
                {busy ? "Preparing…" : "Try a sample"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPEG or WebP.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="truncate text-sm text-muted-foreground">{creative.fileName}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setShowOverlay((v) => !v)}>
                  {showOverlay ? "Hide cover" : "Show cover"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={reset}>
                  Clear
                </Button>
              </div>
            </div>
            {displayImage ? (
              <OverlayCanvas image={displayImage} placementId={activeId} showOverlay={showOverlay} />
            ) : null}
            {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
          </>
        )}

        {deepLinkLabel && !creative ? <Alert>{deepLinkLabel}</Alert> : null}
        {error ? <AlertError>{error}</AlertError> : null}
        {busy && creative ? <Alert>Reading the still…</Alert> : null}
      </div>

      <aside className="flex flex-col gap-4">
        {displayReport ? (
          <ScoreRail report={displayReport} activeId={activeId} onSelect={setActiveId} />
        ) : (
          <Alert>Checks stay on this computer. Nothing uploads until you ask us to move the offer.</Alert>
        )}

        {creative ? (
          <FixPanel
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
