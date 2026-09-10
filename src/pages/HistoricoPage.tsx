import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { type IconName } from "@/components/ui-ext/app-icon";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { ScoreHistory } from "@/components/ui-ext/score-history";
import { SectionCard } from "@/components/ui-ext/section-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  historySeries,
  monthlyResults,
} from "@/data/support-data";
import { fmtBR } from "@/lib/format";

export default function HistoricoPage() {
  const [selectedId, setSelectedId] = useState(employees[0].id);
  const [feedback, setFeedback] = useState("");

  const emp = employees.find((e) => e.id === selectedId) ?? employees[0];
  const series = historySeries.find((h) => h.nome === emp.name)!;
  const points = series.pontos
    .filter((p) => p.nota != null)
    .map((p) => ({ competencia: p.competencia, nota: p.nota as number }));

  const saveFeedback = () =>
    toast("Edição bloqueada na demonstração", {
      description:
        "O registro de gestão fica disponível na versão completa do sistema.",
    });

  return (
    <AppShell breadcrumb="Painel de performance" title="Histórico">
      <div className="animate-fade-in-up space-y-5">
        {/* Histórico individual */}
        <SectionCard
          eyebrow="Histórico individual"
          title={`Evolução de ${emp.name}`}
          description="Acompanhe a trajetória do funcionário ao longo das competências."
          action={
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="Última nota"
              value={fmtBR(emp.note, 2)}
              hint="competência mais recente"
              icon="gauge"
              tone="primary"
            />
            <KpiCard
              label="Última posição"
              value={`${emp.rank}º`}
              hint="posição no ranking"
              icon="medal"
            />
            <KpiCard
              label="Volume observado"
              value={String(emp.volume)}
              hint="última competência"
              icon="database"
            />
            <KpiCard
              label="TMA observado"
              value={`${fmtBR(emp.tmaMediano, 1)} min`}
              hint="não altera a nota fixa"
              icon="timer"
            />
            <KpiCard
              label="Cobertura CSAT"
              value={`${fmtBR(emp.cobertura, 1)}%`}
              hint="última competência"
              icon="percent"
            />
            <KpiCard
              label="Competências"
              value="2"
              hint="meses registrados"
              icon="calendar"
            />
          </div>
        </SectionCard>

        {/* Histórico de notas */}
        <SectionCard
          eyebrow="Histórico de notas"
          title="Nota por competência"
          description="Cada competência é exibida separadamente; a linha representa a meta de 85."
        >
          <ScoreHistory data={points} />
        </SectionCard>

        {/* Resultados mensais */}
        <SectionCard
          eyebrow="Resultados mensais"
          title="Histórico consolidado"
          contentClassName="p-0"
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Competência</TableHead>
                  <TableHead>Índice médio</TableHead>
                  <TableHead>Mediana</TableHead>
                  <TableHead>Liderança</TableHead>
                  <TableHead>Elegíveis</TableHead>
                  <TableHead>Premiados</TableHead>
                  <TableHead className="pr-6">Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyResults.map((m) => (
                  <TableRow key={m.competencia}>
                    <TableCell className="pl-6 font-medium">
                      {m.competencia}
                    </TableCell>
                    <TableCell className="tnum">
                      {fmtBR(m.indice, 2)}
                    </TableCell>
                    <TableCell className="tnum">
                      {fmtBR(m.mediana, 2)}
                    </TableCell>
                    <TableCell className="tnum">
                      {fmtBR(m.lideranca, 2)}
                    </TableCell>
                    <TableCell className="tnum">{m.elegiveis}</TableCell>
                    <TableCell className="tnum">{m.premiados}</TableCell>
                    <TableCell className="pr-6">
                      <span
                        className={
                          m.situacao === "ATUAL"
                            ? "rounded-sm bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary"
                            : "rounded-sm bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground"
                        }
                      >
                        {m.situacao}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        {/* Registro de gestão */}
        <SectionCard
          eyebrow="Registro de gestão"
          title="Feedback individual"
          description="Texto vinculado à competência selecionada."
        >
          <div className="space-y-3">
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={`Escreva o feedback de ${emp.name} para a competência 08/2026…`}
              rows={4}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Edição bloqueada na demonstração pública.
              </p>
              <Button size="sm" onClick={saveFeedback}>
                Salvar feedback
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
