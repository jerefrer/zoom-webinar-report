import * as XLSX from "xlsx";
import type { AggregateStats, CountryStat } from "./types";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export interface XlsxOptions {
  /** Per-threshold country breakdowns, keyed by threshold minutes.
   *  If omitted, the unfiltered country breakdown is used as a fallback. */
  filteredCountriesByThreshold?: Map<number, CountryStat[]>;
}

/**
 * Build the formatted XLSX as a Blob ready to download. Sheet layout matches
 * the v1 Python report (Summary / Countries / UbC / UbC_Nmin). SheetJS in the
 * free community build does not embed openpyxl-level cell styling, so this is
 * structural parity (sheets, headers, values, totals) — not pixel-perfect.
 */
export function buildXlsx(stats: AggregateStats, options: XlsxOptions = {}): Blob {
  const wb = XLSX.utils.book_new();

  // ── Summary ──────────────────────────────────────────────────────────────
  const summaryAOA: (string | number)[][] = [];
  summaryAOA.push([stats.title]);
  summaryAOA.push(["Zoom Webinar Attendance Report"]);
  summaryAOA.push([]);
  summaryAOA.push(["Report Generated", stats.generatedAt || new Date().toISOString()]);
  summaryAOA.push([]);
  summaryAOA.push(["Room Statistics"]);
  summaryAOA.push([
    "Day", "Room", "Webinar ID", "Unique Attendees",
    "Total Users (Zoom)", "Unique Viewers (Zoom)", "Duration (min)",
  ]);
  for (const r of stats.rooms) {
    summaryAOA.push([
      r.dayLabel, r.roomLabel, r.webinarId, r.uniqueAttendees,
      r.totalUsersZoom, r.uniqueViewersZoom, r.durationMinutesZoom,
    ]);
  }
  summaryAOA.push([
    "TOTAL", "", "",
    stats.rooms.reduce((s, r) => s + r.uniqueAttendees, 0),
    "", "", "",
  ]);
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAOA);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // ── Countries ────────────────────────────────────────────────────────────
  const countriesAOA: (string | number)[][] = [];
  countriesAOA.push([`List of countries during the ${stats.title}`]);
  countriesAOA.push([]);
  countriesAOA.push([]);
  countriesAOA.push(["No.", "Country"]);
  [...stats.countries]
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((c, i) => countriesAOA.push([i + 1, c.name]));
  const wsCountries = XLSX.utils.aoa_to_sheet(countriesAOA);
  XLSX.utils.book_append_sheet(wb, wsCountries, "Countries");

  // ── UbC (Users by Country) ───────────────────────────────────────────────
  const multiDay = (stats.perDay?.length ?? 0) > 1;
  XLSX.utils.book_append_sheet(wb, ubcSheet(stats, stats.countries, multiDay, null), "UbC");

  for (const t of stats.thresholds) {
    const filteredForT = options.filteredCountriesByThreshold?.get(t.mins) ?? stats.countries;
    XLSX.utils.book_append_sheet(
      wb,
      ubcSheet(stats, filteredForT, multiDay, t.mins),
      `UbC_${t.mins}min`,
    );
  }

  const ab = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Blob([ab], { type: XLSX_MIME });
}

function ubcSheet(
  stats: AggregateStats,
  countries: CountryStat[],
  multiDay: boolean,
  threshold: number | null,
) {
  const title = threshold
    ? `List of users by country during the ${stats.title} (those who stayed more than ${threshold} minutes in total)`
    : `List of users by country during the ${stats.title}`;
  const aoa: (string | number)[][] = [];
  aoa.push([title]);
  aoa.push([]);
  aoa.push([]);
  if (multiDay) {
    const dayLabels = stats.days.map((d) => d.label);
    aoa.push(["No.", "Country/Region Name", ...dayLabels, "Total"]);
    countries.forEach((c, i) => {
      const cells: (string | number)[] = [i + 1, c.name];
      for (let d = 0; d < stats.days.length; d++) cells.push("");
      cells.push(c.count);
      aoa.push(cells);
    });
    aoa.push(["", "Total", ...stats.days.map(() => ""), countries.reduce((s, c) => s + c.count, 0)]);
  } else {
    aoa.push(["No.", "Countries", "Users", "%"]);
    countries.forEach((c, i) => {
      aoa.push([i + 1, c.name, c.count, c.pct]);
    });
    aoa.push(["", "Total", countries.reduce((s, c) => s + c.count, 0), 100]);
  }
  return XLSX.utils.aoa_to_sheet(aoa);
}
