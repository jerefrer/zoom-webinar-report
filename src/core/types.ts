// ──────────────────────────────────────────────────────────────────────────
// Inputs (per-source = one Zoom CSV uploaded by the user)
// ──────────────────────────────────────────────────────────────────────────

/** Raw attendee row as parsed from a Zoom CSV (one row per join/rejoin session). */
export interface AttendeeRow {
  name: string;          // "User Name (Original Name)"
  email: string;         // may be ""
  joinTime: string;      // raw string from Zoom — parsed when needed
  leaveTime: string;
  durationMinutes: number;
  isGuest: string;       // "Yes" / "No" / "" — preserved as-is
  country: string;
}

/** Metadata extracted from a Zoom CSV's preamble (Topic, Webinar ID, etc.). */
export interface ParsedMeta {
  topic: string;
  webinarId: string;
  actualStartTime: string;    // raw Zoom string, e.g. "05/12/2026 09:00:00 AM"
  actualDurationMinutes: string;
  totalUsers: string;
  uniqueViewers: string;
  generatedTime: string;
}

/** Output of parsing a single CSV. */
export interface ParsedReport {
  meta: ParsedMeta;
  hosts: AttendeeRow[];
  panelists: AttendeeRow[];
  attendees: AttendeeRow[];
}

// ──────────────────────────────────────────────────────────────────────────
// Processed (after dedup + combine, before rendering)
// ──────────────────────────────────────────────────────────────────────────

/** A single source after dedup, with its meta and a stable label. */
export interface ProcessedSource {
  attendees: AttendeeRow[];   // deduplicated (Alice rejoins → 1 row)
  meta: ParsedMeta;
  roomLabel: string;
}

/** A day groups one or more sources (e.g. Main Room + Chinese Room on the same date). */
export interface ProcessedDay {
  sources: ProcessedSource[];
}

// ──────────────────────────────────────────────────────────────────────────
// Aggregated output (the data the dashboard renders and the share URL encodes)
// ──────────────────────────────────────────────────────────────────────────

export interface CountryStat {
  name: string;       // "United States", "France", "Unknown"…
  count: number;
  pct: number;        // 0–100, rounded to 1 decimal
}

export interface ThresholdStat {
  mins: number;       // 40, 60, …
  count: number;      // attendees who watched ≥ mins
  pct: number;        // count / totalUnique * 100
}

export interface HistogramBucket {
  label: string;      // "0–15", "15–30", "30–60", "60–90", "90–120", "120+"
  minMin: number;
  maxMin: number | null; // null for the open-ended top bucket
  count: number;
}

export interface RetentionPoint {
  tMinutes: number;
  pctRemaining: number;  // 0–100, rounded to 1 decimal
}

export interface PerDayStat {
  dayIdx: number;       // 0-based
  label: string;        // e.g. "Day 1" or "26/05/2026"
  unique: number;       // unique attendees on that day
}

export interface RoomStatRow {
  dayLabel: string;     // full date "26/05/2026" or empty when single-day
  roomLabel: string;    // "Main Room", "Chinese Room", or filename stem
  webinarId: string;
  uniqueAttendees: number;
  totalUsersZoom: string;     // raw from meta
  uniqueViewersZoom: string;  // raw from meta
  durationMinutesZoom: string;// raw from meta
}

export interface AggregateStats {
  title: string;
  generatedAt: string;                  // ISO date of report build (now)
  days: { label: string; date: string }[];
  rooms: RoomStatRow[];
  topLine: {
    unique: number;
    countries: number;
    avg: number;
    median: number;
    max: number;
  };
  countries: CountryStat[];
  thresholds: ThresholdStat[];
  perDay?: PerDayStat[];                // only when more than one day
  histogram: HistogramBucket[];
  retention?: RetentionPoint[];
  peak?: { count: number; at: string }; // "HH:MM" 24-hour
}

// ──────────────────────────────────────────────────────────────────────────
// Shareable payload (subset of AggregateStats, serialised to URL hash)
// ──────────────────────────────────────────────────────────────────────────

export interface ShareableReport {
  v: 1;
  title: string;
  generatedAt: string;
  days: { label: string; date: string }[];
  rooms: { dayIdx: number; label: string; webinarId: string }[];
  topLine: AggregateStats["topLine"];
  thresholds: ThresholdStat[];
  countries: CountryStat[];
  perDay?: PerDayStat[];
  histogram: HistogramBucket[];
  retention?: RetentionPoint[];
  peak?: AggregateStats["peak"];
}
