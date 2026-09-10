import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { monthlyClosures } from "@/data/support-data";
import { fmtBR } from "@/lib/format";

const data = monthlyClosures.map((m) => ({
  competencia: m.competencia,
  indice: m.indice,
  mediana: m.mediana,
}));

const tooltipStyle = {
  borderRadius: 6,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
  boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.5)",
};

export function ComboMonthly() {
  return (
    <div>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="comboBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" />
                <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.5} />
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
              domain={[80, 90]}
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
              formatter={(value, name) => [
                fmtBR(Number(value), 2),
                name === "indice" ? "Índice médio" : "Mediana",
              ]}
            />
            <ReferenceLine
              y={85}
              stroke="hsl(var(--warning) / 0.7)"
              strokeDasharray="4 4"
              label={{
                value: "Meta 85",
                position: "insideTopRight",
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                fill: "hsl(var(--warning))",
              }}
            />
            <Bar
              dataKey="indice"
              fill="url(#comboBar)"
              radius={[2, 2, 0, 0]}
              maxBarSize={48}
            />
            <Line
              type="monotone"
              dataKey="mediana"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              dot={{ r: 4, fill: "hsl(var(--chart-3))", strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mono mt-2 flex items-center gap-5 border-t border-border/60 pt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-[2px] bg-gradient-to-r from-cyan-400 to-blue-500" />
          Índice médio
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-amber-400" />
          Mediana
        </span>
      </div>
    </div>
  );
}
