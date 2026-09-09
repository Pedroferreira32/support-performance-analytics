import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "primary";

const toneClasses: Record<StatusTone, string> = {
  success: "border-transparent bg-success-soft text-success",
  warning: "border-transparent bg-warning-soft text-warning-foreground",
  danger: "border-transparent bg-danger-soft text-danger",
  neutral: "border-transparent bg-muted text-muted-foreground",
  primary: "border-transparent bg-primary-soft text-primary",
};

const dotClasses: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-muted-foreground",
  primary: "bg-primary",
};

interface StatusBadgeProps {
  tone: StatusTone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({
  tone,
  children,
  dot = true,
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", toneClasses[tone], className)}
    >
      {dot && (
        <span className={cn("size-1.5 shrink-0 rounded-full", dotClasses[tone])} />
      )}
      {children}
    </Badge>
  );
}
