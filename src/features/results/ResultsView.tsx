import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { strings } from "@/constants/strings";
import type { AggregateStats } from "@/types/report";
import { TopLineStats } from "./TopLineStats";
import { CountriesPanel } from "./CountriesPanel";
import { ThresholdsPanel } from "./ThresholdsPanel";
import { PerDayChart } from "./PerDayChart";
import { EngagementHistogram } from "./EngagementHistogram";
import { RetentionCurve } from "./RetentionCurve";
import { PeakConcurrentBadge } from "./PeakConcurrentBadge";
import { RoomStatsTable } from "./RoomStatsTable";

interface Props {
  stats: AggregateStats;
  readOnly?: boolean;
  onStartOver: () => void;
  onDownload: () => void;
  onShare: () => void;
}

export function ResultsView({ stats, readOnly, onStartOver, onDownload, onShare }: Props) {
  const multiDay = (stats.perDay?.length ?? 0) > 1;
  return (
    <Card className="mx-auto max-w-5xl rounded-2xl border border-border/70 bg-card p-6 shadow-xl shadow-primary/8 sm:p-10">
      <header className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{stats.title || strings.results.title}</h2>
          {stats.days[0]?.date && (
            <p className="text-sm text-muted-foreground">{stats.days[0].date}</p>
          )}
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button onClick={onDownload}>⬇ {strings.results.download}</Button>
            <Button variant="outline" onClick={onShare}>🔗 {strings.results.share}</Button>
          </div>
        )}
      </header>

      <section className="mb-6"><TopLineStats topLine={stats.topLine} /></section>

      {multiDay ? (
        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PerDayChart perDay={stats.perDay!} />
          <CountriesPanel countries={stats.countries} />
        </section>
      ) : (
        // No per-day chart to sit beside it → let the countries list use the full width.
        <section className="mb-6">
          <CountriesPanel countries={stats.countries} />
        </section>
      )}

      <section className="mb-6">
        <ThresholdsPanel thresholds={stats.thresholds} />
      </section>

      <section className="mb-6">
        <EngagementHistogram histogram={stats.histogram} />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><RetentionCurve retention={stats.retention} /></div>
        <PeakConcurrentBadge peak={stats.peak} />
      </section>

      <section className="mb-2">
        <RoomStatsTable rooms={stats.rooms} />
      </section>

      <footer className="mt-8 flex justify-center">
        {readOnly ? (
          <a href={typeof window !== "undefined" ? window.location.pathname : "/app/"} className="text-sm text-primary hover:underline">
            {strings.results.createOwn}
          </a>
        ) : (
          <Button variant="ghost" onClick={onStartOver}>↺ {strings.results.startOver}</Button>
        )}
      </footer>
    </Card>
  );
}
