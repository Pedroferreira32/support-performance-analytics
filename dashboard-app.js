"use strict";

const META_ELEGIBILIDADE = 85;

const state = {
  resumo: null,
  competencia: null,
  arquivo: null,
  historico: [],
  gerencial: null,
  auditoria: null,
  automaticos: null,
  operacional: null,
  powerpoint: null,
  view: "sobre",
  demo: false,
  auditPage: 1,
  automaticosPage: 1,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const nfmt = (value, digits = 0) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
};
const esc = (value) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const compBr = (value) => {
  const parts = String(value ?? "").split("-");
  return parts.length === 2 ? `${parts[1]}/${parts[0]}` : String(value ?? "—");
};
const dataCurta = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replace("T", " ").slice(0, 19);
  return date.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};
const truncate = (text, length = 22) => String(text ?? "").length > length
  ? `${String(text).slice(0, length - 1)}…` : String(text ?? "");
const isPremiado = (row) => Number(row?.premiado) === 1
  || (Number(row?.elegivel) === 1 && Number(row?.rank) <= 3);
const statusPremiacao = (row) => isPremiado(row)
  ? '<span class="badge success">Premiado</span>'
  : Number(row?.elegivel) === 1
    ? '<span class="badge warning">Elegível — fora do Top 3</span>'
    : '<span class="badge neutral">Abaixo da meta</span>';

const QUALITY_CODES = new Set(["SEM_ATENDENTE", "DATA_INVALIDA", "SEM_FINALIZACAO", "DURACAO_NEGATIVA"]);
const SCOPE_CODES = new Set(["FORA_SUPORTE", "ATENDENTE_EXCLUIDO", "PERIODO"]);
const EXCEPTION_CODES = new Set(["ACIMA_H"]);
const exclusionCategory = (code) => QUALITY_CODES.has(String(code))
  ? { key: "quality", label: "Qualidade dos dados" }
  : SCOPE_CODES.has(String(code))
    ? { key: "scope", label: "Fora do escopo" }
    : EXCEPTION_CODES.has(String(code))
      ? { key: "exception", label: "Exceção operacional" }
      : { key: "other", label: "Outros controles" };

async function api(url, options = {}) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const type = response.headers.get("content-type") || "";
  const payload = type.includes("application/json") ? await response.json() : null;
  if (!response.ok) throw new Error(payload?.erro || `Falha na requisição (${response.status}).`);
  return payload;
}

function loading(active) { $("#loading").classList.toggle("hidden", !active); }

function toast(message, type = "info", duration = 4500) {
  const node = document.createElement("div");
  node.className = `toast ${type}`;
  node.textContent = message;
  $("#toast-stack").appendChild(node);
  window.setTimeout(() => node.remove(), duration);
}

function aplicarModoDemonstracao() {
  document.body.classList.toggle("demo-mode", state.demo);
  $("#demo-banner").classList.toggle("hidden", !state.demo);
  $("#import-demo-note").classList.toggle("hidden", !state.demo);
  $("#feedback-demo-note").classList.toggle("hidden", !state.demo);
  $("#sidebar-status").textContent = state.demo ? "Demonstração pública" : "Sistema local";
  $("#sidebar-note").textContent = state.demo
    ? "Base sintética e ambiente somente leitura."
    : "Os dados permanecem neste computador.";

  if (!state.demo) return;
  $("#arquivo-upload").disabled = true;
  $("#import-competencia").disabled = true;
  $("#import-excluidos").disabled = true;
  $("#processar-btn").disabled = true;
  $("#feedback-texto").readOnly = true;
  $("#feedback-save").disabled = true;
}

function setSelectOptions(select, values, selected, formatter = (v) => v, placeholder = null) {
  if (!select) return;
  const items = [];
  if (placeholder) items.push(`<option value="">${esc(placeholder)}</option>`);
  for (const value of values) {
    items.push(`<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(formatter(value))}</option>`);
  }
  select.innerHTML = items.join("");
}

function showView(name) {
  if (name === "automaticos") name = "auditoria";
  state.view = name;
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${name}`));
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === name));
  const view = $(`#view-${name}`);
  $("#page-title").textContent = view?.dataset.title || "Support Performance";
  $("#global-filter-wrap").classList.toggle("hidden", ["importacao", "historico", "sobre"].includes(name));
  $("#header-excel").classList.toggle("hidden", name === "sobre");
  $("#header-ppt").classList.toggle("hidden", name === "sobre");
  $("#sidebar").classList.remove("open");
  if (window.location.hash !== `#${name}`) history.replaceState(null, "", `#${name}`);
  if (name === "historico") loadHistorico($("#historico-atendente").value);
  if (name === "gerencial") loadGerencial(state.competencia);
  if (name === "operacional") loadOperacional(state.competencia);
  if (name === "auditoria") {
    const competencia = $("#auditoria-competencia").value || state.competencia;
    loadAuditoria(competencia);
    loadAutomaticos(competencia);
  }
  if (name === "powerpoint") loadPowerPoint($("#powerpoint-competencia").value || state.competencia);
  window.scrollTo({ top: 0, behavior: "auto" });
}

function syncCompetencias(competencias, selected) {
  setSelectOptions($("#global-competencia"), competencias, selected, compBr);
  setSelectOptions($("#auditoria-competencia"), competencias, selected, compBr);
  setSelectOptions($("#automaticos-competencia"), competencias, selected, compBr);
  setSelectOptions($("#powerpoint-competencia"), competencias, selected, compBr);
}

async function loadResumo(competencia = "") {
  loading(true);
  try {
    const suffix = competencia ? `?competencia=${encodeURIComponent(competencia)}` : "";
    const data = await api(`/api/resumo${suffix}`);
    state.resumo = data;
    state.competencia = data.competencia;
    syncCompetencias(data.competencias || [], data.competencia);
    setSelectOptions($("#historico-atendente"), data.atendentes || [], $("#historico-atendente").value || data.atendentes?.[0], (v) => v, "Selecione");
    renderDashboard(data);
  } catch (error) {
    toast(error.message, "error");
  } finally {
    loading(false);
  }
}

function renderDashboard(data) {
  const empty = !data.competencia || !data.info || !(data.ranking || []).length;
  $("#dashboard-empty").classList.toggle("hidden", !empty);
  $("#dashboard-content").classList.toggle("hidden", empty);
  if (empty) return;

  const info = data.info;
  const ranking = data.ranking || [];
  const leader = ranking[0];
  const meta = Number(info.configuracao?.nota_minima ?? META_ELEGIBILIDADE);
  const elegiveis = ranking.filter((item) => Number(item.elegivel) === 1).length;
  const premiados = ranking.filter(isPremiado).length;
  const stats = info.estatisticas || {};
  const config = info.configuracao || {};
  const fixedRule = Boolean(config.pontuacao_tempo_tma_fixa);
  const effectiveCeiling = fixedRule
    ? 31.5 + Number(config.peso_quantidade || 0) + Number(config.peso_avaliacao || 0)
    : Number(config.peso_quantidade || 0) + Number(config.peso_tempo || 0) + Number(config.peso_tma || 0) + Number(config.peso_avaliacao || 0);
  const total = Number(info.total_linhas || 0);
  const validos = Number(info.validos || 0);
  const taxa = total ? (validos / total) * 100 : 0;

  renderProjectOverview(data, { meta, elegiveis, premiados, effectiveCeiling, taxa });

  $("#source-strip").innerHTML = `<strong>Competência ${esc(compBr(data.competencia))}</strong> &nbsp;·&nbsp; Fonte: ${esc(info.arquivo_origem || "—")} &nbsp;·&nbsp; Atualizado em ${esc(dataCurta(info.processado_em))} &nbsp;·&nbsp; ${esc(info.configuracao?.perfil_regra || "Regra oficial")}`;
  $("[data-kpi='validos']").textContent = nfmt(info.validos);
  $("[data-kpi-foot='validos']").textContent = `${nfmt(taxa, 1)}% da base importada`;
  $("[data-kpi='excluidos']").textContent = nfmt(info.excluidos);
  $("[data-kpi-foot='excluidos']").textContent = `${nfmt(100 - taxa, 1)}% dos registros analisados`;
  $("[data-kpi='lider']").textContent = leader?.atendente || "—";
  $("[data-kpi='nota']").textContent = nfmt(leader?.nota_final, 2);
  $("[data-kpi-foot='nota']").textContent = `de ${nfmt(effectiveCeiling, 2)} pontos possíveis`;
  $("[data-kpi='premiados']").textContent = nfmt(premiados);
  $("[data-kpi-foot='premiados']").textContent = `${nfmt(premiados)} de ${nfmt(elegiveis)} ${elegiveis === 1 ? "elegível" : "elegíveis"}`;
  $("[data-kpi='automaticos']").textContent = nfmt(info.suspeitos_automaticos || stats.AUTOMATICOS_VALIDOS || 0);

  const notaLeader = Number(leader?.nota_final || 0);
  const gap = Math.max(0, meta - notaLeader);
  let insight = `${leader?.atendente || "A liderança"}: ${nfmt(notaLeader, 2)} de ${nfmt(effectiveCeiling, 2)}.`;
  if (elegiveis > 0) insight += ` ${elegiveis} ${elegiveis === 1 ? "elegível" : "elegíveis"}; ${premiados} ${premiados === 1 ? "premiado" : "premiados"}.`;
  else insight += ` Nenhum elegível; menor distância para a meta: ${nfmt(gap, 2)} pontos.`;
  $("#insight-text").textContent = insight;

  renderRankingChart($("#ranking-chart"), ranking.slice(0, 12), meta, effectiveCeiling);
  const formula = $(".score-formula");
  formula.classList.toggle("fixed-rule", fixedRule);
  formula.classList.toggle("standard-rule", !fixedRule);
  if (fixedRule) {
    formula.innerHTML = `<span><small>Base fixa</small><strong>31,50</strong><em>Tempo + TMA</em></span><b>+</b><span><small>Variável</small><strong>${nfmt(config.peso_quantidade, 2)}</strong><em>Quantidade</em></span><b>+</b><span><small>Variável</small><strong>${nfmt(config.peso_avaliacao, 2)}</strong><em>Avaliação</em></span><b>=</b><span class="score-total"><small>Teto efetivo</small><strong>${nfmt(effectiveCeiling, 2)}</strong><em>meta ${nfmt(meta, 2)}</em></span>`;
  } else {
    const parts = [["Quantidade", config.peso_quantidade], ["Tempo", config.peso_tempo], ["TMA", config.peso_tma], ["Avaliação", config.peso_avaliacao]];
    formula.innerHTML = `${parts.map(([label, value]) => `<span><small>Critério</small><strong>${nfmt(value, 2)}</strong><em>${esc(label)}</em></span>`).join("")}<span class="score-total"><small>Teto da regra</small><strong>${nfmt(effectiveCeiling, 2)}</strong><em>meta ${nfmt(meta, 2)}</em></span>`;
  }
  renderCompositionChart($("#composition-chart"), ranking.slice(0, 8), fixedRule, effectiveCeiling);
  renderRankingTable(ranking, "", meta);
  $("#dashboard-export").onclick = () => exportar(state.competencia);
}

function renderProjectOverview(data, context) {
  const info = data.info || {};
  const config = info.configuracao || {};
  const stats = info.estatisticas || {};
  const validos = Number(info.validos || 0);
  const avaliacoes = Number(stats.AVALIACOES_VALIDAS || (data.ranking || []).reduce((sum, row) => sum + Number(row.avaliacoes || 0), 0));
  const coverage = validos ? avaliacoes / validos * 100 : 0;
  const fixedRule = Boolean(config.pontuacao_tempo_tma_fixa);
  const automaticText = config.incluir_finalizados_automaticamente
    ? (config.neutralizar_tempo_automaticos
      ? "Incluídos; duração artificial sem impacto em Tempo/TMA"
      : "Incluídos conforme a regra da competência")
    : "Tratamento histórico da competência";

  $("#overview-competence").textContent = compBr(data.competencia);
  $("#overview-cutoff").textContent = `${nfmt(context.meta, 2)} pontos`;
  $("#overview-rule-profile").textContent = config.perfil_regra || "Regra oficial da competência";
  $("#overview-scope").textContent = `${config.departamento_alvo || "Suporte"} · ${config.somente_finalizados ? "atendimentos finalizados" : "status conforme a fonte"}`;
  $("#overview-window").textContent = config.incluir_fora_expediente
    ? "Sem corte de expediente"
    : `Segunda a sábado · ${config.hora_inicio || "08:00"}–${config.hora_fim || "19:59"}`;
  $("#overview-duration").textContent = `${nfmt(config.max_horas, 0)} horas no máximo`;
  $("#overview-automatic").textContent = automaticText;
  $("#overview-eligibility").textContent = `Índice ≥ ${nfmt(context.meta, 2)}`;

  const formula = $("#overview-formula");
  if (fixedRule) {
    formula.innerHTML = `<span><small>Base fixa</small><strong>31,50</strong><em>Tempo + TMA</em></span><b>+</b><span><small>Quantidade</small><strong>${nfmt(config.peso_quantidade, 2)}</strong><em>variável</em></span><b>+</b><span><small>Avaliação</small><strong>${nfmt(config.peso_avaliacao, 2)}</strong><em>variável</em></span><b>=</b><span class="formula-total"><small>Teto efetivo</small><strong>${nfmt(context.effectiveCeiling, 2)}</strong><em>meta ${nfmt(context.meta, 2)}</em></span>`;
  } else {
    formula.innerHTML = `<span><small>Quantidade</small><strong>${nfmt(config.peso_quantidade, 2)}</strong></span><b>+</b><span><small>Tempo + TMA</small><strong>${nfmt(Number(config.peso_tempo || 0) + Number(config.peso_tma || 0), 2)}</strong></span><b>+</b><span><small>Avaliação</small><strong>${nfmt(config.peso_avaliacao, 2)}</strong></span><b>=</b><span class="formula-total"><small>Teto da regra</small><strong>${nfmt(context.effectiveCeiling, 2)}</strong></span>`;
  }

  $("[data-overview-kpi='score']").textContent = `0–${nfmt(context.effectiveCeiling, 2)}`;
  $("[data-overview-kpi='awards']").textContent = `${nfmt(context.premiados)} de ${nfmt(context.elegiveis)}`;
  $("[data-overview-kpi='drivers']").textContent = `${nfmt(config.peso_quantidade, 0)} + ${nfmt(config.peso_avaliacao, 0)} pts`;
  $("[data-overview-kpi='coverage']").textContent = `${nfmt(coverage, 1)}%`;
  $("[data-overview-kpi='validation']").textContent = `${nfmt(context.taxa, 1)}%`;
}

function renderRankingTable(rows, search = "", meta = META_ELEGIBILIDADE) {
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = rows.filter((row) => !term || String(row.atendente).toLocaleLowerCase("pt-BR").includes(term));
  $("#ranking-table tbody").innerHTML = filtered.map((row) => `
    <tr>
      <td class="rank-cell">${nfmt(row.rank)}º</td>
      <td><strong>${esc(row.atendente)}</strong></td>
      <td class="num">${nfmt(row.atendimentos)}</td>
      <td class="num">${nfmt(row.pontos_quantidade, 2)}</td>
      <td class="num">${row.avaliacao_media == null ? "—" : nfmt(row.avaliacao_media, 2)}</td>
      <td class="num">${Number(row.atendimentos) ? `${nfmt(Number(row.avaliacoes || 0) / Number(row.atendimentos) * 100, 1)}%` : "—"}</td>
      <td class="num">${nfmt(row.pontos_avaliacao, 2)}</td>
      <td class="num"><strong>${nfmt(row.nota_final, 2)}</strong></td>
      <td class="num">${Number(row.nota_final) >= Number(meta) ? '<span class="cutoff-met">Atingida</span>' : `<strong>${nfmt(Number(meta) - Number(row.nota_final), 2)}</strong> pts`}</td>
      <td>${statusPremiacao(row)}</td>
    </tr>`).join("");
}

function chartEmpty(host, message = "Dados insuficientes para exibir o gráfico.") {
  host.innerHTML = `<div class="chart-empty">${esc(message)}</div>`;
}

function renderRankingChart(host, rows, meta = META_ELEGIBILIDADE, maxScore = 100) {
  if (!rows.length) return chartEmpty(host);
  const values = rows.map((row) => Number(row.nota_final || 0));
  const domainMin = Math.max(0, Math.floor((Math.min(...values, meta) - 3) / 5) * 5);
  const domainMax = Math.ceil((Math.max(...values, maxScore, meta) + 1) / 5) * 5;
  const width = 860, left = 165, right = 165, top = 38, rowHeight = 46;
  const height = top + rows.length * rowHeight + 48;
  const bottom = height - 40, plot = width - left - right;
  const x = (value) => left + ((Number(value) - domainMin) / (domainMax - domainMin || 1)) * plot;
  const metaX = x(meta);
  const ticks = [];
  for (let tick = domainMin; tick <= domainMax; tick += 5) ticks.push(tick);
  const grid = ticks.map((tick) => `<line x1="${x(tick)}" y1="${top - 6}" x2="${x(tick)}" y2="${bottom}" stroke="${tick === meta ? "#9b5f43" : "#e6e9eb"}" stroke-width="${tick === meta ? 1.5 : 1}" ${tick === meta ? 'stroke-dasharray="5 5"' : ""}/><text x="${x(tick)}" y="${height - 15}" text-anchor="middle" fill="#71808c" font-size="10">${nfmt(tick)}</text>`).join("");
  const marks = rows.map((row, index) => {
    const y = top + index * rowHeight + 15;
    const note = Number(row.nota_final || 0);
    const pointX = x(note);
    const awarded = isPremiado(row);
    const eligible = Number(row.elegivel) === 1;
    const fill = awarded ? "#173b58" : eligible ? "#c28a2c" : "#ffffff";
    const stroke = awarded ? "#173b58" : eligible ? "#c28a2c" : "#7d8993";
    const radius = awarded ? 10 : 7;
    const status = awarded ? `Premiado · ${nfmt(row.rank)}º` : eligible ? "Elegível · fora do Top 3" : "Abaixo da meta";
    const scoreAnchor = pointX > width - right - 42 ? "end" : "start";
    const scoreX = pointX > width - right - 42 ? pointX - 13 : pointX + 13;
    const tooltip = `${row.atendente}|Índice: ${nfmt(note, 2)}|Quantidade: ${nfmt(row.pontos_quantidade, 2)} pts|Avaliação: ${nfmt(row.pontos_avaliacao, 2)} pts|${status}`;
    return `<text x="${left - 14}" y="${y + 4}" text-anchor="end" fill="#2f414f" font-size="11" font-weight="600">${esc(truncate(row.atendente, 23))}</text><line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="#e5e9ec"/><circle cx="${pointX}" cy="${y}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2" data-tooltip="${esc(tooltip)}"/>${awarded ? `<text x="${pointX}" y="${y + 3.5}" text-anchor="middle" fill="#fff" font-size="9" font-weight="800">${nfmt(row.rank)}</text>` : ""}<text x="${scoreX}" y="${y + 4}" text-anchor="${scoreAnchor}" fill="#173b58" font-size="11" font-weight="800">${nfmt(note, 2)}</text><text x="${width - right + 18}" y="${y + 4}" fill="${awarded ? "#173b58" : eligible ? "#8d621f" : "#74818b"}" font-size="9" font-weight="700">${esc(status)}</text>`;
  }).join("");
  host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Índice oficial por funcionário em relação à meta"><rect x="${metaX}" y="${top - 8}" width="${width - right - metaX}" height="${bottom - top + 8}" fill="#f3f7f5"/><text x="${metaX + 7}" y="${top - 17}" fill="#48685d" font-size="9" font-weight="800">FAIXA ELEGÍVEL · ${nfmt(meta, 0)}+</text>${grid}${marks}</svg>`;
  activateTooltips(host);
}

function renderCompositionChart(host, rows, fixedRule = true, maxScore = 100) {
  if (!rows.length) return chartEmpty(host);
  const leader = rows[0];
  const base = Number(leader.pontos_tempo || 0) + Number(leader.pontos_tma || 0);
  const steps = fixedRule
    ? [["Base fixa", base, "Tempo + TMA iguais para a equipe"], ["Quantidade", Number(leader.pontos_quantidade || 0), `${nfmt(leader.atendimentos)} atendimentos válidos`], ["Avaliação", Number(leader.pontos_avaliacao || 0), `CSAT ${leader.avaliacao_media == null ? "—" : nfmt(leader.avaliacao_media, 2)}`]]
    : [["Quantidade", Number(leader.pontos_quantidade || 0), `${nfmt(leader.atendimentos)} atendimentos válidos`], ["Tempo total", Number(leader.pontos_tempo || 0), "Regra histórica"], ["TMA", Number(leader.pontos_tma || 0), "Regra histórica"], ["Avaliação", Number(leader.pontos_avaliacao || 0), `CSAT ${leader.avaliacao_media == null ? "—" : nfmt(leader.avaliacao_media, 2)}`]];
  const bridge = steps.map(([label, value, note], index) => `${index ? '<b class="bridge-operator">+</b>' : ""}<div class="bridge-step"><span>${esc(label)}</span><strong>${nfmt(value, 2)}</strong><small>${esc(note)}</small></div>`).join("");
  const note = Number(leader.nota_final || 0);
  const ceilingUse = maxScore ? note / maxScore * 100 : 0;
  host.innerHTML = `<div class="score-bridge">${bridge}<b class="bridge-operator">=</b><div class="bridge-step bridge-total"><span>Índice final</span><strong>${nfmt(note, 2)}</strong><small>${nfmt(ceilingUse, 1)}% do teto efetivo</small></div></div><div class="bridge-conclusion"><span>LIDERANÇA DA COMPETÊNCIA</span><strong>${esc(leader.atendente)}</strong><p>${nfmt(note, 2)} pontos de ${nfmt(maxScore, 2)} possíveis. A nota ficou ${nfmt(Math.max(0, maxScore - note), 2)} ponto(s) abaixo do teto.</p></div>`;
}

async function loadGerencial(competencia = state.competencia || "") {
  loading(true);
  try {
    const suffix = competencia ? `?competencia=${encodeURIComponent(competencia)}` : "";
    const data = await api(`/api/gerencial${suffix}`);
    state.gerencial = data;
    renderGerencial(data);
  } catch (error) {
    toast(error.message, "error");
  } finally {
    loading(false);
  }
}

function renderGerencial(data) {
  const ranking = data?.dispersao || [];
  const empty = !data?.competencia || !ranking.length;
  $("#gerencial-empty").classList.toggle("hidden", !empty);
  $("#gerencial-content").classList.toggle("hidden", empty);
  if (empty) return;

  const metrics = data.metricas || {};
  const info = data.atual?.info || {};
  const managerConfig = info.configuracao || {};
  const managerCeiling = managerConfig.pontuacao_tempo_tma_fixa
    ? 31.5 + Number(managerConfig.peso_quantidade || 0) + Number(managerConfig.peso_avaliacao || 0)
    : Number(managerConfig.peso_quantidade || 0) + Number(managerConfig.peso_tempo || 0) + Number(managerConfig.peso_tma || 0) + Number(managerConfig.peso_avaliacao || 0);
  const anterior = data.competencia_anterior ? compBr(data.competencia_anterior) : "não disponível";
  $("#gerencial-source").innerHTML = `<strong>Competência ${esc(compBr(data.competencia))}</strong> &nbsp;·&nbsp; Fonte: ${esc(info.arquivo_origem || "—")} &nbsp;·&nbsp; Comparação: ${esc(anterior)} &nbsp;·&nbsp; Atualizado em ${esc(dataCurta(info.processado_em))} &nbsp;·&nbsp; ${esc(info.configuracao?.perfil_regra || "Regra oficial")}`;
  $("[data-manager-kpi='media']").textContent = nfmt(metrics.nota_media, 2);
  $("[data-manager-foot='media']").textContent = `teto efetivo ${nfmt(managerCeiling, 2)}`;
  $("[data-manager-kpi='mediana']").textContent = nfmt(metrics.nota_mediana, 2);
  $("[data-manager-kpi='premiados']").textContent = nfmt(metrics.premiados);
  $("[data-manager-foot='premiados']").textContent = `${nfmt(metrics.premiados)} de ${nfmt(metrics.elegiveis)} ${Number(metrics.elegiveis) === 1 ? "elegível" : "elegíveis"}`;
  $("[data-manager-kpi='elegiveis']").textContent = nfmt(metrics.elegiveis);
  $("[data-manager-kpi='validacao']").textContent = `${nfmt(metrics.taxa_validacao, 1)}%`;
  $("[data-manager-foot='validacao']").textContent = `${nfmt(metrics.taxa_exclusao, 1)}% da base foi excluída`;
  $("[data-manager-kpi='avaliacoes']").textContent = `${nfmt(metrics.cobertura_avaliacoes, 1)}%`;
  $("[data-manager-foot='avaliacoes']").textContent = metrics.avaliacao_ponderada == null
    ? "sem avaliações válidas"
    : `média ponderada ${nfmt(metrics.avaliacao_ponderada, 2)}`;

  const foraTop3 = Math.max(0, Number(metrics.elegiveis || 0) - Number(metrics.premiados || 0));
  const below = Math.max(0, Number(metrics.funcionarios || 0) - Number(metrics.elegiveis || 0));
  const priority = (data.acoes || []).find((item) => item.prioridade === "Alta") || data.acoes?.[0];
  $("#executive-title").textContent = `Top 3 definido; ${nfmt(metrics.elegiveis)} de ${nfmt(metrics.funcionarios)} atingiram o corte`;
  $("#gerencial-insight").textContent = `${nfmt(metrics.premiados)} profissionais ocupam as posições premiadas e ${nfmt(below)} ficaram abaixo de 85. O índice médio fechou em ${nfmt(metrics.nota_media, 2)} de ${nfmt(managerCeiling, 2)} possíveis; ${metrics.principal_alavanca || "Quantidade"} é a principal alavanca observada.`;
  const status = $("#executive-status");
  status.textContent = Number(metrics.premiados) > 0 ? "Top 3 confirmado" : "Sem premiados";
  status.parentElement.className = `executive-status ${Number(metrics.premiados) > 0 ? "good" : "attention"}`;
  $("#decision-result").textContent = `${nfmt(metrics.premiados)} premiados entre ${nfmt(metrics.elegiveis)} elegíveis`;
  $("#decision-result-note").textContent = foraTop3
    ? `${nfmt(foraTop3)} ${foraTop3 === 1 ? "elegível" : "elegíveis"} fora das posições premiadas.`
    : `${nfmt(metrics.elegiveis)} profissionais atingiram o corte de 85.`;
  $("#decision-risk").textContent = below ? `${nfmt(below)} abaixo da meta; ${nfmt(foraTop3)} fora do Top 3` : "Equipe acima do corte";
  $("#decision-risk-note").textContent = priority
    ? `${priority.atendente}: ${priority.objetivo}.`
    : `Monitorar cobertura do CSAT e concentração de volume.`;
  $("#decision-action").textContent = priority ? `Atuar sobre ${String(priority.foco || "o principal desvio").toLocaleLowerCase("pt-BR")}` : "Sustentar o resultado";
  $("#decision-action-note").textContent = priority
    ? `${priority.acao}.`
    : `Manter controles semanais de volume e qualidade.`;

  renderGerencialTrend($("#gerencial-trend-chart"), data.serie_equipe || []);
  renderGerencialStatus($("#gerencial-status-chart"), ranking, Number(managerConfig.nota_minima || META_ELEGIBILIDADE), managerCeiling);
  renderGerencialComponents($("#gerencial-components-chart"), data.componentes || []);
  renderGerencialActions(data.acoes || []);
  renderGerencialComparison(data);
}

function renderGerencialTrend(host, rows) {
  if (!rows.length) return chartEmpty(host);
  host.innerHTML = `<div class="period-ledger">${rows.map((row, index) => `<article class="period-column ${index === rows.length - 1 ? "current" : ""}"><div class="period-heading"><span>${esc(compBr(row.competencia))}</span><small>${index === rows.length - 1 ? "ATUAL" : "FECHAMENTO"}</small></div><div class="period-primary"><strong>${nfmt(row.nota_media, 2)}</strong><span>índice médio</span></div><dl><div><dt>Mediana</dt><dd>${nfmt(row.nota_mediana, 2)}</dd></div><div><dt>Liderança</dt><dd>${nfmt(row.nota_lider, 2)}</dd></div><div><dt>Elegíveis</dt><dd>${nfmt(row.elegiveis)} de ${nfmt(row.funcionarios)}</dd></div><div><dt>Premiados</dt><dd>${nfmt(row.premiados)}</dd></div></dl><p>${esc(row.perfil_regra || "Regra oficial")}</p>${index && !row.comparavel_com_anterior ? '<em>Nova versão de regra</em>' : '<em>Primeira referência</em>'}</article>`).join("")}</div>`;
}

function renderGerencialStatus(host, rows, meta = META_ELEGIBILIDADE, maxScore = 100) {
  renderRankingChart(host, rows, meta, maxScore);
}

function renderGerencialComponents(host, rows) {
  if (!rows.length) return chartEmpty(host);
  const fixed = rows.filter((row) => row.protegido);
  const fixedPoints = fixed.reduce((sum, row) => sum + Number(row.media_pontos || 0), 0);
  const items = fixed.length
    ? [{ indicador: "Base fixa", media_pontos: fixedPoints, peso: fixedPoints, protegido: true }, ...rows.filter((row) => !row.protegido)]
    : rows;
  const variable = items.filter((row) => !row.protegido);
  const mainDriver = [...variable].sort((a, b) => Number(b.gap_medio || 0) - Number(a.gap_medio || 0))[0];
  host.innerHTML = `<div class="driver-ledger">${items.map((row) => {
    const utilization = Number(row.peso) ? Number(row.media_pontos || 0) / Number(row.peso) * 100 : 0;
    return `<article class="driver-row ${row.protegido ? "fixed" : "variable"}"><div><span>${row.protegido ? "BASE COMUM" : "CRITÉRIO VARIÁVEL"}</span><strong>${esc(row.indicador)}</strong><p>${row.protegido ? "Mesma pontuação para todos; não altera a posição." : `${nfmt(row.gap_medio, 2)} ponto(s) médios ainda disponíveis.`}</p></div><div class="driver-value"><strong>${nfmt(row.media_pontos, 2)} <small>/ ${nfmt(row.peso, 2)}</small></strong><span>${nfmt(utilization, 1)}% do máximo</span></div></article>`;
  }).join("")}</div>${mainDriver ? `<div class="driver-conclusion"><span>PRINCIPAL ALAVANCA</span><strong>${esc(mainDriver.indicador)}</strong><p>É o componente variável com maior distância média para o máximo: ${nfmt(mainDriver.gap_medio, 2)} pontos.</p></div>` : ""}`;
}

function renderGerencialActions(rows) {
  const classPriority = { "Alta": "high", "Média": "medium", "Monitorar": "monitor" };
  $("#gerencial-actions-table tbody").innerHTML = rows.map((row) => `<tr><td><span class="priority-badge ${classPriority[row.prioridade] || "monitor"}">${esc(row.prioridade)}</span></td><td><strong>${esc(row.atendente)}</strong><small class="treatment-detail">${nfmt(row.rank)}º no ranking</small></td><td class="num"><strong>${nfmt(row.nota, 2)}</strong></td><td>${row.situacao === "Premiado" ? '<span class="badge success">Premiado</span>' : row.situacao.includes("Elegível") ? '<span class="badge warning">Elegível — fora do Top 3</span>' : '<span class="badge neutral">Abaixo da meta</span>'}</td><td class="manager-text"><strong>${esc(row.foco)}</strong><small class="treatment-detail">${esc(row.objetivo)}</small></td><td class="manager-text">${esc(row.acao)}</td></tr>`).join("");
}

function deltaCell(value, digits = 2, suffix = "") {
  if (value == null) return '<span class="delta neutral">—</span>';
  const number = Number(value);
  if (!Number.isFinite(number)) return '<span class="delta neutral">—</span>';
  const css = number > 0 ? "positive" : number < 0 ? "negative" : "neutral";
  const sign = number > 0 ? "+" : "";
  return `<span class="delta ${css}">${sign}${nfmt(number, digits)}${suffix}</span>`;
}

function renderGerencialComparison(data) {
  const rows = data.comparativo || [];
  const title = data.competencia_anterior
    ? `${compBr(data.competencia)} versus ${compBr(data.competencia_anterior)}`
    : `Competência ${compBr(data.competencia)}`;
  $("#gerencial-comparison-title").textContent = title;
  if (!data.comparacao_disponivel) {
    $("#gerencial-comparison-note").textContent = "Ainda não existe uma competência anterior para calcular variações.";
    $("#gerencial-comparison-note").classList.remove("comparison-warning");
    $("#gerencial-comparison-table tbody").innerHTML = '<tr><td colspan="9" class="empty-table">O comparativo será liberado após o processamento de um segundo mês.</td></tr>';
    return;
  }
  $("#gerencial-comparison-note").textContent = data.comparacao_confiavel
    ? "As duas competências usam perfis de pontuação comparáveis. Δ Rank positivo indica ganho de posição."
    : "Atenção: as competências usam perfis de regra diferentes; as variações são descritivas e não devem ser tratadas como comparação direta de performance.";
  $("#gerencial-comparison-note").classList.toggle("comparison-warning", !data.comparacao_confiavel);
  $("#gerencial-comparison-table tbody").innerHTML = rows.map((row) => `<tr><td><strong>${esc(row.atendente)}</strong></td><td class="num">${nfmt(row.rank_atual)}º</td><td class="num">${deltaCell(row.delta_rank, 0)}</td><td class="num">${nfmt(row.nota_atual, 2)}</td><td class="num">${deltaCell(row.delta_nota)}</td><td class="num">${nfmt(row.atendimentos_atual)}</td><td class="num">${deltaCell(row.delta_atendimentos, 0)}</td><td class="num">${row.avaliacao_atual == null ? "—" : nfmt(row.avaliacao_atual, 2)}</td><td class="num">${deltaCell(row.delta_avaliacao)}</td></tr>`).join("");
}

async function loadOperacional(competencia = state.competencia || "") {
  loading(true);
  try {
    const suffix = competencia ? `?competencia=${encodeURIComponent(competencia)}` : "";
    const data = await api(`/api/operacional${suffix}`);
    state.operacional = data;
    renderOperacional(data);
  } catch (error) {
    toast(error.message, "error");
  } finally {
    loading(false);
  }
}

function renderOperacional(data) {
  const empty = !data?.competencia || !data?.info;
  $("#operacional-empty").classList.toggle("hidden", !empty);
  $("#operacional-content").classList.toggle("hidden", empty);
  if (empty) return;
  const metrics = data.metricas || {};
  const comparison = data.comparacao || {};
  const info = data.info || {};
  $("#operacional-source").innerHTML = `<strong>Competência ${esc(compBr(data.competencia))}</strong> &nbsp;·&nbsp; Fonte: ${esc(info.arquivo_origem || "—")} &nbsp;·&nbsp; Atualizado em ${esc(dataCurta(info.processado_em))} &nbsp;·&nbsp; TMA sem encerramentos automáticos`;
  $("[data-ops-kpi='base']").textContent = nfmt(metrics.base_operacional_observada);
  const volumeDelta = comparison.delta_pct_base_operacional_observada;
  $("[data-ops-kpi='volume-delta']").textContent = volumeDelta == null ? "—" : `${volumeDelta > 0 ? "+" : ""}${nfmt(volumeDelta, 1)}%`;
  $("[data-ops-foot='volume-delta']").textContent = comparison.disponivel
    ? `versus ${compBr(comparison.competencia_anterior)}`
    : "sem competência anterior";
  $("[data-ops-kpi='tma-mediano']").textContent = metrics.tma_mediano == null ? "—" : `${nfmt(metrics.tma_mediano, 1)} min`;
  $("[data-ops-kpi='tma-p90']").textContent = metrics.tma_p90 == null ? "—" : `${nfmt(metrics.tma_p90, 1)} min`;
  $("[data-ops-kpi='csat']").textContent = metrics.avaliacao_media == null ? "—" : nfmt(metrics.avaliacao_media, 2);
  $("[data-ops-kpi='coverage']").textContent = `${nfmt(metrics.cobertura_avaliacoes, 1)}%`;
  $("[data-ops-foot='coverage']").textContent = `${nfmt(metrics.avaliacoes)} avaliações válidas`;
  const deltaPhrase = volumeDelta == null
    ? "sem comparação mensal disponível"
    : `${Math.abs(Number(volumeDelta)) < 2 ? "volume estável" : Number(volumeDelta) > 0 ? "volume em alta" : "volume em queda"} (${volumeDelta > 0 ? "+" : ""}${nfmt(volumeDelta, 1)}%)`;
  $("#operational-insight").textContent = `A competência fecha com ${deltaPhrase}, TMA mediano de ${nfmt(metrics.tma_mediano, 1)} min e CSAT de ${nfmt(metrics.avaliacao_media, 2)} sustentado por ${nfmt(metrics.cobertura_avaliacoes, 1)}% da base.`;
  $("#basis-award").textContent = nfmt(metrics.base_premiavel);
  $("#basis-quality").textContent = nfmt(metrics.erros_qualidade);
  $("#basis-scope").textContent = nfmt(metrics.fora_escopo);
  $("#basis-exception").textContent = nfmt(metrics.excecoes_operacionais);
  $("#basis-observed").textContent = nfmt(metrics.base_operacional_observada);
  $("#basis-imported").textContent = nfmt(metrics.total_importado);
  $("#basis-auto").textContent = nfmt(metrics.automaticos);
  $("#basis-auto-note").textContent = `(${nfmt(metrics.participacao_automaticos, 1)}% da base premiável)`;
  renderOperationalTrend($("#operacional-trend-chart"), data.serie || []);
  renderOperationalHours($("#operacional-hour-chart"), data.volume_por_hora || []);
  renderOperationalTable(data.atendentes || []);
  const notes = data.notas_metodologicas || [];
  $("#operacional-method-note").innerHTML = `<strong>Leitura responsável dos dados</strong><ul>${notes.map((note) => `<li>${esc(note)}</li>`).join("")}</ul>`;
}

function renderOperationalTrend(host, rows) {
  if (!rows.length) return chartEmpty(host);
  host.innerHTML = `<div class="operational-period-table" role="table" aria-label="Indicadores operacionais por competência"><div class="operational-period-head" role="row"><span>Mês</span><span>Base observada</span><span>TMA mediano</span><span>TMA P90</span><span>CSAT</span><span>Cobertura</span><span>Qualidade</span></div>${rows.map((row, index) => {
    const previous = rows[index - 1];
    const delta = previous && Number(previous.base_operacional_observada)
      ? (Number(row.base_operacional_observada) / Number(previous.base_operacional_observada) - 1) * 100
      : null;
    return `<div class="operational-period-row ${index === rows.length - 1 ? "current" : ""}" role="row"><span><strong>${esc(compBr(row.competencia))}</strong>${index === rows.length - 1 ? "<small>Atual</small>" : ""}</span><span><strong>${nfmt(row.base_operacional_observada)}</strong>${delta == null ? "" : `<small>${delta > 0 ? "+" : ""}${nfmt(delta, 1)}%</small>`}</span><span>${nfmt(row.tma_mediano, 1)} min</span><span>${nfmt(row.tma_p90, 1)} min</span><span>${nfmt(row.avaliacao_media, 2)}</span><span>${nfmt(row.cobertura_avaliacoes, 1)}%</span><span>${nfmt(row.erros_qualidade)}</span></div>`;
  }).join("")}</div>`;
}

function renderOperationalHours(host, rows) {
  if (!rows.length) return chartEmpty(host);
  const width = 760, height = 335, left = 48, right = 28, top = 34, bottom = 50;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const max = Math.max(...rows.map((row) => Number(row.atendimentos || 0)), 1);
  const step = rows.length > 1 ? plotWidth / (rows.length - 1) : plotWidth;
  const yMax = Math.ceil(max / 25) * 25;
  const y = (value) => top + (1 - Number(value) / yMax) * plotHeight;
  const points = rows.map((row, index) => ({ x: left + index * step, y: y(row.atendimentos), row }));
  const path = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const area = `${path} L${points.at(-1).x},${top + plotHeight} L${points[0].x},${top + plotHeight} Z`;
  const peak = rows.reduce((best, row) => Number(row.atendimentos) > Number(best.atendimentos) ? row : best, rows[0]);
  const min = Math.min(...rows.map((row) => Number(row.atendimentos || 0)));
  const peakVariation = min ? (Number(peak.atendimentos) / min - 1) * 100 : 0;
  $("#hourly-chart-note").textContent = `Demanda distribuída entre ${String(rows[0].hora).padStart(2, "0")}h e ${String(rows.at(-1).hora).padStart(2, "0")}h; diferença de apenas ${nfmt(peakVariation, 1)}% entre o menor volume e o pico.`;
  const grid = [0, .5, 1].map((ratio) => {
    const value = yMax * ratio;
    const yy = y(value);
    return `<line x1="${left}" y1="${yy}" x2="${width - right}" y2="${yy}" stroke="#e6eaed"/><text x="${left - 9}" y="${yy + 4}" text-anchor="end" fill="#76838d" font-size="9">${nfmt(value)}</text>`;
  }).join("");
  const marks = points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4.5" fill="#fff" stroke="#255f87" stroke-width="2.5" data-tooltip="${esc(`${String(point.row.hora).padStart(2, "0")}:00|Entradas: ${nfmt(point.row.atendimentos)}`)}"/><text x="${point.x}" y="${height - 24}" text-anchor="middle" fill="#647584" font-size="9">${String(point.row.hora).padStart(2, "0")}h</text>`).join("");
  host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Entradas por hora ao longo do expediente">${grid}<path d="${area}" fill="#eaf2f7"/><path d="${path}" fill="none" stroke="#255f87" stroke-width="2.5" stroke-linejoin="round"/>${marks}<text x="${points.find((point) => point.row === peak).x}" y="${points.find((point) => point.row === peak).y - 13}" text-anchor="middle" fill="#173b58" font-size="10" font-weight="800">Pico ${nfmt(peak.atendimentos)}</text></svg>`;
  activateTooltips(host);
}

function renderOperationalTable(rows, search = "") {
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = rows.filter((row) => !term || String(row.atendente).toLocaleLowerCase("pt-BR").includes(term));
  $("#operacional-table tbody").innerHTML = filtered.length ? filtered.map((row) => `<tr><td><strong>${esc(row.atendente)}</strong></td><td class="num">${nfmt(row.atendimentos_observados)}</td><td class="num">${nfmt(row.participacao_volume, 1)}%</td><td class="num">${row.tma_mediano == null ? "—" : `${nfmt(row.tma_mediano, 1)} min`}</td><td class="num">${row.tma_p90 == null ? "—" : `${nfmt(row.tma_p90, 1)} min`}</td><td class="num">${row.avaliacao_media_observada == null ? "—" : nfmt(row.avaliacao_media_observada, 2)}</td><td class="num">${nfmt(row.avaliacoes_observadas)}</td><td class="num"><strong>${nfmt(row.cobertura_avaliacoes, 1)}%</strong></td><td class="num">${nfmt(row.automaticos)}</td></tr>`).join("") : '<tr><td colspan="9" class="empty-table">Nenhum funcionário encontrado.</td></tr>';
}

let tooltipNode = null;
function activateTooltips(root) {
  if (!tooltipNode) {
    tooltipNode = $("#chart-tooltip") || document.createElement("div");
    tooltipNode.className = "chart-tooltip";
    if (!tooltipNode.parentElement) document.body.appendChild(tooltipNode);
  }
  $$('[data-tooltip]', root).forEach((node) => {
    node.addEventListener("mousemove", (event) => {
      tooltipNode.innerHTML = node.dataset.tooltip.split("|").map((line, index) => index === 0 ? `<strong>${esc(line)}</strong>` : `<br>${esc(line)}`).join("");
      tooltipNode.style.left = `${event.clientX}px`;
      tooltipNode.style.top = `${event.clientY}px`;
      tooltipNode.style.opacity = "1";
    });
    node.addEventListener("mouseleave", () => { tooltipNode.style.opacity = "0"; });
  });
}

async function updateProfile() {
  const text = $("#import-competencia").value.trim();
  if (!/^\d{2}\/\d{4}$/.test(text)) return;
  try {
    const data = await api(`/api/perfil?competencia=${encodeURIComponent(text)}`);
    const config = data.configuracao;
    $("#profile-name").textContent = config.perfil_regra;
    $("#rule-summary").innerHTML = [
      ["Competência", data.competencia_br],
      ["Departamento", "Suporte em Filas/Setores ou Transfers"],
      ["Período", data.periodo],
      ["Duração", data.duracao],
      ["Finalizados automáticos", config.incluir_finalizados_automaticamente ? "Incluídos; Tempo/TMA fixos em 31,50" : "Regra histórica da competência"],
      ["Avaliação", `Escala de 0 a ${nfmt(config.escala_avaliacao_max)}`],
      ["Meta mínima", `${nfmt(config.nota_minima)} pontos`],
    ].map(([label, value]) => `<div class="rule-item"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("");
    $("#weight-grid").innerHTML = [
      ["Quantidade", config.peso_quantidade],
      [config.pontuacao_tempo_tma_fixa ? "Tempo total (fixo)" : "Tempo total", config.pontuacao_tempo_tma_fixa ? 7.88 : config.peso_tempo],
      [config.pontuacao_tempo_tma_fixa ? "TMA (fixo)" : "TMA", config.pontuacao_tempo_tma_fixa ? 23.62 : config.peso_tma],
      ["Avaliação", config.peso_avaliacao],
    ].map(([label, value]) => `<div class="weight-card"><span>${esc(label)}</span><strong>${nfmt(value, label.includes("fixo") ? 2 : 0)} pts</strong></div>`).join("");
    $("#profile-rule-note").textContent = config.pontuacao_tempo_tma_fixa
      ? "Todos os funcionários recebem igualmente 7,88 pontos em Tempo Total e 23,62 pontos em TMA, totalizando 31,50 pontos fixos."
      : config.neutralizar_tempo_automaticos
        ? "Finalizados automaticamente contam em Quantidade e Avaliação; sua duração não entra em Tempo Total nem TMA."
        : "Os quatro critérios são normalizados pelo melhor resultado válido da equipe.";
  } catch (error) {
    toast(error.message, "error");
  }
}

async function processarArquivo() {
  const file = state.arquivo;
  const competencia = $("#import-competencia").value.trim();
  if (!file) return toast("Selecione o arquivo mensal do ChatMobi.", "error");
  if (!/^\d{2}\/\d{4}$/.test(competencia)) return toast("Informe a competência no formato MM/AAAA.", "error");
  const params = new URLSearchParams({
    competencia,
    arquivo: file.name,
    excluidos: $("#import-excluidos").value.trim(),
  });
  loading(true);
  $("#processar-btn").disabled = true;
  try {
    const result = await api(`/api/processar?${params.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: await file.arrayBuffer(),
    });
    $("#process-result-panel").classList.remove("hidden");
    const recuperados = Number(result.estatisticas?.AUTOMATICOS_RECUPERADOS || 0);
    const autoTexto = recuperados ? ` ${nfmt(recuperados)} finalizados automaticamente acima do limite foram recuperados.` : "";
    $("#process-result").innerHTML = `<h3>${esc(result.competencia_br)} processado com sucesso</h3><p>${nfmt(result.validos)} válidos, ${nfmt(result.excluidos)} excluídos e ${nfmt(result.atendentes)} funcionários no ranking.${autoTexto} O reprocessamento substituiu somente esta competência.</p>`;
    toast("Competência atualizada com sucesso.", "success");
    await loadResumo(result.competencia);
    showView("gerencial");
  } catch (error) {
    toast(error.message, "error", 7000);
  } finally {
    loading(false);
    $("#processar-btn").disabled = false;
  }
}

async function loadHistorico(atendente) {
  const content = $("#historico-content"), empty = $("#historico-empty");
  if (!atendente) {
    content.classList.add("hidden"); empty.classList.remove("hidden"); return;
  }
  loading(true);
  try {
    const data = await api(`/api/historico?atendente=${encodeURIComponent(atendente)}`);
    state.historico = data.historico || [];
    renderHistorico(atendente, state.historico);
  } catch (error) {
    toast(error.message, "error");
  } finally { loading(false); }
}

function renderHistorico(atendente, rows) {
  const content = $("#historico-content"), empty = $("#historico-empty");
  const ordered = [...rows].sort((a, b) => String(a.competencia).localeCompare(String(b.competencia)));
  const latest = ordered.at(-1);
  content.classList.toggle("hidden", !latest); empty.classList.toggle("hidden", Boolean(latest));
  if (!latest) return;
  const previous = ordered.at(-2);
  const delta = previous ? Number(latest.nota_final) - Number(previous.nota_final) : null;
  $("[data-history-kpi='nota']").textContent = nfmt(latest.nota_final, 2);
  $("[data-history-foot='nota']").textContent = delta == null ? "primeira competência registrada" : `${delta >= 0 ? "+" : ""}${nfmt(delta, 2)} ponto(s) versus mês anterior`;
  $("[data-history-kpi='rank']").textContent = `${nfmt(latest.rank)}º`;
  $("[data-history-kpi='atendimentos']").textContent = nfmt(latest.atendimentos);
  $("[data-history-kpi='tma']").textContent = latest.tma_medio_min == null ? "—" : `${nfmt(latest.tma_medio_min, 1)} min`;
  const coverage = Number(latest.atendimentos) ? Number(latest.avaliacoes || 0) / Number(latest.atendimentos) * 100 : null;
  $("[data-history-kpi='cobertura']").textContent = coverage == null ? "—" : `${nfmt(coverage, 1)}%`;
  $("[data-history-kpi='competencias']").textContent = nfmt(ordered.length);
  $("#history-chart-title").textContent = `Evolução do índice — ${atendente}`;
  renderHistoryChart($("#history-chart"), ordered);
  $("#history-table tbody").innerHTML = [...ordered].reverse().map((row) => `<tr><td><strong>${esc(compBr(row.competencia))}</strong></td><td>${nfmt(row.rank)}º</td><td class="num">${nfmt(row.atendimentos)}</td><td class="num">${row.tma_medio_min == null ? "—" : `${nfmt(row.tma_medio_min, 1)} min`}</td><td class="num">${row.avaliacao_media == null ? "—" : nfmt(row.avaliacao_media, 2)}</td><td class="num">${Number(row.atendimentos) ? `${nfmt(Number(row.avaliacoes || 0) / Number(row.atendimentos) * 100, 1)}%` : "—"}</td><td class="num"><strong>${nfmt(row.nota_final, 2)}</strong></td><td>${statusPremiacao(row)}</td></tr>`).join("");
  setSelectOptions($("#feedback-competencia"), [...ordered].reverse().map((row) => row.competencia), latest.competencia, compBr);
  updateFeedbackText();
}

function renderHistoryChart(host, rows) {
  if (!rows.length) return chartEmpty(host);
  const width = 900, height = 340, left = 60, right = 30, top = 25, bottom = 55;
  const plotW = width - left - right, plotH = height - top - bottom;
  const step = plotW / Math.max(rows.length, 1);
  const y = (value) => top + (1 - Math.max(0, Math.min(100, Number(value || 0))) / 100) * plotH;
  const grid = [0, 20, 40, 60, 80, 100].map((tick) => {
    const yy = y(tick);
    return `<line x1="${left}" y1="${yy}" x2="${width - right}" y2="${yy}" stroke="#e7edf1"/><text x="${left - 10}" y="${yy + 4}" text-anchor="end" fill="#7b8995" font-size="10">${tick}</text>`;
  }).join("");
  const metaY = y(META_ELEGIBILIDADE);
  const points = rows.map((row, i) => ({ x: left + (i + .5) * step, y: y(row.nota_final), row }));
  const marks = points.map((point) => {
    const eligible = Number(point.row.nota_final) >= META_ELEGIBILIDADE;
    return `<line x1="${point.x}" y1="${top}" x2="${point.x}" y2="${top + plotH}" stroke="#eef1f3"/><circle cx="${point.x}" cy="${point.y}" r="8" fill="${eligible ? "#173b58" : "#fff"}" stroke="${eligible ? "#173b58" : "#7d8993"}" stroke-width="2.5" data-tooltip="${esc(`${compBr(point.row.competencia)}|Índice: ${nfmt(point.row.nota_final, 2)}|Rank: ${nfmt(point.row.rank)}º|Atendimentos: ${nfmt(point.row.atendimentos)}`)}"/><text x="${point.x}" y="${point.y - 15}" text-anchor="middle" fill="#173b58" font-size="11" font-weight="800">${nfmt(point.row.nota_final, 2)}</text><text x="${point.x}" y="${height - 25}" text-anchor="middle" fill="#4c5e6d" font-size="10" font-weight="700">${esc(compBr(point.row.competencia))}</text><text x="${point.x}" y="${height - 10}" text-anchor="middle" fill="#84919b" font-size="9">${nfmt(point.row.rank)}º lugar</text>`;
  }).join("");
  host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Fechamentos mensais do índice individual">${grid}<line x1="${left}" y1="${metaY}" x2="${width-right}" y2="${metaY}" stroke="#9b5f43" stroke-width="1.5" stroke-dasharray="6 5"/><text x="${width-right}" y="${metaY - 7}" text-anchor="end" fill="#8f593f" font-size="9" font-weight="700">Corte 85</text>${marks}</svg>`;
  activateTooltips(host);
}

function updateFeedbackText() {
  const comp = $("#feedback-competencia").value;
  const row = state.historico.find((item) => item.competencia === comp);
  $("#feedback-texto").value = row?.feedback || "";
}

async function saveFeedback() {
  const atendente = $("#historico-atendente").value;
  const competencia = $("#feedback-competencia").value;
  const feedback = $("#feedback-texto").value.trim();
  if (!feedback) return toast("O feedback não pode ficar vazio.", "error");
  try {
    await api("/api/feedback", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ atendente, competencia, feedback }),
    });
    toast("Feedback atualizado.", "success");
    await loadHistorico(atendente);
    await loadResumo(state.competencia);
  } catch (error) { toast(error.message, "error"); }
}

async function loadAuditoria(competencia) {
  const content = $("#auditoria-content"), empty = $("#auditoria-empty");
  if (!competencia) { content.classList.add("hidden"); empty.classList.remove("hidden"); return; }
  loading(true);
  try {
    const data = await api(`/api/auditoria?competencia=${encodeURIComponent(competencia)}`);
    state.auditoria = data;
    renderAuditoria(data);
  } catch (error) { toast(error.message, "error"); }
  finally { loading(false); }
}

async function loadAutomaticos(competencia) {
  const content = $("#automaticos-content"), empty = $("#automaticos-empty");
  if (!competencia) {
    content.classList.add("hidden"); empty.classList.remove("hidden"); return;
  }
  loading(true);
  try {
    const data = await api(`/api/automaticos?competencia=${encodeURIComponent(competencia)}`);
    state.automaticos = data;
    setSelectOptions($("#automaticos-competencia"), data.competencias || [], data.competencia, compBr);
    renderAutomaticos(data);
  } catch (error) { toast(error.message, "error"); }
  finally { loading(false); }
}

function renderAutomaticos(data) {
  const has = Boolean(data.competencia && data.info);
  $("#automaticos-content").classList.toggle("hidden", !has);
  $("#automaticos-empty").classList.toggle("hidden", has);
  if (!has) return;
  const info = data.info;
  const metrics = data.metricas || {};
  const config = info.configuracao || {};
  $("#automaticos-source-strip").innerHTML = `<strong>Fonte:</strong> ${esc(info.arquivo_origem || "—")} &nbsp;•&nbsp; <strong>Competência:</strong> ${esc(compBr(data.competencia))} &nbsp;•&nbsp; <strong>Regra:</strong> ${esc(info.configuracao?.perfil_regra || "Regra oficial")} &nbsp;•&nbsp; <strong>Base regular válida:</strong> ${nfmt(metrics.regulares_validos || 0)}`;
  $("#automaticos-reprocessar").classList.toggle("hidden", !data.requer_reprocessamento);
  $$("[data-auto-kpi]").forEach((node) => {
    node.textContent = nfmt(metrics[node.dataset.autoKpi] || 0);
  });
  if (config.pontuacao_tempo_tma_fixa) {
    $("[data-auto-treatment='tempo']").textContent = "7,88 pontos fixos";
    $("[data-auto-treatment='tma']").textContent = "23,62 pontos fixos";
    $("#automaticos-formula-note").textContent = "Todos recebem os mesmos 31,50 pontos de Tempo/TMA. Quantidade e Avaliação continuam diferenciando o resultado.";
  } else if (config.neutralizar_tempo_automaticos) {
    $("[data-auto-treatment='tempo']").textContent = "Duração desconsiderada";
    $("[data-auto-treatment='tma']").textContent = "Duração desconsiderada";
    $("#automaticos-formula-note").textContent = "Quantidade e qualidade usam todos os válidos. Tempo Total e TMA usam somente os atendimentos regulares.";
  } else {
    $("[data-auto-treatment='tempo']").textContent = "Regra histórica";
    $("[data-auto-treatment='tma']").textContent = "Regra histórica";
    $("#automaticos-formula-note").textContent = "Esta competência preserva a regra histórica gravada no processamento.";
  }
  state.automaticosPage = 1;
  renderAutomaticosTable(data.registros || []);
}

function renderAutomaticosTable(rows, search = "") {
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = rows.filter((row) => !term || Object.values(row).some((value) => String(value ?? "").toLocaleLowerCase("pt-BR").includes(term)));
  const pageSize = 20;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  state.automaticosPage = Math.min(state.automaticosPage, pages);
  const start = (state.automaticosPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  $("#automaticos-table tbody").innerHTML = visible.length ? visible.map((row) => `<tr><td>${nfmt(row.linha_origem)}</td><td>${esc(row.protocolo)}</td><td><strong>${esc(row.atendente)}</strong></td><td>${esc(dataCurta(row.inicio))}</td><td>${esc(dataCurta(row.fim))}</td><td class="num">${row.duracao_horas == null ? "—" : `${nfmt(row.duracao_horas, 2)} h`}</td><td class="num">${row.avaliacao == null ? "—" : nfmt(row.avaliacao, 2)}</td><td>${esc(row.gatilho_identificacao)}</td><td><span class="badge success">Incluído</span><small class="treatment-detail">${esc(row.tratamento || "Regra da competência")}</small></td></tr>`).join("") : `<tr><td colspan="9" class="empty-table">Nenhum encerramento automático incluído nesta competência.</td></tr>`;
  renderPagination($("#automaticos-pagination"), filtered.length, state.automaticosPage, pageSize, (page) => {
    state.automaticosPage = page;
    renderAutomaticosTable(rows, search);
  });
}

const STAT_LABELS = {
  TOTAL_IMPORTADO: "Total importado", VALIDOS: "Base válida", EXCLUIDOS: "Total excluído",
  FORA_SUPORTE: "Fora de Suporte", ATENDENTE_EXCLUIDO: "Fora da campanha",
  SEM_ATENDENTE: "Sem atendente", DATA_INVALIDA: "Início inválido",
  SEM_FINALIZACAO: "Fim não preenchido", DURACAO_NEGATIVA: "Duração negativa",
  ACIMA_H: "Acima do limite", PERIODO: "Fora do expediente",
  AUTOMATICOS_IDENTIFICADOS: "Automáticos identificados", AUTOMATICOS_VALIDOS: "Automáticos incluídos",
  AUTOMATICOS_RECUPERADOS: "Automáticos recuperados", AUTOMATICOS_EXCLUIDOS: "Automáticos excluídos",
  AUTOMATICOS_NEUTRALIZADOS_TEMPO: "Tempo/TMA protegidos", REGULARES_VALIDOS: "Regulares válidos", AVALIACOES_VALIDAS: "Avaliações válidas",
  ATENDENTES_RANKING: "Atendentes no ranking",
};

function renderAuditoria(data) {
  const has = Boolean(data.competencia && data.info);
  $("#auditoria-content").classList.toggle("hidden", !has);
  $("#auditoria-empty").classList.toggle("hidden", has);
  if (!has) return;
  const info = data.info;
  $("#audit-source-strip").innerHTML = `<strong>Competência ${esc(compBr(data.competencia))}</strong> &nbsp;·&nbsp; Fonte: ${esc(info.arquivo_origem || "—")} &nbsp;·&nbsp; Atualizado em ${esc(dataCurta(info.processado_em))} &nbsp;·&nbsp; ${esc(info.configuracao?.perfil_regra || "Regra oficial")}`;
  const stats = info.estatisticas || {};
  const qualityCount = (data.exclusoes || []).filter((row) => exclusionCategory(row.motivo_codigo).key === "quality").length;
  const scopeCount = (data.exclusoes || []).filter((row) => exclusionCategory(row.motivo_codigo).key === "scope").length;
  const exceptionCount = (data.exclusoes || []).filter((row) => exclusionCategory(row.motivo_codigo).key === "exception").length;
  $("#audit-quality").textContent = nfmt(qualityCount);
  $("#audit-scope").textContent = nfmt(scopeCount);
  $("#audit-exception").textContent = nfmt(exceptionCount);
  const statsOrder = ["TOTAL_IMPORTADO", "VALIDOS", "EXCLUIDOS", "AVALIACOES_VALIDAS", "ATENDENTES_RANKING", "AUTOMATICOS_VALIDOS"];
  $("#audit-stats").innerHTML = statsOrder.filter((key) => key in stats).map((key) => `<article class="audit-stat"><span>${esc(STAT_LABELS[key] || key)}</span><strong>${nfmt(stats[key])}</strong></article>`).join("");
  renderExclusionChart($("#exclusion-chart"), data.resumo_exclusoes || []);
  state.auditPage = 1;
  renderAuditTable(data.exclusoes || []);
  renderValidTable(data.validos || []);
  $("#valid-preview-count").textContent = `(${nfmt(data.validos_total)} registros)`;
  renderConfig(info.configuracao || {});
  $("#audit-mapping").textContent = JSON.stringify(info.mapeamento || {}, null, 2);
}

function renderExclusionChart(host, rows) {
  if (!rows.length) return chartEmpty(host, "Nenhuma exclusão registrada nesta competência.");
  const top = rows.slice(0, 10), max = Math.max(...top.map((row) => Number(row.size || 0)), 1);
  const width = 760, left = 235, right = 55, topY = 12, rowHeight = 40;
  const height = topY + top.length * rowHeight + 28, plot = width - left - right;
  const marks = top.map((row, i) => {
    const y = topY + i * rowHeight + 6, value = Number(row.size || 0), barW = value / max * plot;
    return `<text x="${left - 10}" y="${y + 15}" text-anchor="end" fill="#334657" font-size="11">${esc(truncate(row.motivo, 34))}</text><rect x="${left}" y="${y}" width="${plot}" height="22" rx="3" fill="#f0f3f5"/><rect x="${left}" y="${y}" width="${barW}" height="22" rx="3" fill="#1e5f8f" stroke="#164b72" data-tooltip="${esc(`${row.motivo}|Registros excluídos: ${nfmt(value)}`)}"/><text x="${Math.min(left + barW + 7, width - 25)}" y="${y + 15}" fill="#173e5d" font-size="10" font-weight="700">${nfmt(value)}</text>`;
  }).join("");
  host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Exclusões por motivo">${marks}</svg>`;
  activateTooltips(host);
}

function renderConfig(config) {
  const rows = [
    ["Perfil", config.perfil_regra], ["Departamento", config.departamento_alvo],
    ["Expediente", config.incluir_fora_expediente ? "Não aplicado" : `${config.hora_inicio}–${config.hora_fim}, segunda a sábado`],
    ["Duração máxima", config.modo === "neutralizado" ? "Neutralizada" : `${nfmt(config.max_horas, 1)} horas`],
    ["Finalizados automáticos", config.incluir_finalizados_automaticamente ? "Incluídos" : "Regra histórica"],
    ["Pontuação Tempo/TMA", config.pontuacao_tempo_tma_fixa ? "7,88 + 23,62 = 31,50 pontos para todos" : "Cálculo comparativo"],
    ["Tempo/TMA dos automáticos", config.neutralizar_tempo_automaticos ? "Duração artificial sem impacto" : "Sem neutralização específica"],
    ["Escala da avaliação", `0 a ${nfmt(config.escala_avaliacao_max)}`],
    ["Meta", `${nfmt(config.nota_minima)} pontos`],
    ["Pesos", `${nfmt(config.peso_quantidade)}/${nfmt(config.peso_tempo)}/${nfmt(config.peso_tma)}/${nfmt(config.peso_avaliacao)}`],
    ["Fora da campanha", config.atendentes_excluidos],
  ];
  $("#audit-config").innerHTML = rows.map(([label, value]) => `<div class="config-row"><span>${esc(label)}</span><strong>${esc(value ?? "—")}</strong></div>`).join("");
}

function renderAuditTable(rows, search = "") {
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const categoryFilter = $("#audit-category")?.value || "";
  const filtered = rows.filter((row) => {
    const category = exclusionCategory(row.motivo_codigo);
    const matchesCategory = !categoryFilter || category.key === categoryFilter;
    const matchesText = !term || Object.values(row).some((value) => String(value ?? "").toLocaleLowerCase("pt-BR").includes(term));
    return matchesCategory && matchesText;
  });
  const pageSize = 20;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  state.auditPage = Math.min(state.auditPage, pages);
  const start = (state.auditPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  $("#audit-table tbody").innerHTML = visible.length ? visible.map((row) => {
    const category = exclusionCategory(row.motivo_codigo);
    return `<tr><td>${nfmt(row.linha_origem)}</td><td>${esc(row.protocolo)}</td><td><strong>${esc(row.atendente || "—")}</strong></td><td>${esc(row.departamento || "—")}</td><td>${esc(dataCurta(row.inicio))}</td><td class="num">${row.duracao_horas == null ? "—" : `${nfmt(row.duracao_horas, 2)} h`}</td><td><span class="category-pill ${category.key}">${esc(category.label)}</span></td><td>${esc(row.motivo)}</td></tr>`;
  }).join("") : '<tr><td colspan="8" class="empty-table">Nenhum registro encontrado para os filtros aplicados.</td></tr>';
  renderPagination($("#audit-pagination"), filtered.length, state.auditPage, pageSize, (page) => {
    state.auditPage = page;
    renderAuditTable(rows, search);
  });
}

function renderPagination(host, total, page, pageSize, onChange) {
  if (!host) return;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, total);
  host.innerHTML = `<span>${nfmt(first)}–${nfmt(last)} de ${nfmt(total)} registros</span><div class="pagination-actions"><button type="button" data-page="prev" ${page <= 1 ? "disabled" : ""} aria-label="Página anterior">‹</button><span>Página ${nfmt(page)} de ${nfmt(pages)}</span><button type="button" data-page="next" ${page >= pages ? "disabled" : ""} aria-label="Próxima página">›</button></div>`;
  $("[data-page='prev']", host)?.addEventListener("click", () => onChange(page - 1));
  $("[data-page='next']", host)?.addEventListener("click", () => onChange(page + 1));
}

function renderValidTable(rows) {
  $("#valid-table tbody").innerHTML = rows.map((row) => `<tr><td>${nfmt(row.linha_origem)}</td><td>${esc(row.protocolo)}</td><td><strong>${esc(row.atendente)}</strong></td><td>${esc(row.departamento)}</td><td>${esc(dataCurta(row.inicio))}</td><td>${esc(dataCurta(row.fim))}</td><td class="num">${row.avaliacao == null ? "—" : nfmt(row.avaliacao, 2)}</td><td>${Number(row.suspeito_automatico) === 1 ? '<span class="badge warning">Sim</span>' : '<span class="badge neutral">Não</span>'}</td></tr>`).join("");
}

function exportar(competencia) {
  if (!competencia) return toast("Nenhuma competência disponível para exportação.", "error");
  window.location.href = `/api/exportar?competencia=${encodeURIComponent(competencia)}`;
}

function montarResumoPowerPoint(atual, anterior = null) {
  const competencia = atual?.competencia || null;
  const rankingAtual = atual?.ranking || [];
  const rankingAnterior = new Map((anterior?.ranking || []).map((item) => [item.atendente, item]));
  const comparativo = rankingAtual.map((item) => {
    const antes = rankingAnterior.get(item.atendente);
    const notaAtual = item.nota_final;
    const notaAnterior = antes?.nota_final ?? null;
    return {
      atendente: item.atendente,
      rank_atual: item.rank,
      rank_anterior: antes?.rank ?? null,
      nota_atual: notaAtual,
      nota_anterior: notaAnterior,
      delta_nota: notaAtual != null && notaAnterior != null
        ? Number(notaAtual) - Number(notaAnterior) : null,
    };
  });
  const roteiro = [
    { grupo: "Abertura", titulo: "Capa e apuração executiva", slides: 2 },
    { grupo: "Resultado", titulo: "Resumo, regras, metodologia e ranking", slides: 5 },
    { grupo: "Análise", titulo: "Comparativos e painel de indicadores", slides: 3 },
    { grupo: "Pessoas", titulo: "Detalhamento individual por funcionário", slides: rankingAtual.length },
    { grupo: "Fechamento", titulo: "Oportunidades e recomendação", slides: 2 },
  ];
  return {
    competencias: atual?.competencias || [],
    competencia,
    competencia_br: compBr(competencia),
    atual,
    anterior,
    comparativo,
    quantidade_slides: 12 + rankingAtual.length,
    roteiro,
  };
}

async function loadPowerPoint(competencia) {
  if (!competencia) {
    state.powerpoint = null;
    renderPowerPoint({ competencia: null, atual: null, roteiro: [] });
    return null;
  }
  state.powerpoint = null;
  $("#powerpoint-download").disabled = true;
  loading(true);
  try {
    // Usa a mesma rota estável da Visão geral. Assim o painel continua compatível
    // mesmo quando o navegador ainda está conectado a uma versão anterior do servidor.
    const atual = await api(`/api/resumo?competencia=${encodeURIComponent(competencia)}`);
    const anteriorCompetencia = (atual.competencias || [])
      .filter((item) => item < atual.competencia)
      .sort()
      .at(-1);
    const anterior = anteriorCompetencia
      ? await api(`/api/resumo?competencia=${encodeURIComponent(anteriorCompetencia)}`)
      : null;
    const data = montarResumoPowerPoint(atual, anterior);
    state.powerpoint = data;
    setSelectOptions($("#powerpoint-competencia"), data.competencias || [], data.competencia, compBr);
    renderPowerPoint(data);
    return data;
  } catch (error) {
    state.powerpoint = null;
    renderPowerPoint({ competencia: null, atual: null, roteiro: [] });
    toast(error.message, "error");
    return null;
  } finally {
    loading(false);
  }
}

function renderPowerPoint(data) {
  const has = Boolean(data?.competencia && data?.atual?.info && data?.atual?.ranking?.length);
  $("#powerpoint-content").classList.toggle("hidden", !has);
  $("#powerpoint-empty").classList.toggle("hidden", has);
  $("#powerpoint-download").disabled = !has;
  if (!has) return;

  const info = data.atual.info;
  const ranking = data.atual.ranking || [];
  const leader = ranking[0];
  const elegiveis = ranking.filter((item) => Number(item.elegivel) === 1).length;
  const premiados = ranking.filter(isPremiado).length;
  $("#powerpoint-source-strip").innerHTML = `<strong>Fonte:</strong> ${esc(info.arquivo_origem || "—")} &nbsp;•&nbsp; <strong>Competência:</strong> ${esc(data.competencia_br)} &nbsp;•&nbsp; <strong>Processado em:</strong> ${esc(dataCurta(info.processado_em))} &nbsp;•&nbsp; <strong>Padrão:</strong> apresentação executiva completa`;
  $("#powerpoint-cover-title").textContent = `Apuração executiva de ${data.competencia_br}`;
  $("#powerpoint-cover-subtitle").textContent = `Resultado oficial • ${info.configuracao?.perfil_regra || "Regra oficial"}`;
  $("[data-ppt-kpi='analisados']").textContent = nfmt(info.total_linhas);
  $("[data-ppt-kpi='validos']").textContent = nfmt(info.validos);
  $("[data-ppt-kpi='premiados']").textContent = nfmt(premiados);
  $("[data-ppt-kpi='lider']").textContent = leader?.atendente || "—";
  $("#powerpoint-slide-count").textContent = nfmt(data.quantidade_slides);
  $("#powerpoint-comparison-status").textContent = data.anterior?.competencia ? compBr(data.anterior.competencia) : "Não disponível";
  $("#powerpoint-route").innerHTML = (data.roteiro || []).map((item, index) => `<div class="ppt-route-item"><span class="ppt-route-index">${index + 1}</span><div><strong>${esc(item.grupo)}</strong><small>${esc(item.titulo)}</small></div><span class="ppt-route-count">${nfmt(item.slides)} slide${Number(item.slides) === 1 ? "" : "s"}</span></div>`).join("");
}

async function baixarPowerPoint() {
  const competencia = $("#powerpoint-competencia").value || state.competencia;
  if (!state.powerpoint?.competencia || state.powerpoint.competencia !== competencia) {
    await loadPowerPoint(competencia);
  }
  if (!state.powerpoint?.competencia) return toast("Não foi possível carregar a competência para a apresentação.", "error");
  if (!window.PremiacaoPowerPoint?.gerar) return toast("O gerador de PowerPoint não foi carregado.", "error");
  const button = $("#powerpoint-download");
  button.disabled = true;
  loading(true);
  try {
    await window.PremiacaoPowerPoint.gerar(state.powerpoint);
    toast("Apresentação PowerPoint gerada com sucesso.", "success");
  } catch (error) {
    toast(error.message || "Não foi possível gerar a apresentação.", "error", 7000);
  } finally {
    loading(false);
    button.disabled = !state.powerpoint?.competencia;
  }
}

function setupUpload() {
  const input = $("#arquivo-upload"), drop = $("#drop-zone");
  const selectFile = (file) => {
    if (!file) return;
    state.arquivo = file;
    $("#file-name").textContent = `${file.name} • ${nfmt(file.size / 1024, 1)} KB`;
  };
  input.addEventListener("change", () => selectFile(input.files[0]));
  ["dragenter", "dragover"].forEach((event) => drop.addEventListener(event, (e) => { e.preventDefault(); drop.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((event) => drop.addEventListener(event, (e) => { e.preventDefault(); drop.classList.remove("dragging"); }));
  drop.addEventListener("drop", (event) => selectFile(event.dataTransfer.files[0]));
}

function initializeEvents() {
  $$(".nav-item").forEach((item) => item.addEventListener("click", () => showView(item.dataset.view)));
  $$('[data-go], [data-go]').forEach((button) => button.addEventListener("click", () => showView(button.dataset.go)));
  $("#mobile-menu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $("#global-competencia").addEventListener("change", async (event) => {
    await loadResumo(event.target.value);
    if (state.view === "gerencial") await loadGerencial(event.target.value);
    if (state.view === "operacional") await loadOperacional(event.target.value);
    if (state.view === "auditoria") {
      await Promise.all([loadAuditoria(event.target.value), loadAutomaticos(event.target.value)]);
    }
    if (state.view === "powerpoint") await loadPowerPoint(event.target.value);
  });
  $("#auditoria-competencia").addEventListener("change", async (event) => {
    state.competencia = event.target.value;
    setSelectOptions($("#global-competencia"), state.resumo?.competencias || [], state.competencia, compBr);
    await Promise.all([loadAuditoria(event.target.value), loadAutomaticos(event.target.value)]);
  });
  $("#powerpoint-competencia").addEventListener("change", (event) => loadPowerPoint(event.target.value));
  $("#powerpoint-download").addEventListener("click", baixarPowerPoint);
  $("#historico-atendente").addEventListener("change", (event) => loadHistorico(event.target.value));
  $("#feedback-competencia").addEventListener("change", updateFeedbackText);
  $("#feedback-save").addEventListener("click", saveFeedback);
  $("#processar-btn").addEventListener("click", processarArquivo);
  $("#import-competencia").addEventListener("change", updateProfile);
  $("#dashboard-export").addEventListener("click", () => exportar(state.competencia));
  $("#header-excel").addEventListener("click", () => exportar(state.competencia));
  $("#header-ppt").addEventListener("click", () => showView("powerpoint"));
  $("#auditoria-export").addEventListener("click", () => exportar($("#auditoria-competencia").value));
  $("#ranking-search").addEventListener("input", (event) => renderRankingTable(
    state.resumo?.ranking || [],
    event.target.value,
    Number(state.resumo?.info?.configuracao?.nota_minima || META_ELEGIBILIDADE),
  ));
  $("#operacional-search").addEventListener("input", (event) => renderOperationalTable(state.operacional?.atendentes || [], event.target.value));
  $("#audit-search").addEventListener("input", (event) => {
    state.auditPage = 1;
    renderAuditTable(state.auditoria?.exclusoes || [], event.target.value);
  });
  $("#audit-category").addEventListener("change", () => {
    state.auditPage = 1;
    renderAuditTable(state.auditoria?.exclusoes || [], $("#audit-search").value);
  });
  $("#automaticos-search").addEventListener("input", (event) => {
    state.automaticosPage = 1;
    renderAutomaticosTable(state.automaticos?.registros || [], event.target.value);
  });
  window.addEventListener("hashchange", () => {
    const requested = window.location.hash.slice(1);
    const allowed = ["gerencial", "operacional", "dashboard", "historico", "auditoria", "sobre", "importacao", "powerpoint"];
    if (allowed.includes(requested) && requested !== state.view) showView(requested);
  });
}

async function init() {
  let version = "Executive 3.0";
  try {
    const saude = await api("/api/saude");
    state.demo = Boolean(saude?.demonstracao);
    version = saude?.versao || version;
  } catch (_error) {
    state.demo = false;
  }
  $(".version-mark").textContent = String(version).toLocaleUpperCase("pt-BR");
  const now = new Date();
  $("#today-chip").textContent = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  $("#import-competencia").value = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  $("#import-excluidos").value = "Agente Demonstração Excluído";
  setupUpload();
  initializeEvents();
  aplicarModoDemonstracao();
  await updateProfile();
  await loadResumo();
  const requested = window.location.hash.slice(1);
  const allowed = ["gerencial", "operacional", "dashboard", "historico", "auditoria", "sobre", "importacao", "powerpoint"];
  showView(allowed.includes(requested) ? requested : "sobre");
}

document.addEventListener("DOMContentLoaded", init);
