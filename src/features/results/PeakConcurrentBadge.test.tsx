import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PeakConcurrentBadge } from "./PeakConcurrentBadge";

describe("PeakConcurrentBadge", () => {
  it("renders nothing when no peak", () => {
    const { container } = render(<PeakConcurrentBadge peak={undefined} />);
    expect(container.firstChild).toBeNull();
  });
  it("renders peak count and time", () => {
    render(<PeakConcurrentBadge peak={{ count: 1420, at: "10:32" }} />);
    // toLocaleString("fr-FR") inserts a narrow no-break space as thousands separator
    expect(screen.getByText(/1.?420/)).toBeInTheDocument();
    expect(screen.getByText(/10:32/)).toBeInTheDocument();
  });
});
