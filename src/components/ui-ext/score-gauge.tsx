import { fmtBR } from "@/lib/format";

interface ScoreGaugeProps {
  value: number;
  max: number;
  label: string;
  sublabel: string;
}

export function ScoreGauge({ value, max, label, sublabel }: ScoreGaugeProps) {
  const pct = Math.min(value / max, 1);
  const r = 68;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg viewBox="0 0 160 160" className="size-40 -rotate-90">
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" />
              <stop offset="100%" stopColor="hsl(var(--chart-2))" />
            </linearGradient>
          </defs>
          <circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            strokeWidth={11}
            className="stroke-muted"
          />
          <circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            strokeWidth={11}
            strokeLinecap="round"
            stroke="url(#gaugeGrad)"
            strokeDasharray={`${c * pct} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="mono text-3xl font-bold">{fmtBR(value, 2)}</span>
          <span className="mono text-[11px] text-muted-foreground">
            de {fmtBR(max, 2)}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm font-bold">{label}</p>
      <p className="mt-0.5 text-center text-xs text-muted-foreground">
        {sublabel}
      </p>
    </div>
  );
}
