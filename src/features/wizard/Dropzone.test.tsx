import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Dropzone } from "./Dropzone";
import { strings } from "@/constants/strings";

const csv = (name: string) => new File(["a,b\n1,2"], name, { type: "text/csv" });

describe("Dropzone", () => {
  it("renders the prompt and browse hint", () => {
    render(<Dropzone onFiles={vi.fn()} />);
    expect(screen.getByText(strings.upload.prompt)).toBeInTheDocument();
    expect(screen.getByText(strings.upload.browse)).toBeInTheDocument();
  });

  it("passes through only .csv files chosen via the input", () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} />);
    const input = screen.getByTestId("file-input");
    fireEvent.change(input, { target: { files: [csv("a.csv"), new File(["x"], "notes.txt"), csv("b.CSV")] } });
    expect(onFiles).toHaveBeenCalledTimes(1);
    const passed = onFiles.mock.calls[0][0] as File[];
    expect(passed.map((f) => f.name)).toEqual(["a.csv", "b.CSV"]); // .txt filtered out, case-insensitive
  });

  it("accepts files dropped onto the zone (filtering non-csv)", () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} />);
    const zone = screen.getByRole("button", { name: /drag & drop/i });
    fireEvent.drop(zone, { dataTransfer: { files: [csv("dropped.csv"), new File(["x"], "img.png")] } });
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect((onFiles.mock.calls[0][0] as File[]).map((f) => f.name)).toEqual(["dropped.csv"]);
  });
});
