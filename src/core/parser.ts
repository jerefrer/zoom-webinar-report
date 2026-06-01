import Papa from "papaparse";
import type { AttendeeRow, ParsedMeta, ParsedReport } from "./types";

const SECTION_MARKERS = new Set([
  "Host Details",
  "Panelist Details",
  "Attendee Details",
]);

const EMPTY_META: ParsedMeta = {
  topic: "",
  webinarId: "",
  actualStartTime: "",
  actualDurationMinutes: "",
  totalUsers: "",
  uniqueViewers: "",
  generatedTime: "",
};

function rowToAttendee(row: string[], headers: string[]): AttendeeRow {
  const get = (key: string): string => {
    const i = headers.indexOf(key);
    return i >= 0 && i < row.length ? row[i].trim() : "";
  };
  const dur = Number(get("Time in Session (minutes)"));
  return {
    name: get("User Name (Original Name)"),
    email: get("Email"),
    joinTime: get("Join Time"),
    leaveTime: get("Leave Time"),
    durationMinutes: Number.isFinite(dur) ? dur : 0,
    isGuest: get("Is Guest"),
    country: get("Country/Region Name"),
  };
}

function isEmptyRow(row: string[]): boolean {
  return row.every((c) => c.trim() === "");
}

export function parseZoomCsv(text: string): ParsedReport {
  // PapaParse handles quoting / commas-inside-quotes correctly.
  // We strip BOM ourselves so cell-by-cell comparisons are clean.
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const parsed = Papa.parse<string[]>(clean, { skipEmptyLines: false });
  const rows = parsed.data.map((r) => r.map((c) => (c ?? "").trim()));

  const meta: ParsedMeta = { ...EMPTY_META };
  const hosts: AttendeeRow[] = [];
  const panelists: AttendeeRow[] = [];
  const attendees: AttendeeRow[] = [];

  let currentSection: "Host Details" | "Panelist Details" | "Attendee Details" | null = null;
  let currentHeaders: string[] | null = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (isEmptyRow(row)) continue;
    const first = row[0] ?? "";

    if (first === "Attendee Report") continue;

    if (first === "Report generated time") {
      meta.generatedTime = row[1] ?? "";
      continue;
    }

    if (first === "Topic") {
      const webinarCols = row;
      let j = i + 1;
      while (j < rows.length && isEmptyRow(rows[j])) j++;
      if (j < rows.length) {
        const valuesRow = rows[j];
        for (let c = 0; c < webinarCols.length; c++) {
          const col = webinarCols[c];
          const value = valuesRow[c] ?? "";
          if (col === "Topic") meta.topic = value;
          else if (col === "Webinar ID") meta.webinarId = value;
          else if (col === "Actual Start Time") meta.actualStartTime = value;
          else if (col === "Actual Duration (minutes)") meta.actualDurationMinutes = value;
          else if (col === "Total Users") meta.totalUsers = value;
          else if (col === "Unique Viewers") meta.uniqueViewers = value;
        }
        i = j;
      }
      continue;
    }

    if (SECTION_MARKERS.has(first)) {
      currentSection = first as unknown as typeof currentSection;
      currentHeaders = null;
      let j = i + 1;
      while (j < rows.length && isEmptyRow(rows[j])) j++;
      if (j < rows.length) {
        currentHeaders = rows[j];
        i = j;
      }
      continue;
    }

    if (currentSection && currentHeaders) {
      const att = rowToAttendee(row, currentHeaders);
      if (currentSection === "Host Details") hosts.push(att);
      else if (currentSection === "Panelist Details") panelists.push(att);
      else attendees.push(att);
    }
  }

  return { meta, hosts, panelists, attendees };
}

/** Convenience: parse from an ArrayBuffer (e.g. `await file.arrayBuffer()`). */
export function parseZoomCsvBuffer(buf: ArrayBuffer): ParsedReport {
  return parseZoomCsv(new TextDecoder("utf-8", { fatal: false }).decode(buf));
}
