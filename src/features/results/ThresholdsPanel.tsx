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
      {/* Same column grid as Top countries: label | bar | count | pct, with the
          numbers right-aligned in their own columns so they line up. */}
      <ul className="space-y-2">
        {thresholds.map((t) => (
          <li key={t.mins} className="grid grid-cols-[5rem_1fr_3.5rem_4rem] items-center gap-3 text-sm">
            <span className="text-muted-foreground">≥ {t.mins} min</span>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${t.pct}%` }} />
            </div>
            <span className="tabular-nums text-right">{t.count}</span>
            <span className="tabular-nums text-right text-muted-foreground">{t.pct}%</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
