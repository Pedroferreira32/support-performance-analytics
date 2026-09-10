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
        "overflow-hidden border-border/60 bg-card/50 shadow-none",
        className
      )}
    >
      <div className="flex flex-col gap-3 px-6 pt-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="mt-1 h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600"
            />
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  {eyebrow}
                </p>
              )}
              <h2 className="mt-0.5 text-base font-bold tracking-tight">
                {title}
              </h2>
            </div>
          </div>
          {description && (
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
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
