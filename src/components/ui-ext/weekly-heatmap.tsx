import { Fragment } from "react";

import { heatDayKeys, heatDayLabels, weeklyHeatmap } from "@/data/support-data-runtime";

export function WeeklyHeatmap() {
  const max = Math.max(
    ...weeklyHeatmap.flatMap((row) => heatDayKeys.map((d) => row[d]))
  );

  return (
    <div>
      <div className="grid grid-cols-[2.75rem_repeat(6,1fr)] gap-1.5">
        <div />
        {heatDayKeys.map((d) => (
          <div
            key={d}
            className="mono text-center text-[10px] font-semibold text-muted-foreground"
          >
            {heatDayLabels[d]}
          </div>
        ))}

        {weeklyHeatmap.map((row) => (
          <Fragment key={row.hora}>
            <div className="mono flex items-center justify-end pr-1 text-[10px] font-medium text-muted-foreground">
              {row.hora}
            </div>
            {heatDayKeys.map((d) => {
              const v = row[d];
              const alpha = 0.08 + (v / max) * 0.85;
              return (
                <div
                  key={d}
                  title={`${row.hora} · ${heatDayLabels[d]}: ${v} atendimentos`}
                  className="h-7 rounded-[5px] border border-border/40 transition-transform hover:scale-[1.05]"
                  style={{
                    backgroundColor: `hsl(var(--chart-1) / ${alpha})`,
                  }}
                />
              );
            })}
          </Fragment>
        ))}
      </div>

      <div className="mono mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Menor demanda</span>
        <div className="flex gap-0.5">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((a) => (
            <span
              key={a}
              className="size-3 rounded-[3px]"
              style={{
                backgroundColor: `hsl(var(--chart-1) / ${0.08 + a * 0.85})`,
              }}
            />
          ))}
        </div>
        <span>Maior demanda</span>
      </div>
    </div>
  );
}
