import type { CompetenceSnapshot, ResellerSummary } from "@/lib/validation-engine";

export type DemandSignal = "Demanda elevada" | "Acompanhar" | "Regular" | "Sem carteira";

export interface ResellerIntelligenceRow extends ResellerSummary {
  rank: number;
  share: number;
  clientesAtivos: number | null;
  assinaturasAtivas: number | null;
  taxaPor100: number | null;
  alcance: number | null;
  signal: DemandSignal;
}

function percentile(values: number[], ratio: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * ratio;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function buildResellerIntelligence(snapshot: CompetenceSnapshot | null) {
  const tickets = snapshot?.revendas ?? [];
  const portfolio = snapshot?.carteira ?? [];
  const byReseller = new Map(tickets.map((row) => [row.revenda, row]));
  const byPortfolio = new Map(portfolio.map((row) => [row.revenda, row]));
  const names = new Set([...byReseller.keys(), ...byPortfolio.keys()]);
  const total = tickets.reduce((sum, row) => sum + row.atendimentos, 0);
  const rows: ResellerIntelligenceRow[] = [...names].map((name) => {
    const record = byReseller.get(name);
    const clients = byPortfolio.get(name)?.clientesAtivos ?? null;
    const subscriptions = byPortfolio.get(name)?.assinaturasAtivas ?? null;
    return {
      revenda: name,
      atendimentos: record?.atendimentos ?? 0,
      clientes: record?.clientes ?? 0,
      atendentes: record?.atendentes ?? 0,
      diasAtivos: record?.diasAtivos ?? 0,
      avaliacaoMedia: record?.avaliacaoMedia ?? null,
      avaliacoes: record?.avaliacoes ?? 0,
      coberturaAvaliacao: record?.coberturaAvaliacao ?? 0,
      tmaMedioMin: record?.tmaMedioMin ?? null,
      rank: 0,
      share: total ? (record?.atendimentos ?? 0) / total * 100 : 0,
      clientesAtivos: clients,
      assinaturasAtivas: subscriptions,
      taxaPor100: clients ? (record?.atendimentos ?? 0) / clients * 100 : null,
      alcance: clients ? (record?.clientes ?? 0) / clients * 100 : null,
      signal: "Sem carteira",
    };
  });
  const rates = rows.flatMap((row) => row.taxaPor100 == null ? [] : [row.taxaPor100]);
  const elevatedCut = percentile(rates, 0.9);
  const attentionCut = percentile(rates, 0.75);
  for (const row of rows) {
    row.signal = row.taxaPor100 == null ? "Sem carteira"
      : row.atendimentos > 0 && row.taxaPor100 >= elevatedCut ? "Demanda elevada"
        : row.atendimentos > 0 && row.taxaPor100 >= attentionCut ? "Acompanhar" : "Regular";
  }
  rows.sort((a, b) => {
    if (a.taxaPor100 == null && b.taxaPor100 != null) return 1;
    if (b.taxaPor100 == null && a.taxaPor100 != null) return -1;
    return (b.taxaPor100 ?? b.atendimentos) - (a.taxaPor100 ?? a.atendimentos)
      || b.atendimentos - a.atendimentos || a.revenda.localeCompare(b.revenda);
  });
  rows.forEach((row, index) => { row.rank = index + 1; });

  const totalActiveClients = portfolio.reduce((sum, row) => sum + row.clientesAtivos, 0);
  const totalSubscriptions = portfolio.reduce((sum, row) => sum + row.assinaturasAtivas, 0);
  const reachedClients = tickets.reduce((sum, row) => sum + row.clientes, 0);
  const evaluations = tickets.reduce((sum, row) => sum + row.avaliacoes, 0);
  const weightedCsat = evaluations
    ? tickets.reduce((sum, row) => sum + (row.avaliacaoMedia ?? 0) * row.avaliacoes, 0) / evaluations
    : null;
  return {
    rows, total, totalActiveClients, totalSubscriptions, reachedClients, weightedCsat,
    overallRate: totalActiveClients ? total / totalActiveClients * 100 : null,
    overallReach: totalActiveClients ? reachedClients / totalActiveClients * 100 : null,
    elevatedCut: rates.length ? elevatedCut : null,
    attentionCut: rates.length ? attentionCut : null,
    topReseller: rows.find((row) => row.taxaPor100 != null && row.atendimentos > 0) ?? null,
    hasPortfolio: portfolio.length > 0,
  };
}
