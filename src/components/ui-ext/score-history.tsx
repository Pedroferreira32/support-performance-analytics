import {
  Area,
  AreaChart,
  CartesianGrid,
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
}

export function ScoreHistory({ data }: ScoreHistoryProps) {
  const safe = data.filter((d) => d.nota != null);
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={safe}
          margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
        >
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            dataKey="competencia"
            tickLine={false}
            axisLine={false}
            tick={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fill: "hsl(var(--muted-foreground))",
            }}
          />
          <YAxis
            domain={[70, 95]}
            tickLine={false}
            axisLine={false}
            tick={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fill: "hsl(var(--muted-foreground))",
            }}
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))",
              fontSize: 12,
              boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.5)",
            }}
            formatter={(value) => [fmtBR(Number(value), 2), "Nota final"]}
          />
          <ReferenceLine
            y={85}
            stroke="hsl(var(--warning) / 0.7)"
            strokeDasharray="4 4"
            label={{
              value: "Meta 85",
              position: "insideTopRight",
              fontSize: 10,
              fill: "hsl(var(--warning))",
            }}
          />
          <Area
            type="monotone"
            dataKey="nota"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2.5}
            fill="url(#scoreGrad)"
            dot={{ r: 5, fill: "hsl(var(--chart-1))", strokeWidth: 2, stroke: "hsl(var(--card))" }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
