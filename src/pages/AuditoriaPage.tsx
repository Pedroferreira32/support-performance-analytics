import { Download, Info } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { type IconName } from "@/components/ui-ext/app-icon";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { SectionCard } from "@/components/ui-ext/section-card";
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
  auditLog,
  auditSummary,
  rastreabilidade,
  saidasProcesso,
  currentSnapshot,
  operationalSnapshots,
} from "@/data/support-data-runtime";
import { exportExcel } from "@/lib/report-export";

export default function AuditoriaPage() {
  const automaticos = currentSnapshot?.validos.filter((row) => row.suspeitoAutomatico) ?? [];
  const exclusoesDetalhadas = currentSnapshot?.excluidos.slice(0, 100) ?? [];
  const downloadExcel = async () => {
    if (!currentSnapshot) {
      toast.info("Importe uma base para gerar a auditoria em Excel.");
      return;
    }
    try {
      await exportExcel(currentSnapshot, operationalSnapshots);
      toast.success("Auditoria gerada em Excel");
    } catch (error) {
      toast.error("Não foi possível gerar o Excel", { description: error instanceof Error ? error.message : "Tente novamente." });
    }
  };

  return (
    <AppShell breadcrumb="Painel de performance" title="Auditoria">
      <div className="animate-fade-in-up space-y-5">
        {/* Saídas do processo */}
        <SectionCard
          eyebrow="Saídas do processo"
          title="Entregáveis da competência"
          description="O processo publica os artefatos abaixo para conferência e prestação de contas."
          action={
            <Button variant="outline" size="sm" onClick={() => void downloadExcel()}>
              <Download className="size-4" />
              Baixar auditoria em Excel
            </Button>
          }
        >
          <div className="flex flex-wrap gap-2">
            {saidasProcesso.map((s) => (
              <span
                key={s}
                className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        </SectionCard>

        {/* Explicação da validação */}
        <SectionCard
          eyebrow="Como a base foi validada"
          title="Limpeza, controles e regra aplicada"
          description="A trilha abaixo explica como os dados brutos se transformam na base usada no ranking."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["1. Leitura e limpeza", "Localização do cabeçalho, correção de linhas CSV encapsuladas, padronização de textos e conversão de datas."],
              ["2. Competência", "O mês é definido pela data de início. Um atendimento iniciado em agosto e finalizado em 01/09 permanece em agosto."],
              ["3. Escopo", "Suporte é aceito em Filas/Setores ou no campo de transferência; nomes fora da campanha são comparados parcialmente."],
              ["4. Qualidade", "Datas ausentes, duração negativa, limite de duração, domingo e horário são avaliados na ordem da regra vigente."],
              ["5. Automáticos", "Fechamentos às 06:00 ou em lotes de 20 ou mais no mesmo minuto são identificados e mantidos com duração protegida quando a regra permite."],
              ["6. Resultado", "A nota usa os pesos da competência, corte de 85 pontos e premia somente o Top 3 elegível por maior nota."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-sm border bg-muted/35 p-4">
                <p className="text-sm font-bold">{title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>

          {currentSnapshot && (
            <div className="mt-5 grid gap-4 border-t border-border/60 pt-5 md:grid-cols-2">
              <div>
                <p className="mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Parâmetros da competência</p>
                <dl className="mt-2 divide-y divide-border/60 rounded-sm border px-4">
                  {[
                    ["Perfil", currentSnapshot.config.perfilRegra],
                    ["Escala de avaliação", `0 a ${currentSnapshot.config.escalaAvaliacaoMax}`],
                    ["Duração regular", `até ${currentSnapshot.config.maxHoras} horas`],
                    ["Tempo + TMA", currentSnapshot.config.pontuacaoTempoTmaFixa ? "31,50 pontos iguais para todos" : "pontuação comparativa"],
                    ["Meta e premiação", `${currentSnapshot.config.notaMinima} pontos · Top 3 elegível`],
                  ].map(([term, value]) => (
                    <div key={term} className="flex justify-between gap-4 py-2.5 text-xs">
                      <dt className="text-muted-foreground">{term}</dt>
                      <dd className="max-w-[65%] text-right font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <p className="mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Colunas reconhecidas no arquivo</p>
                <dl className="mt-2 divide-y divide-border/60 rounded-sm border px-4">
                  {Object.entries(currentSnapshot.mapeamento).map(([field, column]) => (
                    <div key={field} className="flex justify-between gap-4 py-2.5 text-xs">
                      <dt className="capitalize text-muted-foreground">{field.replace(/([A-Z])/g, " $1")}</dt>
                      <dd className="font-semibold">{column}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </SectionCard>

        {currentSnapshot && (
          <SectionCard
            eyebrow="Finalizados automaticamente"
            title={`${automaticos.length.toLocaleString("pt-BR")} registros incluídos e rastreáveis`}
            description="Eles contam em Quantidade e Avaliação. A duração artificial não participa de Tempo Total nem de TMA."
            contentClassName="p-0"
          >
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Linha</TableHead>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Duração original</TableHead>
                    <TableHead className="pr-6">Tempo/TMA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automaticos.slice(0, 100).map((row) => (
                    <TableRow key={`${row.linhaOrigem}-${row.protocolo}`}>
                      <TableCell className="pl-6 tnum">{row.linhaOrigem}</TableCell>
                      <TableCell>{row.protocolo}</TableCell>
                      <TableCell className="font-medium">{row.atendente}</TableCell>
                      <TableCell className="tnum">{row.inicio.replace("T", " ")}</TableCell>
                      <TableCell className="tnum">{row.fim.replace("T", " ")}</TableCell>
                      <TableCell className="tnum">{row.duracaoHoras.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} h</TableCell>
                      <TableCell className="pr-6 font-semibold text-primary">Protegido</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {automaticos.length > 100 && <p className="border-t px-6 py-3 text-[11px] text-muted-foreground">Prévia limitada a 100 registros. O Excel contém a relação completa.</p>}
          </SectionCard>
        )}

        {/* Rastreabilidade */}
        <SectionCard
          eyebrow="Rastreabilidade"
          title="Memória completa da competência"
          description="Cada valor publicado pode ser rastreado até o registro de origem."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rastreabilidade.map((r) => (
              <div
                key={r.titulo}
                className="rounded-sm border bg-muted/40 p-4 transition-shadow hover:shadow-elevated"
              >
                <p className="text-sm font-bold">{r.titulo}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {r.descricao}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Resumo da base */}
        <SectionCard
          eyebrow="Resumo da base"
          title="Do arquivo importado ao resultado"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {auditSummary.map((k) => (
              <KpiCard
                key={k.label}
                label={k.label}
                value={k.value}
                hint={k.hint}
                icon={k.icon as IconName}
                tone={
                  k.icon === "x"
                    ? "danger"
                    : k.icon === "check"
                      ? "success"
                      : "default"
                }
              />
            ))}
          </div>
        </SectionCard>

        {/* Log de exclusões */}
        <SectionCard
          eyebrow="Log de exclusões"
          title="Motivos registrados"
          description="Cada exclusão registra o primeiro motivo encontrado para evitar dupla contagem."
          contentClassName="p-0"
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[520px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Motivo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead className="w-[40%]">Participação</TableHead>
                  <TableHead className="pr-6">Percentual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((l) => (
                  <TableRow key={l.motivo}>
                    <TableCell className="pl-6 font-medium">
                      {l.motivo}
                    </TableCell>
                    <TableCell className="tnum">{l.quantidade}</TableCell>
                    <TableCell>
                      <div className="h-2 w-full overflow-hidden rounded-[2px] bg-muted">
                        <div
                          className="h-full rounded-[2px] bg-primary"
                          style={{ width: l.percentual }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 tnum">
                      {l.percentual}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="flex items-center gap-2 border-t px-6 py-3 text-[11px] text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            Total excluído: {currentSnapshot?.excluidos.length.toLocaleString("pt-BR") ?? "127"} registros · {currentSnapshot ? (currentSnapshot.totalLinhas ? (currentSnapshot.excluidos.length / currentSnapshot.totalLinhas * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "0") : "5,1"}% da base importada.
          </p>
        </SectionCard>

        {currentSnapshot && exclusoesDetalhadas.length > 0 && (
          <SectionCard
            eyebrow="Detalhe das exclusões"
            title="Registros retirados da base de pontuação"
            description="Prévia auditável com o primeiro motivo identificado em cada linha."
            contentClassName="p-0"
          >
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Linha</TableHead>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead className="pr-6">Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exclusoesDetalhadas.map((row) => (
                    <TableRow key={`${row.linhaOrigem}-${row.protocolo}`}>
                      <TableCell className="pl-6 tnum">{row.linhaOrigem}</TableCell>
                      <TableCell>{row.protocolo}</TableCell>
                      <TableCell className="font-medium">{row.atendente || "—"}</TableCell>
                      <TableCell>{row.departamento || "—"}</TableCell>
                      <TableCell className="pr-6 text-xs text-muted-foreground">{row.motivo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {currentSnapshot.excluidos.length > 100 && <p className="border-t px-6 py-3 text-[11px] text-muted-foreground">Prévia limitada a 100 registros. O Excel contém o log completo.</p>}
          </SectionCard>
        )}
      </div>
    </AppShell>
  );
}
