import { Equal, Plus } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { type IconName } from "@/components/ui-ext/app-icon";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { ScatterTeam } from "@/components/ui-ext/scatter-team";
import { SectionCard } from "@/components/ui-ext/section-card";
import { WeeklyHeatmap } from "@/components/ui-ext/weekly-heatmap";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  baseReconciliation,
  employees,
  operationalKpis,
  operationalMonths,
} from "@/data/support-data";
import { cn } from "@/lib/utils";
import { fmtBR } from "@/lib/format";

const BASE_PREMIAVEL = 2350;

function ReconBox({
  title,
  value,
  hint,
  highlight = false,
}: {
  title: string;
  value: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex-1 rounded-sm border p-4 text-center",
        highlight ? "border-primary/40 bg-primary-soft/50 ring-1 ring-primary/20" : "bg-muted/40"
      )}
    >
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <p className="tnum mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function OperacaoPage() {
  return (
    <AppShell breadcrumb="Painel de performance" title="Operação">
      <div className="animate-fade-in-up space-y-5">
        {/* KPIs operacionais */}
        <SectionCard
          eyebrow="Operação"
          title="Demanda, tempo e satisfação"
          description="A leitura operacional usa a base observada e mantém as exceções visíveis."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {operationalKpis.map((k) => (
              <KpiCard
                key={k.label}
                label={k.label}
                value={k.value}
                hint={k.hint}
                icon={k.icon as IconName}
                tone={
                  k.icon === "trend"
                    ? "success"
                    : k.icon === "star"
                      ? "warning"
                      : "default"
                }
              />
            ))}
          </div>
        </SectionCard>

        {/* Reconciliação da base */}
        <SectionCard
          eyebrow="Reconciliação da base"
          title="Do arquivo importado à demanda observada"
          description="Casos acima de 9 horas ficam fora da campanha, mas continuam visíveis na análise operacional."
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
            <ReconBox
              title={baseReconciliation.premiável.label}
              value={baseReconciliation.premiável.value}
              hint={baseReconciliation.premiável.hint}
            />
            <div className="flex items-center justify-center">
              <Plus className="size-5 text-muted-foreground" />
            </div>
            <ReconBox
              title={baseReconciliation.excecao.label}
              value={baseReconciliation.excecao.value}
              hint={baseReconciliation.excecao.hint}
            />
            <div className="flex items-center justify-center">
              <Equal className="size-5 text-muted-foreground" />
            </div>
            <ReconBox
              title={baseReconciliation.observada.label}
              value={baseReconciliation.observada.value}
              hint={baseReconciliation.observada.hint}
              highlight
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {baseReconciliation.legendas.map((l) => (
              <span
                key={l}
                className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {l}
              </span>
            ))}
          </div>
        </SectionCard>

        {/* Mapa de calor */}
        <SectionCard
          eyebrow="Mapa de calor"
          title="Demanda por hora e dia da semana"
          description="Intensidade de atendimentos por faixa de início, de segunda a sábado."
        >
          <WeeklyHeatmap />
        </SectionCard>

        {/* Comparação mensal */}
        <SectionCard
          eyebrow="Comparação mensal"
          title="Indicadores por competência"
          description="Valores exatos de volume, TMA, satisfação, cobertura e qualidade."
          contentClassName="p-0"
        >
            <div className="overflow-x-auto">
              <Table className="min-w-[520px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Competência</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>TMA mediano</TableHead>
                    <TableHead>TMA P90</TableHead>
                    <TableHead>CSAT</TableHead>
                    <TableHead>Cobertura</TableHead>
                    <TableHead className="pr-6">Validade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operationalMonths.map((m) => (
                    <TableRow key={m.competencia}>
                      <TableCell className="pl-6 font-medium">
                        {m.competencia}
                      </TableCell>
                      <TableCell className="tnum">
                        {m.volume ?? "—"}
                      </TableCell>
                      <TableCell className="tnum">
                        {m.tmaMediano ? `${fmtBR(m.tmaMediano, 1)} min` : "—"}
                      </TableCell>
                      <TableCell className="tnum">
                        {m.tmaP90 ? `${fmtBR(m.tmaP90, 1)} min` : "—"}
                      </TableCell>
                      <TableCell className="tnum">
                        {m.csat ? fmtBR(m.csat, 2) : "—"}
                      </TableCell>
                      <TableCell className="tnum">
                        {m.cobertura ? `${fmtBR(m.cobertura, 1)}%` : "—"}
                      </TableCell>
                      <TableCell className="pr-6">
                        <span
                          className={cn(
                            "rounded-sm px-2 py-0.5 text-[10px] font-bold",
                            m.validade === "Atual"
                              ? "bg-primary-soft text-primary"
                              : m.validade === "Validado"
                                ? "bg-success-soft text-success"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {m.validade ?? "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>

        {/* Detalhe da equipe */}
        <SectionCard
          eyebrow="Detalhe da equipe"
          title="Volume, tempo e cobertura da avaliação"
          description="A fonte não contém jornada, categoria ou complexidade para cálculo de produtividade por hora."
        >
          <div className="rounded-sm border border-border/60 bg-card/30 p-4">
            <ScatterTeam />
          </div>
          <div className="mt-4 overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Funcionário</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Participação</TableHead>
                  <TableHead>TMA mediano</TableHead>
                  <TableHead>TMA P90</TableHead>
                  <TableHead>CSAT</TableHead>
                  <TableHead>Avaliações</TableHead>
                  <TableHead>Cobertura</TableHead>
                  <TableHead className="pr-6">Automáticos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="pl-6 font-medium">{e.name}</TableCell>
                    <TableCell className="tnum">{e.volume}</TableCell>
                    <TableCell className="tnum">
                      {fmtBR((e.volume / BASE_PREMIAVEL) * 100, 1)}%
                    </TableCell>
                    <TableCell className="tnum">
                      {fmtBR(e.tmaMediano, 1)} min
                    </TableCell>
                    <TableCell className="tnum">
                      {fmtBR(e.tmaP90, 1)} min
                    </TableCell>
                    <TableCell className="tnum">
                      {fmtBR(e.csat, 2)}
                    </TableCell>
                    <TableCell className="tnum">{e.avaliacoes}</TableCell>
                    <TableCell className="tnum">
                      {fmtBR(e.cobertura, 1)}%
                    </TableCell>
                    <TableCell className="pr-6 tnum">
                      {e.automáticos}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="border-t px-6 py-3 text-[11px] text-muted-foreground">
            Limite de leitura: volume é demanda observada; sem jornada e
            complexidade, não representa produtividade por hora.
          </p>
        </SectionCard>
      </div>
    </AppShell>
  );
}
