import { competencia, currentSnapshot, employees } from "@/data/support-data-runtime";
import { fmtBR } from "@/lib/format";
import { cn } from "@/lib/utils";

type MetricCell = {
  key: string;
  label: string;
  max: number;
  value: number;
  barClass: string;
};

const rows = currentSnapshot
  ? currentSnapshot.ranking.map((row) => {
      const fixed = currentSnapshot.config.pontuacaoTempoTmaFixa;
      const metrics: MetricCell[] = fixed
        ? [
            { key: "base", label: "Base fixa", max: 31.5, value: row.pontosTempo + row.pontosTma, barClass: "bg-muted-foreground/30" },
            { key: "qtd", label: "Quantidade", max: currentSnapshot.config.pesoQuantidade, value: row.pontosQuantidade, barClass: "bg-primary/35" },
            { key: "aval", label: "Avaliação", max: currentSnapshot.config.pesoAvaliacao, value: row.pontosAvaliacao, barClass: "bg-blue-500/35" },
          ]
        : [
            { key: "qtd", label: "Quantidade", max: currentSnapshot.config.pesoQuantidade, value: row.pontosQuantidade, barClass: "bg-primary/35" },
            { key: "tempo", label: "Tempo", max: currentSnapshot.config.pesoTempo, value: row.pontosTempo, barClass: "bg-sky-500/35" },
            { key: "tma", label: "TMA", max: currentSnapshot.config.pesoTma, value: row.pontosTma, barClass: "bg-amber-400/30" },
            { key: "aval", label: "Avaliação", max: currentSnapshot.config.pesoAvaliacao, value: row.pontosAvaliacao, barClass: "bg-blue-500/35" },
          ];
      return { rank: row.rank, name: row.atendente, note: row.notaFinal, metrics };
    })
  : employees.map((employee) => ({
      rank: employee.rank,
      name: employee.name,
      note: employee.note,
      metrics: [
        { key: "base", label: "Base fixa", max: competencia.baseFixa, value: competencia.baseFixa, barClass: "bg-muted-foreground/30" },
        { key: "qtd", label: "Quantidade", max: competencia.pesoQuantidade, value: employee.ptsQuantidade, barClass: "bg-primary/35" },
        { key: "aval", label: "Avaliação", max: competencia.pesoAvaliacao, value: employee.ptsAvaliacao, barClass: "bg-blue-500/35" },
      ] satisfies MetricCell[],
    }));

const metricHeaders = rows[0]?.metrics ?? [];

export function StackedFormation() {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div
          className="grid items-end gap-2 border-b border-border/70 pb-2"
          style={{ gridTemplateColumns: `minmax(150px, 1.45fr) repeat(${metricHeaders.length}, minmax(76px, .8fr)) minmax(78px, .8fr)` }}
        >
          <span className="mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Funcionário</span>
          {metricHeaders.map((metric) => (
            <span key={metric.key} className="text-right mono text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {metric.label}
              <small className="mt-0.5 block font-normal normal-case tracking-normal">máx. {fmtBR(metric.max, 1)}</small>
            </span>
          ))}
          <span className="text-right mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Nota final
            <small className="mt-0.5 block font-normal normal-case tracking-normal">meta {fmtBR(competencia.meta, 0)}</small>
          </span>
        </div>

        {rows.map((row) => (
          <div
            key={row.name}
            className="grid items-center gap-2 border-b border-border/45 py-2.5 last:border-0"
            style={{ gridTemplateColumns: `minmax(150px, 1.45fr) repeat(${row.metrics.length}, minmax(76px, .8fr)) minmax(78px, .8fr)` }}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-5 shrink-0 place-items-center bg-muted mono text-[9px] font-bold text-muted-foreground">{row.rank}</span>
              <span className="truncate text-xs font-semibold" title={row.name}>{row.name}</span>
            </div>
            {row.metrics.map((metric) => {
              const ratio = Math.min(Math.max(metric.value / Math.max(metric.max, 1), 0), 1) * 100;
              return (
                <div
                  key={metric.key}
                  className="relative overflow-hidden rounded-[2px] border border-border/50 bg-muted/25 px-2 py-1.5 text-right"
                  aria-label={`${metric.label}: ${fmtBR(metric.value, 2)} de ${fmtBR(metric.max, 2)} pontos`}
                >
                  <span aria-hidden className={cn("absolute inset-y-0 left-0", metric.barClass)} style={{ width: `${ratio}%` }} />
                  <span className="tnum relative text-[11px] font-bold">{fmtBR(metric.value, 2)}</span>
                </div>
              );
            })}
            <div className={cn(
              "border-l-2 pl-2 text-right",
              row.note >= competencia.meta ? "border-primary" : "border-muted-foreground/40",
            )}>
              <span className="tnum text-sm font-bold">{fmtBR(row.note, 2)}</span>
              <span className={cn(
                "block mono text-[8px] font-semibold uppercase tracking-wide",
                row.note >= competencia.meta ? "text-primary" : "text-muted-foreground",
              )}>
                {row.note >= competencia.meta ? "Meta atingida" : `${fmtBR(competencia.meta - row.note, 2)} abaixo`}
              </span>
            </div>
          </div>
        ))}

        <p className="mt-3 border-t border-border/50 pt-2 text-[10px] leading-relaxed text-muted-foreground">
          Valores em pontos. O preenchimento de cada célula representa o aproveitamento do peso máximo do critério.
        </p>
      </div>
    </div>
  );
}
