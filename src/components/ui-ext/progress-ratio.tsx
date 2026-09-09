import { Progress } from "@/components/ui/progress";
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
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              fixed
                ? "bg-muted text-muted-foreground"
                : "bg-primary-soft text-primary"
            )}
          >
            {tipo}
          </span>
          <span className="truncate text-sm font-semibold">{label}</span>
        </div>
        <span className="tnum text-sm font-semibold">
          {fmtBR(obtido, 2)} / {fmtBR(maximo, 2)}
        </span>
      </div>

      <Progress value={percentual} className="mt-3 h-2" />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="text-balance">{descricao}</span>
        <span className="tnum shrink-0 font-medium">
          {fmtBR(percentual, 0, 1)}% do máximo
        </span>
      </div>
    </div>
  );
}
