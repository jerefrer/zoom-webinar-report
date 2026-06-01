import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useSharedReport } from "./useSharedReport";
import { encodeReport } from "@/core/shareUrl";
import type { ShareableReport } from "@/types/report";

const sample: ShareableReport = {
  v: 1, title: "T", generatedAt: "x", days: [], rooms: [],
  topLine: { unique: 1, countries: 1, avg: 1, median: 1, max: 1 },
  thresholds: [], countries: [], histogram: [],
};

afterEach(() => { window.location.hash = ""; });

describe("useSharedReport", () => {
  it("returns null when no hash is present", () => {
    const { result } = renderHook(() => useSharedReport());
    expect(result.current).toBeNull();
  });

  it("decodes a valid hash payload", () => {
    window.location.hash = `#report=${encodeReport(sample)}`;
    const { result } = renderHook(() => useSharedReport());
    expect(result.current?.title).toBe("T");
  });

  it("returns null on a corrupt hash", () => {
    window.location.hash = `#report=garbage`;
    const { result } = renderHook(() => useSharedReport());
    expect(result.current).toBeNull();
  });
});
