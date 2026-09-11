import type PptxGenJS from "pptxgenjs";

import type { CompetenceSnapshot } from "@/lib/validation-engine";

const fmt = (value: number | null | undefined, digits = 2): string =>
  value == null ? "—" : value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export async function exportExcel(snapshot: CompetenceSnapshot, history: CompetenceSnapshot[]): Promise<void> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const ranking = snapshot.ranking.map((row) => ({
    Rank: row.rank,
    Funcionário: row.atendente,
    Atendimentos: row.atendimentos,
    "TMA médio (min)": row.tmaMedioMin,
    "Horas totais": row.horasTotal,
    "Avaliação média": row.avaliacaoMedia,
    Avaliações: row.avaliacoes,
    "Pontos quantidade": row.pontosQuantidade,
    "Pontos tempo": row.pontosTempo,
    "Pontos TMA": row.pontosTma,
    "Pontos avaliação": row.pontosAvaliacao,
    "Nota final": row.notaFinal,
    Elegível: row.elegivel ? "Sim" : "Não",
    Premiado: row.premiado ? "Sim" : "Não",
    Feedback: row.feedback,
  }));
  const historyRows = history.flatMap((item) => item.ranking.map((row) => ({
    Competência: item.competenciaBr,
    Funcionário: row.atendente,
    Rank: row.rank,
    Atendimentos: row.atendimentos,
    "Avaliação média": row.avaliacaoMedia,
    "Nota final": row.notaFinal,
    Elegível: row.elegivel ? "Sim" : "Não",
    Premiado: row.premiado ? "Sim" : "Não",
    Feedback: row.feedback,
  })));
  const validRows = snapshot.validos.map((row) => ({
    Linha: row.linhaOrigem,
    Protocolo: row.protocolo,
    Funcionário: row.atendente,
    Departamento: row.departamento,
    Início: row.inicio,
    Fim: row.fim,
    "Duração (h)": row.duracaoHoras,
    "TMA (min)": row.tmaMinutos,
    Avaliação: row.avaliacao,
    Automático: row.suspeitoAutomatico ? "Sim" : "Não",
    "Duração considerada": row.duracaoConsiderada ? "Sim" : "Não",
  }));
  const excludedRows = snapshot.excluidos.map((row) => ({
    Linha: row.linhaOrigem,
    Protocolo: row.protocolo,
    Funcionário: row.atendente,
    Departamento: row.departamento,
    Início: row.inicio,
    Fim: row.fim,
    "Duração (h)": row.duracaoHoras,
    Código: row.motivoCodigo,
    Motivo: row.motivo,
  }));
  const stats = Object.entries(snapshot.estatisticas).map(([Indicador, Quantidade]) => ({ Indicador, Quantidade }));
  const params = Object.entries(snapshot.config).map(([Parâmetro, Valor]) => ({ Parâmetro, Valor }));
  const automatics = validRows.filter((row) => row.Automático === "Sim");

  [
    ["Ranking", ranking],
    ["Historico_Notas", historyRows],
    ["Base_Validada", validRows],
    ["Log_Exclusoes", excludedRows],
    ["Resumo_Validacao", stats],
    ["Parametros_Auditoria", params],
    ["Finalizados_Automaticos", automatics],
  ].forEach(([name, rows]) => {
    const sheet = XLSX.utils.json_to_sheet(rows as Record<string, unknown>[]);
    sheet["!autofilter"] = sheet["!ref"] ? { ref: sheet["!ref"] } : undefined;
    sheet["!cols"] = Array.from({ length: 16 }, () => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(workbook, sheet, String(name));
  });
  XLSX.writeFile(workbook, `Premiacao_Suporte_${snapshot.competenciaBr.replace("/", "-")}.xlsx`, { compression: true });
}

const COLORS = {
  navy: "071624",
  blue: "16B8E6",
  white: "F7FAFC",
  muted: "94A3B8",
  green: "22C55E",
  amber: "F59E0B",
  red: "EF4444",
};

function addTitle(slide: PptxGenJS.Slide, eyebrow: string, title: string, subtitle?: string): void {
  slide.background = { color: COLORS.navy };
  slide.addText(eyebrow.toUpperCase(), { x: 0.6, y: 0.35, w: 12.1, h: 0.25, fontFace: "Aptos", fontSize: 9, bold: true, color: COLORS.blue, charSpacing: 1.5 });
  slide.addText(title, { x: 0.6, y: 0.72, w: 12.1, h: 0.52, fontFace: "Aptos Display", fontSize: 25, bold: true, color: COLORS.white, breakLine: false });
  if (subtitle) slide.addText(subtitle, { x: 0.6, y: 1.28, w: 12.1, h: 0.35, fontFace: "Aptos", fontSize: 11, color: COLORS.muted });
  slide.addShape("line", { x: 0.6, y: 1.72, w: 12.1, h: 0, line: { color: "294052", width: 1 } });
}

function addFooter(slide: PptxGenJS.Slide, snapshot: CompetenceSnapshot, page: number): void {
  slide.addText(`Performance do Suporte · ${snapshot.competenciaBr}`, { x: 0.6, y: 7.14, w: 5, h: 0.2, fontFace: "Aptos", fontSize: 8, color: COLORS.muted });
  slide.addText(String(page).padStart(2, "0"), { x: 12.1, y: 7.14, w: 0.6, h: 0.2, fontFace: "Aptos", fontSize: 8, color: COLORS.muted, align: "right" });
}

function addKpis(slide: PptxGenJS.Slide, items: Array<{ label: string; value: string; hint?: string }>, y = 2): void {
  const width = 11.9 / items.length;
  items.forEach((item, index) => {
    const x = 0.7 + index * width;
    slide.addShape("roundRect", { x, y, w: width - 0.15, h: 1.25, rectRadius: 0.05, fill: { color: "0D2536" }, line: { color: "294052", width: 1 } });
    slide.addText(item.label.toUpperCase(), { x: x + 0.16, y: y + 0.15, w: width - 0.47, h: 0.18, fontFace: "Aptos", fontSize: 8, bold: true, color: COLORS.muted });
    slide.addText(item.value, { x: x + 0.16, y: y + 0.42, w: width - 0.47, h: 0.36, fontFace: "Aptos Display", fontSize: 21, bold: true, color: COLORS.white });
    if (item.hint) slide.addText(item.hint, { x: x + 0.16, y: y + 0.88, w: width - 0.47, h: 0.2, fontFace: "Aptos", fontSize: 8, color: COLORS.muted });
  });
}

function tableRows(snapshot: CompetenceSnapshot): Array<Array<string | number>> {
  return snapshot.ranking.map((row) => [row.rank, row.atendente, row.atendimentos, fmt(row.avaliacaoMedia), fmt(row.notaFinal), row.premiado ? "Premiado" : row.elegivel ? "Elegível" : "Abaixo da meta"]);
}

export async function exportPowerPoint(snapshot: CompetenceSnapshot, history: CompetenceSnapshot[]): Promise<void> {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Performance do Suporte";
  pptx.subject = "Apuração mensal da premiação";
  pptx.title = `Premiação do Suporte — ${snapshot.competenciaBr}`;
  pptx.company = "Performance do Suporte";
  pptx.lang = "pt-BR";
  pptx.theme = { headFontFace: "Aptos Display", bodyFontFace: "Aptos", lang: "pt-BR" };
  let page = 0;
  const slide = (eyebrow: string, title: string, subtitle?: string) => {
    const item = pptx.addSlide();
    page += 1;
    addTitle(item, eyebrow, title, subtitle);
    addFooter(item, snapshot, page);
    return item;
  };

  let s = pptx.addSlide();
  page += 1;
  s.background = { color: COLORS.navy };
  s.addText("PERFORMANCE DO SUPORTE", { x: 0.75, y: 0.75, w: 5.5, h: 0.3, fontFace: "Aptos", fontSize: 11, bold: true, color: COLORS.blue, charSpacing: 1.8 });
  s.addText("Apuração mensal\nda premiação", { x: 0.75, y: 1.55, w: 7.2, h: 1.5, fontFace: "Aptos Display", fontSize: 38, bold: true, color: COLORS.white, breakLine: false });
  s.addText(snapshot.competenciaBr, { x: 0.75, y: 3.45, w: 3, h: 0.5, fontFace: "Aptos Display", fontSize: 24, bold: true, color: COLORS.blue });
  s.addText("Dados validados · Meta 85 · Top 3 entre elegíveis", { x: 0.75, y: 4.2, w: 6.5, h: 0.35, fontFace: "Aptos", fontSize: 13, color: COLORS.muted });
  addFooter(s, snapshot, page);

  const eligible = snapshot.ranking.filter((row) => row.elegivel).length;
  const awarded = snapshot.ranking.filter((row) => row.premiado).length;
  const leader = snapshot.ranking[0];
  s = slide("Apuração executiva", "Decisão da competência", "Quem atingiu a meta e quais três pessoas foram premiadas.");
  addKpis(s, [
    { label: "Elegíveis", value: String(eligible), hint: "nota final ≥ 85" },
    { label: "Premiados", value: String(awarded), hint: "Top 3 por maior nota" },
    { label: "Líder", value: leader?.atendente ?? "—", hint: leader ? fmt(leader.notaFinal) : "sem resultado" },
    { label: "Base válida", value: snapshot.validos.length.toLocaleString("pt-BR"), hint: `${snapshot.excluidos.length} excluídos` },
  ]);

  s = slide("Resumo geral", "Indicadores centrais", `Arquivo ${snapshot.origem}`);
  addKpis(s, [
    { label: "Nota média", value: fmt(snapshot.ranking.reduce((sum, row) => sum + row.notaFinal, 0) / Math.max(1, snapshot.ranking.length)) },
    { label: "Avaliações", value: snapshot.ranking.reduce((sum, row) => sum + row.avaliacoes, 0).toLocaleString("pt-BR") },
    { label: "Automáticos", value: String(snapshot.estatisticas.AUTOMATICOS_VALIDOS ?? 0), hint: "incluídos e rastreados" },
    { label: "Aproveitamento", value: `${fmt(snapshot.totalLinhas ? snapshot.validos.length / snapshot.totalLinhas * 100 : 0, 1)}%` },
  ]);

  s = slide("Regras", "Critérios aplicados", snapshot.config.perfilRegra);
  const rules = [
    `Escopo: Suporte em Filas/Setores ou Transfers`,
    `Janela: ${snapshot.config.incluirForaExpediente ? "período integral preservado" : "segunda a sábado, 08:00–19:59"}`,
    `Duração: até ${snapshot.config.maxHoras} horas para atendimentos regulares`,
    `Automáticos: ${snapshot.config.incluirFinalizadosAutomaticamente ? "incluídos; duração não altera Tempo/TMA" : "tratamento regular"}`,
    `Tempo/TMA: ${snapshot.config.pontuacaoTempoTmaFixa ? "31,50 pontos iguais para todos" : "normalizados pela equipe"}`,
    `Elegibilidade: nota final ≥ ${snapshot.config.notaMinima}; premiação: Top 3 elegível`,
  ];
  s.addText(rules.map((text) => ({ text, options: { bullet: { indent: 14 }, breakLine: true } })), { x: 0.9, y: 2.05, w: 11.4, h: 3.7, fontFace: "Aptos", fontSize: 17, color: COLORS.white, breakLine: false, paraSpaceAfterPt: 13 });

  s = slide("Metodologia", "Pipeline de engenharia de dados", "Leitura, limpeza, validação, transformação e persistência local.");
  addKpis(s, [
    { label: "01", value: "Importar", hint: "CSV ou Excel" },
    { label: "02", value: "Limpar", hint: "datas, textos e colunas" },
    { label: "03", value: "Validar", hint: "escopo e qualidade" },
    { label: "04", value: "Calcular", hint: "nota, ranking e Top 3" },
    { label: "05", value: "Auditar", hint: "memória completa" },
  ]);

  s = slide("Resultado", "Ranking oficial", "Ordenação por nota, quantidade e avaliação.");
  s.addTable([["Rank", "Funcionário", "Volume", "CSAT", "Nota", "Situação"], ...tableRows(snapshot)], { x: 0.65, y: 1.95, w: 12, h: 4.65, border: { color: "294052", width: 0.6 }, fill: "0D2536", color: COLORS.white, fontFace: "Aptos", fontSize: 10, rowH: 0.34, margin: 0.07, bold: false, autoFit: false, colW: [0.65, 3.25, 1.2, 1.1, 1.1, 2.2] });

  s = slide("Memória de cálculo", "Formação da nota", "Tempo e TMA aparecem separados mesmo quando protegidos.");
  s.addTable([["Funcionário", "Qtd.", "Tempo", "TMA", "Aval.", "Final"], ...snapshot.ranking.map((row) => [row.atendente, fmt(row.pontosQuantidade), fmt(row.pontosTempo), fmt(row.pontosTma), fmt(row.pontosAvaliacao), fmt(row.notaFinal)])], { x: 0.65, y: 1.95, w: 12, h: 4.65, border: { color: "294052", width: 0.6 }, fill: "0D2536", color: COLORS.white, fontFace: "Aptos", fontSize: 10, rowH: 0.34, margin: 0.07 });

  s = slide("Comparativo mensal", "Evolução das competências", "Comparações devem respeitar as versões de regra.");
  s.addTable([["Competência", "Nota média", "Líder", "Elegíveis", "Premiados"], ...history.map((item) => [item.competenciaBr, fmt(item.ranking.reduce((sum, row) => sum + row.notaFinal, 0) / Math.max(1, item.ranking.length)), fmt(item.ranking[0]?.notaFinal), item.ranking.filter((row) => row.elegivel).length, item.ranking.filter((row) => row.premiado).length])], { x: 0.9, y: 2.05, w: 11.4, h: 3.8, border: { color: "294052", width: 0.6 }, fill: "0D2536", color: COLORS.white, fontFace: "Aptos", fontSize: 11, rowH: 0.42, margin: 0.08 });

  s = slide("Operação", "Volume, tempo e satisfação", "A duração artificial de automáticos não entra em Tempo/TMA.");
  const timed = snapshot.validos.filter((row) => row.duracaoConsiderada).map((row) => row.tmaMinutos).sort((a, b) => a - b);
  addKpis(s, [
    { label: "Volume válido", value: snapshot.validos.length.toLocaleString("pt-BR") },
    { label: "TMA mediano", value: `${fmt(timed[Math.floor(timed.length / 2)] ?? 0, 1)} min` },
    { label: "Automáticos", value: String(snapshot.estatisticas.AUTOMATICOS_VALIDOS ?? 0) },
    { label: "Excluídos", value: snapshot.excluidos.length.toLocaleString("pt-BR") },
  ]);

  s = slide("Controle", "Finalizados automaticamente", "Incluídos em Quantidade e Avaliação; Tempo/TMA permanecem protegidos.");
  addKpis(s, [
    { label: "Identificados", value: String(snapshot.estatisticas.AUTOMATICOS_IDENTIFICADOS ?? 0) },
    { label: "Incluídos", value: String(snapshot.estatisticas.AUTOMATICOS_VALIDOS ?? 0) },
    { label: "Recuperados", value: String(snapshot.estatisticas.AUTOMATICOS_RECUPERADOS ?? 0), hint: `duração acima de ${snapshot.config.maxHoras}h` },
  ]);

  snapshot.ranking.forEach((row) => {
    s = slide("Análise individual", row.atendente, `${row.rank}º lugar · ${row.premiado ? "Premiado" : row.elegivel ? "Elegível fora do Top 3" : "Abaixo da meta"}`);
    addKpis(s, [
      { label: "Nota", value: fmt(row.notaFinal) },
      { label: "Atendimentos", value: row.atendimentos.toLocaleString("pt-BR") },
      { label: "Avaliação", value: fmt(row.avaliacaoMedia), hint: `${row.avaliacoes} respostas` },
      { label: "Automáticos", value: String(row.automaticos) },
    ]);
    s.addText(row.feedback, { x: 0.9, y: 4.1, w: 11.2, h: 1.1, fontFace: "Aptos", fontSize: 15, color: COLORS.white, breakLine: false, margin: 0.12, fill: { color: "0D2536" }, line: { color: "294052", width: 1 } });
  });

  s = slide("Insights", "Leituras para o gestor", "Oportunidades calculadas apenas com os indicadores disponíveis.");
  s.addText(snapshot.ranking.slice(0, 5).map((row) => ({ text: `${row.atendente}: ${row.feedback}`, options: { bullet: { indent: 14 }, breakLine: true } })), { x: 0.85, y: 1.95, w: 11.5, h: 4.8, fontFace: "Aptos", fontSize: 13, color: COLORS.white, paraSpaceAfterPt: 10 });

  s = slide("Recomendação", "Próximo ciclo de acompanhamento", "Preservar qualidade, acompanhar volume e revisar as exceções antes do fechamento.");
  s.addText([
    { text: "1. ", options: { bold: true, color: COLORS.blue } }, { text: "Conferir o log de exclusões e os automáticos antes de homologar o resultado.\n", options: { breakLine: true } },
    { text: "2. ", options: { bold: true, color: COLORS.blue } }, { text: "Acompanhar os funcionários abaixo da meta pelo componente com maior distância.\n", options: { breakLine: true } },
    { text: "3. ", options: { bold: true, color: COLORS.blue } }, { text: "Registrar feedbacks objetivos e reprocessar a competência quando houver correção na base.", options: { breakLine: true } },
  ], { x: 0.95, y: 2.2, w: 11, h: 2.7, fontFace: "Aptos", fontSize: 18, color: COLORS.white, breakLine: false, paraSpaceAfterPt: 16 });

  await pptx.writeFile({ fileName: `Premiacao_Suporte_${snapshot.competenciaBr.replace("/", "-")}.pptx` });
}
