import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { SectionCard } from "@/components/ui-ext/section-card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  currentSnapshot,
  operationalSnapshots,
} from "@/data/support-data-runtime";
import { demoClientSnapshots } from "@/data/demo-client-data";
import { fmtBR } from "@/lib/format";
import type { CompetenceSnapshot, ValidRecord } from "@/lib/validation-engine";
import { cn } from "@/lib/utils";

type DemandSignal = "Crítico" | "Atenção" | "Regular";

interface ClientSummary {
  rank: number;
  key: string;
  name: string;
  contact: string;
  tickets: number;
  share: number;
  activeDays: number;
  averagePerDay: number;
  agents: number;
  rating: number | null;
  ratingCount: number;
  lastContact: string;
  delta: number | null;
  signal: DemandSignal;
}

interface ClientAccumulator {
  key: string;
  name: string;
  contact: string;
  tickets: number;
  days: Set<string>;
  agents: Set<string>;
  ratings: number[];
  lastContact: string;
}

type ClientSnapshot = Pick<CompetenceSnapshot, "competencia" | "competenciaBr" | "validos">;

const UNKNOWN_CLIENTS = new Set(["", "-", "NAN", "NULL", "NAO INFORMADO", "NÃO INFORMADO"]);

function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function maskContact(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits ? `Contato ••••${digits.slice(-4)}` : "Cliente não identificado";
}

function clientIdentity(record: ValidRecord): { key: string; name: string; contact: string } | null {
  const client = record.cliente?.trim() ?? "";
  const contact = record.contato?.trim() ?? "";
  const clientKey = normalized(client);
  if (clientKey && !UNKNOWN_CLIENTS.has(clientKey)) {
    return { key: `CLIENT:${clientKey}`, name: client, contact };
  }
  const contactKey = normalized(contact);
  if (contactKey && !UNKNOWN_CLIENTS.has(contactKey)) {
    return { key: `CONTACT:${contactKey}`, name: maskContact(contact), contact };
  }
  return null;
}

function aggregate(snapshot: ClientSnapshot | null): Map<string, ClientAccumulator> {
  const result = new Map<string, ClientAccumulator>();
  snapshot?.validos.forEach((record) => {
    const identity = clientIdentity(record);
    if (!identity) return;
    const current = result.get(identity.key) ?? {
      ...identity,
      tickets: 0,
      days: new Set<string>(),
      agents: new Set<string>(),
      ratings: [],
      lastContact: "",
    };
    current.tickets += 1;
    if (record.inicio) current.days.add(record.inicio.slice(0, 10));
    if (record.atendente) current.agents.add(record.atendente);
    if (record.avaliacao != null) current.ratings.push(record.avaliacao);
    const timestamp = record.fim || record.inicio;
    if (timestamp > current.lastContact) current.lastContact = timestamp;
    result.set(identity.key, current);
  });
  return result;
}

function percentile(values: number[], ratio: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * ratio;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return lower === upper
    ? sorted[lower]
    : sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function signalClass(signal: DemandSignal): string {
  if (signal === "Crítico") return "border-danger/35 bg-danger-soft text-danger";
  if (signal === "Atenção") return "border-warning/35 bg-warning-soft text-warning";
  return "border-primary/25 bg-primary-soft/60 text-primary";
}

function barClass(signal: DemandSignal): string {
  if (signal === "Crítico") return "bg-danger";
  if (signal === "Atenção") return "bg-warning";
  return "bg-primary";
}

function formatDate(value: string): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const isDemo = !currentSnapshot;
  const clientSnapshots: ClientSnapshot[] = currentSnapshot
    ? operationalSnapshots
    : demoClientSnapshots;
  const activeClientSnapshot: ClientSnapshot | null = currentSnapshot
    ?? demoClientSnapshots.at(-1)
    ?? null;
  const model = useMemo(() => {
    const currentMap = aggregate(activeClientSnapshot);
    const currentIndex = activeClientSnapshot
      ? clientSnapshots.findIndex((snapshot) => snapshot.competencia === activeClientSnapshot.competencia)
      : -1;
    const previousSnapshot = currentIndex > 0 ? clientSnapshots[currentIndex - 1] : null;
    const previousMap = aggregate(previousSnapshot);
    const counts = [...currentMap.values()].map((item) => item.tickets);
    const criticalCut = Math.max(2, Math.ceil(percentile(counts, 0.9)));
    const attentionCut = Math.max(2, Math.ceil(percentile(counts, 0.75)));
    const totalTickets = activeClientSnapshot?.validos.length ?? 0;

    const rows: ClientSummary[] = [...currentMap.values()]
      .map((item) => {
        const previousTickets = previousSnapshot ? previousMap.get(item.key)?.tickets ?? 0 : null;
        const signal: DemandSignal = item.tickets >= criticalCut
          ? "Crítico"
          : item.tickets >= attentionCut
            ? "Atenção"
            : "Regular";
        return {
          key: item.key,
          name: item.name,
          contact: item.contact,
          tickets: item.tickets,
          share: totalTickets ? (item.tickets / totalTickets) * 100 : 0,
          activeDays: item.days.size,
          averagePerDay: item.tickets / Math.max(1, item.days.size),
          agents: item.agents.size,
          rating: item.ratings.length
            ? item.ratings.reduce((sum, value) => sum + value, 0) / item.ratings.length
            : null,
          ratingCount: item.ratings.length,
          lastContact: item.lastContact,
          delta: previousTickets == null ? null : item.tickets - previousTickets,
          signal,
        };
      })
      .sort((a, b) => b.tickets - a.tickets || b.activeDays - a.activeDays || a.name.localeCompare(b.name, "pt-BR"))
      .map((item, index) => ({ ...item, rank: index + 1 }));

    const identifiedTickets = rows.reduce((sum, item) => sum + item.tickets, 0);
    const topFiveTickets = rows.slice(0, 5).reduce((sum, item) => sum + item.tickets, 0);
    return {
      rows,
      previousLabel: previousSnapshot?.competenciaBr ?? null,
      criticalCut,
      attentionCut,
      identifiedTickets,
      unidentifiedTickets: Math.max(0, totalTickets - identifiedTickets),
      recurringClients: rows.filter((item) => item.tickets > 1).length,
      criticalClients: rows.filter((item) => item.signal === "Crítico").length,
      topFiveShare: totalTickets ? (topFiveTickets / totalTickets) * 100 : 0,
      identificationRate: totalTickets ? (identifiedTickets / totalTickets) * 100 : 0,
    };
  }, [activeClientSnapshot, clientSnapshots]);

  const filteredRows = model.rows.filter((item) =>
    normalized(item.name).includes(normalized(search)),
  );
  const topRows = model.rows.slice(0, 10);
  const maxTickets = topRows[0]?.tickets ?? 1;

  if (!activeClientSnapshot) {
    return (
      <AppShell breadcrumb="Carteira de atendimento" title="Clientes críticos">
        <SectionCard
          eyebrow="Base necessária"
          title="Importe uma competência para iniciar a análise"
          description="O painel será formado a partir de Contact ID e Contact Number presentes no arquivo do ChatMobi."
        >
          <p className="text-sm text-muted-foreground">
            Nenhum atendimento está disponível para a análise.
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumb="Carteira de atendimento" title="Clientes críticos">
      <div className="animate-fade-in-up space-y-5">
        {isDemo && (
          <div className="rounded-sm border border-primary/30 bg-primary/5 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Versão de demonstração:</span>{" "}
            empresas, contatos, atendentes e protocolos são totalmente fictícios. Os indicadores reproduzem o comportamento do painel interno sem expor dados reais.
          </div>
        )}
        <div className="rounded-sm border border-border/70 bg-card/45 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
          A criticidade representa <span className="font-semibold text-foreground">volume e recorrência de contatos</span> na competência selecionada. Ela não indica, isoladamente, a gravidade técnica dos chamados.
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Clientes identificados"
            value={model.rows.length.toLocaleString("pt-BR")}
            hint={`${fmtBR(model.identificationRate, 1)}% dos atendimentos com identificação`}
            tone="primary"
          />
          <KpiCard
            label="Clientes recorrentes"
            value={model.recurringClients.toLocaleString("pt-BR")}
            hint="mais de um contato na competência"
            tone="warning"
          />
          <KpiCard
            label="Clientes críticos"
            value={model.criticalClients.toLocaleString("pt-BR")}
            hint={`percentil 90 e pelo menos ${model.criticalCut} contatos`}
            tone="danger"
          />
          <KpiCard
            label="Concentração Top 5"
            value={`${fmtBR(model.topFiveShare, 1)}%`}
            hint="participação dos cinco clientes mais atendidos"
            tone="default"
          />
        </div>

        {model.rows.length ? (
          <SectionCard
            eyebrow="Concentração da demanda"
            title="Clientes com maior volume de atendimentos"
            description="Ranking simples dos dez clientes que mais passaram pelo suporte na competência."
          >
            <div className="space-y-3">
              {topRows.map((item, index) => (
                <div key={item.key} className="grid items-center gap-2 sm:grid-cols-[2rem_minmax(10rem,15rem)_1fr_4.5rem]">
                  <span className="mono text-right text-[11px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" title={item.name}>{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.activeDays} dia(s) · {item.agents} atendente(s)</p>
                  </div>
                  <div
                    className="h-6 overflow-hidden rounded-[2px] bg-muted/70"
                    role="img"
                    aria-label={`${item.name}: ${item.tickets} atendimentos, ${item.signal}`}
                  >
                    <div
                      className={cn("h-full min-w-1 rounded-[2px]", barClass(item.signal))}
                      style={{ width: `${Math.max(2, (item.tickets / maxTickets) * 100)}%` }}
                    />
                  </div>
                  <span className="tnum text-right text-sm font-bold">{item.tickets}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-border/50 pt-3 text-[10px]">
              <span className="rounded-sm border border-danger/35 bg-danger-soft px-2 py-1 text-danger">Crítico · ≥ {model.criticalCut}</span>
              <span className="rounded-sm border border-warning/35 bg-warning-soft px-2 py-1 text-warning">Atenção · ≥ {model.attentionCut}</span>
              <span className="rounded-sm border border-primary/25 bg-primary-soft/60 px-2 py-1 text-primary">Regular</span>
            </div>
          </SectionCard>
        ) : (
          <SectionCard
            eyebrow="Qualidade do dado"
            title="Clientes ainda não identificados"
            description="A competência foi processada antes do mapeamento de Contact ID. Reprocesse o arquivo para formar esta análise."
          >
            <p className="text-sm text-muted-foreground">
              {activeClientSnapshot.validos.length.toLocaleString("pt-BR")} atendimento(s) válido(s) estão sem identificação de cliente.
            </p>
          </SectionCard>
        )}

        <SectionCard
          eyebrow="Lista de acompanhamento"
          title="Detalhamento dos clientes"
          description={`Critérios: Crítico no percentil 90; Atenção no percentil 75. Comparação com ${model.previousLabel ?? "competência anterior indisponível"}.`}
          action={(
            <div>
              <label htmlFor="client-search" className="sr-only">Buscar cliente</label>
              <Input
                id="client-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente"
                className="h-8 w-44 bg-background/70 text-xs sm:w-56"
              />
            </div>
          )}
          contentClassName="p-0"
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[1060px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Atendimentos</TableHead>
                  <TableHead>Participação</TableHead>
                  <TableHead>Dias ativos</TableHead>
                  <TableHead>Média/dia</TableHead>
                  <TableHead>Atendentes</TableHead>
                  <TableHead>CSAT</TableHead>
                  <TableHead>Δ anterior</TableHead>
                  <TableHead>Último contato</TableHead>
                  <TableHead className="pr-6">Sinal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell className="mono pl-6 text-muted-foreground">{item.rank}</TableCell>
                    <TableCell className="max-w-[260px] font-medium">
                      <p className="truncate" title={item.name}>{item.name}</p>
                      {item.contact && <p className="text-[10px] text-muted-foreground">{maskContact(item.contact)}</p>}
                    </TableCell>
                    <TableCell className="tnum font-semibold">{item.tickets}</TableCell>
                    <TableCell className="tnum">{fmtBR(item.share, 1)}%</TableCell>
                    <TableCell className="tnum">{item.activeDays}</TableCell>
                    <TableCell className="tnum">{fmtBR(item.averagePerDay, 1)}</TableCell>
                    <TableCell className="tnum">{item.agents}</TableCell>
                    <TableCell className="tnum">
                      {item.rating == null ? "—" : `${fmtBR(item.rating, 2)} (${item.ratingCount})`}
                    </TableCell>
                    <TableCell className={cn("tnum", item.delta != null && item.delta > 0 && "text-warning", item.delta != null && item.delta < 0 && "text-success")}>
                      {item.delta == null ? "—" : `${item.delta > 0 ? "+" : ""}${item.delta}`}
                    </TableCell>
                    <TableCell className="tnum text-xs">{formatDate(item.lastContact)}</TableCell>
                    <TableCell className="pr-6">
                      <span className={cn("inline-flex rounded-sm border px-2 py-0.5 text-[10px] font-bold", signalClass(item.signal))}>
                        {item.signal}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredRows.length && (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                      Nenhum cliente encontrado para a busca informada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-t border-border/50 px-6 py-3 text-[11px] text-muted-foreground">
            <span>{filteredRows.length.toLocaleString("pt-BR")} cliente(s) na listagem</span>
            {model.unidentifiedTickets > 0 && <span>{model.unidentifiedTickets.toLocaleString("pt-BR")} atendimento(s) sem identificação</span>}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
