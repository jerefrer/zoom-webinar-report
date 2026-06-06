import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseZoomCsv } from "./parser";
import { deduplicate } from "./processor";
import { aggregate, combinedFor } from "./aggregator";
import { buildXlsx } from "./xlsx";
import { DAY1_MAIN_CSV, DAY2_MAIN_CSV } from "./__fixtures__/sample-csvs";

function daysFor(csvs: string[][]) {
  return csvs.map((sources) => ({
    sources: sources.map((csv, i) => {
      const p = parseZoomCsv(csv);
      return { attendees: deduplicate(p.attendees), meta: p.meta, roomLabel: `Room ${i + 1}` };
    }),
  }));
}

function aggFor(csvs: string[][], thresholds: number[] = [90]) {
  return aggregate({ title: "Event", thresholds, days: daysFor(csvs) });
}

/** Read the attendee count on the "Total" row of a single-day UbC sheet
 *  (layout: "", "Total", <count>, 100). The count sits immediately right of
 *  the "Total" label. */
function totalOf(wb: XLSX.WorkBook, sheetName: string): number {
  const ws = wb.Sheets[sheetName];
  for (const ref of Object.keys(ws)) {
    if (ref.startsWith("!")) continue;
    if (ws[ref].v === "Total") {
      const { r, c } = XLSX.utils.decode_cell(ref);
      const countRef = XLSX.utils.encode_cell({ r, c: c + 1 });
      return ws[countRef]?.v as number;
    }
  }
  throw new Error(`No Total row in ${sheetName}`);
}

describe("buildXlsx", () => {
  it("produces a workbook with the expected sheet names (single-day, one threshold)", async () => {
    const stats = aggFor([[DAY1_MAIN_CSV]]);
    const blob = buildXlsx(stats);
    expect(blob).toBeInstanceOf(Blob);
    const buf = await blob.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
    expect(wb.SheetNames).toEqual(["Summary", "Countries", "UbC", "UbC_90min"]);
  });

  it("multi-day workbook has the same sheets and the UbC has per-day columns", async () => {
    const stats = aggFor([[DAY1_MAIN_CSV], [DAY2_MAIN_CSV]]);
    const blob = buildXlsx(stats);
    const wb = XLSX.read(new Uint8Array(await blob.arrayBuffer()), { type: "array" });
    expect(wb.SheetNames).toContain("UbC");
    const ubcSheet = wb.Sheets["UbC"];
    // The header row (row index 4 in the layout) includes No., Country/Region Name,
    // day labels, and Total. We assert structurally rather than at specific cells.
    const headerCells = Object.keys(ubcSheet)
      .filter((k) => /^[A-Z]4$/.test(k))
      .map((k) => ubcSheet[k].v);
    expect(headerCells).toContain("No.");
    expect(headerCells).toContain("Country/Region Name");
    expect(headerCells).toContain("Total");
  });

  it("blob has the correct XLSX MIME type", () => {
    const stats = aggFor([[DAY1_MAIN_CSV]]);
    const blob = buildXlsx(stats);
    expect(blob.type).toContain("openxmlformats");
  });

  // ── Regression: UbC_Nmin sheets must apply the threshold ──────────────────
  // Day 1 attendees (Host/Panelist sections excluded by the parser):
  //   Bob 100 min (Germany), Alice 30+55 = 85 min (France) → 2 unique.
  // UbC (no threshold) total = 2. UbC_90min total = 1 (Alice's 85 is excluded).
  // Before the fix, buildXlsx ignored the threshold and every UbC_Nmin sheet
  // duplicated the unfiltered UbC list (so 90min also read 2).
  it("applies the threshold to each UbC_Nmin sheet when combinedAttendees is provided", async () => {
    const days = daysFor([[DAY1_MAIN_CSV]]);
    const input = { title: "Event", thresholds: [90], days };
    const stats = aggregate(input);
    const combined = combinedFor(input);

    const wb = XLSX.read(
      new Uint8Array(await buildXlsx(stats, { combinedAttendees: combined }).arrayBuffer()),
      { type: "array" },
    );

    expect(totalOf(wb, "UbC")).toBe(2);
    expect(totalOf(wb, "UbC_90min")).toBe(1);
    // The threshold sheet must NOT simply mirror the unfiltered list.
    expect(totalOf(wb, "UbC_90min")).toBeLessThan(totalOf(wb, "UbC"));
  });

  it("produces distinct totals for distinct thresholds", async () => {
    const days = daysFor([[DAY1_MAIN_CSV]]);
    const input = { title: "Event", thresholds: [90, 110], days };
    const stats = aggregate(input);
    const combined = combinedFor(input);

    const wb = XLSX.read(
      new Uint8Array(await buildXlsx(stats, { combinedAttendees: combined }).arrayBuffer()),
      { type: "array" },
    );

    expect(totalOf(wb, "UbC_90min")).toBe(1); // Bob (100)
    expect(totalOf(wb, "UbC_110min")).toBe(0); // none (Bob's 100 excluded)
  });

  it("falls back to the unfiltered list when combinedAttendees is omitted", async () => {
    // Documents the fallback behaviour: without attendee data the threshold
    // cannot be applied, so the sheet mirrors UbC. (App always passes it.)
    const stats = aggFor([[DAY1_MAIN_CSV]], [90]);
    const wb = XLSX.read(new Uint8Array(await buildXlsx(stats).arrayBuffer()), { type: "array" });
    expect(totalOf(wb, "UbC_90min")).toBe(totalOf(wb, "UbC"));
  });
});
