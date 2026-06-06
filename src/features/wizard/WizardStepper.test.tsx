import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WizardStepper } from "./WizardStepper";
import { strings } from "@/constants/strings";

describe("WizardStepper", () => {
  it("renders all four step labels", () => {
    render(<WizardStepper step="upload" />);
    expect(screen.getByText(strings.steps.upload)).toBeInTheDocument();
    expect(screen.getByText(strings.steps.grouping)).toBeInTheDocument();
    expect(screen.getByText(strings.steps.options)).toBeInTheDocument();
    expect(screen.getByText(strings.steps.done)).toBeInTheDocument();
  });

  it("shows numbered badges (no checks) when on the first step", () => {
    render(<WizardStepper step="upload" />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
  });

  it("marks earlier steps as done (✓) and numbers the rest", () => {
    render(<WizardStepper step="options" />);
    // upload + grouping are before "options" → two check marks
    expect(screen.getAllByText("✓")).toHaveLength(2);
    // the still-pending "Download" step keeps its number (4)
    const items = screen.getAllByRole("listitem");
    expect(within(items[3]).getByText("4")).toBeInTheDocument();
  });
});
