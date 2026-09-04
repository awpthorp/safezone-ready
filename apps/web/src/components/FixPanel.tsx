import type { ScoreReport } from "@safezone-ready/safezone-specs";
import { Download, Sparkles } from "lucide-react";
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
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Make this safe-zone ready
        </CardTitle>
        <CardDescription>
          AI edit via Google Gemini. It must keep offer text, logos, and CTAs. Two complimentary
          fixes per account, then credit packs.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {phase === "idle" ? (
          <>
            <p className="text-sm text-muted-foreground">
              Local checks stay free and never leave this browser. An AI fix signs you in with
              Google first. That is the main spam control.
            </p>
            <Button onClick={onStart}>Sign in and run an AI fix</Button>
            <p className="text-xs text-muted-foreground">{credits} complimentary fixes remaining on this demo account.</p>
          </>
        ) : null}

        {phase === "auth" ? (
          <Alert>
            Google OAuth is stubbed in this workspace. No live client secret is configured. The
            demo continues as if you signed in.
          </Alert>
        ) : null}

        {phase === "running" ? (
          <Alert>Analysing, planning, editing, verifying, then rescoring. Flash first, Pro once if needed.</Alert>
        ) : null}

        {phase === "paywall" ? (
          <>
            <Alert>
              You have used your 2 complimentary AI fixes. Buy a credit pack to keep going. Local
              checks stay free. Pack prices are hypotheses: £9 / 20 and £29 / 80.
            </Alert>
            <Button variant="secondary" disabled>
              Checkout (Stripe test mode not configured)
            </Button>
          </>
        ) : null}

        {phase === "done" && before && after ? (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md border border-border p-2">
                <p className="text-xs text-muted-foreground">Before</p>
                <p className="font-mono text-xl">{before.overall}</p>
              </div>
              <div className="rounded-md border border-border p-2">
                <p className="text-xs text-muted-foreground">After (mocked)</p>
                <p className="font-mono text-xl">{after.overall}</p>
              </div>
            </div>
            <Alert>
              Gemini outputs include a SynthID watermark. You cannot remove it in this product.
              This preview is a local mock until Worker secrets are set.
            </Alert>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={onDownload}>
                <Download className="h-4 w-4" />
                Download PNG
              </Button>
              <Button variant="outline" onClick={onReset}>
                Check another still
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Optional next step:{" "}
              <a className="underline underline-offset-2" href={posterlyDownloadLink()} target="_blank" rel="noreferrer">
                schedule or resize this still in Posterly
              </a>
              . Posterly is a separate product.
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
