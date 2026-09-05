"use strict";

const path = require("path");
const fs = require("fs");

const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
global.PptxGenJS = runtimeModules
  ? require(path.join(runtimeModules, "pptxgenjs"))
  : require("pptxgenjs");
const generator = require("./powerpoint.js");

const names = ["Lucas Rocha", "Marina Costa", "Bruno Souza", "Diego Santos", "Rafael Lima", "Camila Alves", "Juliana Melo"];
const notes = [99.56, 94.97, 88.41, 87.27, 83.68, 82.43, 79.12];
const ranking = names.map((name, index) => ({
  rank: index + 1,
  atendente: name,
  atendimentos: [326, 280, 246, 222, 220, 197, 110][index],
  tma_medio_min: [94.53, 94.56, 119.09, 105.97, 120.64, 117.97, 96.73][index],
  horas_total: [513.6, 441.3, 488.2, 392.1, 442.4, 387.3, 177.3][index],
  avaliacao_media: [4.74, 4.70, 4.80, 4.71, 4.56, 4.65, 4.75][index],
  pontos_quantidade: [20, 17.18, 15.09, 13.62, 13.5, 12.09, 6.75][index],
  pontos_tempo: [10, 8.59, 9.51, 7.63, 8.61, 7.54, 3.45][index],
  pontos_tma: [30, 29.99, 23.81, 26.76, 23.51, 24.04, 29.32][index],
  pontos_avaliacao: [39.56, 39.21, 40, 39.26, 38.06, 38.76, 39.59][index],
  nota_final: notes[index],
  elegivel: index < 4 ? 1 : 0,
  feedback: index < 4
    ? "Ponto forte: excelente equilíbrio dos indicadores. Foco: sustentar a consistência. Resultado evoluiu no mês anterior. Meta atingida."
    : "Ponto forte: boa avaliação dos clientes. Foco: reduzir o TMA e ampliar o volume válido. Resultado estável em relação ao mês anterior. Faltaram pontos para a meta.",
}));

const previousNotes = [93.68, 83.81, 82.74, 76.58, 79.85, 83.94, 88.02];
const payload = {
  competencia: "2026-06",
  competencia_br: "06/2026",
  quantidade_slides: 19,
  atual: {
    competencia: "2026-06",
    info: {
      arquivo_origem: "atendimentos_junho.xlsx",
      processado_em: "2026-06-30T18:00:00",
      total_linhas: 2212,
      validos: 1601,
      excluidos: 611,
      suspeitos_automaticos: 0,
      configuracao: {
        perfil_regra: "Novo modelo oficial — 9 horas",
        somente_finalizados: true,
        incluir_fora_expediente: false,
        hora_inicio: "08:00",
        hora_fim: "19:59",
        max_horas: 9,
        nota_minima: 85,
        escala_avaliacao_max: 5,
        peso_quantidade: 20,
        peso_tempo: 10,
        peso_tma: 30,
        peso_avaliacao: 40,
      },
      estatisticas: { ACIMA_H: 592, PERIODO: 12, FORA_SUPORTE: 7 },
    },
    ranking,
  },
  anterior: {
    competencia: "2026-05",
    ranking: ranking.map((row, index) => ({ ...row, nota_final: previousNotes[index] })),
  },
  comparativo: ranking.map((row, index) => ({
    atendente: row.atendente,
    rank_atual: row.rank,
    rank_anterior: row.rank,
    nota_atual: row.nota_final,
    nota_anterior: previousNotes[index],
    delta_nota: row.nota_final - previousNotes[index],
  })),
};

async function main() {
  const output = path.resolve(process.argv[2] || "powerpoint_teste.pptx");
  if (fs.existsSync(output)) fs.unlinkSync(output);
  const result = await generator.gerar(payload, { fileName: output });
  if (!fs.existsSync(output) || fs.statSync(output).size < 50000) throw new Error("PPTX não foi gerado corretamente.");
  if (result.slideCount !== 19) throw new Error(`Quantidade de slides incorreta: ${result.slideCount}`);
  process.stdout.write(JSON.stringify({ ...result, bytes: fs.statSync(output).size }));
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
