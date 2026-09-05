"use strict";

(function (root) {
  const C = {
    navy: "0B2238",
    navy2: "123E63",
    blue: "1E5F8F",
    blue2: "2F7FB5",
    lightBlue: "DCECF7",
    paleBlue: "EFF7FC",
    ink: "182838",
    muted: "657586",
    line: "DFE6EC",
    bg: "F3F6F8",
    white: "FFFFFF",
    gold: "D3951D",
    purple: "7352A3",
    green: "287D68",
    red: "A44747",
    orange: "CC6C37",
    slate: "778797",
  };

  const WIDTH = 13.333;
  const HEIGHT = 7.5;
  const MARGIN_X = 0.55;
  const DEFAULT_MIN_SCORE = 85;

  const num = (value, fallback = 0) => {
    const result = Number(value);
    return Number.isFinite(result) ? result : fallback;
  };
  const intBr = (value) => Math.round(num(value)).toLocaleString("pt-BR");
  const numBr = (value, digits = 2) => num(value).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const pctBr = (value, digits = 1) => `${numBr(value, digits)}%`;
  const text = (value, fallback = "—") => String(value ?? fallback);
  const short = (value, max = 42) => {
    const source = text(value, "");
    return source.length > max ? `${source.slice(0, max - 1)}…` : source;
  };
  const competenciaBr = (value) => {
    const parts = text(value, "").split("-");
    return parts.length === 2 ? `${parts[1]}/${parts[0]}` : text(value);
  };
  const nomeMes = (competencia) => {
    const [ano, mes] = text(competencia, "").split("-");
    const meses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${meses[Number(mes)] || mes}/${ano}`;
  };
  const cleanFile = (value) => text(value, "arquivo").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "_");

  function configOf(payload) {
    return payload?.atual?.info?.configuracao || {};
  }

  function minScore(payload) {
    return num(configOf(payload).nota_minima, DEFAULT_MIN_SCORE);
  }

  function isAwarded(row) {
    return num(row?.premiado) === 1
      || (num(row?.elegivel) === 1 && num(row?.rank) <= 3);
  }

  function resultStatus(row, payload) {
    if (isAwarded(row)) return "Premiado — Top 3";
    if (num(row?.elegivel) === 1) return "Elegível — fora do Top 3";
    return `Abaixo da meta de ${numBr(minScore(payload), 0)} pontos`;
  }

  function modelSummary(payload) {
    const config = configOf(payload);
    if (config.pontuacao_tempo_tma_fixa || config.modo === "neutralizado") {
      return "Modelo especial: Quantidade 20 • Tempo/TMA fixos 31,5 • Avaliação 40";
    }
    const automaticos = config.neutralizar_tempo_automaticos
      ? " • automáticos sem impacto em Tempo/TMA"
      : "";
    return `Modelo ${numBr(config.peso_quantidade || 20, 0)} / ${numBr(config.peso_tempo || 10, 0)} / ${numBr(config.peso_tma || 30, 0)} / ${numBr(config.peso_avaliacao || 40, 0)}${automaticos}`;
  }

  function criteriaFooter(payload) {
    const config = configOf(payload);
    const periodo = config.incluir_fora_expediente
      ? "sem corte de expediente"
      : `seg-sáb ${config.hora_inicio || "08:00"}–${config.hora_fim || "19:59"}`;
    const duracao = config.pontuacao_tempo_tma_fixa || config.modo === "neutralizado"
      ? "Tempo/TMA fixos em 31,5"
      : `outlier > ${numBr(config.max_horas || 9, 0)}h`;
    const automaticos = config.incluir_finalizados_automaticamente
      ? " • automáticos incluídos"
      : "";
    return `Suporte • ${periodo} • TMA por última mensagem • ${duracao}${automaticos}`;
  }

  function addNotes(slide, payload) {
    const info = payload?.atual?.info || {};
    slide.addNotes(`[Sources]\n- Banco local historico_premiacao.db; competência ${payload.competencia_br || competenciaBr(payload.competencia)}; arquivo de origem ${info.arquivo_origem || "não informado"}; processamento ${info.processado_em || "não informado"}.`);
  }

  function addHeader(pptx, slide, payload, title, section = "APURAÇÃO EXECUTIVA") {
    slide.background = { color: C.white };
    slide.addText(`Premiação Suporte • ${payload.competencia_br || competenciaBr(payload.competencia)}`, {
      x: MARGIN_X, y: 0.2, w: 5.3, h: 0.18,
      fontFace: "Aptos", fontSize: 9, bold: true, color: C.blue,
      margin: 0, breakLine: false,
    });
    slide.addText(section, {
      x: 9.35, y: 0.2, w: 3.42, h: 0.18,
      fontFace: "Aptos", fontSize: 8, bold: true, color: C.muted,
      align: "right", margin: 0, charSpacing: 1.2,
    });
    slide.addShape(pptx.ShapeType.line, {
      x: MARGIN_X, y: 0.48, w: WIDTH - 2 * MARGIN_X, h: 0,
      line: { color: C.line, width: 1 },
    });
    slide.addText(title, {
      x: MARGIN_X, y: 0.62, w: WIDTH - 2 * MARGIN_X, h: 0.45,
      fontFace: "Aptos Display", fontSize: 24, bold: true, color: C.ink,
      margin: 0, breakLine: false, fit: "shrink",
    });
  }

  function addFooter(pptx, slide, payload, pageNumber) {
    slide.addShape(pptx.ShapeType.line, {
      x: MARGIN_X, y: 7.12, w: WIDTH - 2 * MARGIN_X, h: 0,
      line: { color: C.line, width: 0.8 },
    });
    slide.addText(`${payload.competencia_br || competenciaBr(payload.competencia)} • Apuração de premiação • ${pageNumber} | Critérios finais: ${criteriaFooter(payload)}`, {
      x: MARGIN_X, y: 7.18, w: WIDTH - 2 * MARGIN_X, h: 0.16,
      fontFace: "Aptos", fontSize: 6.8, color: C.muted, margin: 0,
      fit: "shrink", breakLine: false,
    });
    addNotes(slide, payload);
  }

  function addKpi(pptx, slide, x, y, w, label, value, helper, accent = C.blue, options = {}) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w, h: options.h || 1.02,
      rectRadius: 0.06,
      fill: { color: options.dark ? C.navy2 : C.white, transparency: options.dark ? 5 : 0 },
      line: { color: options.dark ? "315776" : C.line, width: 1 },
      shadow: options.dark ? undefined : { type: "outer", color: "B7C4CE", opacity: 0.14, blur: 1, angle: 45, distance: 1 },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x, y, w: 0.07, h: options.h || 1.02,
      fill: { color: accent }, line: { color: accent, transparency: 100 },
    });
    slide.addText(label, {
      x: x + 0.17, y: y + 0.12, w: w - 0.27, h: 0.16,
      fontSize: 8.5, bold: true, color: options.dark ? "B9D0DF" : C.muted,
      margin: 0, breakLine: false, fit: "shrink",
    });
    slide.addText(text(value), {
      x: x + 0.17, y: y + 0.35, w: w - 0.27, h: 0.31,
      fontFace: "Aptos Display", fontSize: options.valueSize || 20, bold: true,
      color: options.dark ? C.white : C.navy2, margin: 0, breakLine: false,
      fit: "shrink",
    });
    if (helper) slide.addText(helper, {
      x: x + 0.17, y: y + 0.76, w: w - 0.27, h: 0.12,
      fontSize: 7, color: options.dark ? "A9C1D4" : "8996A2", margin: 0,
      breakLine: false, fit: "shrink",
    });
  }

  function addSectionLabel(slide, label, x, y, w = 3) {
    slide.addText(label, {
      x, y, w, h: 0.2, fontSize: 8, bold: true, color: C.blue,
      margin: 0, charSpacing: 1.1, breakLine: false,
    });
  }

  function addTable(slide, rows, options = {}) {
    const tableRows = rows.map((row, rowIndex) => row.map((cell) => ({
      text: text(cell, ""),
      options: rowIndex === 0
        ? { bold: true, color: C.white, fill: C.navy2, align: "left" }
        : { color: C.ink, fill: rowIndex % 2 ? C.white : "F7F9FA" },
    })));
    slide.addTable(tableRows, {
      x: options.x, y: options.y, w: options.w, h: options.h,
      colW: options.colW,
      rowH: options.rowH,
      fontFace: "Aptos", fontSize: options.fontSize || 8.2,
      color: C.ink, border: { type: "solid", color: C.line, pt: 0.6 },
      margin: options.margin ?? 0.055,
      valign: "middle", breakLine: false,
      autoFit: false,
    });
  }

  function splitFeedback(value) {
    const sentences = text(value, "").split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);
    return sentences.length ? sentences : ["Sem feedback registrado para esta competência."];
  }

  function componentLabels(row) {
    const components = [
      ["Quantidade", num(row.pontos_quantidade)],
      ["Tempo total", num(row.pontos_tempo)],
      ["TMA", num(row.pontos_tma)],
      ["Avaliação", num(row.pontos_avaliacao)],
    ];
    const max = [...components].sort((a, b) => b[1] - a[1])[0];
    const configMax = { "Quantidade": 20, "Tempo total": 10, TMA: 30, "Avaliação": 40 };
    const min = [...components].sort((a, b) => (a[1] / configMax[a[0]]) - (b[1] / configMax[b[0]]))[0];
    return { force: max[0], opportunity: min[0] };
  }

  function addCover(pptx, payload) {
    const slide = pptx.addSlide();
    const info = payload.atual.info;
    const ranking = payload.atual.ranking || [];
    const leader = ranking[0] || {};
    const eligible = ranking.filter((row) => num(row.elegivel) === 1);
    const awarded = ranking.filter(isAwarded);
    slide.background = { color: C.navy };
    slide.addShape(pptx.ShapeType.rect, { x: 12.98, y: 0, w: 0.35, h: HEIGHT, fill: { color: C.gold }, line: { transparency: 100 } });
    slide.addShape(pptx.ShapeType.arc, { x: 9.88, y: 4.02, w: 3.15, h: 3.15, adjustPoint: 0.35, rotate: 15, fill: { color: C.blue, transparency: 100 }, line: { color: C.blue2, transparency: 65, width: 18 } });
    slide.addText("PREMIAÇÃO SUPORTE", { x: 0.7, y: 0.72, w: 4.7, h: 0.24, fontSize: 12, bold: true, color: "72BCE9", margin: 0, charSpacing: 1.8 });
    slide.addText(`Apuração executiva de ${nomeMes(payload.competencia)}`, { x: 0.7, y: 1.24, w: 8.6, h: 0.9, fontFace: "Aptos Display", fontSize: 31, bold: true, color: C.white, margin: 0, fit: "shrink" });
    slide.addText(`Resultado oficial • ${info.configuracao?.perfil_regra || "Regra oficial"}`, { x: 0.7, y: 2.28, w: 8.9, h: 0.3, fontSize: 13, color: "C8DBE9", margin: 0, fit: "shrink" });
    const cardY = 5.47, cardW = 2.82, gap = 0.13;
    addKpi(pptx, slide, 0.7, cardY, cardW, "Atendimentos analisados", intBr(info.total_linhas), "Registros importados", C.blue2, { dark: true });
    addKpi(pptx, slide, 0.7 + cardW + gap, cardY, cardW, "Atendimentos válidos", intBr(info.validos), "Após filtros oficiais", C.green, { dark: true });
    addKpi(pptx, slide, 0.7 + 2 * (cardW + gap), cardY, cardW, "Premiados", intBr(awarded.length), awarded.map((r) => r.atendente).join(" e ") || "Sem premiados", C.gold, { dark: true });
    addKpi(pptx, slide, 0.7 + 3 * (cardW + gap), cardY, cardW, "Líder do mês", short(leader.atendente, 20), `${numBr(leader.nota_final)} pontos`, C.purple, { dark: true, valueSize: 17 });
    slide.addText(`Mensagem de gestão: ${awarded.length ? `os ${awarded.length} premiados correspondem às maiores notas entre os elegíveis.` : `o fechamento indica oportunidades objetivas para aproximar a equipe da meta de ${numBr(minScore(payload), 0)} pontos.`}`, { x: 0.72, y: 6.72, w: 11.7, h: 0.38, fontSize: 10.5, color: "C7D9E6", margin: 0, fit: "shrink" });
    addNotes(slide, payload);
  }

  function addExecutiveApuration(pptx, payload, page) {
    const slide = pptx.addSlide();
    const info = payload.atual.info;
    const ranking = payload.atual.ranking || [];
    const eligible = ranking.filter((row) => num(row.elegivel) === 1);
    const awarded = ranking.filter(isAwarded);
    addHeader(pptx, slide, payload, `Apuração de ${nomeMes(payload.competencia)} e análise executiva`);
    const total = num(info.total_linhas), valid = num(info.validos);
    const rate = total ? valid / total * 100 : 0;
    addKpi(pptx, slide, 0.58, 1.32, 2.89, "Atendimentos analisados", intBr(total), "Registros importados", C.blue);
    addKpi(pptx, slide, 3.66, 1.32, 2.89, "Atendimentos válidos", intBr(valid), `${pctBr(rate)} da base`, C.green);
    addKpi(pptx, slide, 6.75, 1.32, 2.89, "Excluídos", intBr(info.excluidos), "Fora das regras", C.slate);
    addKpi(pptx, slide, 9.84, 1.32, 2.89, "Premiados", intBr(awarded.length), awarded.map((r) => r.atendente).join(" e ") || "Nenhum premiado", C.gold, { valueSize: 18 });
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.58, y: 2.75, w: 12.15, h: 1.45, fill: { color: C.paleBlue }, line: { color: "CFE1ED" }, rectRadius: 0.05 });
    slide.addText("Resultado oficial", { x: 0.86, y: 3.01, w: 2.2, h: 0.24, fontSize: 11, bold: true, color: C.blue, margin: 0 });
    slide.addText(`${modelSummary(payload)}. A nota mínima de elegibilidade é ${numBr(minScore(payload), 0)} pontos.`, { x: 0.86, y: 3.34, w: 11.4, h: 0.45, fontSize: 14, bold: true, color: C.ink, margin: 0, fit: "shrink" });
    addSectionLabel(slide, "LEITURA DE GESTÃO", 0.62, 4.62);
    const leader = ranking[0] || {};
    const message = eligible.length
      ? `${leader.atendente} lidera com ${numBr(leader.nota_final)} pontos. ${eligible.length} funcionário(s) atingiram a meta e os ${awarded.length} maiores resultados foram premiados.`
      : `${leader.atendente || "A liderança"} encerra o mês com ${numBr(leader.nota_final)} pontos. A prioridade é atuar nos indicadores que mais afastaram cada funcionário da meta.`;
    slide.addText(message, { x: 0.62, y: 4.93, w: 12.05, h: 0.85, fontSize: 17, color: C.ink, margin: 0, breakLine: true, fit: "shrink", valign: "mid" });
    slide.addShape(pptx.ShapeType.line, { x: 0.62, y: 6.18, w: 12.05, h: 0, line: { color: C.blue2, width: 2 } });
    slide.addText("A apresentação foi gerada diretamente do histórico validado e mantém a memória de cálculo auditável.", { x: 0.62, y: 6.34, w: 12.05, h: 0.28, fontSize: 11, color: C.muted, margin: 0 });
    addFooter(pptx, slide, payload, page);
  }

  function addExecutiveSummary(pptx, payload, page) {
    const slide = pptx.addSlide();
    const info = payload.atual.info;
    const ranking = payload.atual.ranking || [];
    const leader = ranking[0] || {};
    const second = ranking[1] || {};
    const eligible = ranking.filter((row) => num(row.elegivel) === 1);
    const awarded = ranking.filter(isAwarded);
    addHeader(pptx, slide, payload, "Resumo executivo", "RESULTADO DO MÊS");
    addKpi(pptx, slide, 0.58, 1.27, 2.88, "Líder do mês", short(leader.atendente, 22), `${numBr(leader.nota_final)} pontos`, C.gold, { valueSize: 18 });
    addKpi(pptx, slide, 3.66, 1.27, 2.88, "2ª posição", short(second.atendente, 22), second.nota_final == null ? "Sem segundo colocado" : `${numBr(second.nota_final)} pontos`, C.purple, { valueSize: 18 });
    addKpi(pptx, slide, 6.74, 1.27, 2.88, "Meta mínima", numBr(minScore(payload), 0), `${intBr(eligible.length)} elegível(is)`, C.blue);
    const rate = num(info.total_linhas) ? num(info.validos) / num(info.total_linhas) * 100 : 0;
    addKpi(pptx, slide, 9.82, 1.27, 2.88, "Base válida", intBr(info.validos), `${pctBr(rate)} dos registros`, C.green);
    slide.addText(`${leader.atendente || "O líder"} encerrou o mês com ${numBr(leader.nota_final)} pontos. ${eligible.length ? `${eligible.length} atingiram a meta e ${awarded.length} foram premiados pelo Top 3.` : `Nenhum funcionário atingiu a meta de ${numBr(minScore(payload), 0)} pontos.`}`, { x: 0.62, y: 2.72, w: 12, h: 0.55, fontSize: 17, bold: true, color: C.ink, margin: 0, fit: "shrink" });
    addSectionLabel(slide, "LEITURA EXECUTIVA", 0.62, 3.55);
    const rows = ranking.slice(0, 4).map((row, index) => {
      const labels = componentLabels(row);
      const value = index === 0
        ? `Liderança sustentada por ${labels.force.toLowerCase()}`
        : `${row.atendente}: força em ${labels.force.toLowerCase()}; foco em ${labels.opportunity.toLowerCase()}`;
      return [index + 1, value, `${numBr(row.nota_final)} pts`];
    });
    addTable(slide, [["#", "Leitura", "Resultado"], ...rows], { x: 0.62, y: 3.88, w: 7.75, h: 2.28, colW: [0.55, 5.75, 1.45], fontSize: 9.5, rowH: 0.44 });
    slide.addShape(pptx.ShapeType.roundRect, { x: 8.72, y: 3.88, w: 3.93, h: 2.28, fill: { color: C.paleBlue }, line: { color: "CFE1ED" }, rectRadius: 0.05 });
    slide.addText("Impacto prático", { x: 9.02, y: 4.15, w: 3.3, h: 0.28, fontSize: 15, bold: true, color: C.navy2, margin: 0 });
    slide.addText([
      { text: "• ", options: { bold: true, color: C.blue } },
      { text: `Qualidade média: ${ranking.length ? numBr(ranking.reduce((sum, r) => sum + num(r.avaliacao_media), 0) / ranking.length) : "—"}\n` },
      { text: "• ", options: { bold: true, color: C.blue } },
      { text: `Maior volume: ${leader.atendente || "—"}, ${intBr(leader.atendimentos)} atendimentos\n` },
      { text: "• ", options: { bold: true, color: C.blue } },
      { text: eligible.length ? `${eligible.length} funcionário(s) acima da meta` : "Prioridade: reduzir o afastamento da meta" },
    ], { x: 9.02, y: 4.58, w: 3.25, h: 1.12, fontSize: 11, color: C.ink, margin: 0.02, breakLine: true, fit: "shrink" });
    addFooter(pptx, slide, payload, page);
  }

  function addRules(pptx, payload, page) {
    const slide = pptx.addSlide();
    const info = payload.atual.info;
    const config = configOf(payload);
    const stats = info.estatisticas || {};
    addHeader(pptx, slide, payload, "Base de dados e regras de validação", "GOVERNANÇA DOS DADOS");
    const period = config.incluir_fora_expediente ? "Sem exclusão por horário ou domingo" : `${config.hora_inicio || "08:00"} às ${config.hora_fim || "19:59"}; segunda a sábado`;
    const rules = [
      ["Departamento", "Somente Suporte", "Remove áreas fora da campanha"],
      ["Status", config.somente_finalizados === false ? "Todos os status" : "FINALIZADO", "Mantém o perfil oficial da competência"],
      ["Período", period, config.incluir_fora_expediente ? "Regra especial da competência" : "Fora do expediente desconsiderado"],
      ["Tempo/TMA", config.pontuacao_tempo_tma_fixa || config.modo === "neutralizado" ? "7,88 + 23,62 = 31,50 para todos" : "Início até última mensagem", config.pontuacao_tempo_tma_fixa || config.modo === "neutralizado" ? "Pontuação igual para toda a equipe" : "Mede o tempo efetivo da interação"],
      ["Outlier", config.modo === "neutralizado" ? "Sem corte de duração" : config.incluir_finalizados_automaticamente ? `Manual acima de ${numBr(config.max_horas || 9, 0)}h excluído; automático incluído` : `Duração acima de ${numBr(config.max_horas || 9, 0)}h excluída`, "Evita distorção dos indicadores"],
      ["Elegibilidade", `Nota mínima de ${numBr(minScore(payload), 0)}`, "Somente elegíveis recebem premiação"],
    ];
    addTable(slide, [["Critério", "Regra aplicada", "Efeito na apuração"], ...rules], { x: 0.58, y: 1.3, w: 8.15, h: 3.85, colW: [1.35, 3.1, 3.7], fontSize: 8.7, rowH: 0.47 });
    addSectionLabel(slide, "PRINCIPAIS EXCLUSÕES", 9.02, 1.35);
    const reasons = [
      ["Acima do limite", stats.ACIMA_H],
      ["Fora do expediente", stats.PERIODO],
      ["Fora de Suporte", stats.FORA_SUPORTE],
      ["Fora da campanha", stats.ATENDENTE_EXCLUIDO],
      ["Início inválido", stats.DATA_INVALIDA],
    ].filter((item) => num(item[1]) > 0).slice(0, 5);
    addTable(slide, [["Motivo", "Qtde"], ...(reasons.length ? reasons.map((r) => [r[0], intBr(r[1])]) : [["Nenhuma exclusão", "0"]])], { x: 9.02, y: 1.7, w: 3.65, h: 2.25, colW: [2.8, 0.85], fontSize: 8.8, rowH: 0.4 });
    addKpi(pptx, slide, 0.58, 5.45, 2.65, "Analisados", intBr(info.total_linhas), "registros importados", C.blue);
    addKpi(pptx, slide, 3.4, 5.45, 2.65, "Válidos", intBr(info.validos), "base oficial", C.green);
    addKpi(pptx, slide, 6.22, 5.45, 2.65, "Excluídos", intBr(info.excluidos), "log auditável", C.slate);
    const rate = num(info.total_linhas) ? num(info.validos) / num(info.total_linhas) * 100 : 0;
    addKpi(pptx, slide, 9.04, 5.45, 3.63, "Aproveitamento", pctBr(rate, 2), "percentual da base válida", C.gold);
    addFooter(pptx, slide, payload, page);
  }

  function addMethodology(pptx, payload, page) {
    const slide = pptx.addSlide();
    const config = configOf(payload);
    addHeader(pptx, slide, payload, "Metodologia de cálculo", "MODELO OFICIAL");
    const neutralized = config.modo === "neutralizado" || config.pontuacao_tempo_tma_fixa;
    const weights = [
      ["Quantidade", num(config.peso_quantidade, 20), "Proporcional ao maior volume", C.blue],
      ["Tempo total", neutralized ? 7.88 : num(config.peso_tempo, 10), neutralized ? "7,88 pontos fixos para todos" : config.neutralizar_tempo_automaticos ? "Proporcional às horas dos atendimentos regulares" : "Proporcional ao maior tempo absorvido", C.slate],
      ["TMA", neutralized ? 23.62 : num(config.peso_tma, 30), neutralized ? "23,62 pontos fixos para todos" : config.neutralizar_tempo_automaticos ? "Menor TMA regular recebe a maior pontuação" : "Menor TMA recebe a maior pontuação", C.gold],
      ["Avaliação", num(config.peso_avaliacao, 40), "Proporcional à maior avaliação média", C.purple],
    ];
    addTable(slide, [["Indicador", "Peso", "Regra"], ...weights.map((r) => [r[0], `${numBr(r[1], 0)} pts`, r[2]])], { x: 0.65, y: 1.35, w: 6.35, h: 2.55, colW: [1.65, 0.9, 3.8], fontSize: 9.5, rowH: 0.48 });
    addSectionLabel(slide, "COMPOSIÇÃO DA NOTA", 7.45, 1.4);
    let cursor = 7.45;
    const totalW = 5.2;
    const effectiveTotal = weights.reduce((sum, item) => sum + item[1], 0);
    weights.forEach((item) => {
      const w = totalW * item[1] / effectiveTotal;
      slide.addShape(pptx.ShapeType.rect, { x: cursor, y: 1.82, w, h: 0.62, fill: { color: item[3] }, line: { color: C.white, width: 0.6 } });
      if (w > 0.8) slide.addText(`${item[0]}\n${numBr(item[1], 0)}`, { x: cursor + 0.03, y: 1.93, w: w - 0.06, h: 0.33, fontSize: 8, bold: true, color: C.white, align: "center", margin: 0, fit: "shrink" });
      cursor += w;
    });
    const calculationText = neutralized
      ? "Quantidade e Avaliação são comparadas ao melhor resultado da equipe. Tempo Total e TMA permanecem fixos em 31,50 pontos para todos."
      : "Cada indicador é normalizado contra o melhor desempenho da equipe e multiplicado pelo peso definido. A soma dos quatro blocos gera a nota final.";
    slide.addText(calculationText, { x: 7.45, y: 2.75, w: 5.2, h: 0.78, fontSize: 13, color: C.ink, margin: 0, fit: "shrink" });
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.65, y: 4.38, w: 12, h: 1.38, fill: { color: "FFF8E9" }, line: { color: "E9D9B4" }, rectRadius: 0.05 });
    slide.addText("Leitura do modelo", { x: 0.95, y: 4.68, w: 2.25, h: 0.28, fontSize: 15, bold: true, color: "705D39", margin: 0 });
    const modelReading = neutralized
      ? "Tempo total e TMA somam 31,5 pontos fixos. A diferenciação do mês vem de quantidade e avaliação."
      : config.neutralizar_tempo_automaticos
        ? "Finalizados automaticamente contam em Quantidade e Avaliação. A duração artificial não participa de Tempo Total nem de TMA."
        : `${numBr(num(config.peso_tma, 30) + num(config.peso_avaliacao, 40), 0)}% da nota vem de eficiência e qualidade (TMA + Avaliação). Quantidade e tempo total permanecem relevantes.`;
    slide.addText(modelReading, { x: 3.15, y: 4.58, w: 9.05, h: 0.62, fontSize: 15, bold: true, color: C.ink, margin: 0, fit: "shrink", valign: "mid" });
    addFooter(pptx, slide, payload, page);
  }

  function addRanking(pptx, payload, page) {
    const slide = pptx.addSlide();
    const rows = payload.atual.ranking || [];
    const display = rows.slice(0, 10);
    addHeader(pptx, slide, payload, "Resultado oficial — ranking da competência", "RESULTADO OFICIAL");
    addTable(slide, [["Rank", "Atendente", "Nota", "Resultado"], ...display.map((r) => [`${intBr(r.rank)}º`, short(r.atendente, 25), numBr(r.nota_final), isAwarded(r) ? "Premiado" : num(r.elegivel) === 1 ? "Elegível" : "Abaixo"])], { x: 0.58, y: 1.25, w: 5.45, h: 4.98, colW: [0.7, 2.65, 1.15, 0.95], fontSize: 8.8, rowH: Math.min(0.43, 4.7 / (display.length + 1)) });
    slide.addChart(pptx.ChartType.bar, [{ name: "Nota final", labels: display.map((r) => short(r.atendente, 18)), values: display.map((r) => num(r.nota_final)) }], {
      x: 6.35, y: 1.25, w: 6.35, h: 4.98,
      catAxisLabelFontFace: "Aptos", catAxisLabelFontSize: 8,
      valAxisLabelFontFace: "Aptos", valAxisLabelFontSize: 8,
      valAxisMinVal: 0, valAxisMaxVal: 100, valAxisMajorUnit: 20,
      showLegend: false, showTitle: false, showValue: true,
      dataLabelPosition: "outEnd", dataLabelColor: C.navy2, dataLabelFormatCode: "0.00",
      chartColors: [C.blue], showCatName: false,
      showValue: true, showBorder: false, showGridLines: true,
      showValue: true, showCategoryName: false,
    });
    const eligible = rows.filter((r) => num(r.elegivel) === 1);
    const awarded = rows.filter(isAwarded);
    const extraEligible = eligible.filter((r) => !isAwarded(r));
    const rankingText = awarded.length
      ? `Premiados: ${awarded.map((r) => r.atendente).join(", ")}.${extraEligible.length ? ` Elegível fora do Top 3: ${extraEligible.map((r) => r.atendente).join(", ")}.` : ""}`
      : `Nenhum funcionário foi premiado nesta competência.`;
    slide.addText(rankingText, { x: 0.62, y: 6.43, w: 12, h: 0.3, fontSize: 12, bold: true, color: awarded.length ? C.green : C.red, margin: 0, fit: "shrink" });
    addFooter(pptx, slide, payload, page);
  }

  function addCalculationMemory(pptx, payload, page) {
    const slide = pptx.addSlide();
    const rows = (payload.atual.ranking || []).slice(0, 12);
    addHeader(pptx, slide, payload, "Memória de cálculo — modelo oficial", "TRANSPARÊNCIA DA NOTA");
    const table = [["#", "Atendente", "Atend.", "TMA", "Horas", "Aval.", "Qtd", "Tempo", "TMA", "Aval.", "Nota"]];
    rows.forEach((r) => table.push([
      `${intBr(r.rank)}º`, short(r.atendente, 18), intBr(r.atendimentos), numBr(r.tma_medio_min), numBr(r.horas_total, 1), r.avaliacao_media == null ? "—" : numBr(r.avaliacao_media), numBr(r.pontos_quantidade), numBr(r.pontos_tempo), numBr(r.pontos_tma), numBr(r.pontos_avaliacao), numBr(r.nota_final),
    ]));
    addTable(slide, table, { x: 0.42, y: 1.25, w: 12.49, h: 4.98, colW: [0.48, 1.72, 0.72, 0.72, 0.7, 0.66, 0.66, 0.66, 0.66, 0.66, 0.7], fontSize: 7.2, rowH: Math.min(0.42, 4.7 / (rows.length + 1)), margin: 0.035 });
    slide.addText("A nota final é a soma dos quatro critérios. O ranking respeita a pontuação calculada e mantém a memória completa disponível na exportação Excel.", { x: 0.58, y: 6.42, w: 12.15, h: 0.3, fontSize: 11.5, color: C.muted, margin: 0, fit: "shrink" });
    addFooter(pptx, slide, payload, page);
  }

  function addReferenceComparison(pptx, payload, page) {
    const slide = pptx.addSlide();
    const previous = payload.anterior;
    const comp = payload.comparativo || [];
    addHeader(pptx, slide, payload, previous?.competencia ? `Comparativo ${competenciaBr(previous.competencia)} x ${payload.competencia_br}` : "Comparativo mensal — primeira competência disponível", "EVOLUÇÃO DO HISTÓRICO");
    if (!previous?.competencia) {
      slide.addShape(pptx.ShapeType.roundRect, { x: 1.25, y: 2.1, w: 10.83, h: 2.75, fill: { color: C.paleBlue }, line: { color: "CFE1ED" }, rectRadius: 0.05 });
      slide.addText("Ainda não existe uma competência anterior", { x: 2, y: 2.78, w: 9.3, h: 0.5, fontSize: 24, bold: true, color: C.navy2, align: "center", margin: 0 });
      slide.addText("Quando outro mês for processado, esta seção mostrará variação de nota e ranking por funcionário.", { x: 2.2, y: 3.55, w: 8.9, h: 0.45, fontSize: 14, color: C.muted, align: "center", margin: 0, fit: "shrink" });
    } else {
      const rows = comp.slice(0, 10);
      addTable(slide, [["Atendente", "Rank ant.", "Nota ant.", "Rank atual", "Nota atual", "Δ Nota"], ...rows.map((r) => [short(r.atendente, 23), r.rank_anterior == null ? "—" : `${intBr(r.rank_anterior)}º`, r.nota_anterior == null ? "—" : numBr(r.nota_anterior), `${intBr(r.rank_atual)}º`, numBr(r.nota_atual), r.delta_nota == null ? "—" : `${num(r.delta_nota) >= 0 ? "+" : ""}${numBr(r.delta_nota)}`])], { x: 0.58, y: 1.3, w: 8.15, h: 4.7, colW: [2.55, 1, 1.1, 1, 1.1, 1.4], fontSize: 8.5, rowH: Math.min(0.42, 4.35 / (rows.length + 1)) });
      const deltas = rows.filter((r) => r.delta_nota != null);
      const best = [...deltas].sort((a, b) => num(b.delta_nota) - num(a.delta_nota))[0];
      const attention = [...deltas].sort((a, b) => num(a.delta_nota) - num(b.delta_nota))[0];
      const average = deltas.length ? deltas.reduce((sum, r) => sum + num(r.delta_nota), 0) / deltas.length : 0;
      addKpi(pptx, slide, 9.02, 1.3, 3.65, "Maior evolução", best ? short(best.atendente, 22) : "—", best ? `${best.delta_nota >= 0 ? "+" : ""}${numBr(best.delta_nota)} pts` : "Sem comparação", C.green, { valueSize: 17 });
      addKpi(pptx, slide, 9.02, 2.58, 3.65, "Maior atenção", attention ? short(attention.atendente, 22) : "—", attention ? `${attention.delta_nota >= 0 ? "+" : ""}${numBr(attention.delta_nota)} pts` : "Sem comparação", C.red, { valueSize: 17 });
      addKpi(pptx, slide, 9.02, 3.86, 3.65, "Média do grupo", `${average >= 0 ? "+" : ""}${numBr(average)} pts`, "variação média da nota", average >= 0 ? C.green : C.red, { valueSize: 18 });
      slide.addText("Variações positivas são apresentadas em verde; reduções recebem destaque em vermelho para orientar o acompanhamento.", { x: 9.05, y: 5.35, w: 3.55, h: 0.62, fontSize: 10.5, color: C.muted, margin: 0, fit: "shrink" });
    }
    addFooter(pptx, slide, payload, page);
  }

  function addIndicators(pptx, payload, page) {
    const slide = pptx.addSlide();
    const rows = (payload.atual.ranking || []).slice(0, 8);
    addHeader(pptx, slide, payload, "Painel comparativo de indicadores", "DESEMPENHO OPERACIONAL");
    const charts = [
      { title: "Atendimentos válidos", key: "atendimentos", color: C.blue, y: 1.52, format: "0" },
      { title: "TMA médio (min)", key: "tma_medio_min", color: C.gold, y: 3.25, format: "0.0" },
      { title: "Avaliação média", key: "avaliacao_media", color: C.purple, y: 4.98, format: "0.00" },
    ];
    charts.forEach((chart) => {
      slide.addText(chart.title, { x: 0.58, y: chart.y - 0.25, w: 8.8, h: 0.2, fontSize: 10, bold: true, color: C.ink, margin: 0 });
      slide.addChart(pptx.ChartType.bar, [{ name: chart.title, labels: rows.map((r) => short(r.atendente, 14)), values: rows.map((r) => num(r[chart.key])) }], {
        x: 0.58, y: chart.y, w: 8.7, h: 1.35,
        catAxisLabelFontSize: 6.6, valAxisLabelFontSize: 6.6,
        showLegend: false, showTitle: false, showValue: true,
        dataLabelPosition: "outEnd", dataLabelFormatCode: chart.format,
        dataLabelColor: C.navy2, chartColors: [chart.color], showBorder: false,
        showGridLines: true,
      });
    });
    const maxVolume = [...rows].sort((a, b) => num(b.atendimentos) - num(a.atendimentos))[0] || {};
    const bestTma = [...rows].filter((r) => num(r.tma_medio_min) > 0).sort((a, b) => num(a.tma_medio_min) - num(b.tma_medio_min))[0] || {};
    const bestRating = [...rows].sort((a, b) => num(b.avaliacao_media) - num(a.avaliacao_media))[0] || {};
    const leader = rows[0] || {};
    addSectionLabel(slide, "MELHORES MARCAS DO MÊS", 9.62, 1.36);
    addKpi(pptx, slide, 9.62, 1.75, 3.05, "Maior volume", short(maxVolume.atendente, 21), `${intBr(maxVolume.atendimentos)} atendimentos`, C.blue, { valueSize: 16 });
    addKpi(pptx, slide, 9.62, 2.98, 3.05, "Melhor TMA", short(bestTma.atendente, 21), `${numBr(bestTma.tma_medio_min)} min`, C.gold, { valueSize: 16 });
    addKpi(pptx, slide, 9.62, 4.21, 3.05, "Melhor avaliação", short(bestRating.atendente, 21), numBr(bestRating.avaliacao_media), C.purple, { valueSize: 16 });
    addKpi(pptx, slide, 9.62, 5.44, 3.05, "Maior nota", short(leader.atendente, 21), numBr(leader.nota_final), C.green, { valueSize: 16 });
    addFooter(pptx, slide, payload, page);
  }

  function addOperatorComparison(pptx, payload, page) {
    const slide = pptx.addSlide();
    const previous = payload.anterior;
    const rows = (payload.comparativo || []).filter((r) => r.delta_nota != null).slice(0, 10);
    addHeader(pptx, slide, payload, previous?.competencia ? `Comparativo ${competenciaBr(previous.competencia)} x ${payload.competencia_br} por funcionário` : "Evolução mensal por funcionário", "VARIAÇÃO DA NOTA");
    if (!rows.length) {
      slide.addText("O comparativo será liberado automaticamente quando houver uma competência anterior com os mesmos funcionários.", { x: 1.3, y: 2.7, w: 10.7, h: 0.8, fontSize: 22, bold: true, color: C.navy2, align: "center", margin: 0, fit: "shrink" });
    } else {
      const deltas = rows.map((r) => num(r.delta_nota));
      const bound = Math.max(5, Math.ceil(Math.max(...deltas.map(Math.abs)) / 5) * 5);
      slide.addChart(pptx.ChartType.bar, [{ name: "Variação da nota", labels: rows.map((r) => short(r.atendente, 18)), values: deltas }], {
        x: 0.58, y: 1.32, w: 7.25, h: 4.8,
        catAxisLabelFontSize: 8, valAxisLabelFontSize: 8,
        valAxisMinVal: -bound, valAxisMaxVal: bound,
        showLegend: false, showTitle: false, showValue: true,
        dataLabelPosition: "outEnd", dataLabelFormatCode: "+0.00;-0.00;0.00",
        chartColors: [C.blue], showBorder: false, showGridLines: true,
      });
      const best = [...rows].sort((a, b) => num(b.delta_nota) - num(a.delta_nota))[0];
      const attention = [...rows].sort((a, b) => num(a.delta_nota) - num(b.delta_nota))[0];
      const entered = rows.filter((r) => num(r.nota_anterior) < minScore(payload) && num(r.nota_atual) >= minScore(payload));
      addKpi(pptx, slide, 8.25, 1.32, 4.42, "Maior evolução", short(best.atendente, 28), `${best.delta_nota >= 0 ? "+" : ""}${numBr(best.delta_nota)} pts`, C.green, { valueSize: 18 });
      addKpi(pptx, slide, 8.25, 2.58, 4.42, "Entraram na meta", intBr(entered.length), entered.map((r) => r.atendente).join(" e ") || "Nenhuma nova entrada", C.gold);
      addKpi(pptx, slide, 8.25, 3.84, 4.42, "Maior atenção", short(attention.atendente, 28), `${attention.delta_nota >= 0 ? "+" : ""}${numBr(attention.delta_nota)} pts`, C.red, { valueSize: 18 });
      const avg = rows.reduce((sum, r) => sum + num(r.delta_nota), 0) / rows.length;
      addKpi(pptx, slide, 8.25, 5.10, 4.42, "Média do grupo", `${avg >= 0 ? "+" : ""}${numBr(avg)} pts`, "evolução média", avg >= 0 ? C.green : C.red);
      slide.addText("Leitura: evoluções positivas indicam avanço no equilíbrio entre quantidade, eficiência e avaliação; reduções orientam o plano individual do próximo ciclo.", { x: 0.62, y: 6.4, w: 12, h: 0.33, fontSize: 10.5, color: C.muted, margin: 0, fit: "shrink" });
    }
    addFooter(pptx, slide, payload, page);
  }

  function addIndividual(pptx, payload, row, page) {
    const slide = pptx.addSlide();
    const status = resultStatus(row, payload);
    const awarded = isAwarded(row);
    addHeader(pptx, slide, payload, `Detalhamento individual — ${row.atendente}`, "ANÁLISE DO FUNCIONÁRIO");
    const kpiW = 2.32, gap = 0.16;
    addKpi(pptx, slide, 0.58, 1.25, kpiW, "Atendimentos válidos", intBr(row.atendimentos), "base após filtros", C.blue);
    addKpi(pptx, slide, 0.58 + (kpiW + gap), 1.25, kpiW, "TMA médio", `${numBr(row.tma_medio_min)} min`, "até a última mensagem", C.gold, { valueSize: 17 });
    addKpi(pptx, slide, 0.58 + 2 * (kpiW + gap), 1.25, kpiW, "Avaliação média", row.avaliacao_media == null ? "—" : numBr(row.avaliacao_media), `escala 0 a ${numBr(configOf(payload).escala_avaliacao_max || 5, 0)}`, C.purple);
    addKpi(pptx, slide, 0.58 + 3 * (kpiW + gap), 1.25, kpiW, "Horas absorvidas", `${numBr(row.horas_total, 1)} h`, "tempo total válido", C.slate, { valueSize: 17 });
    addKpi(pptx, slide, 0.58 + 4 * (kpiW + gap), 1.25, kpiW, "Nota final", numBr(row.nota_final), `${intBr(row.rank)}º lugar`, awarded ? C.green : num(row.elegivel) === 1 ? C.gold : C.red);
    const table = [
      ["Indicador", "Pontos", "Leitura"],
      ["Quantidade", numBr(row.pontos_quantidade), `Peso ${numBr(configOf(payload).peso_quantidade || 20, 0)} — volume válido`],
      ["Tempo total", numBr(row.pontos_tempo), configOf(payload).modo === "neutralizado" ? "Pontuação fixa — regra da competência" : `Peso ${numBr(configOf(payload).peso_tempo || 10, 0)} — absorção operacional`],
      ["TMA", numBr(row.pontos_tma), configOf(payload).modo === "neutralizado" ? "Pontuação fixa — regra da competência" : `Peso ${numBr(configOf(payload).peso_tma || 30, 0)} — eficiência`],
      ["Avaliação", numBr(row.pontos_avaliacao), `Peso ${numBr(configOf(payload).peso_avaliacao || 40, 0)} — qualidade percebida`],
      ["Nota final", numBr(row.nota_final), status],
    ];
    addTable(slide, table, { x: 0.58, y: 2.65, w: 7.15, h: 3.25, colW: [1.55, 1, 4.6], fontSize: 9.4, rowH: 0.48 });
    slide.addShape(pptx.ShapeType.roundRect, { x: 8.08, y: 2.65, w: 4.62, h: 3.25, fill: { color: C.paleBlue }, line: { color: "CFE1ED" }, rectRadius: 0.05 });
    slide.addText("Análise executiva", { x: 8.4, y: 2.98, w: 3.9, h: 0.3, fontSize: 16, bold: true, color: C.navy2, margin: 0 });
    const feedback = splitFeedback(row.feedback).slice(0, 4);
    slide.addText(feedback.map((sentence) => ({ text: `• ${sentence}\n`, options: { bullet: false, breakLine: true } })), { x: 8.4, y: 3.45, w: 3.9, h: 1.8, fontSize: 11.2, color: C.ink, margin: 0.02, breakLine: true, fit: "shrink", valign: "top" });
    slide.addShape(pptx.ShapeType.roundRect, { x: 8.4, y: 5.35, w: 3.9, h: 0.36, fill: { color: awarded ? "E8F5F0" : num(row.elegivel) === 1 ? "FFF3DD" : "FBECEC" }, line: { color: awarded ? "C4E5DA" : num(row.elegivel) === 1 ? "E8D3A4" : "EAC7C7" }, rectRadius: 0.04 });
    slide.addText(status, { x: 8.55, y: 5.44, w: 3.6, h: 0.14, fontSize: 9.5, bold: true, color: awarded ? C.green : num(row.elegivel) === 1 ? C.gold : C.red, align: "center", margin: 0, fit: "shrink" });
    addFooter(pptx, slide, payload, page);
  }

  function addInsights(pptx, payload, page) {
    const slide = pptx.addSlide();
    const rows = (payload.atual.ranking || []).slice(0, 12);
    addHeader(pptx, slide, payload, "Insights dos funcionários e oportunidades", "PLANO DE DESENVOLVIMENTO");
    const table = [["Atendente", "Força do mês", "Oportunidade principal"]];
    rows.forEach((row) => {
      const labels = componentLabels(row);
      const sentences = splitFeedback(row.feedback);
      table.push([short(row.atendente, 24), short(sentences[0]?.replace(/^Ponto forte:\s*/i, "") || labels.force, 56), short(sentences[1]?.replace(/^Foco:\s*/i, "") || `Evoluir ${labels.opportunity.toLowerCase()}`, 62)]);
    });
    addTable(slide, table, { x: 0.58, y: 1.27, w: 12.15, h: 4.9, colW: [2.4, 4.7, 5.05], fontSize: rows.length > 9 ? 7.4 : 8.7, rowH: Math.min(0.45, 4.6 / (rows.length + 1)), margin: 0.045 });
    slide.addText("Síntese: o ranking deve orientar um foco específico por funcionário. O objetivo não é melhorar todos os indicadores ao mesmo tempo, e sim atuar no critério com maior potencial de ganho.", { x: 0.62, y: 6.4, w: 12, h: 0.34, fontSize: 11.5, bold: true, color: C.navy2, margin: 0, fit: "shrink" });
    addFooter(pptx, slide, payload, page);
  }

  function addRecommendations(pptx, payload, page) {
    const slide = pptx.addSlide();
    addHeader(pptx, slide, payload, "Recomendação para continuidade", "PRÓXIMO CICLO");
    const recommendations = [
      "Publicar mensalmente a memória de cálculo: quantidade, horas, TMA, avaliação, pontos por indicador e nota final.",
      "Acompanhar semanalmente os indicadores para evitar surpresa no fechamento da competência.",
      "Criar um plano individual por funcionário, focando no indicador que mais reduziu a nota.",
      "Manter a régua oficial da competência e registrar qualquer exceção diretamente nos parâmetros de auditoria.",
    ];
    recommendations.forEach((item, index) => {
      const y = 1.36 + index * 0.92;
      slide.addShape(pptx.ShapeType.ellipse, { x: 0.78, y, w: 0.5, h: 0.5, fill: { color: index === 3 ? C.gold : C.blue }, line: { transparency: 100 } });
      slide.addText(String(index + 1), { x: 0.78, y: y + 0.11, w: 0.5, h: 0.18, fontSize: 11, bold: true, color: C.white, align: "center", margin: 0 });
      slide.addText(item, { x: 1.55, y: y - 0.01, w: 10.7, h: 0.52, fontSize: 15, color: C.ink, margin: 0, fit: "shrink", valign: "mid" });
    });
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.78, y: 5.38, w: 11.75, h: 1.05, fill: { color: C.navy }, line: { color: C.navy }, rectRadius: 0.05 });
    slide.addText("Mensagem final para o time", { x: 1.06, y: 5.64, w: 2.8, h: 0.25, fontSize: 13, bold: true, color: "72BCE9", margin: 0 });
    slide.addText("A premiação reconhece quem atende bem, resolve com eficiência e mantém volume saudável. A elegibilidade depende do equilíbrio entre produtividade e experiência do cliente.", { x: 3.6, y: 5.56, w: 8.45, h: 0.5, fontSize: 14.5, bold: true, color: C.white, margin: 0, fit: "shrink", valign: "mid" });
    addFooter(pptx, slide, payload, page);
  }

  async function gerar(payload, options = {}) {
    if (!root.PptxGenJS) throw new Error("Biblioteca de PowerPoint indisponível.");
    if (!payload?.atual?.info || !payload?.atual?.ranking?.length) throw new Error("A competência não possui dados suficientes para gerar a apresentação.");
    const pptx = new root.PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Premiação do Suporte";
    pptx.company = "Gestão de Performance";
    pptx.subject = `Apuração da premiação — ${payload.competencia_br || competenciaBr(payload.competencia)}`;
    pptx.title = `Premiação do Suporte — ${payload.competencia_br || competenciaBr(payload.competencia)}`;
    pptx.lang = "pt-BR";
    pptx.theme = {
      headFontFace: "Aptos Display",
      bodyFontFace: "Aptos",
      lang: "pt-BR",
    };
    pptx.defineSlideMaster({
      title: "PREMIACAO_BASE",
      background: { color: C.white },
      objects: [],
      slideNumber: { x: 12.4, y: 7.16, w: 0.35, h: 0.14, color: C.muted, fontFace: "Aptos", fontSize: 6.5, align: "right" },
    });

    addCover(pptx, payload);
    let page = 1;
    addExecutiveApuration(pptx, payload, page++);
    addExecutiveSummary(pptx, payload, page++);
    addRules(pptx, payload, page++);
    addMethodology(pptx, payload, page++);
    addRanking(pptx, payload, page++);
    addCalculationMemory(pptx, payload, page++);
    addReferenceComparison(pptx, payload, page++);
    addIndicators(pptx, payload, page++);
    addOperatorComparison(pptx, payload, page++);
    payload.atual.ranking.forEach((row) => addIndividual(pptx, payload, row, page++));
    addInsights(pptx, payload, page++);
    addRecommendations(pptx, payload, page++);

    const fileName = options.fileName || `APRESENTACAO_PREMIACAO_SUPORTE_${cleanFile(payload.competencia_br || payload.competencia)}.pptx`;
    await pptx.writeFile({ fileName, compression: true });
    return { fileName, slideCount: 12 + payload.atual.ranking.length };
  }

  root.PremiacaoPowerPoint = { gerar, componentLabels, splitFeedback };
  if (typeof module !== "undefined" && module.exports) module.exports = root.PremiacaoPowerPoint;
})(typeof globalThis !== "undefined" ? globalThis : window);
