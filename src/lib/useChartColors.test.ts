import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useChartColors } from "./useChartColors";

describe("useChartColors", () => {
  it("returns concrete color strings recharts can consume", () => {
    const { result } = renderHook(() => useChartColors());
    for (const color of [result.current.primary, result.current.muted, result.current.border]) {
      expect(color).toBeTruthy();
      // Regression guard: the old code passed `hsl(var(--primary))`, which is
      // invalid CSS (the vars are oklch) → black bars / invisible lines.
      expect(color).not.toContain("var(");
      expect(color).not.toMatch(/hsl\(\s*oklch/i);
    }
  });
});
