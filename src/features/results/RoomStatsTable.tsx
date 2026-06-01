import { Card } from "@/components/ui/card";
import { strings } from "@/constants/strings";
import type { RoomStatRow } from "@/types/report";

interface Props { rooms: RoomStatRow[]; }

export function RoomStatsTable({ rooms }: Props) {
  return (
    <Card className="overflow-x-auto p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {strings.results.panels.rooms}
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="p-2">Day</th>
            <th className="p-2">Room</th>
            <th className="p-2">Webinar ID</th>
            <th className="p-2 text-right">Unique</th>
            <th className="p-2 text-right">Total (Zoom)</th>
            <th className="p-2 text-right">Unique viewers (Zoom)</th>
            <th className="p-2 text-right">Duration (min)</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((r, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              <td className="p-2">{r.dayLabel}</td>
              <td className="p-2 font-medium">{r.roomLabel}</td>
              <td className="p-2 tabular-nums">{r.webinarId}</td>
              <td className="p-2 text-right tabular-nums">{r.uniqueAttendees}</td>
              <td className="p-2 text-right tabular-nums">{r.totalUsersZoom}</td>
              <td className="p-2 text-right tabular-nums">{r.uniqueViewersZoom}</td>
              <td className="p-2 text-right tabular-nums">{r.durationMinutesZoom}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
