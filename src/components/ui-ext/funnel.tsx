import { cn } from "@/lib/utils";

const stages = [
  { label: "Avaliados", value: 7, tone: "bg-primary" },
  { label: "Elegíveis", value: 4, tone: "bg-cyan-500" },
  { label: "Premiados", value: 3, tone: "bg-emerald-500" },
];

function pctOf(n: number) {
  return Math.round((n / 7) * 100);
}

export function Funnel() {
  return (
    <div className="flex flex-col gap-3">
      {stages.map((s) => {
        const width = (s.value / 7) * 100;
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
        De 7 profissionais avaliados, 4 atingiram a meta (≥ 85) e 3 foram
        premiados — o Top 3 entre os elegíveis.
      </p>
    </div>
  );
}
