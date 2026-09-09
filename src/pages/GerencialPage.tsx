import { AppShell } from "@/components/layout/app-shell";
import { type IconName } from "@/components/ui-ext/app-icon";
import { Delta } from "@/components/ui-ext/delta";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { ProgressRatio } from "@/components/ui-ext/progress-ratio";
import { RankingDotPlot } from "@/components/ui-ext/ranking-dot-plot";
import { SectionCard } from "@/components/ui-ext/section-card";
import { StatusBadge } from "@/components/ui-ext/status-badge";
import { prioridadeTone, situacaoTone } from "@/lib/status-tones";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  actionPlan,
  gestorLeituras,
  individualComparisons,
  monthlyClosures,
  principalAlavanca,
  resultado,
  scoreComposition,
} from "@/data/support-data";
import { cn } from "@/lib/utils";
import { fmtBR } from "@/lib/format";

export default function GerencialPage() {
  return (
    <AppShell breadcrumb="Painel de performance" title="Resumo gerencial">
      <div className="animate-fade-in-up space-y-5">
        {/* Resultado da competência */}
        <SectionCard
          eyebrow="Resultado da competência"
          title={resultado.titulo}
          description={resultado.descricao}
          contentClassName="pt-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resultado.kpis.map((kpi) => (
              <KpiCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                hint={kpi.hint}
                icon={kpi.icon as IconName}
                tone={
                  kpi.icon === "trophy"
                    ? "success"
                    : kpi.icon === "check"
                      ? "primary"
                      : "default"
                }
              />
            ))}
          </div>
        </SectionCard>

        {/* Ranking + leitura do gestor */}
        <div className="grid gap-5 lg:grid-cols-3">
          <SectionCard
            eyebrow="Ranking da equipe"
            title="Nota final por funcionário"
            description="A linha marca a meta de 85 pontos. Os círculos preenchidos identificam os premiados."
            className="lg:col-span-2"
          >
            <RankingDotPlot />
          </SectionCard>

          <SectionCard
            eyebrow="Leitura do gestor"
            title="Pontos para acompanhamento"
            className="h-fit"
          >
            <ol>
              {gestorLeituras.map((g) => (
                <li key={g.numero} className="flex gap-4 border-b py-4 first:pt-0 last:border-0 last:pb-0">
                  <span className="tnum shrink-0 text-lg font-bold text-primary/40">
                    {g.numero}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      {g.titulo}
                    </p>
                    <p className="mt-0.5 text-sm font-bold">{g.destaque}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {g.detalhe}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>

        {/* Comparação mensal + composição da nota */}
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            eyebrow="Comparação mensal"
            title="Fechamentos por competência"
            description="Média, mediana e liderança apresentadas separadamente para respeitar a regra de cada mês."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {monthlyClosures.map((m) => (
                <div
                  key={m.competencia}
                  className={cn(
                    "rounded-xl border p-4",
                    m.status === "ATUAL"
                      ? "border-primary/40 bg-primary-soft/40 ring-1 ring-primary/20"
                      : "bg-card"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{m.competencia}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        m.status === "ATUAL"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="tnum mt-3 text-3xl font-bold">
                    {fmtBR(m.indice, 2)}
                  </p>
                  <p className="text-xs text-muted-foreground">índice médio</p>
                  <dl className="mt-4 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Mediana</dt>
                      <dd className="tnum font-semibold">
                        {fmtBR(m.mediana, 2)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Liderança</dt>
                      <dd className="tnum font-semibold">
                        {fmtBR(m.lideranca, 2)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Elegíveis</dt>
                      <dd className="tnum font-semibold">{m.elegiveis}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Premiados</dt>
                      <dd className="tnum font-semibold">{m.premiados}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
                    {m.nota}
                  </p>
                  {m.tag && (
                    <span className="mt-2 inline-block rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning-foreground">
                      {m.tag}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Composição da nota"
            title="Aproveitamento médio por critério"
            description="Pontos obtidos em relação ao peso máximo; critérios fixos aparecem identificados."
          >
            <div className="space-y-6">
              {scoreComposition.map((c) => (
                <ProgressRatio
                  key={c.label}
                  tipo={c.tipo}
                  label={c.label}
                  obtido={c.obtido}
                  maximo={c.maximo}
                  percentual={c.percentual}
                  descricao={c.descricao}
                  fixed={c.tipo === "Base comum"}
                />
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-warning/30 bg-warning-soft/60 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-warning-foreground">
                Principal alavanca
              </p>
              <p className="mt-1 text-sm font-bold">{principalAlavanca.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {principalAlavanca.descricao}
              </p>
            </div>
          </SectionCard>
        </div>

        {/* Plano de acompanhamento */}
        <SectionCard
          eyebrow="Plano de acompanhamento"
          title="Prioridades por funcionário"
          description="A lista começa pelos profissionais abaixo da meta e utiliza apenas evidências disponíveis na base."
          contentClassName="p-0"
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Prioridade</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Evidência</TableHead>
                  <TableHead className="pr-6">Próxima ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionPlan.map((item) => (
                  <TableRow key={item.nome}>
                    <TableCell className="pl-6">
                      <StatusBadge tone={prioridadeTone(item.prioridade)}>
                        {item.prioridade}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{item.nome}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.ranking}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="tnum text-sm font-bold">
                        {fmtBR(item.nota, 2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={situacaoTone(item.situacao)}>
                        {item.situacao}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <p className="text-xs font-semibold">{item.evidencia}</p>
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        {item.detalheEvidencia}
                      </p>
                    </TableCell>
                    <TableCell className="pr-6">
                      <p className="max-w-[260px] text-xs leading-snug text-muted-foreground">
                        {item.acao}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        {/* Comparação individual */}
        <SectionCard
          eyebrow="Comparação individual"
          title="08/2026 versus 07/2026"
          description="Atenção: as competências usam perfis de regra diferentes; as variações são descritivas e não devem ser tratadas como comparação direta de performance."
          contentClassName="p-0"
        >
          <Accordion type="single" collapsible>
            <AccordionItem value="comparison" className="border-0">
              <AccordionTrigger className="px-6 py-4 text-sm font-semibold hover:no-underline">
                Ver comparação individual com a competência anterior
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto px-6 pb-5">
                  <Table className="min-w-[880px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Rank atual</TableHead>
                        <TableHead>Δ Rank</TableHead>
                        <TableHead>Nota atual</TableHead>
                        <TableHead>Δ Nota</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Δ Volume</TableHead>
                        <TableHead>Avaliação</TableHead>
                        <TableHead>Δ Avaliação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {individualComparisons.map((c) => (
                        <TableRow key={c.nome}>
                          <TableCell className="font-medium">{c.nome}</TableCell>
                          <TableCell>
                            <span className="tnum font-semibold">
                              {c.rankAtual}º
                            </span>
                          </TableCell>
                          <TableCell>
                            <Delta value={c.deltaRank} suffix="º" />
                          </TableCell>
                          <TableCell>
                            <span className="tnum font-semibold">
                              {fmtBR(c.nota, 2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Delta value={c.deltaNota} />
                          </TableCell>
                          <TableCell className="tnum">{c.volume}</TableCell>
                          <TableCell>
                            <Delta value={c.deltaVolume} />
                          </TableCell>
                          <TableCell className="tnum">
                            {fmtBR(c.avaliacao, 2)}
                          </TableCell>
                          <TableCell>
                            <Delta value={c.deltaAvaliacao} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </SectionCard>
      </div>
    </AppShell>
  );
}
