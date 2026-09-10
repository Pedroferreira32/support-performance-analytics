import { Equal, Plus } from "lucide-react";

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
  selectedRule,
  validationGroups,
  versionedRules,
} from "@/data/support-data";

export default function ProjectPage() {
  return (
    <AppShell breadcrumb="Painel de performance" title="Visão do projeto">
      <div className="animate-fade-in-up space-y-5">
        {/* Sobre o projeto */}
        <SectionCard
          eyebrow="Sobre o projeto"
          title="Validação da Premiação do Suporte"
          description="Aplicação criada para transformar a base mensal do ChatMobi em um resultado confiável de premiação. O sistema limpa e padroniza os dados, aplica as regras da competência, calcula o ranking e mantém a memória completa para conferência."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              label="Competência"
              value="08/2026"
              hint="competência vigente"
              icon="calendar"
              tone="primary"
            />
            <KpiCard
              label="Meta mínima"
              value="85,00"
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
          title="Novo modelo oficial — automáticos incluídos e Tempo/TMA fixos em 31,5"
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
            <span className="text-sm">
              <span className="font-semibold">Base fixa </span>
              <span className="tnum font-bold">31,50</span>
              <span className="ml-1 text-xs text-muted-foreground">
                Tempo + TMA
              </span>
            </span>
            <Plus className="size-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-semibold">Quantidade </span>
              <span className="tnum font-bold">20,00</span>
              <span className="ml-1 text-xs text-muted-foreground">variável</span>
            </span>
            <Plus className="size-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-semibold">Avaliação </span>
              <span className="tnum font-bold">40,00</span>
              <span className="ml-1 text-xs text-muted-foreground">variável</span>
            </span>
            <Equal className="size-4 text-muted-foreground" />
            <span className="text-sm font-bold">
              Teto efetivo <span className="tnum">91,50</span>
            </span>
            <span className="ml-1 rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-bold text-warning-foreground">
              meta 85,00
            </span>
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
