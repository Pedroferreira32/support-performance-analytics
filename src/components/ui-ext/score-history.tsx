import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fmtBR } from "@/lib/format";

export interface HistoryPoint {
  competencia: string;
  nota: number;
}

interface ScoreHistoryProps {
  data: HistoryPoint[];
  color?: string;
}

export function ScoreHistory({
  data,
  color = "hsl(var(--chart-1))",
}: ScoreHistoryProps) {
  const safe = data.filter((d) => d.nota != null);
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={safe}
          margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            dataKey="competencia"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            domain={[70, 95]}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid hsl(var(--border))",
              fontSize: 12,
              boxShadow: "0 8px 24px -8px rgb(15 23 42 / 0.15)",
            }}
            formatter={(value) => [fmtBR(Number(value), 2), "Nota final"]}
          />
          <ReferenceLine
            y={85}
            stroke="hsl(var(--danger) / 0.6)"
            strokeDasharray="4 4"
            label={{
              value: "Meta 85",
              position: "insideTopRight",
              fontSize: 10,
              fill: "hsl(var(--danger))",
            }}
          />
          <Line
            type="monotone"
            dataKey="nota"
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 5, fill: color, strokeWidth: 2, stroke: "hsl(var(--card))" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
