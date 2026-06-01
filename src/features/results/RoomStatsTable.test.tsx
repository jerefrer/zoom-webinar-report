import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomStatsTable } from "./RoomStatsTable";

describe("RoomStatsTable", () => {
  it("renders one row per room with the right values", () => {
    render(<RoomStatsTable rooms={[
      { dayLabel: "12/05/2026", roomLabel: "Main Room", webinarId: "123456",
        uniqueAttendees: 1310, totalUsersZoom: "2056", uniqueViewersZoom: "1463", durationMinutesZoom: "150" },
      { dayLabel: "12/05/2026", roomLabel: "Chinese Room", webinarId: "789012",
        uniqueAttendees: 738, totalUsersZoom: "1037", uniqueViewersZoom: "820", durationMinutesZoom: "145" },
    ]} />);
    expect(screen.getByText("Main Room")).toBeInTheDocument();
    expect(screen.getByText("Chinese Room")).toBeInTheDocument();
    expect(screen.getByText("1310")).toBeInTheDocument();
  });
});
