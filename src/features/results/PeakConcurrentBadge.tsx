import { Card } from "@/components/ui/card";
import { strings } from "@/constants/strings";
import type { AggregateStats } from "@/types/report";

interface Props { peak?: AggregateStats["peak"]; }

export function PeakConcurrentBadge({ peak }: Props) {
  if (!peak) return null;
  return (
    <Card className="flex flex-col items-center justify-center gap-2 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {strings.results.panels.peak}
      </h3>
      <p className="text-3xl font-semibold text-primary">{peak.count.toLocaleString("fr-FR")}</p>
      <p className="text-sm text-muted-foreground">
        {strings.results.panels.peakAt.replace("%time", peak.at)}
      </p>
    </Card>
  );
}
