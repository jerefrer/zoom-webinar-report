import { describe, expect, it } from "vitest";
import { parseZoomCsv } from "./parser";
import { deduplicate } from "./processor";
import {
  aggregate,
  combinedFor,
  countriesFilteredBy,
  perDayCombinedFor,
} from "./aggregator";
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

describe("aggregate — topLine viewing-time stats", () => {
  it("computes avg/median/max in minutes from the combined deduped attendees", () => {
    const days = [{ sources: [processedSource(DAY1_MAIN_CSV, "Main Room")] }];
    const stats = aggregate({ title: "Event", thresholds: [], days });
    // Alice 85m, Bob 100m → avg 92.5, median 92.5, max 100
    expect(stats.topLine.avg).toBe(92.5);
    expect(stats.topLine.median).toBe(92.5);
    expect(stats.topLine.max).toBe(100);
  });

  it("avg/median/max are zero on empty input", () => {
    const stats = aggregate({ title: "Empty", thresholds: [], days: [] });
    expect(stats.topLine.avg).toBe(0);
    expect(stats.topLine.median).toBe(0);
    expect(stats.topLine.max).toBe(0);
  });
});

describe("aggregate — engagement histogram", () => {
  it("places Alice (85m) in 60–90, Bob (100m) in 90–120", () => {
    const days = [{ sources: [processedSource(DAY1_MAIN_CSV, "Main Room")] }];
    const stats = aggregate({ title: "Event", thresholds: [], days });
    const get = (label: string) => stats.histogram.find((b) => b.label === label);
    expect(get("60–90")!.count).toBe(1);
    expect(get("90–120")!.count).toBe(1);
    expect(get("0–15")!.count).toBe(0);
  });

  it("includes 120+ as the open-ended top bucket", () => {
    const stats = aggregate({ title: "Event", thresholds: [], days: [] });
    const top = stats.histogram.find((b) => b.label === "120+");
    expect(top).toBeDefined();
    expect(top!.maxMin).toBeNull();
  });
});

describe("aggregate — retention curve + peak concurrent", () => {
  it("computes a retention curve (% of attendees still watching at minute T)", () => {
    const days = [{ sources: [processedSource(DAY1_MAIN_CSV, "Main Room")] }];
    const stats = aggregate({ title: "Event", thresholds: [], days });
    expect(stats.retention).toBeDefined();
    expect(stats.retention!.length).toBeGreaterThan(0);
    expect(stats.retention![0].tMinutes).toBe(0);
    expect(stats.retention![0].pctRemaining).toBe(100);
    for (let i = 1; i < stats.retention!.length; i++) {
      expect(stats.retention![i].pctRemaining).toBeLessThanOrEqual(stats.retention![i - 1].pctRemaining);
    }
  });

  it("computes peak concurrent viewers with the timestamp", () => {
    const days = [{ sources: [processedSource(DAY1_MAIN_CSV, "Main Room")] }];
    const stats = aggregate({ title: "Event", thresholds: [], days });
    expect(stats.peak).toBeDefined();
    expect(stats.peak!.count).toBe(2);
    expect(stats.peak!.at).toMatch(/^\d{2}:\d{2}$/);
  });
});

// These exported helpers feed the XLSX builder directly (combinedFor →
// combinedAttendees, countriesFilteredBy → each UbC_Nmin sheet). They are the
// engine behind the threshold-sheet fix, so they are tested independently.
describe("aggregate helpers — combinedFor / countriesFilteredBy / perDayCombinedFor", () => {
  it("combinedFor merges sources across the whole event by email", () => {
    const input = {
      title: "Event",
      thresholds: [],
      days: [{
        sources: [
          processedSource(DAY1_MAIN_CSV, "Main Room"),
          processedSource(DAY2_MAIN_CSV, "Chinese Room"),
        ],
      }],
    };
    const combined = combinedFor(input);
    // Day1: Alice 85, Bob 100. Day2: Carol 70. Distinct emails → 3 attendees.
    expect(combined).toHaveLength(3);
    expect(combined.map((r) => r.durationMinutes).sort((a, b) => a - b)).toEqual([70, 85, 100]);
  });

  it("countriesFilteredBy keeps only attendees at/above the threshold", () => {
    const input = { title: "Event", thresholds: [], days: [{ sources: [processedSource(DAY1_MAIN_CSV, "Main Room")] }] };
    const combined = combinedFor(input);

    const all = countriesFilteredBy(combined, 0);
    expect(all.reduce((s, c) => s + c.count, 0)).toBe(2); // France + Germany

    const ge90 = countriesFilteredBy(combined, 90);
    expect(ge90.reduce((s, c) => s + c.count, 0)).toBe(1); // Bob (Germany, 100m)
    expect(ge90.find((c) => c.name === "France")).toBeUndefined();
    expect(ge90.find((c) => c.name === "Germany")).toMatchObject({ count: 1 });

    const ge110 = countriesFilteredBy(combined, 110);
    expect(ge110).toEqual([]); // nobody reaches 110m
  });

  it("countriesFilteredBy uses '>=' (boundary attendee is included)", () => {
    const input = { title: "Event", thresholds: [], days: [{ sources: [processedSource(DAY1_MAIN_CSV, "Main Room")] }] };
    const combined = combinedFor(input);
    // Alice is exactly 85m → threshold 85 must include her.
    expect(countriesFilteredBy(combined, 85).reduce((s, c) => s + c.count, 0)).toBe(2);
    expect(countriesFilteredBy(combined, 86).reduce((s, c) => s + c.count, 0)).toBe(1);
  });

  it("perDayCombinedFor returns one combined list per day, index-aligned", () => {
    const input = {
      title: "Event",
      thresholds: [],
      days: [
        { sources: [processedSource(DAY1_MAIN_CSV, "Main Room")] },
        { sources: [processedSource(DAY2_MAIN_CSV, "Main Room")] },
      ],
    };
    const perDay = perDayCombinedFor(input);
    expect(perDay).toHaveLength(2);
    expect(perDay[0]).toHaveLength(2); // Alice + Bob
    expect(perDay[1]).toHaveLength(1); // Carol
  });
});
