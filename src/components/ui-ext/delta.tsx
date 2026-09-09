import { cn } from "@/lib/utils";
import { fmtBR } from "@/lib/format";

interface DeltaProps {
  value: number;
  digits?: number;
  suffix?: string;
  className?: string;
}

export function Delta({ value, digits = 2, suffix, className }: DeltaProps) {
  const text = `${value > 0 ? "+" : ""}${fmtBR(value, digits)}${suffix ?? ""}`;
  return (
    <span
      className={cn(
        "tnum font-medium",
        value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-muted-foreground",
        className
      )}
    >
      {text}
    </span>
  );
}
