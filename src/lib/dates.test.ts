import { describe, expect, it } from "vitest";
import { extractDdmm, extractFullDate } from "./dates";

describe("extractFullDate", () => {
  it("parses MM/DD/YYYY (US / English Zoom export) → DD/MM/YYYY", () => {
    expect(extractFullDate("05/30/2026 09:35:53 AM")).toBe("30/05/2026");
  });

  it("parses DD.MM.YYYY (European / Asian Zoom locales — e.g. Chinese export)", () => {
    expect(extractFullDate("30.05.2026 09:43:19 AM")).toBe("30/05/2026");
  });

  it("pads single-digit day / month", () => {
    expect(extractFullDate("5/3/2026 09:00:00 AM")).toBe("03/05/2026");
    expect(extractFullDate("3.5.2026 09:00:00 AM")).toBe("03/05/2026");
  });

  it("returns null on empty / unknown input", () => {
    expect(extractFullDate("")).toBeNull();
    expect(extractFullDate("not a date")).toBeNull();
    expect(extractFullDate("2026-05-30")).toBeNull(); // ISO not supported (matches v1 Python)
  });
});

describe("extractDdmm", () => {
  it("returns the compact DDMM key for filename usage", () => {
    expect(extractDdmm("05/30/2026 09:00:00 AM")).toBe("3005");
    expect(extractDdmm("30.05.2026 09:00:00 AM")).toBe("3005");
  });

  it("returns empty string on no match", () => {
    expect(extractDdmm("")).toBe("");
    expect(extractDdmm("garbage")).toBe("");
  });
});
