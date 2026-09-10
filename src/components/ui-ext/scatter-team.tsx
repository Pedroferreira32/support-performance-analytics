import { employees } from "@/data/support-data";

const X_MIN = 260;
const X_MAX = 440;
const Y_MIN = 4.0;
const Y_MAX = 4.9;
const W = 560;
const H = 220;
const PAD_L = 48;
const PAD_R = 16;
const PAD_T = 12;
const PAD_B = 30;

const xPos = (v: number) =>
  PAD_L + ((v - X_MIN) / (X_MAX - X_MIN)) * (W - PAD_L - PAD_R);
const yPos = (v: number) =>
  H - PAD_B - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD_T - PAD_B);

const bubbleColor = (s: string) =>
  s === "Premiado"
    ? "hsl(var(--chart-1))"
    : s === "Elegível — fora do Top 3"
      ? "hsl(var(--chart-3))"
      : "hsl(var(--danger) / 0.75)";

const MONO = "'JetBrains Mono', monospace";

const XTICKS = [280, 320, 360, 400, 420];
const YTICKS = [4.2, 4.4, 4.6, 4.8];

export function ScatterTeam() {
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
          {XTICKS.map((t) => (
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
          {YTICKS.map((t) => (
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
          {XTICKS.map((t) => (
            <text
              key={`xt${t}`}
              x={xPos(t)}
              y={H - PAD_B + 16}
              textAnchor="middle"
              fontSize={9}
              fill="hsl(var(--muted-foreground))"
              fontFamily={MONO}
            >
              {t}
            </text>
          ))}
          {YTICKS.map((t) => (
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
            const r = 5 + (e.cobertura - 85) * 0.6;
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
