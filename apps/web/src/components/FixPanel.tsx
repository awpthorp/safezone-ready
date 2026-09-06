import type { ScoreReport } from "@safezone-ready/safezone-specs";
import { Download } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { posterlyDownloadLink } from "@/lib/utils";

export type FixPhase = "idle" | "auth" | "running" | "done" | "paywall";

interface FixPanelProps {
  phase: FixPhase;
  credits: number;
  kind?: "image" | "video";
  before?: ScoreReport;
  after?: ScoreReport;
  onStart: () => void;
  onDownload: () => void;
  onReset: () => void;
}

export function FixPanel({
  phase,
  credits,
  kind = "image",
  before,
  after,
  onStart,
  onDownload,
  onReset,
}: FixPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Move the offer out of the cover</CardTitle>
        <CardDescription>
          Keep the price, the logo, and the button. Two free edits, then a pack.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {kind === "video" ? (
          <p className="text-base/7 text-muted-foreground sm:text-sm/6">
            AI edits are for stills. This video check stays in your browser.
          </p>
        ) : null}

        {kind === "image" && phase === "idle" ? (
          <>
            <p className="text-base/7 text-muted-foreground sm:text-sm/6">
              The score already ran in your browser. Sign in only if you want an AI edit that shifts the still.
            </p>
            <Button onClick={onStart}>Fix this still</Button>
            <p className="text-base/7 text-muted-foreground sm:text-sm/6">
              {credits} free {credits === 1 ? "edit" : "edits"} left on this demo account.
            </p>
          </>
        ) : null}

        {kind === "image" && phase === "auth" ? <Alert>Signing you in…</Alert> : null}

        {kind === "image" && phase === "running" ? (
          <Alert>Moving the offer so captions cannot sit on it.</Alert>
        ) : null}

        {kind === "image" && phase === "paywall" ? (
          <>
            <Alert>
              You have used both free edits. Local checks stay free. Packs are £9 for 20 and £29
              for 80.
            </Alert>
            <Button variant="secondary" disabled>
              Buy a pack
            </Button>
          </>
        ) : null}

        {kind === "image" && phase === "done" && before && after ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md p-2 ring-1 ring-zinc-950/10">
                <p className="text-base text-muted-foreground sm:text-sm">Before</p>
                <p className="font-mono text-xl tabular-nums">{before.overall}</p>
              </div>
              <div className="rounded-md p-2 ring-1 ring-zinc-950/10">
                <p className="text-base text-muted-foreground sm:text-sm">After</p>
                <p className="font-mono text-xl tabular-nums">{after.overall}</p>
              </div>
            </div>
            <Alert>
              This preview is a stand-in until live edits are switched on. Live Gemini edits include
              a SynthID watermark.
            </Alert>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="pl-2 pr-3" onClick={onDownload}>
                <Download className="size-4 shrink-0" />
                Download this still
              </Button>
              <Button variant="outline" onClick={onReset}>
                Check another still
              </Button>
            </div>
            <p className="text-base/7 text-muted-foreground sm:text-sm/6">
              Need sizes or a schedule?{" "}
              <a className="underline underline-offset-2" href={posterlyDownloadLink()} target="_blank" rel="noreferrer">
                Open in posterly
              </a>
              . Separate product.
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
