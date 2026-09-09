import { employees } from "@/data/support-data";
import { cn } from "@/lib/utils";
import { fmtBR } from "@/lib/format";

const MIN = 70;
const MAX = 95;
const TICKS = [70, 75, 80, 85, 90, 95];

function pos(note: number) {
  return ((note - MIN) / (MAX - MIN)) * 100;
}

export function RankingDotPlot({ scale = "Nota final" }: { scale?: string }) {
  return (
    <div>
      {/* Escala */}
      <div className="flex items-end">
        <div className="w-40 shrink-0 pr-4" aria-hidden />
        <div className="relative h-6 flex-1">
          <span
            className="absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary"
            style={{ left: `${pos(85)}%` }}
          >
            Elegível · 85+
          </span>
          {TICKS.map((t) => (
            <span
              key={t}
              className="tnum absolute bottom-0 -translate-x-1/2 text-[10px] font-medium text-muted-foreground"
              style={{ left: `${pos(t)}%` }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Linhas */}
      <div className="mt-1 flex flex-col">
        {employees.map((e) => {
          const premiado = e.rank <= 3;
          const elegivel = e.situacao === "Elegível — fora do Top 3";
          const abaixo = e.situacao === "Abaixo da meta";
          return (
            <div
              key={e.id}
              className="flex items-center border-t py-2.5"
            >
              <div className="flex w-40 shrink-0 items-center gap-2 pr-4">
                <span className="truncate text-sm font-medium">{e.name}</span>
              </div>

              <div className="relative h-7 flex-1">
                {/* trilha */}
                <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
                {/* linha da meta */}
                <div
                  className="absolute bottom-0 top-0 w-0 border-l-2 border-dashed border-danger/50"
                  style={{ left: `${pos(85)}%` }}
                />
                {/* ponto */}
                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pos(e.note)}%` }}
                >
                  {premiado ? (
                    <span className="grid size-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-glow">
                      {e.rank}
                    </span>
                  ) : elegivel ? (
                    <span className="block size-4 rounded-full border-2 border-warning bg-warning/20" />
                  ) : (
                    <span className="block size-4 rounded-full border-2 border-muted-foreground/60 bg-card" />
                  )}
                </div>
              </div>

              <div className="flex w-28 shrink-0 flex-col items-end pl-3">
                <span
                  className={cn(
                    "tnum text-sm font-bold",
                    premiado && "text-primary"
                  )}
                >
                  {fmtBR(e.note, 2)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {scale === "Nota final"
                    ? e.situacao === "Premiado"
                      ? `Premiado · ${e.rank}º`
                      : e.situacao
                    : e.situacao}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" /> Premiados
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full border-2 border-warning bg-warning/20" />
          Elegível
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full border-2 border-muted-foreground/60" />
          Abaixo da meta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 border-l-2 border-dashed border-danger/50" />
          Meta de 85
        </span>
      </div>

    </div>
  );
}
