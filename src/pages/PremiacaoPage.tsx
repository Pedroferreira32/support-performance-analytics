import { Equal, FileDown, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { type IconName } from "@/components/ui-ext/app-icon";
import { Funnel } from "@/components/ui-ext/funnel";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { LeaderComparison } from "@/components/ui-ext/leader-comparison";
import { RankingChart } from "@/components/ui-ext/ranking-chart";
import { SectionCard } from "@/components/ui-ext/section-card";
import { StackedFormation } from "@/components/ui-ext/stacked-formation";
import { StatusBadge } from "@/components/ui-ext/status-badge";
import { WaterfallLeader } from "@/components/ui-ext/waterfall-leader";
import { situacaoTone } from "@/lib/status-tones";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  competencia,
  currentSnapshot,
  employees,
  operationalSnapshots,
  premiacaoResumo,
} from "@/data/support-data-runtime";
import { fmtBR } from "@/lib/format";
import { exportExcel as generateExcel } from "@/lib/report-export";

export default function PremiacaoPage() {
  const leader = employees[0];
  const exportExcel = async () => {
    if (!currentSnapshot) {
      toast.info("Importe uma base para gerar o arquivo oficial.");
      return;
    }
    try {
      await generateExcel(currentSnapshot, operationalSnapshots);
      toast.success("Memória de cálculo gerada em Excel");
    } catch (error) {
      toast.error("Não foi possível gerar o Excel", { description: error instanceof Error ? error.message : "Tente novamente." });
    }
  };

  return (
    <AppShell breadcrumb="Painel de performance" title="Premiação">
      <div className="animate-fade-in-up space-y-5">
        {/* Regra oficial */}
        <SectionCard
          eyebrow="Regra oficial"
          title="Composição da nota final"
          description="O perfil da competência define os pesos e identifica quais parcelas são fixas ou comparativas."
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-sm bg-primary-soft px-4 py-3.5">
            {competencia.baseFixa > 0 ? (
              <>
            <span className="text-sm">
              <span className="font-semibold">Base fixa </span>
              <span className="tnum font-bold">{fmtBR(competencia.baseFixa, 2)}</span>
              <span className="ml-1 text-xs text-muted-foreground">
                Tempo + TMA
              </span>
            </span>
            <Plus className="size-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-semibold">Variável </span>
              <span className="tnum font-bold">{fmtBR(competencia.pesoQuantidade, 2)}</span>
              <span className="ml-1 text-xs text-muted-foreground">
                Quantidade
              </span>
            </span>
            <Plus className="size-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-semibold">Variável </span>
              <span className="tnum font-bold">{fmtBR(competencia.pesoAvaliacao, 2)}</span>
              <span className="ml-1 text-xs text-muted-foreground">
                Avaliação
              </span>
            </span>
            <Equal className="size-4 text-muted-foreground" />
            <span className="text-sm font-bold">
              Teto efetivo <span className="tnum">{fmtBR(competencia.teto, 2)}</span>
            </span>
              </>
            ) : (
              <span className="text-sm font-semibold">
                Pontuação comparativa por equipe · Quantidade {currentSnapshot?.config.pesoQuantidade ?? 20} · Tempo {currentSnapshot?.config.pesoTempo ?? 10} · TMA {currentSnapshot?.config.pesoTma ?? 30} · Avaliação {currentSnapshot?.config.pesoAvaliacao ?? 40}
              </span>
            )}
            <span className="ml-1 rounded-sm bg-warning-soft px-2 py-0.5 mono text-[11px] font-bold text-warning-foreground">
              meta {fmtBR(competencia.meta, 2)}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {premiacaoResumo.map((k) => (
              <KpiCard
                key={k.label}
                label={k.label}
                value={k.value}
                hint={k.hint}
                icon={k.icon as IconName}
                tone={
                  k.icon === "trophy"
                    ? "success"
                    : k.icon === "x"
                      ? "danger"
                      : "default"
                }
              />
            ))}
          </div>
        </SectionCard>

        {/* Ranking oficial */}
        <SectionCard
          eyebrow="Ranking oficial"
          title="Nota final e meta de elegibilidade"
          description="Escala única por funcionário; a linha vertical representa os 85 pontos."
        >
          <RankingChart />
        </SectionCard>

        {/* Formação da nota + liderança */}
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            eyebrow="Formação da nota"
            title="Componentes do primeiro colocado"
            description={`Cascata da nota final da liderança até o índice de ${fmtBR(leader?.note ?? 0, 2)}.`}
          >
            <WaterfallLeader />
          </SectionCard>

          <SectionCard
            eyebrow="Leitura direta"
            title="Líder comparada à equipe"
            description="Volume e avaliação contra a média da equipe; nota final contra a meta da competência."
          >
            <LeaderComparison />
          </SectionCard>
        </div>

        {/* Formação por funcionário + funil */}
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            eyebrow="Comparação por critério"
            title="Matriz de composição da nota"
            description="Pontuação exata e aproveitamento de cada critério, ordenados pelo ranking oficial."
          >
            <StackedFormation />
          </SectionCard>

          <SectionCard
            eyebrow="Funil de elegibilidade"
            title="Da avaliação à premiação"
            description="Queda de aproveitamento entre as etapas do processo."
          >
            <Funnel />
          </SectionCard>
        </div>

        {/* Memória de cálculo */}
        <SectionCard
          eyebrow="Memória de cálculo"
          title="Detalhamento por funcionário"
          description="Pontos variáveis, nota final, distância para a meta e situação."
          action={
            <Button variant="outline" size="sm" onClick={() => void exportExcel()}>
              <FileDown className="size-4" />
              Exportar Excel
            </Button>
          }
          contentClassName="p-0"
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Rank</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Pts. quantidade</TableHead>
                  <TableHead>CSAT</TableHead>
                  <TableHead>Cobertura</TableHead>
                  <TableHead>Pts. avaliação</TableHead>
                  <TableHead>Nota final</TableHead>
                  <TableHead>Distância p/ 85</TableHead>
                  <TableHead className="pr-6">Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="pl-6">
                      <span className="tnum font-semibold">{e.rank}º</span>
                    </TableCell>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="tnum">{e.volume}</TableCell>
                    <TableCell className="tnum">
                      {fmtBR(e.ptsQuantidade, 2)}
                    </TableCell>
                    <TableCell className="tnum">{fmtBR(e.csat, 2)}</TableCell>
                    <TableCell className="tnum">
                      {fmtBR(e.cobertura, 1)}%
                    </TableCell>
                    <TableCell className="tnum">
                      {fmtBR(e.ptsAvaliacao, 2)}
                    </TableCell>
                    <TableCell>
                      <span className="tnum text-sm font-bold">
                        {fmtBR(e.note, 2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {e.distanciaMeta ? (
                        <span className="tnum text-danger">
                          {fmtBR(e.distanciaMeta, 2)} pts
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold uppercase text-success">
                          Atingida
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6">
                      <StatusBadge tone={situacaoTone(e.situacao)}>
                        {e.situacao}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
