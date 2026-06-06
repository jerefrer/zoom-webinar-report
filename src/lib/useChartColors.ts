import { useState } from "react";

/**
 * Recharts needs concrete color strings for `fill`/`stroke`. The theme defines
 * its colors as `oklch(...)` CSS variables, so `hsl(var(--primary))` (what the
 * charts used to pass) is invalid CSS — the browser drops it, leaving bars black
 * and lines with no stroke (invisible). We resolve the variables to their actual
 * computed values instead, which keeps the charts on-theme (incl. dark mode).
 */
export interface ChartColors {
  primary: string;
  muted: string;
  border: string;
}

// Used only when the CSS vars can't be read (e.g. jsdom in unit tests). Picked
// to approximate the light-theme tokens so test renders aren't nonsensical.
const FALLBACK: ChartColors = {
  primary: "#2563eb",
  muted: "#64748b",
  border: "#e2e8f0",
};

function readChartColors(): ChartColors {
  if (typeof document === "undefined") return { ...FALLBACK };
  const cs = getComputedStyle(document.documentElement);
  const pick = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
  return {
    primary: pick("--primary", FALLBACK.primary),
    muted: pick("--muted-foreground", FALLBACK.muted),
    border: pick("--border", FALLBACK.border),
  };
}

export function useChartColors(): ChartColors {
  // The stylesheet is injected before the app mounts, so the computed values
  // are available on first render — a one-time read is enough.
  const [colors] = useState<ChartColors>(readChartColors);
  return colors;
}
