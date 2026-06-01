import { describe, expect, it } from "vitest";
import { parseZoomCsv } from "./parser";
import { deduplicate, combineAttendees } from "./processor";
import { DAY1_MAIN_CSV } from "./__fixtures__/sample-csvs";

describe("deduplicate", () => {
  it("merges Alice's two sessions by email into one row totaling 85 minutes", () => {
    const r = parseZoomCsv(DAY1_MAIN_CSV);
    const deduped = deduplicate(r.attendees);
    expect(deduped).toHaveLength(2);
    const alice = deduped.find((a) => a.email === "alice@example.com");
    expect(alice).toBeDefined();
    expect(alice!.durationMinutes).toBe(85);
  });

  it("preserves Bob as a separate person with 100 minutes", () => {
    const r = parseZoomCsv(DAY1_MAIN_CSV);
    const deduped = deduplicate(r.attendees);
    const bob = deduped.find((a) => a.email === "bob@example.com");
    expect(bob).toBeDefined();
    expect(bob!.durationMinutes).toBe(100);
  });

  it("returns an empty array for an empty input", () => {
    expect(deduplicate([])).toEqual([]);
  });

  it("uses the earliest joinTime and latest leaveTime in the merged row", () => {
    const r = parseZoomCsv(DAY1_MAIN_CSV);
    const deduped = deduplicate(r.attendees);
    const alice = deduped.find((a) => a.email === "alice@example.com")!;
    expect(alice.joinTime).toContain("09:00:00 AM");
    expect(alice.leaveTime).toContain("10:30:00 AM");
  });

  it("keeps the most-frequent country for the merged row", () => {
    const r = parseZoomCsv(DAY1_MAIN_CSV);
    const deduped = deduplicate(r.attendees);
    const alice = deduped.find((a) => a.email === "alice@example.com")!;
    expect(alice.country).toBe("France");
  });
});

describe("deduplicate — name-only collisions (interval scheduling)", () => {
  it("keeps two concurrent 'iPhone' attendees as separate rows", () => {
    const rows = [
      makeRow({ name: "iPhone", joinTime: "01/01/2026 09:00:00 AM",
                leaveTime: "01/01/2026 09:30:00 AM", durationMinutes: 30 }),
      makeRow({ name: "iPhone", joinTime: "01/01/2026 09:10:00 AM",
                leaveTime: "01/01/2026 09:45:00 AM", durationMinutes: 35 }),
    ];
    const deduped = deduplicate(rows);
    expect(deduped).toHaveLength(2);
  });

  it("merges two sequential 'iPhone' sessions (rejoin) as one row", () => {
    const rows = [
      makeRow({ name: "iPhone", joinTime: "01/01/2026 09:00:00 AM",
                leaveTime: "01/01/2026 09:15:00 AM", durationMinutes: 15 }),
      makeRow({ name: "iPhone", joinTime: "01/01/2026 09:20:00 AM",
                leaveTime: "01/01/2026 09:50:00 AM", durationMinutes: 30 }),
    ];
    const deduped = deduplicate(rows);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].durationMinutes).toBe(45);
  });
});

function makeRow(p: Partial<import("./types").AttendeeRow>) {
  return {
    name: "", email: "", joinTime: "", leaveTime: "",
    durationMinutes: 0, isGuest: "", country: "",
    ...p,
  };
}

describe("combineAttendees", () => {
  it("merges across sources by email, keeps name-only rows separate", () => {
    const a = [
      { name: "Alice", email: "alice@example.com", joinTime: "", leaveTime: "",
        durationMinutes: 40, isGuest: "Yes", country: "France" },
      { name: "iPhone", email: "", joinTime: "", leaveTime: "",
        durationMinutes: 20, isGuest: "Yes", country: "" },
    ];
    const b = [
      { name: "Alice", email: "alice@example.com", joinTime: "", leaveTime: "",
        durationMinutes: 30, isGuest: "Yes", country: "France" },
      { name: "iPhone", email: "", joinTime: "", leaveTime: "",
        durationMinutes: 25, isGuest: "Yes", country: "" },
    ];
    const combined = combineAttendees([a, b]);
    const alice = combined.find((r) => r.email === "alice@example.com");
    expect(alice).toBeDefined();
    expect(alice!.durationMinutes).toBe(70);
    const iphones = combined.filter((r) => r.email === "" && r.name === "iPhone");
    expect(iphones).toHaveLength(2);
  });

  it("returns an empty array when all sources are empty", () => {
    expect(combineAttendees([[], []])).toEqual([]);
  });
});
