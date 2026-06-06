import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DndContext } from "@dnd-kit/core";
import { DayBucket } from "./DayBucket";

function renderBucket(props: Partial<React.ComponentProps<typeof DayBucket>> = {}) {
  const onRemoveFile = vi.fn();
  render(
    <DndContext>
      <DayBucket id="day-0" label="Day 1" files={["a.csv", "b.csv"]} onRemoveFile={onRemoveFile} {...props} />
    </DndContext>,
  );
  return { onRemoveFile };
}

describe("DayBucket", () => {
  it("renders its label and one card per file", () => {
    renderBucket();
    expect(screen.getByText("Day 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move a.csv" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move b.csv" })).toBeInTheDocument();
  });

  it("omits the label when empty (used by the unassigned bucket)", () => {
    renderBucket({ label: "", files: ["x.csv"] });
    expect(screen.queryByText("Day 1")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move x.csv" })).toBeInTheDocument();
  });

  it("propagates a file removal", async () => {
    const { onRemoveFile } = renderBucket();
    await userEvent.click(screen.getByRole("button", { name: "Remove a.csv" }));
    expect(onRemoveFile).toHaveBeenCalledWith("a.csv");
  });
});
