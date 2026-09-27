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
import type { ResellerSummary } from "@/lib/validation-engine";
import { cn } from "@/lib/utils";

type DemandSignal = "Crítica" | "Atenção" | "Regular";

interface ResellerRow extends ResellerSummary {
  rank: number;
  share: number;
  signal: DemandSignal;
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

function tone(signal: DemandSignal): string {
  if (signal === "Crítica") return "border-danger/35 bg-danger-soft text-danger";
  if (signal === "Atenção") return "border-warning/35 bg-warning-soft text-warning";
  return "border-primary/25 bg-primary-soft/60 text-primary";
}

export default function RevendasPage() {
  const [search, setSearch] = useState("");
  const [signal, setSignal] = useState<"Todas" | DemandSignal>("Todas");
  const [selectedReseller, setSelectedReseller] = useState<string>(
    currentSnapshot?.revendas?.[0]?.revenda ?? "",
  );

  const model = useMemo(() => {
    const source = currentSnapshot?.revendas ?? [];
    const total = source.reduce((sum, row) => sum + row.atendimentos, 0);
    const volumes = source.map((row) => row.atendimentos);
    const criticalCut = Math.ceil(percentile(volumes, 0.9));
    const attentionCut = Math.ceil(percentile(volumes, 0.75));
    const rows: ResellerRow[] = source
      .map((row, index) => ({
        ...row,
        rank: index + 1,
        share: total ? row.atendimentos / total * 100 : 0,
        signal: row.atendimentos >= criticalCut
          ? "Crítica" as const
          : row.atendimentos >= attentionCut
            ? "Atenção" as const
            : "Regular" as const,
      }));
    const evaluations = rows.reduce((sum, row) => sum + row.avaliacoes, 0);
    const weightedCsat = evaluations
      ? rows.reduce((sum, row) => sum + (row.avaliacaoMedia ?? 0) * row.avaliacoes, 0) / evaluations
      : 0;
    const topFive = rows.slice(0, 5).reduce((sum, row) => sum + row.atendimentos, 0);
    const uniqueClients = new Set(
      currentSnapshot?.validos
        .map((record) => record.cliente?.trim())
        .filter(Boolean),
    ).size;
    return {
      rows,
      total,
      criticalCut,
      attentionCut,
      weightedCsat,
      topFiveShare: total ? topFive / total * 100 : 0,
      averageVolume: rows.length ? total / rows.length : 0,
      uniqueClients,
    };
  }, []);

  const filtered = model.rows.filter((row) => {
    const matchesSearch = row.revenda.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
    return matchesSearch && (signal === "Todas" || row.signal === signal);
  });
  const maxVolume = model.rows[0]?.atendimentos ?? 1;
  const selectedHistory = operationalSnapshots.map((snapshot) => {
    const row = snapshot.revendas?.find((item) => item.revenda === selectedReseller);
    return { competencia: snapshot.competenciaBr, row };
  });
  const monthlyOverview = operationalSnapshots.map((snapshot) => {
    const rows = snapshot.revendas ?? [];
    const total = rows.reduce((sum, row) => sum + row.atendimentos, 0);
    const evaluations = rows.reduce((sum, row) => sum + row.avaliacoes, 0);
    return {
      competencia: snapshot.competenciaBr,
      total,
      active: rows.length,
      leader: rows[0]?.revenda ?? "—",
      leaderShare: total && rows[0] ? rows[0].atendimentos / total * 100 : 0,
      csat: evaluations
        ? rows.reduce((sum, row) => sum + (row.avaliacaoMedia ?? 0) * row.avaliacoes, 0) / evaluations
        : null,
    };
  });

  if (!currentSnapshot || !model.rows.length) {
    return (
      <AppShell breadcrumb="Rede de atendimento" title="Revendas">
        <SectionCard
          eyebrow="Base necessária"
          title="Importe uma competência com a coluna Revenda"
          description="O painel será formado a partir dos atendimentos vinculados a cada parceiro comercial."
        >
          <p className="text-sm text-muted-foreground">Nenhum atendimento com revenda está disponível.</p>
        </SectionCard>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumb="Rede de atendimento" title="Revendas">
      <div className="animate-fade-in-up space-y-5">
        <div className="rounded-sm border border-primary/30 bg-primary/5 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Demonstração pública:</span>{" "}
          revendas, empresas, contatos e protocolos são fictícios. A classificação mede concentração de demanda, não qualidade contratual ou gravidade técnica.
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Revendas ativas" value={model.rows.length.toLocaleString("pt-BR")} hint="com atendimento na competência" tone="primary" />
          <KpiCard label="Atendimentos" value={model.total.toLocaleString("pt-BR")} hint="base válida vinculada" />
          <KpiCard label="Clientes" value={model.uniqueClients.toLocaleString("pt-BR")} hint="empresas distintas atendidas" />
          <KpiCard label="CSAT ponderado" value={fmtBR(model.weightedCsat, 2)} hint="ponderado pelo número de avaliações" tone="success" />
          <KpiCard label="Concentração Top 5" value={`${fmtBR(model.topFiveShare, 1)}%`} hint="participação das cinco maiores" tone="warning" />
        </div>

        <SectionCard
          eyebrow="Concentração da demanda"
          title="Revendas com maior volume de atendimentos"
          description="Comparação direta das doze revendas com maior participação na competência."
        >
          <div className="space-y-3">
            {model.rows.slice(0, 12).map((row) => (
              <div key={row.revenda} className="grid items-center gap-2 sm:grid-cols-[2rem_minmax(11rem,16rem)_1fr_5rem_5rem]">
                <span className="mono text-right text-[11px] text-muted-foreground">{String(row.rank).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" title={row.revenda}>{row.revenda}</p>
                  <p className="text-[10px] text-muted-foreground">{row.clientes} clientes · {row.atendentes} atendentes</p>
                </div>
                <div className="h-6 overflow-hidden rounded-[2px] bg-muted/70">
                  <div className="h-full min-w-1 rounded-[2px] bg-primary" style={{ width: `${Math.max(2, row.atendimentos / maxVolume * 100)}%` }} />
                </div>
                <span className="tnum text-right text-sm font-bold">{row.atendimentos.toLocaleString("pt-BR")}</span>
                <span className="tnum text-right text-xs text-muted-foreground">{fmtBR(row.share, 1)}%</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Evolução mensal"
          title="Histórico da revenda selecionada"
          description="Volume, clientes, tempo médio e satisfação ao longo das seis competências."
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
                <TableHead className="pl-6">Competência</TableHead><TableHead>Atendimentos</TableHead><TableHead>Clientes</TableHead><TableHead>Participação</TableHead><TableHead>TMA</TableHead><TableHead>CSAT</TableHead><TableHead className="pr-6">Cobertura</TableHead>
              </TableRow></TableHeader>
              <TableBody>{selectedHistory.map(({ competencia, row }) => {
                const month = operationalSnapshots.find((item) => item.competenciaBr === competencia);
                const monthTotal = month?.revendas?.reduce((sum, item) => sum + item.atendimentos, 0) ?? 0;
                return <TableRow key={competencia}>
                  <TableCell className="pl-6 font-medium">{competencia}</TableCell>
                  <TableCell className="tnum">{row?.atendimentos.toLocaleString("pt-BR") ?? "—"}</TableCell>
                  <TableCell className="tnum">{row?.clientes ?? "—"}</TableCell>
                  <TableCell className="tnum">{row && monthTotal ? `${fmtBR(row.atendimentos / monthTotal * 100, 1)}%` : "—"}</TableCell>
                  <TableCell className="tnum">{row?.tmaMedioMin != null ? `${fmtBR(row.tmaMedioMin, 1)} min` : "—"}</TableCell>
                  <TableCell className="tnum">{row?.avaliacaoMedia != null ? fmtBR(row.avaliacaoMedia, 2) : "—"}</TableCell>
                  <TableCell className="pr-6 tnum">{row ? `${fmtBR(row.coberturaAvaliacao, 1)}%` : "—"}</TableCell>
                </TableRow>;
              })}</TableBody>
            </Table>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Comparação mensal"
          title="Rede de revendas por competência"
          description="Visão consolidada do tamanho da rede, liderança e satisfação em cada mês."
          contentClassName="p-0"
        >
          <div className="overflow-x-auto"><Table className="min-w-[760px]">
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Competência</TableHead><TableHead>Atendimentos</TableHead><TableHead>Revendas ativas</TableHead><TableHead>Líder em volume</TableHead><TableHead>Participação da líder</TableHead><TableHead className="pr-6">CSAT</TableHead>
            </TableRow></TableHeader>
            <TableBody>{monthlyOverview.map((row) => <TableRow key={row.competencia}>
              <TableCell className="pl-6 font-medium">{row.competencia}</TableCell><TableCell className="tnum">{row.total.toLocaleString("pt-BR")}</TableCell><TableCell className="tnum">{row.active}</TableCell><TableCell>{row.leader}</TableCell><TableCell className="tnum">{fmtBR(row.leaderShare, 1)}%</TableCell><TableCell className="pr-6 tnum">{row.csat == null ? "—" : fmtBR(row.csat, 2)}</TableCell>
            </TableRow>)}</TableBody>
          </Table></div>
        </SectionCard>

        <SectionCard
          eyebrow="Exploração"
          title="Detalhamento das revendas"
          description={`Volume médio de ${fmtBR(model.averageVolume, 0)} atendimentos por revenda. Crítica a partir de ${model.criticalCut}; atenção a partir de ${model.attentionCut}.`}
          action={<div className="flex gap-2">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar revenda" className="h-8 w-44 bg-background/70 text-xs" />
            <Select value={signal} onValueChange={(value) => setSignal(value as typeof signal)}>
              <SelectTrigger className="h-8 w-32 bg-background/70 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{["Todas", "Crítica", "Atenção", "Regular"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
            </Select>
          </div>}
          contentClassName="p-0"
        >
          <div className="overflow-x-auto"><Table className="min-w-[1040px]">
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">#</TableHead><TableHead>Revenda</TableHead><TableHead>Atendimentos</TableHead><TableHead>Participação</TableHead><TableHead>Clientes</TableHead><TableHead>Dias ativos</TableHead><TableHead>TMA</TableHead><TableHead>CSAT</TableHead><TableHead>Cobertura</TableHead><TableHead className="pr-6">Sinal</TableHead>
            </TableRow></TableHeader>
            <TableBody>{filtered.map((row) => <TableRow key={row.revenda}>
              <TableCell className="pl-6 mono text-muted-foreground">{String(row.rank).padStart(2, "0")}</TableCell><TableCell className="font-medium">{row.revenda}</TableCell><TableCell className="tnum">{row.atendimentos.toLocaleString("pt-BR")}</TableCell><TableCell className="tnum">{fmtBR(row.share, 1)}%</TableCell><TableCell className="tnum">{row.clientes}</TableCell><TableCell className="tnum">{row.diasAtivos}</TableCell><TableCell className="tnum">{row.tmaMedioMin == null ? "—" : `${fmtBR(row.tmaMedioMin, 1)} min`}</TableCell><TableCell className="tnum">{row.avaliacaoMedia == null ? "—" : fmtBR(row.avaliacaoMedia, 2)}</TableCell><TableCell className="tnum">{fmtBR(row.coberturaAvaliacao, 1)}%</TableCell><TableCell className="pr-6"><span className={cn("rounded-sm border px-2 py-1 text-[10px] font-bold", tone(row.signal))}>{row.signal}</span></TableCell>
            </TableRow>)}</TableBody>
          </Table></div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
