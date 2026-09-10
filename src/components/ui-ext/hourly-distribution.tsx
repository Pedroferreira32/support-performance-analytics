import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { hourlyDistribution } from "@/data/support-data";

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
  boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.5)",
};

export function HourlyDistribution() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={hourlyDistribution}
          margin={{ top: 18, right: 8, left: -22, bottom: 0 }}
        >
          <defs>
            <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" />
              <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            dataKey="hora"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            contentStyle={tooltipStyle}
            formatter={(value) => [`${value} atendimentos`, "Entradas"]}
          />
          <Bar dataKey="total" fill="url(#hourGrad)" radius={[6, 6, 0, 0]} maxBarSize={30}>
            <LabelList
              dataKey="total"
              position="top"
              fontSize={10}
              fill="hsl(var(--muted-foreground))"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
