import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CountriesPanel } from "./CountriesPanel";

function countries(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    name: `Country ${i + 1}`,
    count: 100 - i * 5,
    pct: (100 - i * 5) / 10,
  }));
}

describe("CountriesPanel", () => {
  it("shows the top 10 collapsed, with a 'show all' control for the rest", () => {
    render(<CountriesPanel countries={countries(12)} />);
    expect(screen.getByText("Country 1")).toBeInTheDocument();
    expect(screen.getByText("Country 10")).toBeInTheDocument();
    expect(screen.queryByText("Country 11")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+2 more/ })).toBeInTheDocument();
  });

  it("expands to reveal every country and collapses again", async () => {
    render(<CountriesPanel countries={countries(12)} />);
    await userEvent.click(screen.getByRole("button", { name: /\+2 more/ }));
    expect(screen.getByText("Country 11")).toBeInTheDocument();
    expect(screen.getByText("Country 12")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /show less/i }));
    expect(screen.queryByText("Country 11")).not.toBeInTheDocument();
  });

  it("renders count and percentage as separate cells", () => {
    render(<CountriesPanel countries={[{ name: "France", count: 42, pct: 12.5 }]} />);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("12.5%")).toBeInTheDocument();
  });

  it("shows no toggle when there are 10 or fewer countries", () => {
    render(<CountriesPanel countries={countries(8)} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
