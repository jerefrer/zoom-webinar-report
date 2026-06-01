import { Card } from "@/components/ui/card";
import { strings } from "@/constants/strings";
import type { ThresholdStat } from "@/types/report";

interface Props { thresholds: ThresholdStat[]; }

export function ThresholdsPanel({ thresholds }: Props) {
  if (thresholds.length === 0) return null;
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {strings.results.panels.thresholds}
      </h3>
      <ul className="space-y-2">
        {thresholds.map((t) => (
          <li key={t.mins} className="grid grid-cols-[80px_1fr_auto] items-center gap-3 text-sm">
            <span className="text-muted-foreground">≥ {t.mins} min</span>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${t.pct}%` }} />
            </div>
            <span className="tabular-nums text-muted-foreground">
              {t.count} · {t.pct}%
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
