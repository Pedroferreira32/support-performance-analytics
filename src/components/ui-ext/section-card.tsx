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
    <Card
      className={cn(
        "overflow-hidden rounded-sm border-border/70 bg-card/40 shadow-none",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-card/30 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            aria-hidden
            className="mt-0.5 h-3.5 w-1 shrink-0 rounded-[1px] bg-primary"
          />
          <div className="min-w-0">
            {eyebrow && (
              <p className="mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h2 className="text-sm font-bold tracking-tight">{title}</h2>
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {description && (
        <p className="border-b border-border/40 px-4 py-2 text-[12px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}

      <CardContent className={cn("p-4 sm:p-5", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
