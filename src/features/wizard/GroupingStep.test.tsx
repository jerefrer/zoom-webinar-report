import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GroupingStep } from "./GroupingStep";
import { strings } from "@/constants/strings";

const baseProps = {
  grouping: { days: [["a.csv"]], unassigned: [] as string[] },
  onMove: vi.fn(),
  onAddDay: vi.fn(),
  onRemoveFile: vi.fn(),
  onBack: vi.fn(),
  onNext: vi.fn(),
  canNext: true,
};

describe("GroupingStep", () => {
  it("renders a bucket per day with its files", () => {
    render(<GroupingStep {...baseProps} />);
    expect(screen.getByText("a.csv")).toBeInTheDocument();
    expect(screen.getByText(`${strings.grouping.day} 1`)).toBeInTheDocument();
  });

  it("shows the unassigned warning and disables Continue when files are unassigned", () => {
    render(<GroupingStep {...baseProps} grouping={{ days: [["a.csv"]], unassigned: ["x.csv"] }} canNext={false} />);
    expect(screen.getByText(strings.grouping.unassigned)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: strings.grouping.next })).toBeDisabled();
  });

  it("calls onAddDay", async () => {
    const onAddDay = vi.fn();
    render(<GroupingStep {...baseProps} onAddDay={onAddDay} />);
    await userEvent.click(screen.getByRole("button", { name: strings.grouping.addDay }));
    expect(onAddDay).toHaveBeenCalled();
  });
});
