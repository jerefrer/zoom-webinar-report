import { Card } from "@/components/ui/card";
import { strings } from "@/constants/strings";
import type { PerDayStat } from "@/types/report";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props { perDay: PerDayStat[]; }

export function PerDayChart({ perDay }: Props) {
  if (perDay.length < 2) return null;
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {strings.results.panels.perDay}
      </h3>
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <BarChart data={perDay}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip />
            <Bar dataKey="unique" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
