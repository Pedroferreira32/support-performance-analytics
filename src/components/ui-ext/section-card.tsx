import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

export function SectionCard({
  eyebrow,
  title,
  description,
  action,
  className,
  contentClassName,
  children,
}: SectionCardProps) {
  return (
    <Card className={cn("overflow-hidden shadow-card", className)}>
      <div className="flex flex-col gap-3 border-b bg-card px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-1 text-lg font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <CardContent className={cn("p-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
