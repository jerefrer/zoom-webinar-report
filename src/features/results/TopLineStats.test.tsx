import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TopLineStats } from "./TopLineStats";

describe("TopLineStats", () => {
  it("renders unique, countries, avg, median, max with labels", () => {
    render(<TopLineStats topLine={{ unique: 2048, countries: 38, avg: 87, median: 95, max: 150 }} />);
    expect(screen.getByText("38")).toBeInTheDocument();
    expect(screen.getByText(/87/).closest("span")).toBeInTheDocument();
    expect(screen.getByText(/95/).closest("span")).toBeInTheDocument();
    expect(screen.getByText(/150/).closest("span")).toBeInTheDocument();
    // 2048 formatted — accept any space-like thousands separator
    expect(screen.getByText(/2.048|2 048/)).toBeInTheDocument();
  });
});
