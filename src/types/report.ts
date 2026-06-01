// Re-exports so feature components import "@/types/report" rather than
// reaching into core/. Keeps the layering boundary explicit.
export type {
  AttendeeRow,
  ParsedMeta,
  ParsedReport,
  ProcessedSource,
  ProcessedDay,
  CountryStat,
  ThresholdStat,
  HistogramBucket,
  RetentionPoint,
  PerDayStat,
  RoomStatRow,
  AggregateStats,
  ShareableReport,
} from "@/core/types";

export type WizardStep = "upload" | "grouping" | "options" | "results";

export interface InspectResult {
  filename: string;
  status: "ok" | "invalid";
  detected_date: string | null;
  topic: string | null;
  webinar_id: string | null;
  attendee_count: number;
  error: string | null;
}

export interface Grouping {
  days: string[][];
  unassigned: string[];
}
