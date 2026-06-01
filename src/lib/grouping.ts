import type { Grouping, InspectResult } from "@/types/report";

// detected_date is "DD/MM/YYYY"; produce a sortable key YYYYMMDD.
function dateKey(d: string): number {
  const [dd, mm, yyyy] = d.split("/");
  return Number(`${yyyy}${mm}${dd}`);
}

/**
 * Order files within a bucket so "main" files come first, then "chinese",
 * then anything else (stable for files with neither marker). Matches the
 * desktop tool's Main → Chinese ordering, and is applied consistently in
 * the Upload list, day buckets, and the generated XLSX.
 */
export function compareRoomFilenames(a: string, b: string): number {
  const rank = (f: string): number => {
    const low = f.toLowerCase();
    if (low.includes("main")) return 0;
    if (low.includes("chinese")) return 1;
    return 2;
  };
  return rank(a) - rank(b);
}

export function groupByDate(results: InspectResult[]): Grouping {
  const byDate = new Map<string, string[]>();
  const unassigned: string[] = [];
  for (const res of results) {
    if (res.detected_date) {
      const list = byDate.get(res.detected_date) ?? [];
      list.push(res.filename);
      byDate.set(res.detected_date, list);
    } else {
      unassigned.push(res.filename);
    }
  }
  const days = [...byDate.entries()]
    .sort((a, b) => dateKey(a[0]) - dateKey(b[0]))
    .map(([, files]) => [...files].sort(compareRoomFilenames));
  return { days, unassigned: [...unassigned].sort(compareRoomFilenames) };
}

export type Bucket = { kind: "day"; index: number } | { kind: "unassigned" };

export function moveFile(g: Grouping, filename: string, to: Bucket): Grouping {
  // Guard against a stale/out-of-range target index from the UI: no-op rather
  // than throwing on a non-existent day bucket.
  if (to.kind === "day" && (to.index < 0 || to.index >= g.days.length)) {
    return g;
  }
  const days = g.days.map((d) => d.filter((f) => f !== filename));
  let unassigned = g.unassigned.filter((f) => f !== filename);
  if (to.kind === "day") {
    days[to.index] = [...days[to.index], filename];
  } else {
    unassigned = [...unassigned, filename];
  }
  return { days, unassigned };
}

export function addDay(g: Grouping): Grouping {
  return { ...g, days: [...g.days, []] };
}

export function toGenerateDays(g: Grouping): { filenames: string[] }[] {
  return g.days.filter((d) => d.length > 0).map((filenames) => ({ filenames }));
}
