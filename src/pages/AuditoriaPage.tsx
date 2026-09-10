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
} from "@/data/support-data";

export default function AuditoriaPage() {
  const downloadExcel = () =>
    toast("Exportação disponível na versão completa", {
      description:
        "Esta demonstração é somente leitura e usa dados sintéticos.",
    });

  return (
    <AppShell breadcrumb="Painel de performance" title="Auditoria">
      <div className="animate-fade-in-up space-y-5">
        {/* Saídas do processo */}
        <SectionCard
          eyebrow="Saídas do processo"
          title="Entregáveis da competência"
          description="O processo publica os artefatos abaixo para conferência e prestação de contas."
          action={
            <Button variant="outline" size="sm" onClick={downloadExcel}>
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
                className="rounded-xl border bg-muted/40 p-4 transition-shadow hover:shadow-elevated"
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
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
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
            Total excluído: 127 registros · 5,1% da base importada.
          </p>
        </SectionCard>
      </div>
    </AppShell>
  );
}
