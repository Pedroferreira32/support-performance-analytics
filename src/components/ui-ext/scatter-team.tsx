import { employees } from "@/data/support-data-runtime";

const W = 560;
const H = 220;
const PAD_L = 48;
const PAD_R = 16;
const PAD_T = 12;
const PAD_B = 30;

const bubbleColor = (s: string) =>
  s === "Premiado"
    ? "hsl(var(--chart-1))"
    : s === "Elegível — fora do Top 3"
      ? "hsl(var(--chart-3))"
      : "hsl(var(--danger) / 0.75)";

const MONO = "'JetBrains Mono', monospace";

export function ScatterTeam() {
  const volumes = employees.map((employee) => employee.volume);
  const evaluations = employees.map((employee) => employee.csat);
  const rawXMin = Math.min(...volumes);
  const rawXMax = Math.max(...volumes);
  const rawYMin = Math.min(...evaluations);
  const rawYMax = Math.max(...evaluations);
  const xPadding = Math.max(1, (rawXMax - rawXMin) * 0.12);
  const yPadding = Math.max(0.1, (rawYMax - rawYMin) * 0.18);
  const xMin = Math.max(0, rawXMin - xPadding);
  const xMax = rawXMax + xPadding;
  const yMin = Math.max(0, rawYMin - yPadding);
  const yMax = rawYMax + yPadding;
  const xPos = (value: number) => PAD_L + ((value - xMin) / Math.max(1, xMax - xMin)) * (W - PAD_L - PAD_R);
  const yPos = (value: number) => H - PAD_B - ((value - yMin) / Math.max(0.1, yMax - yMin)) * (H - PAD_T - PAD_B);
  const xTicks = Array.from({ length: 5 }, (_, index) => xMin + ((xMax - xMin) * index) / 4);
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + ((yMax - yMin) * index) / 4);

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="min-w-[440px] w-full"
          role="img"
          aria-label="Gráfico de dispersão: volume por CSAT"
        >
          {/* Grade */}
          {xTicks.map((t) => (
            <line
              key={`x${t}`}
              x1={xPos(t)}
              y1={PAD_T}
              x2={xPos(t)}
              y2={H - PAD_B}
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
            />
          ))}
          {yTicks.map((t) => (
            <line
              key={`y${t}`}
              x1={PAD_L}
              y1={yPos(t)}
              x2={W - PAD_R}
              y2={yPos(t)}
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
            />
          ))}

          {/* Rótulos dos eixos */}
          {xTicks.map((t) => (
            <text
              key={`xt${t}`}
              x={xPos(t)}
              y={H - PAD_B + 16}
              textAnchor="middle"
              fontSize={9}
              fill="hsl(var(--muted-foreground))"
              fontFamily={MONO}
            >
              {Math.round(t)}
            </text>
          ))}
          {yTicks.map((t) => (
            <text
              key={`yt${t}`}
              x={PAD_L - 6}
              y={yPos(t) + 3}
              textAnchor="end"
              fontSize={9}
              fill="hsl(var(--muted-foreground))"
              fontFamily={MONO}
            >
              {t.toFixed(1)}
            </text>
          ))}

          <text
            x={PAD_L + (W - PAD_L - PAD_R) / 2}
            y={H - 6}
            textAnchor="middle"
            fontSize={9}
            fill="hsl(var(--muted-foreground))"
            fontFamily={MONO}
          >
            VOLUME
          </text>
          <text
            x={14}
            y={PAD_T + (H - PAD_T - PAD_B) / 2}
            textAnchor="middle"
            fontSize={9}
            fill="hsl(var(--muted-foreground))"
            fontFamily={MONO}
            transform={`rotate(-90 14 ${PAD_T + (H - PAD_T - PAD_B) / 2})`}
          >
            CSAT
          </text>

          {/* Bolhas */}
          {employees.map((e) => {
            const r = Math.max(5, Math.min(14, 5 + e.cobertura * 0.08));
            const fill = bubbleColor(e.situacao);
            return (
              <g key={e.id}>
                <circle
                  cx={xPos(e.volume)}
                  cy={yPos(e.csat)}
                  r={r}
                  fill={fill}
                  opacity={0.7}
                />
                <circle
                  cx={xPos(e.volume)}
                  cy={yPos(e.csat)}
                  r={r}
                  fill="none"
                  stroke={fill}
                  strokeWidth={1.2}
                />
                <title>{`${e.name} · Volume ${e.volume} · CSAT ${e.csat} · Cobertura ${e.cobertura}%`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mono mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-cyan-400" />
          Premiado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-amber-400" />
          Elegível
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-rose-400/70" />
          Abaixo da meta
        </span>
        <span className="ml-auto hidden text-[10px] normal-case tracking-normal sm:block">
          Tamanho da bolha = cobertura CSAT
        </span>
      </div>
    </div>
  );
}
