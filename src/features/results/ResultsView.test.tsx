import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResultsView } from "./ResultsView";
import { parseZoomCsv } from "@/core/parser";
import { deduplicate } from "@/core/processor";
import { aggregate } from "@/core/aggregator";
import { DAY1_MAIN_CSV } from "@/core/__fixtures__/sample-csvs";
import { strings } from "@/constants/strings";

function statsFixture() {
  const parsed = parseZoomCsv(DAY1_MAIN_CSV);
  return aggregate({
    title: "My Event",
    thresholds: [90],
    days: [{ sources: [{ attendees: deduplicate(parsed.attendees), meta: parsed.meta, roomLabel: "Main Room" }] }],
  });
}

const handlers = () => ({ onStartOver: vi.fn(), onDownload: vi.fn(), onShare: vi.fn() });

describe("ResultsView", () => {
  it("shows the event title and action buttons in edit mode", () => {
    render(<ResultsView stats={statsFixture()} {...handlers()} />);
    expect(screen.getByRole("heading", { name: "My Event" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(strings.results.download) })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(strings.results.share) })).toBeInTheDocument();
  });

  it("wires the download and share buttons", async () => {
    const h = handlers();
    render(<ResultsView stats={statsFixture()} {...h} />);
    await userEvent.click(screen.getByRole("button", { name: new RegExp(strings.results.download) }));
    await userEvent.click(screen.getByRole("button", { name: new RegExp(strings.results.share) }));
    expect(h.onDownload).toHaveBeenCalledTimes(1);
    expect(h.onShare).toHaveBeenCalledTimes(1);
  });

  it("hides download/share and shows a 'create your own' link in readOnly mode", () => {
    render(<ResultsView stats={statsFixture()} readOnly {...handlers()} />);
    expect(screen.queryByRole("button", { name: new RegExp(strings.results.download) })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(strings.results.createOwn) })).toBeInTheDocument();
  });
});
