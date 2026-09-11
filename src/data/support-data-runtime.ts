import * as demo from "@/data/support-data";
import { loadSnapshots, selectedCompetence } from "@/lib/dashboard-store";
import { META_ELEGIBILIDADE } from "@/lib/validation-engine";
import type { CompetenceSnapshot, RankingRecord } from "@/lib/validation-engine";

export type Situacao = demo.Situacao;
export type Prioridade = demo.Prioridade;
export type Employee = demo.Employee;
export type MonthlyClosure = demo.MonthlyClosure;
export type ActionItem = demo.ActionItem;
export type IndividualComparison = demo.IndividualComparison;
export type VersionedRule = demo.VersionedRule;
export type WeeklyHeatRow = demo.WeeklyHeatRow;
export type OperationalMonth = demo.OperationalMonth;

const snapshots = loadSnapshots();
const selectedKey = selectedCompetence();
const current = snapshots.find((item) => item.competencia === selectedKey) ?? snapshots.at(-1);
const currentIndex = current ? snapshots.findIndex((item) => item.competencia === current.competencia) : -1;
const previous = currentIndex > 0 ? snapshots[currentIndex - 1] : undefined;

export const hasOperationalData = Boolean(current);
export const operationalSnapshots = snapshots;
export const currentSnapshot = current ?? null;

const average = (values: number[]): number => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
const median = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const percentile = (values: number[], ratio: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * ratio;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};
const fmt = (value: number, digits = 2): string => value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const intFmt = (value: number): string => value.toLocaleString("pt-BR");
const statusOf = (row: RankingRecord): Situacao => row.premiado ? "Premiado" : row.elegivel ? "Elegível — fora do Top 3" : "Abaixo da meta";

function makeEmployees(snapshot: CompetenceSnapshot): Employee[] {
  return snapshot.ranking.map((row) => ({
    id: row.id,
    name: row.atendente,
    rank: row.rank,
    note: row.notaFinal,
    volume: row.atendimentos,
    ptsQuantidade: row.pontosQuantidade,
    csat: row.avaliacaoMedia ?? 0,
    cobertura: row.coberturaAvaliacao,
    ptsAvaliacao: row.pontosAvaliacao,
    avaliacoes: row.avaliacoes,
    distanciaMeta: row.elegivel ? null : Math.max(0, snapshot.config.notaMinima - row.notaFinal),
    situacao: statusOf(row),
    automáticos: row.automaticos,
    tmaMediano: row.tmaMedianoMin ?? 0,
    tmaP90: row.tmaP90Min ?? 0,
  }));
}

export const employees: Employee[] = current ? makeEmployees(current) : demo.employees;

function closure(snapshot: CompetenceSnapshot): MonthlyClosure {
  const notes = snapshot.ranking.map((row) => row.notaFinal);
  const eligible = snapshot.ranking.filter((row) => row.elegivel).length;
  return {
    competencia: snapshot.competenciaBr,
    status: current?.competencia === snapshot.competencia ? "ATUAL" : "FECHAMENTO",
    indice: average(notes),
    mediana: median(notes),
    lideranca: Math.max(0, ...notes),
    elegiveis: `${eligible} de ${snapshot.ranking.length}`,
    premiados: snapshot.ranking.filter((row) => row.premiado).length,
    nota: snapshot.config.perfilRegra,
    tag: current?.competencia === snapshot.competencia ? "Competência selecionada" : "Histórico validado",
  };
}

export const monthlyClosures: MonthlyClosure[] = current ? snapshots.map(closure) : demo.monthlyClosures;

export const competencia = current ? {
  label: current.competenciaBr,
  anterior: previous?.competenciaBr ?? "sem histórico anterior",
  fonte: current.origem,
  atualizadoEm: new Date(current.processadoEm).toLocaleString("pt-BR"),
  regra: current.config.perfilRegra,
  meta: current.config.notaMinima,
  teto: current.config.pontuacaoTempoTmaFixa
    ? current.config.pesoQuantidade + current.config.pesoAvaliacao + 31.5
    : current.config.pesoQuantidade + current.config.pesoTempo + current.config.pesoTma + current.config.pesoAvaliacao,
  baseFixa: current.config.pontuacaoTempoTmaFixa ? 31.5 : 0,
  pesoQuantidade: current.config.pesoQuantidade,
  pesoAvaliacao: current.config.pesoAvaliacao,
} : demo.competencia;

const noteTrend = monthlyClosures.map((item) => item.indice);
const eligibleTrend = monthlyClosures.map((item) => Number(item.elegiveis.split(" ")[0]));
const currentNotes = employees.map((item) => item.note);
const validCount = current?.validos.length ?? 0;
const excludedCount = current?.excluidos.length ?? 0;
const importedCount = current?.totalLinhas ?? 0;
const eligibleCount = employees.filter((item) => item.situacao !== "Abaixo da meta").length;
const awardedCount = employees.filter((item) => item.situacao === "Premiado").length;
const evaluationCount = current?.ranking.reduce((sum, row) => sum + row.avaliacoes, 0) ?? 0;
const weightedCsat = current && evaluationCount
  ? current.ranking.reduce((sum, row) => sum + (row.avaliacaoMedia ?? 0) * row.avaliacoes, 0) / evaluationCount
  : 0;
const coverage = validCount ? (evaluationCount / validCount) * 100 : 0;
const ceiling = competencia.teto;

export const resultado = current ? {
  titulo: `Top 3 definido; ${eligibleCount} de ${employees.length} atingiram o corte`,
  descricao: `${awardedCount} profissionais ocupam as posições premiadas. O índice médio fechou em ${fmt(average(currentNotes))} de ${fmt(ceiling)} pontos possíveis.`,
  kpis: [
    { label: "Nota média", value: fmt(average(currentNotes)), hint: `teto efetivo ${fmt(ceiling)}`, icon: "gauge", trend: noteTrend },
    { label: "Mediana", value: fmt(median(currentNotes)), hint: "centro das notas", icon: "medal", trend: monthlyClosures.map((item) => item.mediana) },
    { label: "Elegíveis", value: String(eligibleCount), hint: `nota a partir de ${fmt(META_ELEGIBILIDADE, 0)}`, icon: "check", trend: eligibleTrend },
    { label: "Premiados", value: String(awardedCount), hint: `${awardedCount} de ${eligibleCount} elegíveis`, icon: "trophy", trend: monthlyClosures.map((item) => item.premiados) },
    { label: "Base validada", value: `${fmt(importedCount ? (validCount / importedCount) * 100 : 0, 1)}%`, hint: `${fmt(importedCount ? (excludedCount / importedCount) * 100 : 0, 1)}% excluída`, icon: "shield" },
    { label: "Cobertura CSAT", value: `${fmt(coverage, 1)}%`, hint: `média ponderada ${fmt(weightedCsat)}`, icon: "star", trend: snapshots.map((snapshot) => snapshot.validos.length ? snapshot.ranking.reduce((sum, row) => sum + row.avaliacoes, 0) / snapshot.validos.length * 100 : 0) },
  ],
} : demo.resultado;

function focusFor(row: RankingRecord, snapshot: CompetenceSnapshot): { label: string; gap: number } {
  const criteria = [
    { label: "Quantidade", gap: snapshot.config.pesoQuantidade - row.pontosQuantidade },
    { label: "Avaliação", gap: snapshot.config.pesoAvaliacao - row.pontosAvaliacao },
  ];
  if (!snapshot.config.pontuacaoTempoTmaFixa) {
    criteria.push(
      { label: "Tempo Total", gap: snapshot.config.pesoTempo - row.pontosTempo },
      { label: "TMA", gap: snapshot.config.pesoTma - row.pontosTma },
    );
  }
  return criteria.sort((a, b) => b.gap - a.gap)[0];
}

const thirdNote = employees[2]?.note ?? employees.at(-1)?.note ?? 0;
const priorityOrder: Record<Prioridade, number> = { Alta: 0, Média: 1, Monitorar: 2 };

export const actionPlan: ActionItem[] = current ? current.ranking.map((row) => {
  const focus = focusFor(row, current);
  const situacao = statusOf(row);
  const gap = row.elegivel ? Math.max(0, thirdNote - row.notaFinal) : Math.max(0, current.config.notaMinima - row.notaFinal);
  const objective = row.premiado
    ? `Sustentar nota ≥ ${fmt(current.config.notaMinima, 0)} e posição no Top 3`
    : row.elegivel
      ? `Recuperar ${fmt(gap)} ponto(s) para a referência atual do Top 3`
      : `Recuperar ${fmt(gap)} ponto(s) para a meta`;
  return {
    prioridade: row.premiado ? "Monitorar" : row.elegivel ? "Média" : "Alta",
    nome: row.atendente,
    ranking: `${row.rank}º no ranking`,
    nota: row.notaFinal,
    situacao,
    evidencia: focus.label,
    detalheEvidencia: objective,
    acao: focus.label === "Quantidade"
      ? `Usar ${Math.ceil(row.atendimentos * 1.05)} atendimentos como referência, preservando a qualidade`
      : focus.label === "Avaliação" && row.avaliacaoMedia != null
        ? "Acompanhar a avaliação e a cobertura das respostas, sem reduzir o volume"
        : `Acompanhar semanalmente o indicador ${focus.label}`,
  };
}).sort((a, b) => priorityOrder[a.prioridade] - priorityOrder[b.prioridade]) : demo.actionPlan;

export const individualComparisons: IndividualComparison[] = current ? current.ranking.map((row) => {
  const before = previous?.ranking.find((item) => item.atendente === row.atendente);
  return {
    nome: row.atendente,
    rankAtual: row.rank,
    deltaRank: before ? before.rank - row.rank : 0,
    nota: row.notaFinal,
    deltaNota: before ? row.notaFinal - before.notaFinal : 0,
    volume: row.atendimentos,
    deltaVolume: before ? row.atendimentos - before.atendimentos : 0,
    avaliacao: row.avaliacaoMedia ?? 0,
    deltaAvaliacao: before && row.avaliacaoMedia != null && before.avaliacaoMedia != null ? row.avaliacaoMedia - before.avaliacaoMedia : 0,
  };
}) : demo.individualComparisons;

const components = current ? [
  { label: "Quantidade", field: "pontosQuantidade" as const, max: current.config.pesoQuantidade, protected: false },
  { label: "Tempo Total", field: "pontosTempo" as const, max: current.config.pesoTempo, protected: current.config.pontuacaoTempoTmaFixa },
  { label: "TMA", field: "pontosTma" as const, max: current.config.pesoTma, protected: current.config.pontuacaoTempoTmaFixa },
  { label: "Avaliação", field: "pontosAvaliacao" as const, max: current.config.pesoAvaliacao, protected: false },
] : [];
export const scoreComposition = current ? components.map((item) => {
  const obtained = average(current.ranking.map((row) => row[item.field]));
  return {
    tipo: item.protected ? "Base comum" : "Critério variável",
    label: item.label,
    obtido: obtained,
    maximo: item.max,
    percentual: item.max ? (obtained / item.max) * 100 : 0,
    descricao: item.protected ? "Mesma pontuação para todos; não altera a posição." : `${fmt(Math.max(0, item.max - obtained))} ponto(s) médios ainda disponíveis.`,
  };
}) : demo.scoreComposition;
const variableComposition = scoreComposition.filter((item) => item.tipo !== "Base comum").sort((a, b) => (b.maximo - b.obtido) - (a.maximo - a.obtido));
export const principalAlavanca = current && variableComposition[0] ? {
  label: variableComposition[0].label,
  descricao: `É o componente variável com maior distância média para o máximo: ${fmt(variableComposition[0].maximo - variableComposition[0].obtido)} pontos.`,
} : demo.principalAlavanca;

export const gestorLeituras = current ? [
  { numero: "01", titulo: "Resultado", destaque: `${awardedCount} premiados entre ${eligibleCount} elegíveis`, detalhe: `${Math.max(0, eligibleCount - awardedCount)} elegível(is) fora das posições premiadas.` },
  { numero: "02", titulo: "Atenção", destaque: `${employees.length - eligibleCount} abaixo da meta`, detalhe: actionPlan[0]?.detalheEvidencia ?? "Toda a equipe atingiu a meta." },
  { numero: "03", titulo: "Próxima ação", destaque: `Atuar sobre ${principalAlavanca.label.toLowerCase()}`, detalhe: principalAlavanca.descricao },
] : demo.gestorLeituras;

export const selectedRule = current ? [
  { label: "Escopo", value: "Suporte · atendimentos finalizados" },
  { label: "Período", value: current.config.incluirForaExpediente ? "Período integral preservado pela regra" : "Segunda a sábado · 08:00–19:59" },
  { label: "Duração máxima", value: `${fmt(current.config.maxHoras, 0)} horas no máximo` },
  { label: "Finalizados automáticos", value: current.config.incluirFinalizadosAutomaticamente ? "Incluídos; duração artificial sem impacto em Tempo/TMA" : "Submetidos às regras regulares" },
  { label: "Elegibilidade", value: `Nota final ≥ ${fmt(current.config.notaMinima)}` },
  { label: "Premiação", value: "Somente os três maiores elegíveis" },
  { label: "Desempate", value: "Nota, quantidade e avaliação" },
] : demo.selectedRule;
export const versionedRules = demo.versionedRules;
export const validationGroups = demo.validationGroups;
export const engineeringSteps = demo.engineeringSteps;

const timedRecords = current?.validos.filter((row) => row.duracaoConsiderada) ?? [];
const timedMinutes = timedRecords.map((row) => row.tmaMinutos);
const exceptions = current?.excluidos.filter((row) => row.motivoCodigo === "ACIMA_H").length ?? 0;
const previousValid = previous?.validos.length ?? null;
export const operationalKpis = current ? [
  { label: "Base observada", value: intFmt(validCount + exceptions), hint: "premiável + exceções", icon: "database" },
  { label: "Variação mensal", value: previousValid == null ? "—" : `${validCount - previousValid >= 0 ? "+" : ""}${intFmt(validCount - previousValid)}`, hint: "contra o mês anterior", icon: "trend" },
  { label: "TMA mediano", value: `${fmt(median(timedMinutes), 1)} min`, hint: "tempo típico", icon: "timer" },
  { label: "TMA P90", value: `${fmt(percentile(timedMinutes, 0.9), 1)} min`, hint: "cauda dos casos longos", icon: "clock" },
  { label: "CSAT médio", value: fmt(weightedCsat), hint: `escala de 0 a ${fmt(current.config.escalaAvaliacaoMax, 0)}`, icon: "star" },
  { label: "Cobertura CSAT", value: `${fmt(coverage, 1)}%`, hint: "avaliações válidas", icon: "percent" },
] : demo.operationalKpis;

export const baseReconciliation = current ? {
  premiável: { value: intFmt(validCount), label: "Base premiável", hint: "entra no ranking" },
  excecao: { value: `+${intFmt(exceptions)}`, label: "Exceção operacional", hint: `acima de ${fmt(current.config.maxHoras, 0)} horas` },
  observada: { value: intFmt(validCount + exceptions), label: "Base observada", hint: "demanda analisada" },
  legendas: ["Importados", "Falhas de qualidade", "Fora do escopo", "Automáticos incluídos"],
} : demo.baseReconciliation;

export const hourlyDistribution = current ? Array.from({ length: 12 }, (_, index) => {
  const hour = index + 8;
  return { hora: `${String(hour).padStart(2, "0")}h`, total: current.validos.filter((row) => new Date(row.inicio).getHours() === hour).length };
}) : demo.hourlyDistribution;
export const heatDayKeys = demo.heatDayKeys;
export const heatDayLabels = demo.heatDayLabels;
export const weeklyHeatmap: WeeklyHeatRow[] = current ? hourlyDistribution.map((hour) => {
  const hourNumber = Number(hour.hora.slice(0, 2));
  const counts = [1, 2, 3, 4, 5, 6].map((day) => current.validos.filter((row) => {
    const start = new Date(row.inicio);
    return start.getDay() === day && start.getHours() === hourNumber;
  }).length);
  return { hora: hour.hora, seg: counts[0], ter: counts[1], qua: counts[2], qui: counts[3], sex: counts[4], sab: counts[5] };
}) : demo.weeklyHeatmap;

export const operationalMonths: OperationalMonth[] = current ? snapshots.map((snapshot) => {
  const regular = snapshot.validos.filter((row) => row.duracaoConsiderada).map((row) => row.tmaMinutos);
  const evaluated = snapshot.ranking.reduce((sum, row) => sum + row.avaliacoes, 0);
  const csat = evaluated ? snapshot.ranking.reduce((sum, row) => sum + (row.avaliacaoMedia ?? 0) * row.avaliacoes, 0) / evaluated : null;
  return {
    competencia: snapshot.competenciaBr,
    volume: snapshot.validos.length,
    tmaMediano: regular.length ? median(regular) : null,
    tmaP90: regular.length ? percentile(regular, 0.9) : null,
    csat,
    cobertura: snapshot.validos.length ? (evaluated / snapshot.validos.length) * 100 : null,
    validade: snapshot.competencia === current.competencia ? "Atual" : "Validado",
  };
}) : demo.operationalMonths;

const leader = current?.ranking[0];
export const premiacaoResumo = current ? [
  { label: "Base premiável", value: intFmt(validCount), hint: `${fmt(importedCount ? validCount / importedCount * 100 : 0, 1)}% da base importada`, icon: "database" },
  { label: "Excluídos", value: intFmt(excludedCount), hint: `${fmt(importedCount ? excludedCount / importedCount * 100 : 0, 1)}% dos registros analisados`, icon: "x" },
  { label: "Líder", value: leader?.atendente ?? "—", hint: "1ª posição oficial", icon: "flag" },
  { label: "Nota do líder", value: fmt(leader?.notaFinal ?? 0), hint: `de ${fmt(ceiling)} pontos possíveis`, icon: "gauge" },
  { label: "Premiados", value: String(awardedCount), hint: `${awardedCount} de ${eligibleCount} elegíveis`, icon: "trophy" },
  { label: "Automáticos incluídos", value: intFmt(current.estatisticas.AUTOMATICOS_VALIDOS ?? 0), hint: "mantidos e rastreáveis", icon: "bot" },
] : demo.premiacaoResumo;
export const leaderBreakdown = current && leader ? [
  { label: current.config.pontuacaoTempoTmaFixa ? "Base fixa" : "Tempo + TMA", value: fmt(leader.pontosTempo + leader.pontosTma), hint: current.config.pontuacaoTempoTmaFixa ? "Tempo + TMA iguais para a equipe" : "componentes operacionais", color: "muted" as const },
  { label: "Quantidade", value: fmt(leader.pontosQuantidade), hint: `${leader.atendimentos} atendimentos válidos`, color: "primary" as const },
  { label: "Avaliação", value: fmt(leader.pontosAvaliacao), hint: `CSAT ${fmt(leader.avaliacaoMedia ?? 0)}`, color: "primary" as const },
] : demo.leaderBreakdown;
export const leaderTotal = current && leader ? { label: "Índice final", value: fmt(leader.notaFinal), hint: `${fmt(ceiling ? leader.notaFinal / ceiling * 100 : 0, 1)}% do teto efetivo` } : demo.leaderTotal;

const allAttendants = [...new Set(snapshots.flatMap((snapshot) => snapshot.ranking.map((row) => row.atendente)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
export const historySeries = current ? allAttendants.map((name) => ({
  nome: name,
  pontos: snapshots.map((snapshot) => ({ competencia: snapshot.competenciaBr, nota: snapshot.ranking.find((row) => row.atendente === name)?.notaFinal ?? null })),
})) : demo.historySeries;
export const monthlyResults = current ? monthlyClosures.map((item) => ({
  competencia: item.competencia,
  indice: item.indice,
  mediana: item.mediana,
  lideranca: item.lideranca,
  elegiveis: item.elegiveis,
  premiados: item.premiados,
  situacao: item.status,
})) : demo.monthlyResults;

export const auditSummary = current ? [
  { label: "Base importada", value: intFmt(importedCount), hint: "registros analisados", icon: "upload" },
  { label: "Base premiável", value: intFmt(validCount), hint: `${fmt(importedCount ? validCount / importedCount * 100 : 0, 1)}% aproveitamento`, icon: "check" },
  { label: "Excluídos", value: intFmt(excludedCount), hint: `${fmt(importedCount ? excludedCount / importedCount * 100 : 0, 1)}% da base`, icon: "x" },
  { label: "Automáticos incluídos", value: intFmt(current.estatisticas.AUTOMATICOS_VALIDOS ?? 0), hint: "mantidos e rastreáveis", icon: "bot" },
] : demo.auditSummary;
export const auditLog = current ? Object.entries(current.excluidos.reduce<Record<string, number>>((acc, item) => {
  acc[item.motivo] = (acc[item.motivo] ?? 0) + 1;
  return acc;
}, {})).sort((a, b) => b[1] - a[1]).map(([motivo, quantidade]) => ({ motivo, quantidade, percentual: `${fmt(excludedCount ? quantidade / excludedCount * 100 : 0, 1)}%` })) : demo.auditLog;
export const rastreabilidade = demo.rastreabilidade;
export const saidasProcesso = demo.saidasProcesso;

export function activeSnapshot(): CompetenceSnapshot | null {
  return current ?? null;
}
