import {
  DEFAULT_PLACEMENT_IDS,
  SPEC_VERSION,
  type PlacementId,
  type ScoreReport,
} from "@safezone-ready/safezone-specs";
import { ShieldCheck, Upload } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { FixPanel, type FixPhase } from "@/components/FixPanel";
import { OverlayCanvas } from "@/components/OverlayCanvas";
import { ScoreRail } from "@/components/ScoreRail";
import { Alert, AlertError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { analyseImage, validateFile, validateImageSize } from "@/lib/analyse";
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

export function App() {
  const [creative, setCreative] = useState<LoadedCreative | null>(null);
  const [fixed, setFixed] = useState<LoadedCreative | null>(null);
  const [activeId, setActiveId] = useState<PlacementId>("combined");
  const [showOverlay, setShowOverlay] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<FixPhase>("idle");
  const [credits, setCredits] = useState(2);
  const [dragOver, setDragOver] = useState(false);

  const displayImage = fixed?.image ?? creative?.image;
  const displayReport = fixed?.report ?? creative?.report;

  const onFile = useCallback(async (file: File | undefined) => {
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
      setActiveId("combined");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    } finally {
      setBusy(false);
    }
  }, []);

  const loadSample = useCallback(async () => {
    setBusy(true);
    setError(null);
    setFixed(null);
    setPhase("idle");
    try {
      const sample = await canvasToImage(drawSampleCreative);
      const { report } = analyseImage(sample.image, DEFAULT_PLACEMENT_IDS);
      setCreative({ ...sample, report });
      setActiveId("combined");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build the sample still.");
    } finally {
      setBusy(false);
    }
  }, []);

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
      setError(err instanceof Error ? err.message : "The mocked fix failed.");
      setPhase("idle");
    }
  }, [creative, credits]);

  const downloadFixed = useCallback(() => {
    if (!fixed) {
      return;
    }
    const link = document.createElement("a");
    link.href = fixed.url;
    link.download = "safezone-ready-mock.png";
    link.click();
  }, [fixed]);

  const reset = useCallback(() => {
    setCreative(null);
    setFixed(null);
    setPhase("idle");
    setError(null);
  }, []);

  const hint = useMemo(() => {
    if (!displayReport) {
      return null;
    }
    const worst = displayReport.placements.slice().sort((a, b) => a.score - b.score)[0];
    if (!worst || worst.score >= 85) {
      return "This still looks clear of the practical chrome bands. Still preview it in Ads Manager before you spend.";
    }
    return `${worst.label} is the tightest placement. Move offer text into the dashed rectangle.`;
  }, [displayReport]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Safe Zone Ready</p>
              <p className="text-xs text-muted-foreground">Multi-platform ads · local overlay check</p>
            </div>
          </div>
          <p className="max-w-md text-xs text-muted-foreground sm:text-right">
            Not affiliated with Meta, Google, or TikTok. Overlays are approximate guardrails
            (pack {SPEC_VERSION}).
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <section className="flex flex-col gap-4">
          {!creative ? (
            <label
              className={`flex min-h-[22rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${
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
              <Upload className="h-8 w-8 text-primary" />
              <div>
                <p className="text-base font-medium">Drop a still to score it</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  PNG, JPEG, or WebP. The file stays in this tab. Nothing is uploaded for a check.
                </p>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  void loadSample();
                }}
              >
                {busy ? "Preparing…" : "Use a sample still"}
              </Button>
            </label>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="truncate text-sm text-muted-foreground">{creative.fileName}</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowOverlay((v) => !v)}>
                    {showOverlay ? "Hide overlay" : "Show overlay"}
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

          {error ? <AlertError>{error}</AlertError> : null}
          {busy && creative ? <Alert>Scoring in this browser…</Alert> : null}
        </section>

        <aside className="flex flex-col gap-4">
          {displayReport ? (
            <ScoreRail report={displayReport} activeId={activeId} onSelect={setActiveId} />
          ) : (
            <Alert>
              Unlimited local checks. Sign in is only required when you want Gemini to move the
              offer into the safe rectangle.
            </Alert>
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

          <LegalNotes />
        </aside>
      </main>
    </div>
  );
}

function LegalNotes() {
  return (
    <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
      <p>
        Scores estimate where interface chrome may cover your creative. Device size, caption
        length, and A/B tests can move those elements. This is not legal, brand-safety, or policy
        approval. Always preview in the official ads manager before you spend.
      </p>
      <p>
        AI-edited images are generated with Google Gemini and include a SynthID watermark. Local
        checks never upload your file. An AI fix stores the image for at most 72 hours.
      </p>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
