// ---------------------------------------------------------------------------
// Dados sintéticos do dashboard "Performance do Suporte"
// Conteúdo extraído do site original (support-performance-analytics.vercel.app)
// e enriquecido com valores plausíveis para a demonstração visual.
// ---------------------------------------------------------------------------

export type Situacao =
  | "Premiado"
  | "Elegível — fora do Top 3"
  | "Abaixo da meta";

export type Prioridade = "Alta" | "Média" | "Monitorar";

// ----------------------------- Competência -------------------------------

export const competencia = {
  label: "08/2026",
  anterior: "07/2026",
  fonte: "atendimentos_sinteticos_2026-08.csv",
  atualizadoEm: "09/09/2026, 21:34",
  regra: "Novo modelo oficial — automáticos incluídos e Tempo/TMA fixos em 31,5",
  meta: 85,
  teto: 91.5,
  baseFixa: 31.5,
  pesoQuantidade: 20,
  pesoAvaliacao: 40,
};

// ------------------------------- Equipe ----------------------------------

export interface Employee {
  id: string;
  name: string;
  rank: number;
  note: number;
  volume: number;
  ptsQuantidade: number;
  csat: number;
  cobertura: number; // %
  ptsAvaliacao: number;
  avaliacoes: number;
  distanciaMeta: number | null; // null = meta atingida
  situacao: Situacao;
  automáticos: number;
  tmaMediano: number; // minutos (sintético)
  tmaP90: number; // minutos (sintético)
}

export const employees: Employee[] = [
  {
    id: "marina",
    name: "Marina Costa",
    rank: 1,
    note: 91.09,
    volume: 412,
    ptsQuantidade: 20.0,
    csat: 4.77,
    cobertura: 87.9,
    ptsAvaliacao: 39.59,
    avaliacoes: 362,
    distanciaMeta: null,
    situacao: "Premiado",
    automáticos: 8,
    tmaMediano: 2.9,
    tmaP90: 6.8,
  },
  {
    id: "lucas",
    name: "Lucas Rocha",
    rank: 2,
    note: 89.07,
    volume: 362,
    ptsQuantidade: 17.57,
    csat: 4.82,
    cobertura: 90.1,
    ptsAvaliacao: 40.0,
    avaliacoes: 326,
    distanciaMeta: null,
    situacao: "Premiado",
    automáticos: 7,
    tmaMediano: 3.1,
    tmaP90: 7.2,
  },
  {
    id: "camila",
    name: "Camila Alves",
    rank: 3,
    note: 87.81,
    volume: 351,
    ptsQuantidade: 17.04,
    csat: 4.73,
    cobertura: 88.6,
    ptsAvaliacao: 39.27,
    avaliacoes: 311,
    distanciaMeta: null,
    situacao: "Premiado",
    automáticos: 6,
    tmaMediano: 3.0,
    tmaP90: 7.0,
  },
  {
    id: "rafael",
    name: "Rafael Lima",
    rank: 4,
    note: 86.08,
    volume: 351,
    ptsQuantidade: 17.04,
    csat: 4.52,
    cobertura: 88.6,
    ptsAvaliacao: 37.54,
    avaliacoes: 311,
    distanciaMeta: null,
    situacao: "Elegível — fora do Top 3",
    automáticos: 6,
    tmaMediano: 3.4,
    tmaP90: 7.6,
  },
  {
    id: "juliana",
    name: "Juliana Melo",
    rank: 5,
    note: 83.14,
    volume: 304,
    ptsQuantidade: 14.76,
    csat: 4.44,
    cobertura: 89.8,
    ptsAvaliacao: 36.88,
    avaliacoes: 273,
    distanciaMeta: 1.86,
    situacao: "Abaixo da meta",
    automáticos: 5,
    tmaMediano: 3.2,
    tmaP90: 7.4,
  },
  {
    id: "bruno",
    name: "Bruno Souza",
    rank: 6,
    note: 81.34,
    volume: 292,
    ptsQuantidade: 14.17,
    csat: 4.29,
    cobertura: 86.6,
    ptsAvaliacao: 35.67,
    avaliacoes: 253,
    distanciaMeta: 3.66,
    situacao: "Abaixo da meta",
    automáticos: 4,
    tmaMediano: 3.5,
    tmaP90: 7.9,
  },
  {
    id: "diego",
    name: "Diego Santos",
    rank: 7,
    note: 78.98,
    volume: 278,
    ptsQuantidade: 13.5,
    csat: 4.09,
    cobertura: 87.8,
    ptsAvaliacao: 33.99,
    avaliacoes: 244,
    distanciaMeta: 6.02,
    situacao: "Abaixo da meta",
    automáticos: 4,
    tmaMediano: 3.7,
    tmaP90: 8.3,
  },
];

// ------------------------- Resultado da competência ------------------------

export const resultado = {
  titulo: "Top 3 definido; 4 de 7 atingiram o corte",
  descricao:
    "3 profissionais ocupam as posições premiadas e 3 ficaram abaixo de 85. O índice médio fechou em 85,36 de 91,50 possíveis; Quantidade é a principal alavanca observada.",
  kpis: [
    { label: "Nota média", value: "85,36", hint: "teto efetivo 91,50", icon: "gauge", trend: [87.52, 85.71, 85.36] },
    { label: "Mediana", value: "86,08", hint: "centro das notas", icon: "medal", trend: [86.54, 86.16, 86.08] },
    { label: "Elegíveis", value: "4", hint: "nota a partir de 85", icon: "check", trend: [5, 4, 4] },
    { label: "Premiados", value: "3", hint: "3 de 4 elegíveis", icon: "trophy", trend: [3, 3, 3] },
    { label: "Base validada", value: "94,9%", hint: "5,1% excluída da base", icon: "shield" },
    { label: "Cobertura CSAT", value: "88,5%", hint: "média ponderada 4,55", icon: "star", trend: [88.1, 88.5] },
  ],
};

// --------------------------- Leitura do gestor -----------------------------

export const gestorLeituras = [
  {
    numero: "01",
    titulo: "Resultado",
    destaque: "3 premiados entre 4 elegíveis",
    detalhe: "1 elegível fora das posições premiadas.",
  },
  {
    numero: "02",
    titulo: "Atenção",
    destaque: "3 abaixo da meta; 1 fora do Top 3",
    detalhe: "Juliana Melo: Recuperar 1,86 pontos para a meta.",
  },
  {
    numero: "03",
    titulo: "Próxima ação",
    destaque: "Atuar sobre quantidade",
    detalhe:
      "Usar 320 atendimentos como referência de curto prazo, preservando a qualidade.",
  },
];

// -------------------------- Comparação mensal -------------------------------

export interface MonthlyClosure {
  competencia: string;
  status: "ATUAL" | "FECHAMENTO";
  indice: number;
  mediana: number;
  lideranca: number;
  elegiveis: string;
  premiados: number;
  nota: string;
  tag?: string;
}

export const monthlyClosures: MonthlyClosure[] = [
  {
    competencia: "06/2026",
    status: "FECHAMENTO",
    indice: 87.52,
    mediana: 86.54,
    lideranca: 97.32,
    elegiveis: "5 de 7",
    premiados: 3,
    nota: "Novo modelo oficial — 9 horas",
    tag: "Primeira referência",
  },
  {
    competencia: "07/2026",
    status: "FECHAMENTO",
    indice: 85.71,
    mediana: 86.16,
    lideranca: 91.06,
    elegiveis: "4 de 7",
    premiados: 3,
    nota: "Julho/2026 validado — Tempo/TMA fixos em 31,5",
    tag: "Nova versão de regra",
  },
  {
    competencia: "08/2026",
    status: "ATUAL",
    indice: 85.36,
    mediana: 86.08,
    lideranca: 91.09,
    elegiveis: "4 de 7",
    premiados: 3,
    nota: "Novo modelo oficial — automáticos incluídos e Tempo/TMA fixos em 31,5",
    tag: "Nova versão de regra",
  },
];

// --------------------------- Composição da nota ------------------------------

export const scoreComposition = [
  {
    tipo: "Base comum",
    label: "Base fixa",
    obtido: 31.5,
    maximo: 31.5,
    percentual: 100.0,
    descricao: "Mesma pontuação para todos; não altera a posição.",
  },
  {
    tipo: "Critério variável",
    label: "Quantidade",
    obtido: 16.3,
    maximo: 20.0,
    percentual: 81.5,
    descricao: "3,70 ponto(s) médios ainda disponíveis.",
  },
  {
    tipo: "Critério variável",
    label: "Avaliação",
    obtido: 37.56,
    maximo: 40.0,
    percentual: 93.9,
    descricao: "2,44 ponto(s) médios ainda disponíveis.",
  },
];

export const principalAlavanca = {
  label: "Quantidade",
  descricao:
    "É o componente variável com maior distância média para o máximo: 3,70 pontos.",
};

// --------------------------- Plano de acompanhamento --------------------------

export interface ActionItem {
  prioridade: Prioridade;
  nome: string;
  ranking: string;
  nota: number;
  situacao: Situacao;
  evidencia: string;
  detalheEvidencia: string;
  acao: string;
}

export const actionPlan: ActionItem[] = [
  {
    prioridade: "Alta",
    nome: "Juliana Melo",
    ranking: "5º no ranking",
    nota: 83.14,
    situacao: "Abaixo da meta",
    evidencia: "Quantidade",
    detalheEvidencia: "Recuperar 1,86 pontos para a meta",
    acao: "Usar 320 atendimentos como referência de curto prazo, preservando a qualidade",
  },
  {
    prioridade: "Alta",
    nome: "Bruno Souza",
    ranking: "6º no ranking",
    nota: 81.34,
    situacao: "Abaixo da meta",
    evidencia: "Quantidade",
    detalheEvidencia: "Recuperar 3,66 pontos para a meta",
    acao: "Usar 307 atendimentos como referência de curto prazo, preservando a qualidade",
  },
  {
    prioridade: "Alta",
    nome: "Diego Santos",
    ranking: "7º no ranking",
    nota: 78.98,
    situacao: "Abaixo da meta",
    evidencia: "Quantidade",
    detalheEvidencia: "Recuperar 6,02 pontos para a meta",
    acao: "Usar 292 atendimentos como referência de curto prazo, preservando a qualidade",
  },
  {
    prioridade: "Média",
    nome: "Rafael Lima",
    ranking: "4º no ranking",
    nota: 86.08,
    situacao: "Elegível — fora do Top 3",
    evidencia: "Quantidade",
    detalheEvidencia: "Recuperar 1,73 pontos para a referência atual do Top 3",
    acao: "Usar 369 atendimentos como referência de curto prazo, preservando a qualidade",
  },
  {
    prioridade: "Monitorar",
    nome: "Marina Costa",
    ranking: "1º no ranking",
    nota: 91.09,
    situacao: "Premiado",
    evidencia: "Avaliação",
    detalheEvidencia: "Sustentar nota ≥ 85 e posição no Top 3",
    acao: "Usar avaliação média 4,82 como referência, sem reduzir o volume",
  },
  {
    prioridade: "Monitorar",
    nome: "Lucas Rocha",
    ranking: "2º no ranking",
    nota: 89.07,
    situacao: "Premiado",
    evidencia: "Quantidade",
    detalheEvidencia: "Sustentar nota ≥ 85 e posição no Top 3",
    acao: "Usar 381 atendimentos como referência de curto prazo, preservando a qualidade",
  },
  {
    prioridade: "Monitorar",
    nome: "Camila Alves",
    ranking: "3º no ranking",
    nota: 87.81,
    situacao: "Premiado",
    evidencia: "Quantidade",
    detalheEvidencia: "Sustentar nota ≥ 85 e posição no Top 3",
    acao: "Usar 369 atendimentos como referência de curto prazo, preservando a qualidade",
  },
];

// -------------------------- Comparação individual -----------------------------

export interface IndividualComparison {
  nome: string;
  rankAtual: number;
  deltaRank: number;
  nota: number;
  deltaNota: number;
  volume: number;
  deltaVolume: number;
  avaliacao: number;
  deltaAvaliacao: number;
}

export const individualComparisons: IndividualComparison[] = [
  { nome: "Marina Costa", rankAtual: 1, deltaRank: 0, nota: 91.09, deltaNota: 0.02, volume: 412, deltaVolume: 12, avaliacao: 4.77, deltaAvaliacao: 0.0 },
  { nome: "Lucas Rocha", rankAtual: 2, deltaRank: 0, nota: 89.07, deltaNota: -1.88, volume: 362, deltaVolume: -27, avaliacao: 4.82, deltaAvaliacao: 0.0 },
  { nome: "Camila Alves", rankAtual: 3, deltaRank: 0, nota: 87.81, deltaNota: 0.28, volume: 351, deltaVolume: 11, avaliacao: 4.73, deltaAvaliacao: 0.03 },
  { nome: "Rafael Lima", rankAtual: 4, deltaRank: 0, nota: 86.08, deltaNota: -0.08, volume: 351, deltaVolume: 10, avaliacao: 4.52, deltaAvaliacao: -0.01 },
  { nome: "Juliana Melo", rankAtual: 5, deltaRank: 0, nota: 83.14, deltaNota: -1.28, volume: 304, deltaVolume: -23, avaliacao: 4.44, deltaAvaliacao: 0.04 },
  { nome: "Bruno Souza", rankAtual: 6, deltaRank: 0, nota: 81.34, deltaNota: -0.02, volume: 292, deltaVolume: 9, avaliacao: 4.29, deltaAvaliacao: -0.0 },
  { nome: "Diego Santos", rankAtual: 7, deltaRank: 0, nota: 78.98, deltaNota: 0.52, volume: 278, deltaVolume: 9, avaliacao: 4.09, deltaAvaliacao: 0.06 },
];

// ------------------------------ Regras --------------------------------------

export const selectedRule = [
  { label: "Escopo", value: "Suporte · atendimentos finalizados" },
  { label: "Período", value: "Segunda a sábado · 08:00–19:59" },
  { label: "Duração máxima", value: "9 horas no máximo" },
  {
    label: "Finalizados automáticos",
    value: "Incluídos; duração artificial sem impacto em Tempo/TMA",
  },
  { label: "Elegibilidade", value: "Nota final ≥ 85,00" },
  { label: "Premiação", value: "Somente os três maiores elegíveis" },
  { label: "Desempate", value: "Nota, quantidade e avaliação" },
];

export interface VersionedRule {
  periodo: string;
  avaliacao: string;
  duracao: string;
  pesos: string;
  tratamento: string;
}

export const versionedRules: VersionedRule[] = [
  { periodo: "Até maio/2026", avaliacao: "0 a 10", duracao: "Até 8h", pesos: "30 / 15 / 25 / 30", tratamento: "Comparativo" },
  { periodo: "Junho/2026", avaliacao: "0 a 5", duracao: "Até 9h", pesos: "20 / 10 / 30 / 40", tratamento: "Comparativo" },
  { periodo: "Julho/2026", avaliacao: "0 a 5", duracao: "Neutralizada", pesos: "20 / 10 / 30 / 40", tratamento: "31,50 pontos fixos" },
  { periodo: "Agosto/2026 em diante", avaliacao: "0 a 5", duracao: "Até 9h", pesos: "20 / 10 / 30 / 40", tratamento: "31,50 pontos fixos" },
];

export const validationGroups = [
  {
    titulo: "Estrutura e qualidade",
    itens: [
      "Cabeçalho e colunas identificados automaticamente.",
      "Datas brasileiras, ISO e seriais do Excel são normalizadas.",
      "Início e fim precisam ser válidos; duração negativa é excluída.",
      "Protocolo vazio recebe o número da linha para rastreabilidade.",
      "Avaliação fora da escala não entra na média, mas não exclui o atendimento.",
    ],
  },
  {
    titulo: "Escopo da campanha",
    itens: [
      "Suporte pode constar em Filas, Setores ou campos de transferência.",
      "Atendente ausente ou informado como fora da campanha é excluído.",
      "Nomes completos e parciais são reconhecidos na lista de exclusão.",
      "O arquivo é bloqueado quando a maioria das datas pertence a outra competência.",
    ],
  },
  {
    titulo: "Período e automáticos",
    itens: [
      "Modelo padrão: segunda a sábado, das 08:00 às 19:59.",
      "Atendimentos regulares acima do limite da competência são excluídos.",
      "Fim às 06:00 ou 20+ encerramentos no mesmo minuto sinalizam automático.",
      "Automáticos válidos contam em Quantidade e Avaliação; sua duração não altera Tempo/TMA.",
    ],
  },
  {
    titulo: "Pontuação e resultado",
    itens: [
      "Os componentes são normalizados pelo melhor resultado da equipe.",
      "Quantidade, Tempo Total, TMA e Avaliação usam os pesos do mês.",
      "Quando protegidos, Tempo e TMA somam 31,50 pontos para todos.",
      "Nota final a partir de 85 gera elegibilidade; apenas o Top 3 é premiado.",
    ],
  },
];

export const engineeringSteps = [
  {
    numero: "01",
    titulo: "Importação",
    descricao: "Leitura de CSV ou Excel e localização automática do cabeçalho.",
  },
  {
    numero: "02",
    titulo: "Padronização",
    descricao: "Normalização de colunas, textos, números, datas e horários.",
  },
  {
    numero: "03",
    titulo: "Qualidade",
    descricao: "Separação de registros válidos, erros, escopo e exceções.",
  },
  {
    numero: "04",
    titulo: "Transformação",
    descricao: "Cálculo dos indicadores, pontos, elegibilidade e ranking.",
  },
  {
    numero: "05",
    titulo: "Persistência",
    descricao: "Gravação no SQLite sem duplicar competências reprocessadas.",
  },
];

// ------------------------------ Operação ------------------------------------

export const operationalKpis = [
  { label: "Base observada", value: "2.357", hint: "premiável + exceções", icon: "database" },
  { label: "Variação mensal", value: "+1", hint: "contra o mês anterior", icon: "trend" },
  { label: "TMA mediano", value: "3,2 min", hint: "tempo típico", icon: "timer" },
  { label: "TMA P90", value: "8,1 min", hint: "cauda dos casos longos", icon: "clock" },
  { label: "CSAT médio", value: "4,55", hint: "escala de 1 a 5", icon: "star" },
  { label: "Cobertura CSAT", value: "88,5%", hint: "avaliações válidas", icon: "percent" },
];

export const baseReconciliation = {
  premiável: { value: "2.350", label: "Base premiável", hint: "entra no ranking" },
  excecao: { value: "+7", label: "Exceção operacional", hint: "acima de 9 horas" },
  observada: { value: "2.357", label: "Base observada", hint: "demanda analisada" },
  legendas: [
    "Importados",
    "Falhas de qualidade",
    "Fora do escopo",
    "Automáticos incluídos",
  ],
};

// Distribuição horária (sintética) — soma 2.350 atendimentos válidos
export const hourlyDistribution = [
  { hora: "08h", total: 150 },
  { hora: "09h", total: 220 },
  { hora: "10h", total: 260 },
  { hora: "11h", total: 230 },
  { hora: "12h", total: 180 },
  { hora: "13h", total: 170 },
  { hora: "14h", total: 240 },
  { hora: "15h", total: 230 },
  { hora: "16h", total: 220 },
  { hora: "17h", total: 210 },
  { hora: "18h", total: 150 },
  { hora: "19h", total: 90 },
];

export const heatDayKeys = ["seg", "ter", "qua", "qui", "sex", "sab"] as const;

export const heatDayLabels: Record<string, string> = {
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
  sab: "Sáb",
};

export interface WeeklyHeatRow {
  hora: string;
  seg: number;
  ter: number;
  qua: number;
  qui: number;
  sex: number;
  sab: number;
}

// Matriz sintética dia × hora que respeita os totais por hora da base.
const dayWeights = [0.16, 0.17, 0.18, 0.17, 0.16, 0.16];

export const weeklyHeatmap: WeeklyHeatRow[] = hourlyDistribution.map((h) => {
  const assigned = dayWeights.map((w) => Math.round(h.total * w));
  let diff = h.total - assigned.reduce((a, b) => a + b, 0);
  let i = 0;
  while (diff !== 0) {
    assigned[i] += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
    i = (i + 1) % assigned.length;
  }
  const row: WeeklyHeatRow = {
    hora: h.hora,
    seg: 0,
    ter: 0,
    qua: 0,
    qui: 0,
    sex: 0,
    sab: 0,
  };
  heatDayKeys.forEach((d, idx) => {
    row[d] = assigned[idx];
  });
  return row;
});

export interface OperationalMonth {
  competencia: string;
  volume: number | null;
  tmaMediano: number | null;
  tmaP90: number | null;
  csat: number | null;
  cobertura: number | null;
  validade: string | null;
}

export const operationalMonths: OperationalMonth[] = [
  {
    competencia: "06/2026",
    volume: null,
    tmaMediano: null,
    tmaP90: null,
    csat: null,
    cobertura: null,
    validade: "Primeira referência",
  },
  {
    competencia: "07/2026",
    volume: 2349,
    tmaMediano: 3.1,
    tmaP90: 8.0,
    csat: 4.53,
    cobertura: 88.1,
    validade: "Validado",
  },
  {
    competencia: "08/2026",
    volume: 2350,
    tmaMediano: 3.2,
    tmaP90: 8.1,
    csat: 4.55,
    cobertura: 88.5,
    validade: "Atual",
  },
];

// ------------------------------ Premiação -----------------------------------

export const premiacaoResumo = [
  { label: "Base premiável", value: "2.350", hint: "94,9% da base importada", icon: "database" },
  { label: "Excluídos", value: "127", hint: "5,1% dos registros analisados", icon: "x" },
  { label: "Líder", value: "Marina Costa", hint: "1ª posição oficial", icon: "flag" },
  { label: "Nota do líder", value: "91,09", hint: "de 91,50 pontos possíveis", icon: "gauge" },
  { label: "Premiados", value: "3", hint: "3 de 4 elegíveis", icon: "trophy" },
  { label: "Automáticos incluídos", value: "40", hint: "mantidos e rastreáveis", icon: "bot" },
];

export const leaderBreakdown = [
  { label: "Base fixa", value: "31,50", hint: "Tempo + TMA iguais para a equipe", color: "muted" as const },
  { label: "Quantidade", value: "20,00", hint: "412 atendimentos válidos", color: "primary" as const },
  { label: "Avaliação", value: "39,59", hint: "CSAT 4,77", color: "primary" as const },
];

export const leaderTotal = {
  label: "Índice final",
  value: "91,09",
  hint: "99,5% do teto efetivo",
};

// ------------------------------ Histórico -----------------------------------

// Notas reconstruídas: 08/2026 vem da base; 07/2026 = nota atual - Δnota.
export const historySeries = employees.map((e) => {
  const comp = individualComparisons.find((c) => c.nome === e.name)!;
  return {
    nome: e.name,
    pontos: [
      { competencia: "06/2026", nota: null as number | null },
      { competencia: "07/2026", nota: Math.round((e.note - comp.deltaNota) * 100) / 100 },
      { competencia: "08/2026", nota: e.note },
    ],
  };
});

export const monthlyResults = monthlyClosures.map((m) => ({
  competencia: m.competencia,
  indice: m.indice,
  mediana: m.mediana,
  lideranca: m.lideranca,
  elegiveis: m.elegiveis,
  premiados: m.premiados,
  situacao: m.status,
}));

// ------------------------------ Auditoria ------------------------------------

export const auditSummary = [
  { label: "Base importada", value: "2.477", hint: "registros analisados", icon: "upload" },
  { label: "Base premiável", value: "2.350", hint: "94,9% aproveitamento", icon: "check" },
  { label: "Excluídos", value: "127", hint: "5,1% da base", icon: "x" },
  { label: "Automáticos incluídos", value: "40", hint: "mantidos e rastreáveis", icon: "bot" },
];

export const auditLog = [
  { motivo: "Falhas de qualidade", quantidade: 91, percentual: "71,7%" },
  { motivo: "Fora do escopo da campanha", quantidade: 36, percentual: "28,3%" },
];

export const rastreabilidade = [
  {
    titulo: "Base validada",
    descricao: "Registros válidos após limpeza, com rastreabilidade linha a linha.",
  },
  {
    titulo: "Log de exclusões",
    descricao: "Cada exclusão registra o primeiro motivo encontrado.",
  },
  {
    titulo: "Parâmetros",
    descricao: "Regra da competência preservada por mês.",
  },
  {
    titulo: "Memória de cálculo",
    descricao: "Memória de cálculo por funcionário para conferência.",
  },
];

export const saidasProcesso = [
  "Dashboard",
  "Histórico individual",
  "Excel de auditoria",
  "PowerPoint executivo",
];
