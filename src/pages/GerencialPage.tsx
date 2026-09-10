import { AppShell } from "@/components/layout/app-shell";
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
import { AnimatedValue } from "@/components/ui-ext/animated-value";
import { ComboMonthly } from "@/components/ui-ext/combo-monthly";
import { Delta } from "@/components/ui-ext/delta";
import { ProgressRatio } from "@/components/ui-ext/progress-ratio";
import { RadarComposition } from "@/components/ui-ext/radar-composition";
import { RankingChart } from "@/components/ui-ext/ranking-chart";
import { SectionCard } from "@/components/ui-ext/section-card";
import { Sparkline } from "@/components/ui-ext/sparkline";
import { StatusBadge } from "@/components/ui-ext/status-badge";
import {
  actionPlan,
  gestorLeituras,
  individualComparisons,
  principalAlavanca,
  resultado,
  scoreComposition,
} from "@/data/support-data";
import { fmtBR } from "@/lib/format";
import { prioridadeTone, situacaoTone } from "@/lib/status-tones";

export default function GerencialPage() {
  return (
    <AppShell breadcrumb="Painel de performance" title="Resumo gerencial">
      <div className="animate-fade-in-up space-y-5">
        {/* Faixa de KPIs — leitura de cima para baixo */}
        <section className="rounded-sm border border-border/70 bg-card/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Resultado da competência
              </p>
              <h2 className="mt-1 text-base font-bold tracking-tight">
                {resultado.titulo}
              </h2>
            </div>
            <span className="mono inline-flex items-center gap-2 rounded-sm border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Top 3 confirmado
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-border/60">
            {resultado.kpis.map((kpi) => (
              <div key={kpi.label} className="flex min-w-0 flex-col">
                <p className="mono truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {kpi.label}
                </p>
                <AnimatedValue
                  value={kpi.value}
                  className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl"
                />
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  {kpi.hint}
                </p>
                {kpi.trend && kpi.trend.length >= 2 && (
                  <Sparkline
                    data={kpi.trend}
                    className="mt-2 h-6 w-full max-w-[96px] text-muted-foreground/70"
                  />
                )}
              </div>
            ))}
          </div>

          <p className="mt-5 max-w-4xl text-[13px] leading-relaxed text-muted-foreground">
            {resultado.descricao}
          </p>
        </section>

        {/* Ranking + leitura do gestor */}
        <div className="grid gap-5 lg:grid-cols-3">
          <SectionCard
            eyebrow="Ranking"
            title="Nota final por funcionário"
            description="A linha marca a meta de 85 pontos. As barras destacam as posições premiadas."
            className="lg:col-span-2"
          >
            <RankingChart />
          </SectionCard>

          <SectionCard
            eyebrow="Leitura do gestor"
            title="Pontos para acompanhamento"
            className="h-fit"
          >
            <ol>
              {gestorLeituras.map((g) => (
                <li
                  key={g.numero}
                  className="flex gap-4 border-b border-border/60 py-4 first:pt-0 last:border-0 last:pb-0"
                >
                  <span className="mono shrink-0 bg-primary/20 text-lg font-bold text-primary">
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
            description="Índice médio em barras, mediana em linha e a meta de 85 como referência."
          >
            <ComboMonthly />
          </SectionCard>

          <SectionCard
            eyebrow="Composição da nota"
            title="Aproveitamento médio por critério"
            description="Pontos obtidos em relação ao peso máximo; critérios fixos aparecem identificados."
          >
            <RadarComposition />
            <div className="mt-6 space-y-6">
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
            <div className="mt-6 rounded-sm border border-amber-400/25 bg-amber-400/[0.07] p-4">
              <p className="mono text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
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
