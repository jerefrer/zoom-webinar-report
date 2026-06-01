import { Card } from "@/components/ui/card";
import { strings } from "@/constants/strings";
import type { CountryStat } from "@/types/report";

const TOP_N = 10;

interface Props { countries: CountryStat[]; }

export function CountriesPanel({ countries }: Props) {
  const top = countries.slice(0, TOP_N);
  const overflow = countries.length - top.length;
  const maxCount = top[0]?.count ?? 1;

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {strings.results.panels.topCountries}
      </h3>
      <ul className="space-y-2">
        {top.map((c) => (
          <li key={c.name} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-28 truncate">{c.name}</span>
              <div className="h-2 flex-1 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${(c.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
            <span className="tabular-nums text-muted-foreground">
              {c.count} · {c.pct}%
            </span>
          </li>
        ))}
      </ul>
      {overflow > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {strings.results.panels.moreCountries.replace("%n", String(overflow))}
        </p>
      )}
    </Card>
  );
}
