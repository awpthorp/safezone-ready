import type { Grade, PlacementId, PlacementScore, ScoreReport } from "@safezone-ready/safezone-specs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const GRADE_LABEL: Record<Grade, string> = {
  ready: "Ready",
  caution: "Caution",
  at_risk: "At risk",
};

const GRADE_VARIANT: Record<Grade, "ready" | "caution" | "risk"> = {
  ready: "ready",
  caution: "caution",
  at_risk: "risk",
};

interface ScoreRailProps {
  report: ScoreReport;
  activeId: PlacementId;
  onSelect: (id: PlacementId) => void;
}

export function ScoreRail({ report, activeId, onSelect }: ScoreRailProps) {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Overall (strictest)</CardTitle>
            <Badge variant={GRADE_VARIANT[report.grade]}>{GRADE_LABEL[report.grade]}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-4xl font-medium tracking-tight">{report.overall}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {report.width} × {report.height} · guardrail pack {report.specVersion}
          </p>
          {report.placements.some((p) => p.confidence === "low") ? (
            <p className="mt-2 text-xs text-caution">
              Overlay only on some placements. We have not measured ink in every danger band yet.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-2">
        {report.placements.map((placement) => (
          <ScoreRow
            key={placement.placementId}
            placement={placement}
            active={placement.placementId === activeId}
            onSelect={() => onSelect(placement.placementId)}
          />
        ))}
      </div>
    </div>
  );
}

function ScoreRow({
  placement,
  active,
  onSelect,
}: {
  placement: PlacementScore;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors",
        active ? "border-primary bg-accent" : "border-border bg-card hover:bg-accent/60",
      )}
    >
      <div>
        <p className="text-sm font-medium">{placement.label}</p>
        <p className="text-xs text-muted-foreground">
          {placement.aspectFit ? "Ratio fits" : "Ratio is off"}
          {placement.occupancyPenalty > 0 ? ` · ink in chrome ${placement.occupancyPenalty}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={GRADE_VARIANT[placement.grade]}>{GRADE_LABEL[placement.grade]}</Badge>
        <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums">{placement.score}</span>
      </div>
    </button>
  );
}
