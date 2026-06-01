export type FileStatus = "ok" | "invalid";

export interface InspectResult {
  filename: string;
  status: FileStatus;
  detected_date: string | null;
  topic: string | null;
  webinar_id: string | null;
  attendee_count: number;
  error: string | null;
}

export interface InspectResponse {
  files: InspectResult[];
}

export interface Grouping {
  days: string[][];
  unassigned: string[];
}

export interface GenerateConfig {
  topic: string;
  thresholds: number[];
  days: { filenames: string[] }[];
}

export type WizardStep = "upload" | "grouping" | "options" | "generate";
