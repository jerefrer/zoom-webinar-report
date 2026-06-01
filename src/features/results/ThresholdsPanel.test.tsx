import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThresholdsPanel } from "./ThresholdsPanel";

describe("ThresholdsPanel", () => {
  it("renders rows for each threshold with count and pct", () => {
    render(
      <ThresholdsPanel
        thresholds={[
          { mins: 40, count: 1820, pct: 88.9 },
          { mins: 60, count: 1610, pct: 78.6 },
        ]}
      />,
    );
    expect(screen.getByText(/≥ 40 min/)).toBeInTheDocument();
    expect(screen.getByText(/1820/)).toBeInTheDocument();
    expect(screen.getByText(/88.9%/)).toBeInTheDocument();
  });

  it("renders nothing when no thresholds were specified", () => {
    const { container } = render(<ThresholdsPanel thresholds={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
