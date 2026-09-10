import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { employees } from "@/data/support-data";
import { fmtBR } from "@/lib/format";

const data = employees.map((e) => ({
  name: e.name.split(" ")[0],
  base: 31.5,
  qtd: e.ptsQuantidade,
  aval: e.ptsAvaliacao,
}));

const tooltipStyle = {
  borderRadius: 6,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
  boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.5)",
};

export function StackedFormation() {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            dataKey="name"
            interval={0}
            tickLine={false}
            axisLine={false}
            tick={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fill: "hsl(var(--muted-foreground))",
            }}
          />
          <YAxis
            domain={[0, 95]}
            tickLine={false}
            axisLine={false}
            tick={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fill: "hsl(var(--muted-foreground))",
            }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                base: "Base fixa",
                qtd: "Quantidade",
                aval: "Avaliação",
              };
              return [fmtBR(Number(value), 2), labels[String(name)] ?? String(name)];
            }}
          />
          <ReferenceLine
            y={85}
            stroke="hsl(var(--warning) / 0.7)"
            strokeDasharray="4 4"
          />
          <Bar dataKey="base" stackId="nota" fill="hsl(var(--muted-foreground) / 0.45)" maxBarSize={34} />
          <Bar dataKey="qtd" stackId="nota" fill="hsl(var(--chart-1))" maxBarSize={34} />
          <Bar dataKey="aval" stackId="nota" fill="hsl(var(--chart-2))" maxBarSize={34} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
