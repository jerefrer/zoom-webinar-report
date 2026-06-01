import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EngagementHistogram } from "./EngagementHistogram";

describe("EngagementHistogram", () => {
  it("renders the heading", () => {
    render(<EngagementHistogram histogram={[
      { label: "0–15", minMin: 0, maxMin: 15, count: 5 },
      { label: "120+", minMin: 120, maxMin: null, count: 3 },
    ]} />);
    expect(screen.getByText(/Engagement time distribution/i)).toBeInTheDocument();
  });
});
