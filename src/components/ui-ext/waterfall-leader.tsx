import { fmtBR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { competencia, leaderBreakdown, leaderTotal } from "@/data/support-data-runtime";

const MAX = competencia.teto;

const parse = (value: string) => Number(value.replace(/\./g, "").replace(",", ".")) || 0;
const steps = [
  ...leaderBreakdown.map((item, index) => ({ label: item.label, value: parse(item.value), tone: index === 0 ? "base" : "inc" })),
  { label: "Índice final", value: parse(leaderTotal.value), tone: "total" },
];

const toneCss: Record<string, string> = {
  base: "bg-muted-foreground/40",
  inc: "bg-gradient-to-t from-blue-600 to-cyan-400",
  total: "bg-primary",
};

let cum = 0;
const rendered = steps.map((s) => {
  // Parcela inicial e total final ficam ancoradas na base.
  const grounded = s.tone === "base" || s.tone === "total";
  const prev = grounded ? 0 : cum;
  cum += s.value;
  return { ...s, prev, top: prev + s.value };
});

export function WaterfallLeader() {
  return (
    <div>
      <div className="flex items-end gap-3 px-1" style={{ height: 190 }}>
        {rendered.map((s) => (
          <div
            key={s.label}
            className="relative flex h-full flex-1 flex-col justify-end"
          >
            {/* barra do delta */}
            <div
              className={cn("w-full rounded-t-[2px]", toneCss[s.tone])}
              style={{ height: `${(s.value / MAX) * 100}%` }}
            />
            {/* espaçador acumulado abaixo da barra (barra flutua) */}
            {s.prev > 0 && (
              <div
                className="border-t border-dashed border-muted-foreground/30"
                style={{ height: `${(s.prev / MAX) * 100}%` }}
              />
            )}
            {/* rótulo do valor acima do topo da barra */}
            <span
              className="mono absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold"
              style={{ bottom: `calc(${((s.prev + s.value) / MAX) * 100}% + 4px)` }}
            >
              {fmtBR(s.value, 2)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-3 border-t border-border/60 px-1 pt-2">
        {rendered.map((s) => (
          <div
            key={s.label}
            className="mono flex-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
