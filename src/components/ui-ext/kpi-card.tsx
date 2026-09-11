import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { IconName } from "./app-icon";

export type KpiTone = "default" | "primary" | "success" | "warning" | "danger";

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: IconName;
  tone?: KpiTone;
  className?: string;
}

const dotTones: Record<KpiTone, string> = {
  default: "bg-muted-foreground",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function KpiCard({
  label,
  value,
  hint,
  icon: _icon,
  tone = "default",
  className,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "rounded-sm border-border/70 bg-card/40 p-4 shadow-none",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="mono truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <span
          className={cn("size-1.5 shrink-0 rounded-full", dotTones[tone])}
        />
      </div>
      <p className="mono mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {hint && (
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          {hint}
        </p>
      )}
    </Card>
  );
}
