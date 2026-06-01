import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PerDayChart } from "./PerDayChart";

describe("PerDayChart", () => {
  it("renders a heading and the data labels", () => {
    render(
      <PerDayChart
        perDay={[
          { dayIdx: 0, label: "Day 1", unique: 1310 },
          { dayIdx: 1, label: "Day 2", unique: 738 },
        ]}
      />,
    );
    expect(screen.getByText(/Per-day attendance/i)).toBeInTheDocument();
  });

  it("returns null when only one day or empty", () => {
    const { container } = render(<PerDayChart perDay={[{ dayIdx: 0, label: "Day 1", unique: 1 }]} />);
    expect(container.firstChild).toBeNull();
  });
});
