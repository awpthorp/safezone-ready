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
  before?: ScoreReport;
  after?: ScoreReport;
  onStart: () => void;
  onDownload: () => void;
  onReset: () => void;
}

export function FixPanel({ phase, credits, before, after, onStart, onDownload, onReset }: FixPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Move the offer out of the cover</CardTitle>
        <CardDescription>
          Keep the price, the logo, and the button. Two free edits, then a pack.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {phase === "idle" ? (
          <>
            <p className="text-sm text-muted-foreground">
              Checks stay on this computer. Sign in only if you want us to shift the still.
            </p>
            <Button onClick={onStart}>Fix this still</Button>
            <p className="text-xs text-muted-foreground">
              {credits} free {credits === 1 ? "edit" : "edits"} left on this demo account.
            </p>
          </>
        ) : null}

        {phase === "auth" ? <Alert>Signing you in…</Alert> : null}

        {phase === "running" ? (
          <Alert>Moving the offer so captions cannot sit on it.</Alert>
        ) : null}

        {phase === "paywall" ? (
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

        {phase === "done" && before && after ? (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md border border-border p-2">
                <p className="text-xs text-muted-foreground">Before</p>
                <p className="font-mono text-xl tabular-nums">{before.overall}</p>
              </div>
              <div className="rounded-md border border-border p-2">
                <p className="text-xs text-muted-foreground">After</p>
                <p className="font-mono text-xl tabular-nums">{after.overall}</p>
              </div>
            </div>
            <Alert>This preview is a stand-in until live edits are switched on.</Alert>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={onDownload}>
                <Download className="h-4 w-4" />
                Download this still
              </Button>
              <Button variant="outline" onClick={onReset}>
                Check another still
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Need sizes or a schedule?{" "}
              <a className="underline underline-offset-2" href={posterlyDownloadLink()} target="_blank" rel="noreferrer">
                Open in Posterly
              </a>
              . Separate product.
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
