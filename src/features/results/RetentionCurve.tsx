import { Card } from "@/components/ui/card";
import { strings } from "@/constants/strings";
import type { RetentionPoint } from "@/types/report";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props { retention?: RetentionPoint[]; }

export function RetentionCurve({ retention }: Props) {
  if (!retention || retention.length === 0) return null;
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {strings.results.panels.retention}
      </h3>
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <LineChart data={retention}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis dataKey="tMinutes" stroke="hsl(var(--muted-foreground))" fontSize={12} unit=" min" />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="pctRemaining" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
