import { useState } from "react";
import { Card } from "@/components/ui/card";
import { strings } from "@/constants/strings";
import type { CountryStat } from "@/types/report";

const COLLAPSED_N = 10;

interface Props { countries: CountryStat[]; }

export function CountriesPanel({ countries }: Props) {
  const [expanded, setExpanded] = useState(false);
  const maxCount = countries[0]?.count ?? 1;
  const overflow = countries.length - COLLAPSED_N;
  const shown = expanded ? countries : countries.slice(0, COLLAPSED_N);

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {strings.results.panels.topCountries}
      </h3>
      {/* Fixed columns keep every bar the same width and stack the counts /
          percentages into their own right-aligned columns. */}
      <ul className="space-y-2">
        {shown.map((c) => (
          <li
            key={c.name}
            className="grid grid-cols-[8rem_1fr_3rem_4rem] items-center gap-3 text-sm"
          >
            <span className="truncate">{c.name}</span>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${(c.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="tabular-nums text-right">{c.count}</span>
            <span className="tabular-nums text-right text-muted-foreground">{c.pct}%</span>
          </li>
        ))}
      </ul>
      {overflow > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-xs font-medium text-primary hover:underline"
        >
          {expanded
            ? strings.results.panels.showLess
            : strings.results.panels.moreCountries.replace("%n", String(overflow))}
        </button>
      )}
    </Card>
  );
}
