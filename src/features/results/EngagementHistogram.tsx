import { Card } from "@/components/ui/card";
import { strings } from "@/constants/strings";
import { useChartColors } from "@/lib/useChartColors";
import type { HistogramBucket } from "@/types/report";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props { histogram: HistogramBucket[]; }

export function EngagementHistogram({ histogram }: Props) {
  const c = useChartColors();
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {strings.results.panels.histogram}
      </h3>
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <BarChart data={histogram}>
            <CartesianGrid stroke={c.border} strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke={c.muted} fontSize={12} />
            <YAxis stroke={c.muted} fontSize={12} allowDecimals={false} />
            <Tooltip cursor={{ fill: c.primary, fillOpacity: 0.08 }} />
            <Bar dataKey="count" fill={c.primary} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
