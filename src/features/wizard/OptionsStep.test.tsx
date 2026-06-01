import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OptionsStep } from "./OptionsStep";
import { strings } from "@/constants/strings";

const props = () => ({
  topic: "",
  thresholds: [] as number[],
  onTopic: vi.fn(),
  onAddThreshold: vi.fn(),
  onRemoveThreshold: vi.fn(),
  onBack: vi.fn(),
  onGenerate: vi.fn(),
});

describe("OptionsStep", () => {
  it("edits the event title", async () => {
    const p = props();
    render(<OptionsStep {...p} />);
    await userEvent.type(screen.getByLabelText(strings.options.eventTitle), "Hi");
    expect(p.onTopic).toHaveBeenCalled();
  });

  it("adds a threshold from the input", async () => {
    const p = props();
    render(<OptionsStep {...p} />);
    await userEvent.type(screen.getByLabelText(strings.options.thresholds), "90");
    await userEvent.click(screen.getByRole("button", { name: strings.options.addThreshold }));
    expect(p.onAddThreshold).toHaveBeenCalledWith(90);
  });

  it("renders existing threshold chips", () => {
    render(<OptionsStep {...props()} thresholds={[50, 90]} />);
    expect(screen.getByText("50 min")).toBeInTheDocument();
    expect(screen.getByText("90 min")).toBeInTheDocument();
  });
});
