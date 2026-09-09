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

const toneStyles: Record<KpiTone, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-foreground",
  danger: "bg-danger-soft text-danger",
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
    <Card className={cn("p-5 shadow-card", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="tnum mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {hint && (
            <p className="mt-1.5 truncate text-xs text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-xl",
              toneStyles[tone]
            )}
          >
            <AppIcon name={icon} className="size-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
