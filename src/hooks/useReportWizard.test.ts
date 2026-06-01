import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useReportWizard } from "./useReportWizard";
import type { InspectResult } from "@/types/report";

const file = (name: string) => new File(["x"], name, { type: "text/csv" });
const res = (
  filename: string,
  date: string | null,
  topic: string | null = "T",
): InspectResult => ({
  filename, status: date ? "ok" : "invalid", detected_date: date,
  topic, webinar_id: "1", attendee_count: 1, error: null,
});

describe("useReportWizard", () => {
  it("starts on the upload step", () => {
    const { result } = renderHook(() => useReportWizard());
    expect(result.current.step).toBe("upload");
  });

  it("applies inspection results into a grouping and advances", () => {
    const { result } = renderHook(() => useReportWizard());
    act(() => {
      result.current.setFiles([file("a.csv"), file("b.csv")]);
      result.current.applyInspection([res("a.csv", "12/05/2026"), res("b.csv", "13/05/2026")]);
      result.current.goToGrouping();
    });
    expect(result.current.step).toBe("grouping");
    expect(result.current.grouping.days).toHaveLength(2);
  });

  it("blocks leaving grouping while files are unassigned", () => {
    const { result } = renderHook(() => useReportWizard());
    act(() => {
      result.current.setFiles([file("x.csv")]);
      result.current.applyInspection([res("x.csv", null)]);
      result.current.goToGrouping();
    });
    expect(result.current.canLeaveGrouping).toBe(false);
  });

  it("defaults thresholds to 40 and 60", () => {
    const { result } = renderHook(() => useReportWizard());
    expect(result.current.options.thresholds).toEqual([40, 60]);
  });

  it("adds (dedup, sorted) and removes thresholds", () => {
    const { result } = renderHook(() => useReportWizard());
    // Starts at [40, 60]
    act(() => result.current.addThreshold(90));
    act(() => result.current.addThreshold(90)); // dedup
    expect(result.current.options.thresholds).toEqual([40, 60, 90]);
    act(() => result.current.removeThreshold(90));
    expect(result.current.options.thresholds).toEqual([40, 60]);
  });

  it("pre-fills the event title from the main file's topic", () => {
    const { result } = renderHook(() => useReportWizard());
    act(() => {
      result.current.applyInspection([
        res("26_chinese.csv", "12/05/2026", "Chinese Topic"),
        res("26_main.csv", "12/05/2026", "English Topic"),
      ]);
    });
    expect(result.current.options.topic).toBe("English Topic");
  });

  it("falls back to any ok file's topic when no main file is present", () => {
    const { result } = renderHook(() => useReportWizard());
    act(() => {
      result.current.applyInspection([res("foo.csv", "12/05/2026", "Some Topic")]);
    });
    expect(result.current.options.topic).toBe("Some Topic");
  });

  it("strips a trailing Chinese segment from the pre-filled title", () => {
    const { result } = renderHook(() => useReportWizard());
    act(() => {
      result.current.applyInspection([
        res(
          "26_main.csv",
          "12/05/2026",
          "Long Life Empowerment – HH 41st Sakya Trizin – May 26th 2026 – 5月26日灌顶将另外提供中文翻译。",
        ),
      ]);
    });
    expect(result.current.options.topic).toBe(
      "Long Life Empowerment – HH 41st Sakya Trizin – May 26th 2026",
    );
  });

  it("does not overwrite a topic the user already typed", () => {
    const { result } = renderHook(() => useReportWizard());
    act(() => result.current.setTopic("User Choice"));
    act(() => {
      result.current.applyInspection([res("26_main.csv", "12/05/2026", "From Metadata")]);
    });
    expect(result.current.options.topic).toBe("User Choice");
  });

  it("builds a generate config from grouping + options", () => {
    const { result } = renderHook(() => useReportWizard());
    act(() => {
      result.current.setFiles([file("a.csv")]);
      // Clear defaults so this test can control thresholds precisely
      result.current.removeThreshold(40);
      result.current.removeThreshold(60);
      result.current.applyInspection([res("a.csv", "12/05/2026")]);
      result.current.setTopic("My Event");
      result.current.addThreshold(50);
    });
    const cfg = result.current.buildConfig();
    expect(cfg.topic).toBe("My Event");
    expect(cfg.thresholds).toEqual([50]);
    expect(cfg.days).toEqual([{ filenames: ["a.csv"] }]);
  });
});

import { inspectFilesLocal } from "./useReportWizard";
import { DAY1_MAIN_CSV } from "@/core/__fixtures__/sample-csvs";

it("inspectFilesLocal parses metadata from a real Zoom CSV", async () => {
  const f = new File([DAY1_MAIN_CSV], "26_main.csv", { type: "text/csv" });
  const [res] = await inspectFilesLocal([f]);
  expect(res.status).toBe("ok");
  expect(res.detected_date).toBe("12/05/2026");
  expect(res.attendee_count).toBe(3);
});

it("inspectFilesLocal flags an invalid CSV", async () => {
  const f = new File(["foo,bar\n1,2"], "bad.csv", { type: "text/csv" });
  const [res] = await inspectFilesLocal([f]);
  expect(res.status).toBe("invalid");
});
