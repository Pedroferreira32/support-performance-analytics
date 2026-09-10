import { monthlyClosures } from "@/data/support-data";
import { cn } from "@/lib/utils";
import { fmtBR } from "@/lib/format";

// Escala de leitura: 80 a 95 (faixa relevante dos índices)
const SCALE_MIN = 80;
const SCALE_MAX = 95;

function pct(n: number) {
  return ((n - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
}

export function MonthlyComparison() {
  return (
    <div>
      <div className="flex items-end gap-4" style={{ height: 150 }}>
        {monthlyClosures.map((m) => (
          <div
            key={m.competencia}
            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="mono text-lg font-bold">
              {fmtBR(m.indice, 2)}
            </span>
            <div
              className={cn(
                "w-full max-w-14 rounded-t-[2px]",
                m.status === "ATUAL"
                  ? "bg-gradient-to-t from-blue-600 to-cyan-400"
                  : "bg-slate-600/50"
              )}
              style={{ height: `${pct(m.indice) * 0.92}px` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-4 border-t border-border/60 pt-2.5">
        {monthlyClosures.map((m) => (
          <div key={m.competencia} className="text-center">
            <p className="mono text-xs font-bold">{m.competencia}</p>
            <p
              className={cn(
                "mono text-[10px] font-semibold",
                m.status === "ATUAL" ? "text-cyan-300" : "text-muted-foreground"
              )}
            >
              {m.status === "ATUAL" ? "ATUAL" : "FECHAMENTO"}
            </p>
            <p className="mono mt-0.5 text-[10px] text-muted-foreground">
              {m.elegiveis} · {m.premiados} premiados
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
