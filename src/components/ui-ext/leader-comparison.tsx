import { competencia, employees } from "@/data/support-data-runtime";
import { fmtBR } from "@/lib/format";

const average = (values: number[]) =>
  values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;

const signed = (value: number, digits = 2) =>
  `${value >= 0 ? "+" : ""}${fmtBR(value, digits)}`;

export function LeaderComparison() {
  const leader = employees[0];

  if (!leader) return null;

  const averageVolume = average(employees.map((employee) => employee.volume));
  const averageEvaluation = average(employees.map((employee) => employee.csat));
  const comparisons = [
    {
      label: "Volume",
      value: leader.volume.toLocaleString("pt-BR"),
      unit: "atendimentos",
      referenceLabel: "Média da equipe",
      reference: Math.round(averageVolume).toLocaleString("pt-BR"),
      difference: `${signed(leader.volume - averageVolume, 0)} atendimentos`,
    },
    {
      label: "Avaliação",
      value: fmtBR(leader.csat, 2),
      unit: "de 5,00",
      referenceLabel: "Média da equipe",
      reference: fmtBR(averageEvaluation, 2),
      difference: `${signed(leader.csat - averageEvaluation)} ponto`,
    },
    {
      label: "Nota final",
      value: fmtBR(leader.note, 2),
      unit: `de ${fmtBR(competencia.teto, 2)}`,
      referenceLabel: "Meta de elegibilidade",
      reference: fmtBR(competencia.meta, 2),
      difference: `${signed(leader.note - competencia.meta)} pontos`,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <p className="mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Primeiro colocado
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight text-foreground">{leader.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-sm bg-primary px-2.5 py-1 mono text-[10px] font-extrabold text-primary-foreground">
            1º
          </span>
          <span className="rounded-sm border border-success/30 bg-success-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-success">
            Premiado
          </span>
        </div>
      </div>

      <div className="divide-y divide-border/60">
        {comparisons.map((item) => (
          <div
            key={item.label}
            className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(120px,0.72fr)_auto] sm:items-center"
          >
            <div>
              <p className="mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="tnum text-2xl font-bold tracking-tight text-foreground">
                  {item.value}
                </span>
                <span className="text-[11px] text-muted-foreground">{item.unit}</span>
              </div>
            </div>

            <div className="border-l border-border/60 pl-3">
              <p className="text-[10px] text-muted-foreground">{item.referenceLabel}</p>
              <p className="tnum mt-1 text-sm font-bold text-foreground">{item.reference}</p>
            </div>

            <span className="w-fit rounded-sm border border-primary/25 bg-primary/10 px-2.5 py-1 mono text-[9px] font-bold uppercase tracking-wide text-primary">
              {item.difference}
            </span>
          </div>
        ))}
      </div>

      <p className="border-t border-border/60 pt-3 text-[11px] leading-relaxed text-muted-foreground">
        Comparação direta com a equipe e com a regra da competência, sem escalas ou indicadores redundantes.
      </p>
    </div>
  );
}
