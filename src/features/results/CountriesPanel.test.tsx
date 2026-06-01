import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CountriesPanel } from "./CountriesPanel";

describe("CountriesPanel", () => {
  it("renders the top 10 countries with bars and percentages", () => {
    const countries = Array.from({ length: 12 }, (_, i) => ({
      name: `Country ${i + 1}`,
      count: 100 - i * 5,
      pct: (100 - i * 5) / 10,
    }));
    render(<CountriesPanel countries={countries} />);
    expect(screen.getByText("Country 1")).toBeInTheDocument();
    expect(screen.getByText("Country 10")).toBeInTheDocument();
    expect(screen.queryByText("Country 11")).not.toBeInTheDocument();
    expect(screen.getByText(/\+2 more/)).toBeInTheDocument();
  });
});
