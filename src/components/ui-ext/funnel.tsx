import { cn } from "@/lib/utils";
import { employees } from "@/data/support-data-runtime";

const stages = [
  { label: "Avaliados", value: employees.length, tone: "bg-primary" },
  { label: "Elegíveis", value: employees.filter((item) => item.situacao !== "Abaixo da meta").length, tone: "bg-cyan-500" },
  { label: "Premiados", value: employees.filter((item) => item.situacao === "Premiado").length, tone: "bg-emerald-500" },
];

function pctOf(n: number) {
  return Math.round((n / Math.max(1, employees.length)) * 100);
}

export function Funnel() {
  return (
    <div className="flex flex-col gap-3">
      {stages.map((s) => {
        const width = (s.value / Math.max(1, employees.length)) * 100;
        return (
          <div key={s.label} className="flex items-center gap-3">
            <span className="mono w-20 shrink-0 text-right text-[10px] uppercase tracking-wider text-muted-foreground">
              {s.label}
            </span>
            <div
              className="relative h-7"
              style={{ width: `${width}%` }}
            >
              <div
                className={cn(
                  "flex h-full w-full items-center justify-center rounded-[2px]",
                  s.tone
                )}
              >
                <span className="mono text-[11px] font-bold text-primary-foreground">
                  {s.value}
                </span>
              </div>
            </div>
            <span className="mono w-10 shrink-0 text-[10px] text-muted-foreground">
              {pctOf(s.value)}%
            </span>
          </div>
        );
      })}
      <p className="mt-1 border-t border-border/60 pt-2 text-[11px] leading-relaxed text-muted-foreground">
        De {employees.length} profissionais avaliados, {stages[1].value} atingiram a meta (≥ 85) e {stages[2].value} foram premiados — o Top 3 entre os elegíveis.
      </p>
    </div>
  );
}
