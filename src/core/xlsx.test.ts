import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseZoomCsv } from "./parser";
import { deduplicate } from "./processor";
import { aggregate } from "./aggregator";
import { buildXlsx } from "./xlsx";
import { DAY1_MAIN_CSV, DAY2_MAIN_CSV } from "./__fixtures__/sample-csvs";

function aggFor(csvs: string[][]) {
  const days = csvs.map((sources) => ({
    sources: sources.map((csv, i) => {
      const p = parseZoomCsv(csv);
      return { attendees: deduplicate(p.attendees), meta: p.meta, roomLabel: `Room ${i + 1}` };
    }),
  }));
  return aggregate({ title: "Event", thresholds: [90], days });
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
});
