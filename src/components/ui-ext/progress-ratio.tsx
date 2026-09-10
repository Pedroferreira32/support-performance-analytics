import { cn } from "@/lib/utils";
import { fmtBR } from "@/lib/format";

interface ProgressRatioProps {
  tipo: string;
  label: string;
  obtido: number;
  maximo: number;
  percentual: number;
  descricao: string;
  fixed?: boolean;
}

export function ProgressRatio({
  tipo,
  label,
  obtido,
  maximo,
  percentual,
  descricao,
  fixed = false,
}: ProgressRatioProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold">{label}</span>
          <span
            className={cn(
              "hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-block",
              fixed
                ? "bg-muted text-muted-foreground"
                : "bg-primary-soft text-primary"
            )}
          >
            {tipo}
          </span>
        </div>
        <span className="tnum shrink-0 text-sm font-semibold">
          {fmtBR(obtido, 2)} / {fmtBR(maximo, 2)}
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full",
              fixed
                ? "bg-muted-foreground/40"
                : "bg-gradient-to-r from-cyan-400 to-blue-500"
            )}
            style={{ width: `${percentual}%` }}
          />
        </div>
        <span className="tnum w-14 shrink-0 text-right text-sm font-bold">
          {fmtBR(percentual, 0, 1)}%
        </span>
      </div>

      <p className="mt-1.5 text-balance text-xs leading-relaxed text-muted-foreground">
        {descricao}
      </p>
    </div>
  );
}
