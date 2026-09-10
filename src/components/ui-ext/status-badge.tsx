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
  success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  danger: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  neutral: "border-slate-500/25 bg-slate-500/10 text-slate-400",
  primary: "border-blue-400/25 bg-blue-400/10 text-blue-300",
};

const dotClasses: Record<StatusTone, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-rose-400",
  neutral: "bg-slate-400",
  primary: "bg-blue-400",
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
