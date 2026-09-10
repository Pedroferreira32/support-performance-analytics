import { employees } from "@/data/support-data";
import { cn } from "@/lib/utils";
import { fmtBR } from "@/lib/format";

const MIN = 70;
const MAX = 95;
const TICKS = [70, 75, 80, 85, 90, 95];

function pos(note: number) {
  return ((note - MIN) / (MAX - MIN)) * 100;
}

export function RankingChart() {
  return (
    <div>
      {/* Escala */}
      <div className="mb-2 flex items-center">
        <div className="w-40 shrink-0 pr-3" aria-hidden />
        <div className="relative h-7 flex-1">
          <span
            className="absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300"
            style={{ left: `${pos(85)}%` }}
          >
            Meta 85
          </span>
          {TICKS.map((t) => (
            <span
              key={t}
              className="tnum absolute bottom-0 -translate-x-1/2 text-[10px] font-medium text-muted-foreground/70"
              style={{ left: `${pos(t)}%` }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Barras */}
      <div className="flex flex-col gap-1">
        {employees.map((e) => {
          const premiado = e.rank <= 3;
          const elegivel = e.situacao === "Elegível — fora do Top 3";
          return (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40"
            >
              <div className="flex w-40 shrink-0 items-center gap-2 pr-3">
                <span
                  className={cn(
                    "tnum grid size-5 shrink-0 place-items-center rounded-md text-[10px] font-bold",
                    premiado
                      ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-background"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {e.rank}
                </span>
                <span className="truncate text-sm font-medium">{e.name}</span>
              </div>

              <div className="relative h-6 flex-1">
                <div className="absolute inset-y-1/2 left-0 right-0 h-px -translate-y-1/2 bg-border/60" />
                <div
                  className="absolute inset-y-0 w-px border-l border-dashed border-amber-400/60"
                  style={{ left: `${pos(85)}%` }}
                />
                <div
                  className="absolute inset-y-0 flex items-center"
                  style={{ width: `${pos(e.note)}%` }}
                >
                  <div
                    className={cn(
                      "h-3.5 w-full rounded-full transition-shadow group-hover:shadow-glow",
                      premiado
                        ? "bg-gradient-to-r from-cyan-400 to-blue-500"
                        : elegivel
                          ? "bg-gradient-to-r from-amber-400/70 to-amber-500/40"
                          : "bg-slate-500/40"
                    )}
                  />
                </div>
              </div>

              <div className="w-16 shrink-0 text-right">
                <span
                  className={cn(
                    "tnum text-sm font-bold",
                    premiado && "text-blue-600 dark:text-cyan-300"
                  )}
                >
                  {fmtBR(e.note, 2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
          Premiado (Top 3)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-amber-400/60" />
          Elegível
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-slate-500/40" />
          Abaixo da meta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 border-l border-dashed border-amber-400/60" />
          Meta de 85 pontos
        </span>
      </div>
    </div>
  );
}
