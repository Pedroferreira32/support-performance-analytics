export const META_ELEGIBILIDADE = 85;
export const PONTOS_TEMPO_FIXO = 7.88;
export const PONTOS_TMA_FIXO = 23.62;

export type CellValue = string | number | boolean | Date | null | undefined;

export interface UploadFile {
  name: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface RuleConfig {
  competencia: string;
  perfilRegra: string;
  modo: "padrao" | "neutralizado";
  maxHoras: number;
  escalaAvaliacaoMax: number;
  pesoQuantidade: number;
  pesoTempo: number;
  pesoTma: number;
  pesoAvaliacao: number;
  incluirForaExpediente: boolean;
  incluirFinalizadosAutomaticamente: boolean;
  neutralizarTempoAutomaticos: boolean;
  pontuacaoTempoTmaFixa: boolean;
  notaMinima: number;
  horaInicio: string;
  horaFim: string;
}

export interface ValidRecord {
  linhaOrigem: number;
  protocolo: string;
  atendente: string;
  departamento: string;
  status: string;
  inicio: string;
  fim: string;
  avaliacao: number | null;
  duracaoHoras: number;
  tmaMinutos: number;
  suspeitoAutomatico: boolean;
  duracaoConsiderada: boolean;
}

export interface ExcludedRecord extends Omit<ValidRecord, "duracaoConsiderada"> {
  motivoCodigo: string;
  motivo: string;
}

export interface RankingRecord {
  id: string;
  atendente: string;
  rank: number;
  atendimentos: number;
  tmaMedioMin: number | null;
  tmaMedianoMin: number | null;
  tmaP90Min: number | null;
  horasTotal: number;
  avaliacaoMedia: number | null;
  avaliacoes: number;
  coberturaAvaliacao: number;
  automaticos: number;
  pontosQuantidade: number;
  pontosTempo: number;
  pontosTma: number;
  pontosAvaliacao: number;
  notaFinal: number;
  elegivel: boolean;
  premiado: boolean;
  feedback: string;
}

export interface CompetenceSnapshot {
  schemaVersion: 1;
  competencia: string;
  competenciaBr: string;
  origem: string;
  processadoEm: string;
  config: RuleConfig;
  totalLinhas: number;
  validos: ValidRecord[];
  excluidos: ExcludedRecord[];
  ranking: RankingRecord[];
  mapeamento: Record<string, string>;
  estatisticas: Record<string, number>;
  avisos: string[];
}

const INVALIDOS = new Set([
  "",
  "-",
  "NAN",
  "NAT",
  "NONE",
  "NULL",
  "PENDENTE",
  "SEM ATENDENTE",
  "NAO INFORMADO",
]);

const MOTIVOS: Record<string, string> = {
  FORA_SUPORTE: "Departamento diferente de Suporte",
  SEM_ATENDENTE: "Atendente não informado",
  ATENDENTE_EXCLUIDO: "Atendente fora da campanha",
  DATA_INVALIDA: "Data de início inválida ou pendente",
  SEM_FINALIZACAO: "Data final não informada",
  DURACAO_NEGATIVA: "Data final anterior ao início",
  ACIMA_H: "Duração acima do limite configurado",
  PERIODO: "Fora do expediente ou em domingo",
};

const ALIASES: Record<string, string[]> = {
  protocolo: ["PROTOCOLO", "ID DO TICKET", "IDTICKET", "TICKET", "TICKET ID"],
  atendente: ["ATENDENTE", "USER ID", "USERID", "OPERADOR", "USUARIO", "AGENTE"],
  filas: ["FILAS", "FILA", "DEPARTAMENTO", "SETOR", "SETORES"],
  filasTransfers: [
    "FILAS TRANSFERS",
    "FILASTRANSFERS",
    "FILAS TRANSFER",
    "FILA TRANSFERIDA",
    "SETORES TRANSFERS",
    "SETORESTRANSFERS",
  ],
  inicio: ["INICIADO", "INICIO", "DATA INICIO", "CRIADO", "DATA", "CRIADO EM"],
  fim: ["FIM", "DATA ULTIMA MENSAGEM", "ULTIMA MENSAGEM", "FINALIZADO", "DATA FINALIZACAO"],
  rating: ["RATING", "AVALIACAO", "NOTA", "SATISFACAO", "CSAT"],
  status: ["STATUS", "SITUACAO", "MOTIVO DE ENCERRAMENTO"],
};

function normalize(value: CellValue): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toUpperCase();
}

function normalizeHeader(value: CellValue): string {
  return normalize(value).replace(/[^A-Z0-9]/g, "");
}

function cleanText(value: CellValue): string {
  return String(value ?? "").trim();
}

function parseNumber(value: CellValue): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const found = cleanText(value).replace(/\s/g, "").match(/-?\d+(?:[.,]\d+)?/);
  if (!found) return null;
  const parsed = Number(found[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function excelSerialToDate(value: number): Date | null {
  if (!Number.isFinite(value) || value <= 0 || value > 100000) return null;
  const whole = Math.floor(value);
  const fraction = value - whole;
  const epoch = Date.UTC(1899, 11, 30);
  const utc = new Date(epoch + whole * 86400000 + Math.round(fraction * 86400000));
  return new Date(
    utc.getUTCFullYear(),
    utc.getUTCMonth(),
    utc.getUTCDate(),
    utc.getUTCHours(),
    utc.getUTCMinutes(),
    utc.getUTCSeconds(),
  );
}

export function parseDate(value: CellValue): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value.getTime());
  if (typeof value === "number") return excelSerialToDate(value);
  const text = cleanText(value);
  if (!text || INVALIDOS.has(normalize(text))) return null;

  let match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (match) {
    const [, day, month, year, hour = "0", minute = "0", second = "0"] = match;
    const parsed = new Date(+year, +month - 1, +day, +hour, +minute, +second);
    return !Number.isNaN(parsed.getTime()) &&
      parsed.getFullYear() === +year && parsed.getMonth() === +month - 1 && parsed.getDate() === +day &&
      parsed.getHours() === +hour && parsed.getMinutes() === +minute && parsed.getSeconds() === +second
      ? parsed
      : null;
  }

  match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (match) {
    const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
    const parsed = new Date(+year, +month - 1, +day, +hour, +minute, +second);
    return !Number.isNaN(parsed.getTime()) &&
      parsed.getFullYear() === +year && parsed.getMonth() === +month - 1 && parsed.getDate() === +day &&
      parsed.getHours() === +hour && parsed.getMinutes() === +minute && parsed.getSeconds() === +second
      ? parsed
      : null;
  }
  return null;
}

function isoLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function competenceOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function competenceToIso(value: string): string {
  const text = value.trim();
  let match = text.match(/^(\d{2})\/(\d{4})$/);
  if (match) {
    const month = Number(match[1]);
    if (month >= 1 && month <= 12) return `${match[2]}-${match[1]}`;
  }
  match = text.match(/^(\d{4})-(\d{2})$/);
  if (match && Number(match[2]) >= 1 && Number(match[2]) <= 12) return text;
  throw new Error("Informe a competência no formato MM/AAAA, por exemplo 08/2026.");
}

export function competenceToBr(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  return match ? `${match[2]}/${match[1]}` : value;
}

export function officialConfig(competencia: string): RuleConfig {
  const base: RuleConfig = {
    competencia,
    perfilRegra: "Novo modelo oficial — 9 horas",
    modo: "padrao",
    maxHoras: 9,
    escalaAvaliacaoMax: 5,
    pesoQuantidade: 20,
    pesoTempo: 10,
    pesoTma: 30,
    pesoAvaliacao: 40,
    incluirForaExpediente: false,
    incluirFinalizadosAutomaticamente: false,
    neutralizarTempoAutomaticos: false,
    pontuacaoTempoTmaFixa: false,
    notaMinima: META_ELEGIBILIDADE,
    horaInicio: "08:00",
    horaFim: "19:59",
  };

  if (competencia <= "2026-05") {
    return {
      ...base,
      perfilRegra: "Modelo histórico (até maio/2026)",
      maxHoras: 8,
      escalaAvaliacaoMax: 10,
      pesoQuantidade: 30,
      pesoTempo: 15,
      pesoTma: 25,
      pesoAvaliacao: 30,
    };
  }
  if (competencia === "2026-07") {
    return {
      ...base,
      perfilRegra: "Julho/2026 validado — Tempo/TMA fixos em 31,5",
      modo: "neutralizado",
      incluirForaExpediente: true,
      incluirFinalizadosAutomaticamente: true,
      neutralizarTempoAutomaticos: true,
      pontuacaoTempoTmaFixa: true,
    };
  }
  if (competencia >= "2026-08") {
    return {
      ...base,
      perfilRegra: "Novo modelo oficial — automáticos incluídos e Tempo/TMA fixos em 31,5",
      incluirFinalizadosAutomaticamente: true,
      neutralizarTempoAutomaticos: true,
      pontuacaoTempoTmaFixa: true,
    };
  }
  return base;
}

function detectDelimiter(text: string): string {
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const options = [",", ";", "\t"];
  return options.sort((a, b) => first.split(b).length - first.split(a).length)[0];
}

function parseDelimited(text: string, delimiter: string): CellValue[][] {
  const rows: CellValue[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

function repairEncapsulatedRows(rows: CellValue[][], delimiter: string): CellValue[][] {
  const expected = Math.max(...rows.slice(0, 10).map((row) => row.length));
  return rows.map((row) => {
    if (row.length !== 1 || expected <= 1 || !String(row[0]).includes(delimiter)) return row;
    const repaired = parseDelimited(String(row[0]), delimiter)[0];
    return repaired && repaired.length > 1 ? repaired : row;
  });
}

export async function readWorkbook(file: UploadFile): Promise<CellValue[][]> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (["csv", "txt", "tsv"].includes(extension ?? "")) {
    const buffer = await file.arrayBuffer();
    let text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    if (text.includes("\uFFFD")) text = new TextDecoder("windows-1252").decode(buffer);
    const delimiter = detectDelimiter(text);
    return repairEncapsulatedRows(parseDelimited(text, delimiter), delimiter);
  }

  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("A planilha não possui abas para leitura.");
  return XLSX.utils.sheet_to_json<CellValue[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
    raw: true,
  });
}

function mapHeaders(headers: CellValue[]): Record<string, number> {
  const normalized = headers.map(normalizeHeader);
  const mapping: Record<string, number> = {};
  Object.entries(ALIASES).forEach(([field, aliases]) => {
    const index = aliases
      .map(normalizeHeader)
      .map((alias) => normalized.findIndex((header) => header === alias))
      .find((candidate) => candidate >= 0) ?? -1;
    if (index >= 0) mapping[field] = index;
  });
  return mapping;
}

function locateHeader(rows: CellValue[][]): { headerIndex: number; mapping: Record<string, number> } {
  let best = { headerIndex: -1, mapping: {} as Record<string, number>, score: -1 };
  rows.slice(0, 50).forEach((row, headerIndex) => {
    const mapping = mapHeaders(row);
    const score = Object.keys(mapping).length;
    if (score > best.score) best = { headerIndex, mapping, score };
  });
  const missing: string[] = [];
  if (best.mapping.atendente === undefined) missing.push("Atendente/User ID");
  if (best.mapping.inicio === undefined) missing.push("Iniciado/Criado");
  if (best.mapping.fim === undefined) missing.push("Fim");
  if (best.mapping.filas === undefined && best.mapping.filasTransfers === undefined) {
    missing.push("Filas/Setores ou Transfers");
  }
  if (missing.length) throw new Error(`Campos obrigatórios ausentes: ${missing.join(", ")}`);
  return { headerIndex: best.headerIndex, mapping: best.mapping };
}

export async function detectCompetence(file: UploadFile): Promise<string | null> {
  const rows = await readWorkbook(file);
  const { headerIndex, mapping } = locateHeader(rows);
  const counts = new Map<string, number>();
  rows.slice(headerIndex + 1).forEach((row) => {
    const date = parseDate(row[mapping.inicio]);
    if (!date) return;
    const key = competenceOf(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function percentile(values: number[], ratio: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * ratio;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function slug(value: string): string {
  return normalize(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildFeedback(row: Omit<RankingRecord, "rank" | "elegivel" | "premiado" | "feedback">, config: RuleConfig): string {
  const variable = [
    { label: "Quantidade", score: row.pontosQuantidade, max: config.pesoQuantidade },
    { label: "Avaliação", score: row.pontosAvaliacao, max: config.pesoAvaliacao },
  ];
  if (!config.pontuacaoTempoTmaFixa) {
    variable.push(
      { label: "Tempo total", score: row.pontosTempo, max: config.pesoTempo },
      { label: "TMA", score: row.pontosTma, max: config.pesoTma },
    );
  }
  variable.sort((a, b) => b.score / b.max - a.score / a.max);
  return `Ponto forte: ${variable[0].label}. Foco de acompanhamento: ${variable.at(-1)?.label}. Resultado calculado com ${row.atendimentos} atendimento(s) válido(s) e ${row.avaliacoes} avaliação(ões).`;
}

function calculateRanking(validos: ValidRecord[], config: RuleConfig): RankingRecord[] {
  const groups = new Map<string, ValidRecord[]>();
  validos.forEach((record) => {
    const list = groups.get(record.atendente) ?? [];
    list.push(record);
    groups.set(record.atendente, list);
  });

  const base = [...groups.entries()].map(([atendente, records]) => {
    const timed = records.filter((record) => record.duracaoConsiderada);
    const ratings = records.flatMap((record) => (record.avaliacao == null ? [] : [record.avaliacao]));
    const tmas = timed.map((record) => record.tmaMinutos);
    const horasTotal = timed.reduce((sum, record) => sum + record.duracaoHoras, 0);
    const avaliacaoMedia = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    return {
      id: slug(atendente),
      atendente,
      atendimentos: records.length,
      tmaMedioMin: tmas.length ? tmas.reduce((a, b) => a + b, 0) / tmas.length : null,
      tmaMedianoMin: percentile(tmas, 0.5),
      tmaP90Min: percentile(tmas, 0.9),
      horasTotal,
      avaliacaoMedia,
      avaliacoes: ratings.length,
      coberturaAvaliacao: records.length ? (ratings.length / records.length) * 100 : 0,
      automaticos: records.filter((record) => record.suspeitoAutomatico).length,
    };
  });

  const maxQuantidade = Math.max(0, ...base.map((row) => row.atendimentos));
  const maxHoras = Math.max(0, ...base.map((row) => row.horasTotal));
  const positiveTmas = base.flatMap((row) => (row.tmaMedioMin && row.tmaMedioMin > 0 ? [row.tmaMedioMin] : []));
  const minTma = positiveTmas.length ? Math.min(...positiveTmas) : 0;
  const ratings = base.flatMap((row) => (row.avaliacaoMedia == null ? [] : [row.avaliacaoMedia]));
  const maxRating = ratings.length ? Math.max(...ratings) : 0;

  const scored = base.map((row) => {
    const pontosQuantidade = maxQuantidade ? (row.atendimentos / maxQuantidade) * config.pesoQuantidade : 0;
    const pontosTempo = config.pontuacaoTempoTmaFixa
      ? PONTOS_TEMPO_FIXO
      : maxHoras
        ? (row.horasTotal / maxHoras) * config.pesoTempo
        : 0;
    const pontosTma = config.pontuacaoTempoTmaFixa
      ? PONTOS_TMA_FIXO
      : row.tmaMedioMin && minTma
        ? (minTma / row.tmaMedioMin) * config.pesoTma
        : 0;
    const pontosAvaliacao = row.avaliacaoMedia != null && maxRating
      ? (row.avaliacaoMedia / maxRating) * config.pesoAvaliacao
      : 0;
    const partial = {
      ...row,
      pontosQuantidade,
      pontosTempo,
      pontosTma,
      pontosAvaliacao,
      notaFinal: pontosQuantidade + pontosTempo + pontosTma + pontosAvaliacao,
    };
    return partial;
  });

  scored.sort((a, b) =>
    b.notaFinal - a.notaFinal ||
    b.atendimentos - a.atendimentos ||
    (b.avaliacaoMedia ?? -1) - (a.avaliacaoMedia ?? -1) ||
    a.atendente.localeCompare(b.atendente, "pt-BR"),
  );

  return scored.map((row, index) => {
    const rank = index + 1;
    const elegivel = row.notaFinal >= config.notaMinima;
    const premiado = elegivel && rank <= 3;
    return {
      ...row,
      rank,
      elegivel,
      premiado,
      feedback: `${buildFeedback(row, config)} ${premiado ? "Meta atingida e posição premiada no Top 3." : elegivel ? "Meta atingida, mas fora das três posições premiadas." : `Faltaram ${(config.notaMinima - row.notaFinal).toFixed(2).replace(".", ",")} pontos para a meta.`}`,
    };
  });
}

export async function processFile(
  file: UploadFile,
  competenceInput: string,
  excludedNames = "",
): Promise<CompetenceSnapshot> {
  const rows = await readWorkbook(file);
  const { headerIndex, mapping } = locateHeader(rows);
  const headers = rows[headerIndex];
  const competencia = competenceToIso(competenceInput);
  const config = officialConfig(competencia);
  const excluded = excludedNames.split(";").map(normalize).filter(Boolean);
  const sourceRows = rows.slice(headerIndex + 1).filter((row) => row.some((cell) => cleanText(cell) !== ""));

  const prepared = sourceRows.map((row, index) => {
    const get = (key: string): CellValue => mapping[key] === undefined ? "" : row[mapping[key]];
    const inicio = parseDate(get("inicio"));
    const fim = parseDate(get("fim"));
    const fila = cleanText(get("filas"));
    const transfer = cleanText(get("filasTransfers"));
    const protocoloRaw = cleanText(get("protocolo"));
    const avaliacaoRaw = parseNumber(get("rating"));
    const duracaoHoras = inicio && fim ? (fim.getTime() - inicio.getTime()) / 3600000 : Number.NaN;
    return {
      linhaOrigem: headerIndex + index + 2,
      protocolo: protocoloRaw || `LINHA-${headerIndex + index + 2}`,
      atendente: cleanText(get("atendente")),
      fila,
      transfer,
      departamento: [...new Set([fila, transfer].filter(Boolean))].join(" | "),
      status: cleanText(get("status")),
      inicio,
      fim,
      avaliacao: avaliacaoRaw != null && avaliacaoRaw >= 0 && avaliacaoRaw <= config.escalaAvaliacaoMax ? avaliacaoRaw : null,
      duracaoHoras,
    };
  });

  const competenceCounts = new Map<string, number>();
  prepared.forEach((row) => {
    if (!row.inicio) return;
    const key = competenceOf(row.inicio);
    competenceCounts.set(key, (competenceCounts.get(key) ?? 0) + 1);
  });
  const majority = [...competenceCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (majority && majority[0] !== competencia && majority[1] > prepared.length / 2) {
    throw new Error(
      `A competência informada não corresponde ao arquivo. A maioria dos atendimentos iniciados pertence a ${competenceToBr(majority[0])}, mas foi informado ${competenceToBr(competencia)}. A competência considera a data de início, não a data de finalização.`,
    );
  }

  const endCounts = new Map<string, number>();
  prepared.forEach((row) => {
    if (!row.fim) return;
    const key = isoLocal(row.fim).slice(0, 16);
    endCounts.set(key, (endCounts.get(key) ?? 0) + 1);
  });

  const validos: ValidRecord[] = [];
  const excluidos: ExcludedRecord[] = [];
  const stats: Record<string, number> = {
    TOTAL: prepared.length,
    AUTOMATICOS_IDENTIFICADOS: 0,
    AUTOMATICOS_VALIDOS: 0,
    AUTOMATICOS_RECUPERADOS: 0,
  };

  prepared.forEach((row) => {
    const endKey = row.fim ? isoLocal(row.fim).slice(0, 16) : "";
    const automatico = Boolean(
      row.fim &&
      ((row.fim.getHours() === 6 && row.fim.getMinutes() === 0) || (endCounts.get(endKey) ?? 0) >= 20),
    );
    if (automatico) stats.AUTOMATICOS_IDENTIFICADOS += 1;

    let reason = "";
    const support = normalize(row.fila).includes("SUPORTE") || normalize(row.transfer).includes("SUPORTE");
    const attendantNorm = normalize(row.atendente);
    if (!support) reason = "FORA_SUPORTE";
    else if (INVALIDOS.has(attendantNorm)) reason = "SEM_ATENDENTE";
    else if (excluded.some((name) => attendantNorm.includes(name))) reason = "ATENDENTE_EXCLUIDO";
    else if (!row.inicio) reason = "DATA_INVALIDA";
    else if (!row.fim) reason = "SEM_FINALIZACAO";
    else if (row.duracaoHoras < 0) reason = "DURACAO_NEGATIVA";
    else if (config.modo === "padrao" && row.duracaoHoras > config.maxHoras && !(automatico && config.incluirFinalizadosAutomaticamente)) reason = "ACIMA_H";
    else if (config.modo === "padrao" && !config.incluirForaExpediente && row.inicio) {
      const minute = row.inicio.getHours() * 60 + row.inicio.getMinutes();
      if (row.inicio.getDay() === 0 || minute < 480 || minute > 1199) reason = "PERIODO";
    }

    const common = {
      linhaOrigem: row.linhaOrigem,
      protocolo: row.protocolo,
      atendente: row.atendente,
      departamento: row.departamento,
      status: row.status,
      inicio: row.inicio ? isoLocal(row.inicio) : "",
      fim: row.fim ? isoLocal(row.fim) : "",
      avaliacao: row.avaliacao,
      duracaoHoras: Number.isFinite(row.duracaoHoras) ? row.duracaoHoras : 0,
      tmaMinutos: Number.isFinite(row.duracaoHoras) ? row.duracaoHoras * 60 : 0,
      suspeitoAutomatico: automatico,
    };
    if (reason) {
      stats[reason] = (stats[reason] ?? 0) + 1;
      excluidos.push({ ...common, motivoCodigo: reason, motivo: MOTIVOS[reason] });
    } else {
      const recovered = automatico && row.duracaoHoras > config.maxHoras;
      if (automatico) stats.AUTOMATICOS_VALIDOS += 1;
      if (recovered) stats.AUTOMATICOS_RECUPERADOS += 1;
      validos.push({
        ...common,
        duracaoConsiderada: !(automatico && config.neutralizarTempoAutomaticos),
      });
    }
  });

  stats.VALIDOS = validos.length;
  stats.EXCLUIDOS = excluidos.length;
  stats.REGULARES_VALIDOS = validos.length - stats.AUTOMATICOS_VALIDOS;
  stats.AUTOMATICOS_EXCLUIDOS = excluidos.filter((row) => row.suspeitoAutomatico).length;
  stats.AUTOMATICOS_NEUTRALIZADOS_TEMPO = config.neutralizarTempoAutomaticos
    ? stats.AUTOMATICOS_VALIDOS
    : 0;
  stats.AVALIACOES_VALIDAS = validos.filter((row) => row.avaliacao != null).length;

  if (!validos.length) {
    throw new Error("Nenhum atendimento válido restou após a aplicação das regras.");
  }

  const warnings: string[] = [];
  if (headers[mapping.protocolo] === undefined) warnings.push("Protocolo ausente: foi usado o número da linha para auditoria.");
  if (config.incluirFinalizadosAutomaticamente) warnings.push("Finalizados automaticamente incluídos em Quantidade e Avaliação; a duração artificial não participa de Tempo/TMA.");
  if (config.pontuacaoTempoTmaFixa) warnings.push("Tempo Total e TMA recebem 31,50 pontos iguais para todos os funcionários.");

  const mappingNames = Object.fromEntries(Object.entries(mapping).map(([key, index]) => [key, cleanText(headers[index])]));
  return {
    schemaVersion: 1,
    competencia,
    competenciaBr: competenceToBr(competencia),
    origem: file.name,
    processadoEm: new Date().toISOString(),
    config,
    totalLinhas: prepared.length,
    validos,
    excluidos,
    ranking: calculateRanking(validos, config),
    mapeamento: mappingNames,
    estatisticas: stats,
    avisos: warnings,
  };
}
