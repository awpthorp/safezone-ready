import {
  buyerPlacementLabel,
  describePlacementIssue,
  type Grade,
  type PlacementId,
  type PlacementScore,
  type ScoreReport,
} from "@safezone-ready/safezone-specs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const GRADE_LABEL: Record<Grade, string> = {
  ready: "Ready",
  caution: "Tight",
  at_risk: "Covered",
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
            <CardTitle>Will they cover it?</CardTitle>
            <Badge variant={GRADE_VARIANT[report.grade]}>{GRADE_LABEL[report.grade]}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-4xl font-medium tracking-tight tabular-nums">{report.overall}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {report.width} × {report.height}
          </p>
          {report.placements.some((p) => p.confidence === "low") ? (
            <p className="mt-2 text-xs text-caution">
              We could not read every edge on this still. Treat the score as a first look.
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
        "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
        active ? "border-primary bg-accent" : "border-border bg-card hover:bg-accent/60",
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{buyerPlacementLabel(placement.placementId)}</p>
        <p className="text-xs text-muted-foreground">{describePlacementIssue(placement)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={GRADE_VARIANT[placement.grade]}>{GRADE_LABEL[placement.grade]}</Badge>
        <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums">{placement.score}</span>
      </div>
    </button>
  );
}
