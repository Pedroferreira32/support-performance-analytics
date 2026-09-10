import { Equal, FileDown, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { type IconName } from "@/components/ui-ext/app-icon";
import { GapChart } from "@/components/ui-ext/gap-chart";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { RankingChart } from "@/components/ui-ext/ranking-chart";
import { ScoreGauge } from "@/components/ui-ext/score-gauge";
import { SectionCard } from "@/components/ui-ext/section-card";
import { StatusBadge } from "@/components/ui-ext/status-badge";
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
  employees,
  leaderBreakdown,
  leaderTotal,
  premiacaoResumo,
} from "@/data/support-data";
import { cn } from "@/lib/utils";
import { fmtBR } from "@/lib/format";

export default function PremiacaoPage() {
  const exportExcel = () =>
    toast("Exportação disponível na versão completa", {
      description:
        "Esta demonstração é somente leitura e usa dados sintéticos.",
    });

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
            <span className="text-sm">
              <span className="font-semibold">Base fixa </span>
              <span className="tnum font-bold">31,50</span>
              <span className="ml-1 text-xs text-muted-foreground">
                Tempo + TMA
              </span>
            </span>
            <Plus className="size-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-semibold">Variável </span>
              <span className="tnum font-bold">20,00</span>
              <span className="ml-1 text-xs text-muted-foreground">
                Quantidade
              </span>
            </span>
            <Plus className="size-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-semibold">Variável </span>
              <span className="tnum font-bold">40,00</span>
              <span className="ml-1 text-xs text-muted-foreground">
                Avaliação
              </span>
            </span>
            <Equal className="size-4 text-muted-foreground" />
            <span className="text-sm font-bold">
              Teto efetivo <span className="tnum">91,50</span>
            </span>
            <span className="ml-1 rounded-sm bg-warning-soft px-2 py-0.5 mono text-[11px] font-bold text-warning-foreground">
              meta 85,00
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
            description="Contribuição de cada parcela até a nota final da liderança."
          >
            <div className="space-y-2">
              {leaderBreakdown.map((b, i) => (
                <div key={b.label}>
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-sm border p-4",
                      b.color === "primary" ? "bg-primary-soft/50" : "bg-muted/40"
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold">{b.label}</p>
                      <p className="text-xs text-muted-foreground">{b.hint}</p>
                    </div>
                    <span
                      className={cn(
                        "tnum text-lg font-bold",
                        b.color === "primary" && "text-primary"
                      )}
                    >
                      {b.value}
                    </span>
                  </div>
                  {i < leaderBreakdown.length - 1 && (
                    <Plus className="mx-auto my-1 size-4 text-muted-foreground" />
                  )}
                </div>
              ))}
              <Equal className="mx-auto my-1 size-4 text-muted-foreground" />
              <div className="flex items-center justify-between rounded-sm bg-gradient-to-r from-cyan-500 to-blue-600 p-4 text-primary-foreground shadow-glow">
                <div>
                  <p className="text-sm font-bold">{leaderTotal.label}</p>
                  <p className="text-xs opacity-80">{leaderTotal.hint}</p>
                </div>
                <span className="tnum text-2xl font-bold">
                  {leaderTotal.value}
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Liderança da competência"
            title="Marina Costa"
            className="h-fit"
          >
            <div className="rounded-sm border bg-gradient-to-br from-primary-soft/60 to-card p-5">
              <ScoreGauge
                value={91.09}
                max={91.5}
                label="Índice final"
                sublabel="A nota ficou 0,41 ponto(s) abaixo do teto"
              />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Cálculo reproduzível e memória de cálculo disponível para
              conferência completa da competência.
            </p>
          </SectionCard>
        </div>

        {/* Distância até a meta */}
        <SectionCard
          eyebrow="Distância até a meta"
          title="Posição em relação aos 85 pontos"
          description="As barras partem da meta: para a direita quem superou os 85, para a esquerda quem precisa recuperar pontos."
        >
          <GapChart />
        </SectionCard>

        {/* Memória de cálculo */}
        <SectionCard
          eyebrow="Memória de cálculo"
          title="Detalhamento por funcionário"
          description="Pontos variáveis, nota final, distância para a meta e situação."
          action={
            <Button variant="outline" size="sm" onClick={exportExcel}>
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
