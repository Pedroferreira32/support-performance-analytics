import { Fragment } from "react";

import { heatDayKeys, heatDayLabels, weeklyHeatmap } from "@/data/support-data-runtime";

function getHeatColor(value: number, max: number) {
  const intensity = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const hue =
    intensity <= 0.5
      ? 142 - intensity * 2 * 94
      : 48 - (intensity - 0.5) * 2 * 48;
  const saturation = 66 + intensity * 20;
  const lightness = 32 + intensity * 20;

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

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
              return (
                <div
                  key={d}
                  title={`${row.hora} · ${heatDayLabels[d]}: ${v} atendimentos`}
                  aria-label={`${row.hora}, ${heatDayLabels[d]}: ${v} atendimentos`}
                  className="h-7 rounded-[5px] border border-black/10 transition-transform hover:scale-[1.05]"
                  style={{
                    backgroundColor: getHeatColor(v, max),
                  }}
                />
              );
            })}
          </Fragment>
        ))}
      </div>

      <div className="mono mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Baixa demanda</span>
        <div className="flex gap-0.5" aria-hidden="true">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
            <span
              key={intensity}
              className="size-3 rounded-[3px] border border-black/10"
              style={{
                backgroundColor: getHeatColor(intensity, 1),
              }}
            />
          ))}
        </div>
        <span>Pico de demanda · atenção</span>
      </div>
    </div>
  );
}
