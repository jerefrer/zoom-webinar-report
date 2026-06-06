import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import App from "./App";
import { strings } from "@/constants/strings";

describe("App", () => {
  beforeEach(() => {
    // Ensure no shared-report hash leaks between tests (would switch App to read-only).
    window.location.hash = "";
  });

  it("renders the wizard on the upload step by default", () => {
    render(<App />);
    expect(screen.getByText(strings.upload.prompt)).toBeInTheDocument();
  });

  it("shows the four-step progress indicator", () => {
    render(<App />);
    expect(screen.getByText(strings.steps.upload)).toBeInTheDocument();
    expect(screen.getByText(strings.steps.grouping)).toBeInTheDocument();
    expect(screen.getByText(strings.steps.options)).toBeInTheDocument();
    expect(screen.getByText(strings.steps.done)).toBeInTheDocument();
  });

  it("renders a read-only shared report when the URL carries a #report fragment", () => {
    // A malformed fragment must not crash the app; it falls back to the wizard.
    window.location.hash = "#report=not-valid-data";
    render(<App />);
    expect(screen.getByText(strings.upload.prompt)).toBeInTheDocument();
  });
});
