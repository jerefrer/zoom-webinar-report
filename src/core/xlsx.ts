import * as XLSX from "xlsx-js-style";
import type { AggregateStats, AttendeeRow, CountryStat } from "./types";
import { countriesFilteredBy } from "./aggregator";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// ─── Palette (Zoom blue + neutral) ────────────────────────────────────────
const C = {
  PRIMARY: "0B5CFF",
  PRIMARY_DARK: "093FBE",
  PRIMARY_TINT: "E6EEFF",
  ALT_ROW: "F5F8FF",
  WHITE: "FFFFFF",
  TEXT: "0F172A",
  TEXT_MUTED: "475569",
  BORDER: "DDE5F3",
};

const FONT = "Calibri";

export interface XlsxOptions {
  /** Combined (deduped across rooms/days) attendee rows. Used to compute the
   *  per-threshold country breakdowns for each UbC_Nmin sheet so they reflect
   *  only attendees who met the threshold — matching the v1 Python report.
   *  When omitted, the UbC_Nmin sheets fall back to the unfiltered country
   *  list (no threshold applied); always pass this for correct threshold sheets. */
  combinedAttendees?: AttendeeRow[];
}

// ─── Style preset helpers ─────────────────────────────────────────────────
// Each returns a *fresh* object so SheetJS doesn't mutate a shared style.

function styleTitle() {
  return {
    font: { name: FONT, sz: 22, bold: true, color: { rgb: C.WHITE } },
    fill: { fgColor: { rgb: C.PRIMARY }, patternType: "solid" as const },
    alignment: { horizontal: "center" as const, vertical: "center" as const, wrapText: true },
  };
}

function styleSubtitle() {
  return {
    font: { name: FONT, sz: 11, italic: true, color: { rgb: C.WHITE } },
    fill: { fgColor: { rgb: C.PRIMARY }, patternType: "solid" as const },
    alignment: { horizontal: "center" as const, vertical: "center" as const },
  };
}

function styleSectionHeading() {
  return {
    font: { name: FONT, sz: 13, bold: true, color: { rgb: C.TEXT } },
    alignment: { vertical: "center" as const },
  };
}

function styleTableHeader() {
  return {
    font: { name: FONT, sz: 11, bold: true, color: { rgb: C.WHITE } },
    fill: { fgColor: { rgb: C.PRIMARY_DARK }, patternType: "solid" as const },
    alignment: { horizontal: "center" as const, vertical: "center" as const, wrapText: true },
  };
}

function styleDataCell(rowIdx: number, opts: { numeric?: boolean; bold?: boolean } = {}) {
  const odd = rowIdx % 2 === 1;
  return {
    font: { name: FONT, sz: 11, bold: opts.bold ?? false, color: { rgb: C.TEXT } },
    fill: odd
      ? { fgColor: { rgb: C.ALT_ROW }, patternType: "solid" as const }
      : { fgColor: { rgb: C.WHITE }, patternType: "solid" as const },
    alignment: {
      horizontal: (opts.numeric ? "right" : "left") as "right" | "left",
      vertical: "center" as const,
    },
    border: {
      bottom: { style: "thin" as const, color: { rgb: C.BORDER } },
    },
  };
}

function styleTotal(opts: { numeric?: boolean } = {}) {
  return {
    font: { name: FONT, sz: 12, bold: true, color: { rgb: C.WHITE } },
    fill: { fgColor: { rgb: C.PRIMARY }, patternType: "solid" as const },
    alignment: {
      horizontal: (opts.numeric ? "right" : "left") as "right" | "left",
      vertical: "center" as const,
    },
  };
}

function styleLabel() {
  return {
    font: { name: FONT, sz: 11, bold: true, color: { rgb: C.TEXT_MUTED } },
    alignment: { horizontal: "right" as const, vertical: "center" as const },
  };
}

function styleValue() {
  return {
    font: { name: FONT, sz: 11, color: { rgb: C.TEXT } },
    alignment: { vertical: "center" as const },
  };
}

// ─── Cell helpers ─────────────────────────────────────────────────────────

function setCell(ws: XLSX.WorkSheet, r: number, c: number, value: string | number, style: object) {
  const ref = XLSX.utils.encode_cell({ r, c });
  const t = typeof value === "number" ? "n" : "s";
  ws[ref] = { v: value, t, s: style };
}

/** Apply a fill/style to cells inside a merged range (cells other than the top-left)
 *  so the fill renders across the whole merged area in every spreadsheet client. */
function fillMergeRange(ws: XLSX.WorkSheet, r: number, startC: number, endC: number, style: object) {
  for (let c = startC + 1; c <= endC; c++) {
    const ref = XLSX.utils.encode_cell({ r, c });
    if (!ws[ref]) ws[ref] = { v: "", t: "s" };
    ws[ref].s = style;
  }
}

function setRange(ws: XLSX.WorkSheet, lastRow: number, lastCol: number) {
  ws["!ref"] = `A1:${XLSX.utils.encode_cell({ r: lastRow, c: lastCol })}`;
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map((wch) => ({ wch }));
}

function setRowHeights(ws: XLSX.WorkSheet, heights: Map<number, number>, defaultHpx = 18, totalRows = 0) {
  const rows: { hpx: number }[] = [];
  for (let i = 0; i < totalRows; i++) rows.push({ hpx: heights.get(i) ?? defaultHpx });
  ws["!rows"] = rows;
}

// ─── Localised dates ──────────────────────────────────────────────────────

function humanDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return `${date} — ${time}`;
  } catch {
    return iso;
  }
}

// ─── Summary sheet ────────────────────────────────────────────────────────

function buildSummary(stats: AggregateStats): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const NCOLS = 7;
  const heights = new Map<number, number>();
  const merges: XLSX.Range[] = [];

  let r = 0;

  // Title (merged A1:G1) — bandeau Zoom-blue
  setCell(ws, r, 0, stats.title || "Zoom Webinar Report", styleTitle());
  fillMergeRange(ws, r, 0, NCOLS - 1, styleTitle());
  merges.push({ s: { r, c: 0 }, e: { r, c: NCOLS - 1 } });
  heights.set(r, 56);
  r++;

  // Subtitle (merged) — bandeau Zoom-blue, italic
  setCell(ws, r, 0, "Zoom Webinar Attendance Report", styleSubtitle());
  fillMergeRange(ws, r, 0, NCOLS - 1, styleSubtitle());
  merges.push({ s: { r, c: 0 }, e: { r, c: NCOLS - 1 } });
  heights.set(r, 26);
  r++;

  // Spacer
  heights.set(r, 12);
  r++;

  // Report Generated
  setCell(ws, r, 0, "Report Generated", styleLabel());
  setCell(ws, r, 1, humanDate(stats.generatedAt) || humanDate(new Date().toISOString()), styleValue());
  merges.push({ s: { r, c: 1 }, e: { r, c: NCOLS - 1 } });
  heights.set(r, 22);
  r++;

  // Spacer
  heights.set(r, 12);
  r++;

  // Section heading
  setCell(ws, r, 0, "Room Statistics", styleSectionHeading());
  heights.set(r, 26);
  r++;

  // Table header
  const headers = [
    "Day", "Room", "Webinar ID", "Unique Attendees",
    "Total Users (Zoom)", "Unique Viewers (Zoom)", "Duration (min)",
  ];
  headers.forEach((h, c) => setCell(ws, r, c, h, styleTableHeader()));
  heights.set(r, 36);
  r++;

  // Data rows
  stats.rooms.forEach((room, i) => {
    setCell(ws, r, 0, room.dayLabel, styleDataCell(i));
    setCell(ws, r, 1, room.roomLabel, styleDataCell(i, { bold: true }));
    setCell(ws, r, 2, room.webinarId, styleDataCell(i));
    setCell(ws, r, 3, room.uniqueAttendees, styleDataCell(i, { numeric: true, bold: true }));
    setCell(ws, r, 4, room.totalUsersZoom, styleDataCell(i, { numeric: true }));
    setCell(ws, r, 5, room.uniqueViewersZoom, styleDataCell(i, { numeric: true }));
    setCell(ws, r, 6, room.durationMinutesZoom, styleDataCell(i, { numeric: true }));
    heights.set(r, 24);
    r++;
  });

  // Total row
  setCell(ws, r, 0, "TOTAL", styleTotal());
  setCell(ws, r, 1, "", styleTotal());
  setCell(ws, r, 2, "", styleTotal());
  setCell(ws, r, 3, stats.rooms.reduce((s, x) => s + x.uniqueAttendees, 0), styleTotal({ numeric: true }));
  setCell(ws, r, 4, "", styleTotal());
  setCell(ws, r, 5, "", styleTotal());
  setCell(ws, r, 6, "", styleTotal());
  heights.set(r, 30);
  r++;

  ws["!merges"] = merges;
  setRange(ws, r - 1, NCOLS - 1);
  setColWidths(ws, [16, 30, 20, 18, 18, 22, 16]);
  setRowHeights(ws, heights, 18, r);
  return ws;
}

// ─── Countries sheet (single column "No. | Country") ─────────────────────

function buildCountries(stats: AggregateStats): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const NCOLS = 2;
  const heights = new Map<number, number>();
  const merges: XLSX.Range[] = [];

  let r = 0;

  // Title spans A1:B3 to give the country list a clean banner
  setCell(ws, r, 0, `Countries — ${stats.title}`, styleTitle());
  fillMergeRange(ws, r, 0, NCOLS - 1, styleTitle());
  merges.push({ s: { r, c: 0 }, e: { r: r + 2, c: NCOLS - 1 } });
  // Fill the merge band for rows 2 and 3 too
  for (let band = r + 1; band <= r + 2; band++) {
    setCell(ws, band, 0, "", styleTitle());
    fillMergeRange(ws, band, 0, NCOLS - 1, styleTitle());
  }
  heights.set(r, 50);
  heights.set(r + 1, 8);
  heights.set(r + 2, 8);
  r += 3;

  // Table header
  setCell(ws, r, 0, "No.", styleTableHeader());
  setCell(ws, r, 1, "Country", styleTableHeader());
  heights.set(r, 32);
  r++;

  // Data rows
  [...stats.countries]
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((c, i) => {
      setCell(ws, r, 0, i + 1, styleDataCell(i, { numeric: true }));
      setCell(ws, r, 1, c.name, styleDataCell(i));
      heights.set(r, 22);
      r++;
    });

  ws["!merges"] = merges;
  setRange(ws, r - 1, NCOLS - 1);
  setColWidths(ws, [8, 48]);
  setRowHeights(ws, heights, 18, r);
  return ws;
}

// ─── UbC sheet (single-day or multi-day) ──────────────────────────────────

function buildUbC(
  stats: AggregateStats,
  countries: CountryStat[],
  threshold: number | null,
): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const multiDay = (stats.perDay?.length ?? 0) > 1;
  const dayLabels = multiDay ? stats.days.map((d) => d.label) : [];
  const NCOLS = multiDay ? 3 + dayLabels.length : 4; // No., Country, [days...], Total | No., Country, Users, %
  const heights = new Map<number, number>();
  const merges: XLSX.Range[] = [];

  let r = 0;

  const title = threshold
    ? `Users by country — ${stats.title} · ≥ ${threshold} minutes`
    : `Users by country — ${stats.title}`;

  // Title band over A1:lastCol-3
  setCell(ws, r, 0, title, styleTitle());
  fillMergeRange(ws, r, 0, NCOLS - 1, styleTitle());
  merges.push({ s: { r, c: 0 }, e: { r: r + 2, c: NCOLS - 1 } });
  for (let band = r + 1; band <= r + 2; band++) {
    setCell(ws, band, 0, "", styleTitle());
    fillMergeRange(ws, band, 0, NCOLS - 1, styleTitle());
  }
  heights.set(r, 50);
  heights.set(r + 1, 8);
  heights.set(r + 2, 8);
  r += 3;

  // Header row — match the row index v1 used (row 4 = index 3) so any existing
  // structural test still finds the column labels there.
  if (multiDay) {
    const hs = ["No.", "Country/Region Name", ...dayLabels, "Total"];
    hs.forEach((h, c) => setCell(ws, r, c, h, styleTableHeader()));
  } else {
    ["No.", "Countries", "Users", "%"].forEach((h, c) =>
      setCell(ws, r, c, h, styleTableHeader()),
    );
  }
  heights.set(r, 36);
  r++;

  // Data rows
  if (multiDay) {
    countries.forEach((c, i) => {
      setCell(ws, r, 0, i + 1, styleDataCell(i, { numeric: true }));
      setCell(ws, r, 1, c.name, styleDataCell(i));
      for (let d = 0; d < dayLabels.length; d++) {
        setCell(ws, r, 2 + d, "", styleDataCell(i, { numeric: true }));
      }
      setCell(ws, r, NCOLS - 1, c.count, styleDataCell(i, { numeric: true, bold: true }));
      heights.set(r, 22);
      r++;
    });
  } else {
    countries.forEach((c, i) => {
      setCell(ws, r, 0, i + 1, styleDataCell(i, { numeric: true }));
      setCell(ws, r, 1, c.name, styleDataCell(i));
      setCell(ws, r, 2, c.count, styleDataCell(i, { numeric: true, bold: true }));
      setCell(ws, r, 3, c.pct, styleDataCell(i, { numeric: true }));
      heights.set(r, 22);
      r++;
    });
  }

  // Total row
  const total = countries.reduce((s, c) => s + c.count, 0);
  if (multiDay) {
    setCell(ws, r, 0, "", styleTotal());
    setCell(ws, r, 1, "Total", styleTotal());
    for (let d = 0; d < dayLabels.length; d++) {
      setCell(ws, r, 2 + d, "", styleTotal({ numeric: true }));
    }
    setCell(ws, r, NCOLS - 1, total, styleTotal({ numeric: true }));
  } else {
    setCell(ws, r, 0, "", styleTotal());
    setCell(ws, r, 1, "Total", styleTotal());
    setCell(ws, r, 2, total, styleTotal({ numeric: true }));
    setCell(ws, r, 3, 100, styleTotal({ numeric: true }));
  }
  heights.set(r, 30);
  r++;

  ws["!merges"] = merges;
  setRange(ws, r - 1, NCOLS - 1);
  if (multiDay) {
    setColWidths(ws, [8, 36, ...dayLabels.map(() => 14), 14]);
  } else {
    setColWidths(ws, [8, 40, 12, 12]);
  }
  setRowHeights(ws, heights, 18, r);
  return ws;
}

// ─── Public entry ─────────────────────────────────────────────────────────

/**
 * Build the formatted XLSX as a Blob ready to download. Sheet layout matches
 * the v1 Python report (Summary / Countries / UbC / UbC_Nmin), with rich
 * Zoom-blue styling (banner titles, colored headers, alternating rows,
 * generous row heights). Uses `xlsx-js-style` so styles actually persist.
 */
export function buildXlsx(stats: AggregateStats, options: XlsxOptions = {}): Blob {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildSummary(stats), "Summary");
  XLSX.utils.book_append_sheet(wb, buildCountries(stats), "Countries");
  XLSX.utils.book_append_sheet(wb, buildUbC(stats, stats.countries, null), "UbC");
  for (const t of stats.thresholds) {
    const filtered = options.combinedAttendees
      ? countriesFilteredBy(options.combinedAttendees, t.mins)
      : stats.countries;
    XLSX.utils.book_append_sheet(wb, buildUbC(stats, filtered, t.mins), `UbC_${t.mins}min`);
  }
  const ab = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Blob([ab], { type: XLSX_MIME });
}
