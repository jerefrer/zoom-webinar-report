import { describe, expect, it } from "vitest";
import { parseZoomCsv } from "./parser";
import { deduplicate } from "./processor";
import { aggregate } from "./aggregator";
import { DAY1_MAIN_CSV, DAY2_MAIN_CSV } from "./__fixtures__/sample-csvs";

function processedSource(csv: string, roomLabel: string) {
  const parsed = parseZoomCsv(csv);
  return { attendees: deduplicate(parsed.attendees), meta: parsed.meta, roomLabel };
}

describe("aggregate — XLSX-parity", () => {
  it("computes unique attendees and country breakdown for a single source", () => {
    const days = [{ sources: [processedSource(DAY1_MAIN_CSV, "Main Room")] }];
    const stats = aggregate({ title: "Event", thresholds: [90], days });
    expect(stats.topLine.unique).toBe(2);
    expect(stats.topLine.countries).toBe(2);
    const fr = stats.countries.find((c) => c.name === "France");
    const de = stats.countries.find((c) => c.name === "Germany");
    expect(fr).toMatchObject({ count: 1, pct: 50 });
    expect(de).toMatchObject({ count: 1, pct: 50 });
  });

  it("filters threshold sheets: ≥90 min → only Bob (100m)", () => {
    const days = [{ sources: [processedSource(DAY1_MAIN_CSV, "Main Room")] }];
    const stats = aggregate({ title: "Event", thresholds: [90], days });
    const t90 = stats.thresholds.find((t) => t.mins === 90);
    expect(t90).toMatchObject({ count: 1, pct: 50 });
  });

  it("produces a perDay breakdown when more than one day", () => {
    const days = [
      { sources: [processedSource(DAY1_MAIN_CSV, "Main Room")] },
      { sources: [processedSource(DAY2_MAIN_CSV, "Main Room")] },
    ];
    const stats = aggregate({ title: "Event", thresholds: [], days });
    expect(stats.perDay).toBeDefined();
    expect(stats.perDay).toHaveLength(2);
    expect(stats.perDay![0]).toMatchObject({ dayIdx: 0, unique: 2 });
    expect(stats.perDay![1]).toMatchObject({ dayIdx: 1, unique: 1 });
  });

  it("omits perDay when only one day", () => {
    const days = [{ sources: [processedSource(DAY1_MAIN_CSV, "Main Room")] }];
    const stats = aggregate({ title: "Event", thresholds: [], days });
    expect(stats.perDay).toBeUndefined();
  });

  it("builds rooms[] with one entry per source", () => {
    const days = [{
      sources: [
        processedSource(DAY1_MAIN_CSV, "Main Room"),
        processedSource(DAY1_MAIN_CSV, "Chinese Room"),
      ],
    }];
    const stats = aggregate({ title: "Event", thresholds: [], days });
    expect(stats.rooms).toHaveLength(2);
    expect(stats.rooms[0].roomLabel).toBe("Main Room");
    expect(stats.rooms[1].roomLabel).toBe("Chinese Room");
  });
});
