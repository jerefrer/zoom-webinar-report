import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UploadStep } from "./UploadStep";
import { strings } from "@/constants/strings";

describe("UploadStep", () => {
  it("shows the drop prompt", () => {
    render(<UploadStep files={[]} results={[]} isInspecting={false} onFiles={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByText(strings.upload.prompt)).toBeInTheDocument();
  });

  it("calls onFiles when files are selected via the input", async () => {
    const onFiles = vi.fn();
    render(<UploadStep files={[]} results={[]} isInspecting={false} onFiles={onFiles} onNext={vi.fn()} />);
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    await userEvent.upload(input, new File(["x"], "a.csv", { type: "text/csv" }));
    expect(onFiles).toHaveBeenCalled();
  });

  it("disables Continue when there are no valid files", () => {
    render(<UploadStep files={[]} results={[]} isInspecting={false} onFiles={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByRole("button", { name: strings.upload.next })).toBeDisabled();
  });

  it("renders the main file before the chinese file regardless of input order", () => {
    const results = [
      { filename: "26_chinese.csv", status: "ok" as const, detected_date: "12/05/2026", topic: "T", webinar_id: "1", attendee_count: 1, error: null },
      { filename: "26_main.csv",    status: "ok" as const, detected_date: "12/05/2026", topic: "T", webinar_id: "1", attendee_count: 1, error: null },
    ];
    render(<UploadStep files={[]} results={results} isInspecting={false} onFiles={vi.fn()} onNext={vi.fn()} />);
    const items = screen.getAllByRole("listitem").map((li) => li.textContent ?? "");
    expect(items[0]).toContain("26_main.csv");
    expect(items[1]).toContain("26_chinese.csv");
  });
});
