import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/ui-ext/kpi-card";
import { SectionCard } from "@/components/ui-ext/section-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currentSnapshot, operationalSnapshots } from "@/data/support-data-runtime";
import { fmtBR } from "@/lib/format";
import { buildResellerIntelligence, type DemandSignal } from "@/lib/reseller-intelligence";
import { cn } from "@/lib/utils";

function tone(signal: DemandSignal): string {
  if (signal === "Demanda elevada") return "border-danger/35 bg-danger-soft text-danger";
  if (signal === "Acompanhar") return "border-warning/35 bg-warning-soft text-warning";
  return "border-primary/25 bg-primary-soft/60 text-primary";
}

const displayRate = (value: number | null) => value == null ? "—" : fmtBR(value, 1);

export default function RevendasPage() {
  const [search, setSearch] = useState("");
  const [signal, setSignal] = useState<"Todas" | DemandSignal>("Todas");
  const model = useMemo(() => buildResellerIntelligence(currentSnapshot), []);
  const [selectedReseller, setSelectedReseller] = useState(model.rows[0]?.revenda ?? "");

  const filtered = model.rows.filter((row) => {
    const matchesSearch = row.revenda.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
    return matchesSearch && (signal === "Todas" || row.signal === signal);
  });
  const maxRate = model.rows[0]?.taxaPor100 ?? 1;
  const selectedHistory = operationalSnapshots.map((snapshot) => {
    const row = buildResellerIntelligence(snapshot).rows.find((item) => item.revenda === selectedReseller);
    return { competencia: snapshot.competenciaBr, row, scale: snapshot.config.escalaAvaliacaoMax };
  });
  const monthlyOverview = operationalSnapshots.map((snapshot) => {
    const data = buildResellerIntelligence(snapshot);
    return {
      competencia: snapshot.competenciaBr,
      total: data.total,
      active: data.totalActiveClients,
      rate: data.overallRate,
      leader: data.topReseller?.revenda ?? "—",
      csatPercent: data.weightedCsat == null ? null : data.weightedCsat / snapshot.config.escalaAvaliacaoMax * 100,
    };
  });

  if (!currentSnapshot || !model.rows.length) {
    return (
      <AppShell breadcrumb="Rede de atendimento" title="Revendas">
        <SectionCard
          eyebrow="Base necessária"
          title="Histórico ainda não disponível"
          description="Carregue uma competência sintética com a coluna Revenda para explorar a rede."
        >
          <p className="text-sm text-muted-foreground">Nenhum atendimento com revenda está disponível.</p>
        </SectionCard>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumb="Rede de atendimento" title="Inteligência de revendas">
      <div className="animate-fade-in-up space-y-5">
        <div className="rounded-sm border border-primary/30 bg-primary/5 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Demonstração com dados sintéticos.</span>{" "}
          A carteira inclui empresas sem chamados. “Demanda elevada” indica a taxa no percentil 90 do mês,
          uma prioridade de investigação, sem afirmar gravidade técnica ou causa.
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Revendas na carteira" value={model.rows.length.toLocaleString("pt-BR")} hint="inclusive sem chamados" tone="primary" />
          <KpiCard label="Atendimentos" value={model.total.toLocaleString("pt-BR")} hint="base válida vinculada" />
          <KpiCard label="Clientes ativos" value={model.hasPortfolio ? model.totalActiveClients.toLocaleString("pt-BR") : "—"} hint="denominador mensal" />
          <KpiCard label="Assinaturas ativas" value={model.hasPortfolio ? model.totalSubscriptions.toLocaleString("pt-BR") : "—"} hint="carteira mensal" />
          <KpiCard label="Por 100 clientes" value={displayRate(model.overallRate)} hint="atendimentos / clientes ativos × 100" tone="warning" />
        </div>

        {model.hasPortfolio && model.topReseller ? (
          <SectionCard eyebrow="Leitura para decisão" title="Onde investigar primeiro?"
            description="Comparação proporcional da carteira mensal, com volume e alcance como contexto.">
            <p className="text-sm leading-relaxed">
              <strong>{model.topReseller.revenda}</strong> registrou{" "}
              <strong>{displayRate(model.topReseller.taxaPor100)} atendimentos por 100 clientes ativos</strong>,
              ante {displayRate(model.overallRate)} na rede. São {model.topReseller.atendimentos.toLocaleString("pt-BR")}
              {" "}atendimentos para {model.topReseller.clientesAtivos?.toLocaleString("pt-BR")} clientes ativos.
              Vale investigar os clientes recorrentes e as causas dos chamados antes de definir uma ação.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {displayRate(model.overallReach)}% da carteira teve contato. A taxa de chamados pode ultrapassar
              100 porque uma empresa pode abrir vários atendimentos.
            </p>
          </SectionCard>
        ) : (
          <SectionCard eyebrow="Denominador ausente" title="Carteira mensal não disponível"
            description="Esta competência contém atendimentos, mas não a base independente de clientes ativos. As taxas ficam em branco para evitar conclusões enganosas." />
        )}

        {model.hasPortfolio && <SectionCard
          eyebrow="Comparação proporcional"
          title="Revendas por taxa de atendimento"
          description="Ordenação por atendimentos a cada 100 clientes ativos; volume absoluto ao lado."
        >
          <div className="space-y-3">
            {model.rows.slice(0, 12).map((row) => (
              <div key={row.revenda} className="grid items-center gap-2 sm:grid-cols-[2rem_minmax(11rem,16rem)_1fr_5rem_5rem]">
                <span className="mono text-right text-[11px] text-muted-foreground">{String(row.rank).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" title={row.revenda}>{row.revenda}</p>
                  <p className="text-[10px] text-muted-foreground">{row.clientesAtivos} clientes ativos</p>
                </div>
                <div className="h-6 overflow-hidden rounded-[2px] bg-muted/70">
                  <div className="h-full min-w-1 rounded-[2px] bg-primary" style={{ width: `${Math.max(2, (row.taxaPor100 ?? 0) / maxRate * 100)}%` }} />
                </div>
                <span className="tnum text-right text-sm font-bold">{displayRate(row.taxaPor100)}</span>
                <span className="tnum text-right text-xs text-muted-foreground">{row.atendimentos} chamados</span>
              </div>
            ))}
          </div>
        </SectionCard>}

        <SectionCard
          eyebrow="Evolução mensal"
          title="Histórico da revenda selecionada"
          description="A taxa usa a carteira de cada competência. Meses sem carteira exibem um traço."
          action={(
            <Select value={selectedReseller} onValueChange={setSelectedReseller}>
              <SelectTrigger className="h-8 w-56 bg-background/70 text-xs">
                <SelectValue placeholder="Selecionar revenda" />
              </SelectTrigger>
              <SelectContent>
                {model.rows.map((row) => <SelectItem key={row.revenda} value={row.revenda}>{row.revenda}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          contentClassName="p-0"
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader><TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Competência</TableHead><TableHead>Clientes ativos</TableHead><TableHead>Atendimentos</TableHead><TableHead>Por 100</TableHead><TableHead>Clientes com contato</TableHead><TableHead>Alcance</TableHead><TableHead className="pr-6">CSAT normalizado</TableHead>
              </TableRow></TableHeader>
              <TableBody>{selectedHistory.map(({ competencia, row, scale }) => <TableRow key={competencia}>
                  <TableCell className="pl-6 font-medium">{competencia}</TableCell>
                  <TableCell className="tnum">{row?.clientesAtivos?.toLocaleString("pt-BR") ?? "—"}</TableCell>
                  <TableCell className="tnum">{row?.atendimentos.toLocaleString("pt-BR") ?? "—"}</TableCell>
                  <TableCell className="tnum">{displayRate(row?.taxaPor100 ?? null)}</TableCell>
                  <TableCell className="tnum">{row?.clientes ?? "—"}</TableCell>
                  <TableCell className="tnum">{row?.alcance == null ? "—" : `${fmtBR(row.alcance, 1)}%`}</TableCell>
                  <TableCell className="pr-6 tnum">{row?.avaliacaoMedia == null ? "—" : `${fmtBR(row.avaliacaoMedia / scale * 100, 1)}%`}</TableCell>
                </TableRow>)}</TableBody>
            </Table>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Comparação mensal"
          title="Rede de revendas por competência"
          description="Comparação da demanda relativa, preservando o denominador mensal."
          contentClassName="p-0"
        >
          <div className="overflow-x-auto"><Table className="min-w-[760px]">
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Competência</TableHead><TableHead>Clientes ativos</TableHead><TableHead>Atendimentos</TableHead><TableHead>Por 100</TableHead><TableHead>Maior taxa</TableHead><TableHead className="pr-6">CSAT normalizado</TableHead>
            </TableRow></TableHeader>
            <TableBody>{monthlyOverview.map((row) => <TableRow key={row.competencia}>
              <TableCell className="pl-6 font-medium">{row.competencia}</TableCell><TableCell className="tnum">{row.active || "—"}</TableCell><TableCell className="tnum">{row.total.toLocaleString("pt-BR")}</TableCell><TableCell className="tnum">{displayRate(row.rate)}</TableCell><TableCell>{row.leader}</TableCell><TableCell className="pr-6 tnum">{row.csatPercent == null ? "—" : `${fmtBR(row.csatPercent, 1)}%`}</TableCell>
            </TableRow>)}</TableBody>
          </Table></div>
        </SectionCard>

        <SectionCard
          eyebrow="Exploração"
          title="Detalhamento das revendas"
          description={model.elevatedCut == null ? "Sem carteira para calcular taxas proporcionais." : `Demanda elevada a partir de ${fmtBR(model.elevatedCut, 1)} chamados por 100 clientes; corte relativo ao mês.`}
          action={<div className="flex gap-2">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar revenda" className="h-8 w-44 bg-background/70 text-xs" />
            <Select value={signal} onValueChange={(value) => setSignal(value as typeof signal)}>
              <SelectTrigger className="h-8 w-40 bg-background/70 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{["Todas", "Demanda elevada", "Acompanhar", "Regular", "Sem carteira"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
            </Select>
          </div>}
          contentClassName="p-0"
        >
          <div className="overflow-x-auto"><Table className="min-w-[1100px]">
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">#</TableHead><TableHead>Revenda</TableHead><TableHead>Clientes ativos</TableHead><TableHead>Assinaturas</TableHead><TableHead>Atendimentos</TableHead><TableHead>Por 100</TableHead><TableHead>Clientes com contato</TableHead><TableHead>Alcance</TableHead><TableHead>CSAT</TableHead><TableHead className="pr-6">Sinal</TableHead>
            </TableRow></TableHeader>
            <TableBody>{filtered.map((row) => <TableRow key={row.revenda}>
              <TableCell className="pl-6 mono text-muted-foreground">{String(row.rank).padStart(2, "0")}</TableCell><TableCell className="font-medium">{row.revenda}</TableCell>
              <TableCell className="tnum">{row.clientesAtivos?.toLocaleString("pt-BR") ?? "—"}</TableCell>
              <TableCell className="tnum">{row.assinaturasAtivas?.toLocaleString("pt-BR") ?? "—"}</TableCell>
              <TableCell className="tnum">{row.atendimentos.toLocaleString("pt-BR")}</TableCell>
              <TableCell className="tnum font-semibold">{displayRate(row.taxaPor100)}</TableCell>
              <TableCell className="tnum">{row.clientes}</TableCell>
              <TableCell className="tnum">{row.alcance == null ? "—" : `${fmtBR(row.alcance, 1)}%`}</TableCell>
              <TableCell className="tnum">{row.avaliacaoMedia == null ? "—" : fmtBR(row.avaliacaoMedia, 2)}</TableCell>
              <TableCell className="pr-6"><span className={cn("rounded-sm border px-2 py-1 text-[10px] font-bold", tone(row.signal))}>{row.signal}</span></TableCell>
            </TableRow>)}</TableBody>
          </Table></div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
