import type {
  AttendeeRow,
  AggregateStats,
  ProcessedDay,
  RoomStatRow,
  CountryStat,
  ThresholdStat,
  PerDayStat,
} from "./types";
import { combineAttendees, parseDateTime } from "./processor";

export interface AggregateInput {
  title: string;
  thresholds: number[];        // e.g. [40, 60]
  days: ProcessedDay[];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function extractFullDate(rawStartTime: string): string {
  if (!rawStartTime) return "";
  let m = rawStartTime.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return `${pad(m[1])}/${pad(m[2])}/${m[3]}`;
  m = rawStartTime.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${pad(m[2])}/${pad(m[1])}/${m[3]}`;
  return "";
}

function pad(s: string): string {
  return s.length === 1 ? `0${s}` : s;
}

function countryCountsFrom(rows: AttendeeRow[]): CountryStat[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const c = r.country.trim() || "Unknown";
    map.set(c, (map.get(c) ?? 0) + 1);
  }
  const total = rows.length;
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return entries.map(([name, count]) => ({
    name,
    count,
    pct: total ? round1((count / total) * 100) : 0,
  }));
}

function avgMinutes(rows: AttendeeRow[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((s, r) => s + r.durationMinutes, 0);
  return round1(sum / rows.length);
}

function medianMinutes(rows: AttendeeRow[]): number {
  if (rows.length === 0) return 0;
  const sorted = [...rows].map((r) => r.durationMinutes).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? round1(sorted[mid]) : round1((sorted[mid - 1] + sorted[mid]) / 2);
}

function maxMinutes(rows: AttendeeRow[]): number {
  let m = 0;
  for (const r of rows) if (r.durationMinutes > m) m = r.durationMinutes;
  return m;
}

const HISTOGRAM_BUCKETS: Array<{ label: string; min: number; max: number | null }> = [
  { label: "0–15",   min: 0,   max: 15 },
  { label: "15–30",  min: 15,  max: 30 },
  { label: "30–60",  min: 30,  max: 60 },
  { label: "60–90",  min: 60,  max: 90 },
  { label: "90–120", min: 90,  max: 120 },
  { label: "120+",   min: 120, max: null },
];

function buildHistogram(rows: AttendeeRow[]) {
  const buckets = HISTOGRAM_BUCKETS.map((b) => ({
    label: b.label,
    minMin: b.min,
    maxMin: b.max,
    count: 0,
  }));
  for (const r of rows) {
    const d = r.durationMinutes;
    for (const b of buckets) {
      if (b.maxMin === null) {
        if (d >= b.minMin) { b.count++; break; }
      } else if (d >= b.minMin && d < b.maxMin) {
        b.count++;
        break;
      }
    }
  }
  return buckets;
}

export function aggregate(input: AggregateInput): AggregateStats {
  const numDays = input.days.length;
  const allSources = input.days.flatMap((d) => d.sources);

  const combined = combineAttendees(allSources.map((s) => s.attendees));

  const perDayCombined = input.days.map((d) =>
    combineAttendees(d.sources.map((s) => s.attendees)),
  );

  const days = input.days.map((d, i) => {
    const firstMeta = d.sources[0]?.meta;
    return {
      label: numDays > 1 ? `Day ${i + 1}` : (extractFullDate(firstMeta?.actualStartTime ?? "") || ""),
      date: extractFullDate(firstMeta?.actualStartTime ?? ""),
    };
  });

  const rooms: RoomStatRow[] = [];
  input.days.forEach((d, dayIdx) => {
    d.sources.forEach((s) => {
      rooms.push({
        dayLabel: extractFullDate(s.meta.actualStartTime),
        roomLabel: s.roomLabel,
        webinarId: s.meta.webinarId,
        uniqueAttendees: s.attendees.length,
        totalUsersZoom: s.meta.totalUsers,
        uniqueViewersZoom: s.meta.uniqueViewers,
        durationMinutesZoom: s.meta.actualDurationMinutes,
      });
      void dayIdx;
    });
  });

  const countries = countryCountsFrom(combined);

  const thresholds: ThresholdStat[] = input.thresholds
    .map((mins) => {
      const count = combined.filter((r) => r.durationMinutes >= mins).length;
      return {
        mins,
        count,
        pct: combined.length ? round1((count / combined.length) * 100) : 0,
      };
    })
    .sort((a, b) => a.mins - b.mins);

  const perDay: PerDayStat[] | undefined =
    numDays > 1
      ? perDayCombined.map((rows, i) => ({
          dayIdx: i,
          label: days[i].label,
          unique: rows.length,
        }))
      : undefined;

  return {
    title: input.title,
    generatedAt: "",
    days,
    rooms,
    topLine: {
      unique: combined.length,
      countries: countries.length,
      avg: avgMinutes(combined),
      median: medianMinutes(combined),
      max: maxMinutes(combined),
    },
    countries,
    thresholds,
    perDay,
    histogram: buildHistogram(combined),
    retention: buildRetention(combined),
    peak: buildPeak(combined),
  };
}

interface Interval { start: number; end: number; }

function intervalsOf(rows: AttendeeRow[]): Interval[] {
  const intervals: Interval[] = [];
  for (const r of rows) {
    const s = parseDateTime(r.joinTime);
    const e = parseDateTime(r.leaveTime);
    if (s && e && e.getTime() >= s.getTime()) {
      intervals.push({ start: s.getTime(), end: e.getTime() });
    }
  }
  return intervals;
}

function buildRetention(rows: AttendeeRow[]) {
  const intervals = intervalsOf(rows);
  if (intervals.length === 0) return undefined;
  const earliestStart = Math.min(...intervals.map((i) => i.start));
  const latestEnd = Math.max(...intervals.map((i) => i.end));
  const totalMs = latestEnd - earliestStart;
  if (totalMs <= 0) return undefined;
  const totalMinutes = totalMs / 60000;

  const STEP = totalMinutes > 240 ? 10 : totalMinutes > 60 ? 5 : 1;
  const points = [];
  for (let t = 0; t <= totalMinutes; t += STEP) {
    const tMs = earliestStart + t * 60000;
    const stillIn = intervals.filter((iv) => iv.start <= tMs && tMs < iv.end).length;
    const pct = round1((stillIn / rows.length) * 100);
    points.push({ tMinutes: Math.round(t), pctRemaining: pct });
  }
  return points;
}

function buildPeak(rows: AttendeeRow[]) {
  const intervals = intervalsOf(rows);
  if (intervals.length === 0) return undefined;
  const events: { t: number; delta: number }[] = [];
  for (const iv of intervals) {
    events.push({ t: iv.start, delta: +1 });
    events.push({ t: iv.end,   delta: -1 });
  }
  events.sort((a, b) => a.t - b.t || a.delta - b.delta);
  let cur = 0, peak = 0, peakAt = events[0].t;
  for (const e of events) {
    cur += e.delta;
    if (cur > peak) { peak = cur; peakAt = e.t; }
  }
  const d = new Date(peakAt);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return { count: peak, at: `${hh}:${mm}` };
}

/** Used by xlsx.ts to recompute filtered country counts per threshold sheet. */
export function countriesFilteredBy(
  combined: AttendeeRow[],
  thresholdMins: number,
): CountryStat[] {
  return countryCountsFrom(combined.filter((r) => r.durationMinutes >= thresholdMins));
}

/** Re-export the combined-for-everything helper for callers that need it. */
export function combinedFor(input: AggregateInput): AttendeeRow[] {
  return combineAttendees(input.days.flatMap((d) => d.sources.map((s) => s.attendees)));
}

/** Re-export per-day combined; index aligns with input.days. */
export function perDayCombinedFor(input: AggregateInput): AttendeeRow[][] {
  return input.days.map((d) => combineAttendees(d.sources.map((s) => s.attendees)));
}
