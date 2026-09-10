import { employees } from "@/data/support-data";
import { cn } from "@/lib/utils";
import { fmtBR } from "@/lib/format";

const MIN = 70;
const MAX = 95;
const META = 85;

function pos(n: number) {
  return ((n - MIN) / (MAX - MIN)) * 100;
}

const center = pos(META);

export function GapChart() {
  return (
    <div>
      <div className="flex flex-col gap-1">
        {employees.map((e) => {
          const acima = e.note >= META;
          const width = Math.abs(pos(e.note) - center);
          return (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40"
            >
              <div className="flex w-40 shrink-0 items-center gap-2 pr-3">
                <span className="tnum text-[11px] font-bold text-muted-foreground">
                  {e.rank}º
                </span>
                <span className="truncate text-sm font-medium">{e.name}</span>
              </div>

              <div className="relative h-6 flex-1">
                <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border/60" />
                {/* linha da meta */}
                <div
                  className="absolute inset-y-0 w-0 border-l-2 border-dashed border-amber-500/70"
                  style={{ left: `${center}%` }}
                />
                {/* barra divergente a partir da meta */}
                <div
                  className="absolute inset-y-0 flex items-center"
                  style={{
                    left: `${acima ? center : pos(e.note)}%`,
                    width: `${Math.max(width, 0.6)}%`,
                  }}
                >
                  <div
                    className={cn(
                      "h-3.5 w-full rounded-full",
                      acima
                        ? "bg-gradient-to-r from-cyan-400 to-blue-500"
                        : "bg-rose-500/50"
                    )}
                  />
                </div>
              </div>

              <div className="w-16 shrink-0 text-right">
                <span
                  className={cn(
                    "tnum text-sm font-bold",
                    !acima && "text-rose-600 dark:text-rose-400"
                  )}
                >
                  {fmtBR(e.note, 2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
          Acima da meta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-rose-500/50" />
          Abaixo da meta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 border-l-2 border-dashed border-amber-500/70" />
          Meta de 85 pontos
        </span>
      </div>
    </div>
  );
}
