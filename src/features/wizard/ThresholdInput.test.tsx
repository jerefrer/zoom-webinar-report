import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThresholdInput } from "./ThresholdInput";
import { strings } from "@/constants/strings";

const props = () => ({
  thresholds: [] as number[],
  onAdd: vi.fn(),
  onRemove: vi.fn(),
});

describe("ThresholdInput", () => {
  it("adds a threshold on button click", async () => {
    const p = props();
    render(<ThresholdInput {...p} />);
    await userEvent.type(screen.getByLabelText(strings.options.thresholds), "40");
    await userEvent.click(screen.getByRole("button", { name: strings.options.addThreshold }));
    expect(p.onAdd).toHaveBeenCalledWith(40);
  });

  it("adds a threshold on Enter key", async () => {
    const p = props();
    render(<ThresholdInput {...p} />);
    await userEvent.type(screen.getByLabelText(strings.options.thresholds), "60{Enter}");
    expect(p.onAdd).toHaveBeenCalledWith(60);
  });

  it("floors decimal input to a whole number of minutes", async () => {
    const p = props();
    render(<ThresholdInput {...p} />);
    await userEvent.type(screen.getByLabelText(strings.options.thresholds), "59.9{Enter}");
    expect(p.onAdd).toHaveBeenCalledWith(59);
  });

  it("ignores non-positive or non-numeric input", async () => {
    const p = props();
    render(<ThresholdInput {...p} />);
    const input = screen.getByLabelText(strings.options.thresholds);
    await userEvent.type(input, "0{Enter}");
    await userEvent.type(input, "-5{Enter}");
    await userEvent.type(input, "abc{Enter}");
    expect(p.onAdd).not.toHaveBeenCalled();
  });

  it("renders existing chips and removes one on ✕ click", async () => {
    const p = { ...props(), thresholds: [40, 60] };
    render(<ThresholdInput {...p} />);
    expect(screen.getByText(/40/)).toBeInTheDocument();
    expect(screen.getByText(/60/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove 40 min threshold" }));
    expect(p.onRemove).toHaveBeenCalledWith(40);
  });
});
