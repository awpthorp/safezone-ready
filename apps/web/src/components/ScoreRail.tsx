import {
  buyerPlacementLabel,
  describePlacementIssue,
  type Grade,
  type PlacementId,
  type PlacementScore,
  type ScoreReport,
} from "@safezone-ready/safezone-specs";
import { Badge } from "@/components/ui/badge";
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
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-balance sm:text-sm">Will they cover it?</h2>
          <Badge variant={GRADE_VARIANT[report.grade]}>{GRADE_LABEL[report.grade]}</Badge>
        </div>
        <p className="mt-2 font-mono text-5xl font-medium tracking-tight tabular-nums">{report.overall}</p>
        <p className="mt-1 text-base/7 text-muted-foreground sm:text-sm/6">
          {report.width} × {report.height}
        </p>
        {report.placements.some((p) => p.confidence === "low") ? (
          <p className="mt-2 text-pretty text-base/7 text-caution sm:text-sm/6">
            We could not read every edge on this still. Treat the score as a first look.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col divide-y divide-zinc-950/10 overflow-hidden rounded-(--radius) ring-1 ring-zinc-950/10">
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
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-3 text-left",
        active ? "bg-muted" : "bg-white",
      )}
    >
      <div className="min-w-0">
        <p className="text-base/7 font-medium sm:text-sm/6">{buyerPlacementLabel(placement.placementId)}</p>
        <p className="text-base/6 text-muted-foreground sm:text-sm/5">{describePlacementIssue(placement)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={GRADE_VARIANT[placement.grade]}>{GRADE_LABEL[placement.grade]}</Badge>
        <span className="w-8 shrink-0 text-right font-mono text-base tabular-nums sm:text-sm">
          {placement.score}
        </span>
      </div>
    </button>
  );
}
