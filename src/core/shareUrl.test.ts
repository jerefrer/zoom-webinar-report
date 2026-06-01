import { describe, expect, it } from "vitest";
import { encodeReport, decodeReport, isShareableReport } from "./shareUrl";
import type { ShareableReport } from "./types";

const sample: ShareableReport = {
  v: 1,
  title: "Long Life Empowerment — 26 May 2026",
  generatedAt: "2026-06-01T10:00:00.000Z",
  days: [{ label: "Day 1", date: "26/05/2026" }],
  rooms: [{ dayIdx: 0, label: "Main Room", webinarId: "892 7717 6772" }],
  topLine: { unique: 2048, countries: 38, avg: 87, median: 95, max: 150 },
  thresholds: [
    { mins: 40, count: 1820, pct: 88.9 },
    { mins: 60, count: 1610, pct: 78.6 },
  ],
  countries: [{ name: "United States", count: 612, pct: 29.9 }],
  histogram: [{ label: "60–90", minMin: 60, maxMin: 90, count: 700 }],
};

describe("shareUrl encode/decode", () => {
  it("round-trips losslessly", () => {
    const encoded = encodeReport(sample);
    const decoded = decodeReport(encoded);
    expect(decoded).toEqual(sample);
  });

  it("encoded payload is URL-safe and reasonably compact", () => {
    const encoded = encodeReport(sample);
    expect(encoded).not.toMatch(/[ +/=]/);
    expect(encoded.length).toBeLessThan(2000);
  });

  it("returns null on a corrupt payload", () => {
    expect(decodeReport("not-a-valid-payload")).toBeNull();
  });

  it("returns null on a wrong schema version", () => {
    const encoded = encodeReport({ ...sample, v: 2 as unknown as 1 });
    expect(decodeReport(encoded)).toBeNull();
  });

  it("isShareableReport recognises the right shape", () => {
    expect(isShareableReport(sample)).toBe(true);
    expect(isShareableReport({ v: 1, title: "" } as unknown)).toBe(false);
  });
});
