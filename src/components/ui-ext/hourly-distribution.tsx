import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { hourlyDistribution } from "@/data/support-data";

export function HourlyDistribution() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={hourlyDistribution}
          margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
        >
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
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid hsl(var(--border))",
              fontSize: 12,
              boxShadow: "0 8px 24px -8px rgb(15 23 42 / 0.15)",
            }}
            formatter={(value) => [
              `${value} atendimentos`,
              "Entradas",
            ]}
          />
          <Bar
            dataKey="total"
            fill="hsl(var(--chart-1))"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
