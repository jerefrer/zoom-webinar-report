import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { strings } from "@/constants/strings";
import type { AggregateStats } from "@/types/report";
import { TopLineStats } from "./TopLineStats";

interface Props {
  stats: AggregateStats;
  readOnly?: boolean;
  onStartOver: () => void;
  onDownload: () => void;
  onShare: () => void;
}

export function ResultsView({ stats, readOnly, onStartOver, onDownload, onShare }: Props) {
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

      <section className="mb-6">
        <TopLineStats topLine={stats.topLine} />
      </section>

      {/* Panels added in Tasks 19–24, composition wired in Task 25 */}

      <footer className="mt-8 flex justify-center">
        {readOnly ? (
          <a href="/app/" className="text-sm text-primary hover:underline">
            {strings.results.createOwn}
          </a>
        ) : (
          <Button variant="ghost" onClick={onStartOver}>↺ {strings.results.startOver}</Button>
        )}
      </footer>
    </Card>
  );
}
