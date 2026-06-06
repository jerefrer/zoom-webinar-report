import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DndContext } from "@dnd-kit/core";
import { FileCard, FileCardOverlay } from "./FileCard";

function renderInDnd(ui: React.ReactNode) {
  return render(<DndContext>{ui}</DndContext>);
}

describe("FileCard", () => {
  it("renders the filename and a labelled drag handle", () => {
    renderInDnd(<FileCard filename="day1.csv" onRemove={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Move day1.csv" })).toHaveTextContent("day1.csv");
  });

  it("calls onRemove with the filename when ✕ is clicked", async () => {
    const onRemove = vi.fn();
    renderInDnd(<FileCard filename="day1.csv" onRemove={onRemove} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove day1.csv" }));
    expect(onRemove).toHaveBeenCalledWith("day1.csv");
  });
});

describe("FileCardOverlay", () => {
  it("shows the filename and is non-interactive (no buttons to clip/click)", () => {
    render(<FileCardOverlay filename="dragged.csv" />);
    expect(screen.getByText("dragged.csv")).toBeInTheDocument();
    // The overlay is a passive clone — it must not expose actionable buttons.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
