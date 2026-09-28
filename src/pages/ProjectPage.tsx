import { Equal, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { SectionCard } from "@/components/ui-ext/section-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  engineeringSteps,
  competencia,
  currentSnapshot,
  operationalSnapshots,
  selectedRule,
  validationGroups,
  versionedRules,
} from "@/data/support-data-runtime";

export default function ProjectPage() {
  const records = operationalSnapshots.reduce((sum, snapshot) => sum + snapshot.totalLinhas, 0);
  const valid = operationalSnapshots.reduce((sum, snapshot) => sum + (snapshot.estatisticas.VALIDOS ?? snapshot.validos.length), 0);
  const activeClients = currentSnapshot?.carteira?.reduce((sum, row) => sum + row.clientesAtivos, 0) ?? 0;
  const resellers = currentSnapshot?.carteira?.length ?? 0;

  return (
    <AppShell breadcrumb="Painel de performance" title="Visão do projeto">
      <div className="animate-fade-in-up space-y-5">
        <section className="overflow-hidden rounded-sm border border-primary/20 bg-primary p-6 text-primary-foreground sm:p-8">
          <p className="mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary-foreground/65">Case público · dados sintéticos</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div>
              <h2 className="max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">Do atendimento à decisão, com critérios auditáveis.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/80">
                Um histórico mensal conecta qualidade do suporte, desempenho da equipe e demanda por revenda.
                A carteira ativa dá contexto ao volume de chamados; o ranking mantém regras e exclusões rastreáveis.
              </p>
            </div>
            <div className="grid gap-2 text-xs sm:grid-cols-3 lg:grid-cols-1">
              <Link to="/gerencial" className="rounded-sm border border-primary-foreground/20 px-3 py-2 hover:bg-primary-foreground/10">Visão gerencial →</Link>
              <Link to="/revendas" className="rounded-sm border border-primary-foreground/20 px-3 py-2 hover:bg-primary-foreground/10">Inteligência de revendas →</Link>
              <Link to="/auditoria" className="rounded-sm border border-primary-foreground/20 px-3 py-2 hover:bg-primary-foreground/10">Trilha de auditoria →</Link>
            </div>
          </div>
        </section>

        <SectionCard
          eyebrow="Escala da demonstração"
          title="Uma base que sustenta a análise"
          description="Os nomes, clientes, protocolos e atendimentos foram gerados para este case. Os totais são calculados a partir das competências carregadas."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Atendimentos brutos" value={records.toLocaleString("pt-BR")} hint={`${valid.toLocaleString("pt-BR")} válidos`} icon="activity" tone="primary" />
            <KpiCard label="Meses no histórico" value={operationalSnapshots.length.toLocaleString("pt-BR")} hint="comparação mensal" icon="calendar" />
            <KpiCard label="Revendas" value={resellers.toLocaleString("pt-BR")} hint="carteira da competência" icon="target" tone="warning" />
            <KpiCard label="Clientes ativos" value={activeClients.toLocaleString("pt-BR")} hint="inclui quem não abriu chamado" icon="award" tone="success" />
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Como usar o painel"
          title="Três perguntas, uma mesma base"
          description="A leitura parte da decisão gerencial, investiga a operação e preserva as evidências que explicam o resultado."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["01 · Direção", "Onde houve mudança?", "Volume, qualidade e elegibilidade mostram o fechamento de cada competência.", "/gerencial"],
              ["02 · Diagnóstico", "Onde agir primeiro?", "Clientes recorrentes e chamados por 100 clientes ativos revelam a concentração da demanda.", "/revendas"],
              ["03 · Auditoria", "Por que o resultado mudou?", "Regras versionadas, exclusões e ranking permitem conferir o cálculo.", "/auditoria"],
            ].map(([step, question, description, url]) => (
              <Link key={step} to={url} className="rounded-sm border bg-muted/40 p-5 transition-shadow hover:shadow-elevated">
                <p className="mono text-[10px] font-bold uppercase tracking-wider text-primary">{step}</p>
                <h3 className="mt-3 text-sm font-bold">{question}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Sobre o projeto */}
        <SectionCard
          eyebrow="Regra de premiação"
          title="Resultado explicável, mês a mês"
          description="A pipeline limpa e padroniza a base mensal, aplica o perfil de regra da competência, calcula o ranking e preserva os motivos de exclusão para conferência."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              label="Competência"
              value={competencia.label}
              hint="competência vigente"
              icon="calendar"
              tone="primary"
            />
            <KpiCard
              label="Meta mínima"
              value={competencia.meta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              hint="pontos para elegibilidade"
              icon="target"
              tone="warning"
            />
            <KpiCard
              label="Premiação"
              value="Top 3"
              hint="entre elegíveis"
              icon="award"
              tone="success"
            />
          </div>
        </SectionCard>

        {/* Engenharia de dados */}
        <SectionCard
          eyebrow="Engenharia de dados"
          title="Como a base é preparada"
          description="O fluxo executa etapas de extração, limpeza, validação, transformação e armazenamento antes de publicar qualquer indicador."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {engineeringSteps.map((s) => (
              <div
                key={s.numero}
                className="relative rounded-sm border bg-muted/40 p-4 transition-shadow hover:shadow-elevated"
              >
                <span className="tnum text-2xl font-bold text-primary/40">
                  {s.numero}
                </span>
                <h3 className="mt-2 text-sm font-bold">{s.titulo}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {s.descricao}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Regra selecionada */}
        <SectionCard
          eyebrow="Regra selecionada"
          title={competencia.regra}
          description="Os parâmetros mudam conforme o mês e ficam gravados no histórico."
        >
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {selectedRule.map((r) => (
              <div key={r.label} className="border-l-2 border-primary/30 pl-3">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {r.label}
                </dt>
                <dd className="mt-0.5 text-sm font-medium">{r.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-sm bg-primary-soft px-4 py-3.5">
            {[
              ["Quantidade", currentSnapshot?.config.pesoQuantidade ?? 20],
              ["Tempo Total", currentSnapshot?.config.pesoTempo ?? 10],
              ["TMA", currentSnapshot?.config.pesoTma ?? 30],
              ["Avaliação", currentSnapshot?.config.pesoAvaliacao ?? 40],
            ].map(([label, value], index) => (
              <span key={label} className="contents">
                {index > 0 && <Plus className="size-4 text-muted-foreground" />}
                <span className="text-sm">
                  <span className="font-semibold">{label} </span>
                  <span className="tnum font-bold">{Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </span>
              </span>
            ))}
            <Equal className="size-4 text-muted-foreground" />
            <span className="text-sm font-bold">Teto <span className="tnum">{competencia.teto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></span>
            <span className="ml-1 rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-bold text-warning-foreground">
              meta {competencia.meta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="w-full text-xs text-muted-foreground">Tempo Total e TMA são componentes independentes e comparativos.</span>
          </div>
        </SectionCard>

        {/* Validações da base */}
        <SectionCard
          eyebrow="Validações da base"
          title="Controles aplicados antes do ranking"
          description="Cada exclusão registra o primeiro motivo encontrado para evitar dupla contagem."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {validationGroups.map((g) => (
              <div
                key={g.titulo}
                className="rounded-sm border bg-muted/40 p-5"
              >
                <h3 className="text-sm font-bold">{g.titulo}</h3>
                <ul className="mt-3 space-y-2">
                  {g.itens.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-0.5 size-4 shrink-0 rounded-full bg-success-soft text-success grid place-items-center">
                        <svg viewBox="0 0 12 12" className="size-2.5 fill-none stroke-current stroke-2" aria-hidden>
                          <path d="M2.5 6.5 5 9l4.5-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Regras versionadas */}
        <SectionCard
          eyebrow="Regras versionadas"
          title="Perfis preservados por competência"
          description="O reprocessamento sempre usa o perfil correspondente ao mês informado."
          contentClassName="p-0"
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Período</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Pesos Qtd./Tempo/TMA/Aval.</TableHead>
                  <TableHead>Teto</TableHead>
                  <TableHead className="pr-6">Tratamento de Tempo/TMA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versionedRules.map((r) => (
                  <TableRow key={r.periodo}>
                    <TableCell className="pl-6 font-medium">
                      {r.periodo}
                    </TableCell>
                    <TableCell className="tnum">{r.avaliacao}</TableCell>
                      <TableCell>{r.duracao}</TableCell>
                      <TableCell className="tnum">{r.pesos}</TableCell>
                      <TableCell className="tnum font-bold">{r.teto}</TableCell>
                      <TableCell className="pr-6">{r.tratamento}</TableCell>
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
