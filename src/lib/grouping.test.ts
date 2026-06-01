import { describe, expect, it } from "vitest";
import { groupByDate, moveFile, toGenerateDays } from "./grouping";
import type { InspectResult } from "@/types/report";

const r = (filename: string, detected_date: string | null): InspectResult => ({
  filename, status: detected_date ? "ok" : "invalid", detected_date,
  topic: "T", webinar_id: "1", attendee_count: 1, error: null,
});

describe("groupByDate", () => {
  it("groups files with the same date and sorts days chronologically", () => {
    const g = groupByDate([
      r("b.csv", "13/05/2026"),
      r("a.csv", "12/05/2026"),
      r("a2.csv", "12/05/2026"),
    ]);
    expect(g.days).toEqual([["a.csv", "a2.csv"], ["b.csv"]]);
    expect(g.unassigned).toEqual([]);
  });

  it("puts files with no date into unassigned", () => {
    const g = groupByDate([r("x.csv", null), r("a.csv", "12/05/2026")]);
    expect(g.days).toEqual([["a.csv"]]);
    expect(g.unassigned).toEqual(["x.csv"]);
  });

  it("orders main before chinese within the same day", () => {
    const g = groupByDate([
      r("26_chinese.csv", "12/05/2026"),
      r("26_main.csv", "12/05/2026"),
      r("notes.csv", "12/05/2026"),
    ]);
    expect(g.days).toEqual([["26_main.csv", "26_chinese.csv", "notes.csv"]]);
  });

  it("orders main before chinese in the unassigned bucket", () => {
    const g = groupByDate([
      r("chinese_only.csv", null),
      r("main_only.csv", null),
    ]);
    expect(g.unassigned).toEqual(["main_only.csv", "chinese_only.csv"]);
  });
});

describe("moveFile", () => {
  it("moves a filename from one bucket to another", () => {
    const g = { days: [["a.csv"], ["b.csv"]], unassigned: ["x.csv"] };
    const next = moveFile(g, "x.csv", { kind: "day", index: 0 });
    expect(next.days[0]).toContain("x.csv");
    expect(next.unassigned).not.toContain("x.csv");
  });

  it("is a no-op when the target day index is out of range", () => {
    const g = { days: [["a.csv"]], unassigned: ["x.csv"] };
    expect(moveFile(g, "x.csv", { kind: "day", index: 5 })).toEqual(g);
  });
});

describe("toGenerateDays", () => {
  it("drops empty days and excludes unassigned", () => {
    const g = { days: [["a.csv"], []], unassigned: ["x.csv"] };
    expect(toGenerateDays(g)).toEqual([{ filenames: ["a.csv"] }]);
  });
});
