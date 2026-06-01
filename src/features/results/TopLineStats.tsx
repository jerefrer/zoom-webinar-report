import { Card } from "@/components/ui/card";
import { strings } from "@/constants/strings";
import type { AggregateStats } from "@/types/report";

interface Props { topLine: AggregateStats["topLine"]; }

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

export function TopLineStats({ topLine }: Props) {
  const items = [
    { value: fmt(topLine.unique),    label: strings.results.topLine.unique },
    { value: fmt(topLine.countries), label: strings.results.topLine.countries },
    { value: `${fmt(topLine.avg)} m`,    label: strings.results.topLine.avg },
    { value: `${fmt(topLine.median)} m`, label: strings.results.topLine.median },
    { value: `${fmt(topLine.max)} m`,    label: strings.results.topLine.max },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map((it) => (
        <Card key={it.label} className="flex flex-col items-center gap-1 p-4">
          <span className="text-2xl font-semibold text-primary">{it.value}</span>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{it.label}</span>
        </Card>
      ))}
    </div>
  );
}
