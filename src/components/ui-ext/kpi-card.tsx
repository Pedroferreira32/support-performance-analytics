import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AppIcon, type IconName } from "./app-icon";

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
  icon,
  tone = "default",
  className,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "border-border/60 bg-card/50 p-5 shadow-none",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon ? (
          <AppIcon name={icon} className={cn("size-3.5 shrink-0", dotTones[tone])} />
        ) : (
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              dotTones[tone]
            )}
          />
        )}
      </div>
      <p className="tnum mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {hint && (
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{hint}</p>
      )}
    </Card>
  );
}
