import { describe, expect, it } from "vitest";
import { parseZoomCsv } from "./parser";
import { DAY1_MAIN_CSV, NOT_A_ZOOM_REPORT_CSV } from "./__fixtures__/sample-csvs";

describe("parseZoomCsv", () => {
  it("extracts metadata from the preamble", () => {
    const r = parseZoomCsv(DAY1_MAIN_CSV);
    expect(r.meta.topic).toBe("Test Webinar");
    expect(r.meta.webinarId).toBe("123 456 7890");
    expect(r.meta.actualStartTime).toBe("05/12/2026 09:00:00 AM");
    expect(r.meta.generatedTime).toBe("05/20/2026 10:00:00 AM");
  });

  it("parses 3 raw attendee rows (Alice x2, Bob)", () => {
    const r = parseZoomCsv(DAY1_MAIN_CSV);
    expect(r.attendees).toHaveLength(3);
    expect(r.hosts).toHaveLength(1);
    expect(r.panelists).toHaveLength(1);
  });

  it("strips the UTF-8 BOM from the topic key", () => {
    const r = parseZoomCsv(DAY1_MAIN_CSV);
    expect(r.meta.topic).not.toMatch(/^﻿/);
  });

  it("returns empty arrays and empty meta on a non-Zoom CSV", () => {
    const r = parseZoomCsv(NOT_A_ZOOM_REPORT_CSV);
    expect(r.attendees).toEqual([]);
    expect(r.meta.topic).toBe("");
  });

  it("preserves the country on each attendee row", () => {
    const r = parseZoomCsv(DAY1_MAIN_CSV);
    expect(r.attendees[0].country).toBe("France");
    expect(r.attendees[2].country).toBe("Germany");
  });

  it("preserves the raw duration string parsed as a number", () => {
    const r = parseZoomCsv(DAY1_MAIN_CSV);
    expect(r.attendees[0].durationMinutes).toBe(30);
    expect(r.attendees[1].durationMinutes).toBe(55);
    expect(r.attendees[2].durationMinutes).toBe(100);
  });
});
