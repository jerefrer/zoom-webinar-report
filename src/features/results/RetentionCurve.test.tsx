import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RetentionCurve } from "./RetentionCurve";

describe("RetentionCurve", () => {
  it("renders nothing when no retention data", () => {
    const { container } = render(<RetentionCurve retention={undefined} />);
    expect(container.firstChild).toBeNull();
  });
  it("renders the heading when data is present", () => {
    render(<RetentionCurve retention={[
      { tMinutes: 0, pctRemaining: 100 },
      { tMinutes: 30, pctRemaining: 70 },
    ]} />);
    expect(screen.getByText(/Retention curve/i)).toBeInTheDocument();
  });
});
