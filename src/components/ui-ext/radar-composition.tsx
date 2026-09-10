import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const data = [
  { criterio: "Quantidade", pct: 81.5 },
  { criterio: "Avaliação", pct: 93.9 },
  { criterio: "Cobertura", pct: 88.5 },
  { criterio: "CSAT", pct: 91 },
  { criterio: "Base fixa", pct: 100 },
];

export function RadarComposition() {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <defs>
            <linearGradient id="radarGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.55} />
              <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="criterio"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <Radar
            dataKey="pct"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            fill="url(#radarGrad)"
            dot={{ r: 2.5, fill: "hsl(var(--chart-2))", strokeWidth: 0 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))",
              fontSize: 12,
              boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.35)",
            }}
            formatter={(value) => [`${value}%`, "Aproveitamento"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
