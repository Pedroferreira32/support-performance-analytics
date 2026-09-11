import { describe, expect, it } from "vitest";

import {
  detectCompetence,
  parseDate,
  processFile,
  type UploadFile,
} from "@/lib/validation-engine";

function upload(name: string, contents: string): UploadFile {
  return {
    name,
    async arrayBuffer() {
      return new TextEncoder().encode(contents).buffer;
    },
  };
}

const header = "Protocolo,User ID,Iniciado,Fim,Setores,Setores Transfers,Rating";

describe("motor de validação", () => {
  it("define a competência pela data de início, mesmo com término no mês seguinte", async () => {
    const file = upload("agosto.csv", `${header}\n1,Ana Sofia,31/08/2026 19:56,01/09/2026 02:47,Suporte,,5`);

    await expect(detectCompetence(file)).resolves.toBe("2026-08");
    const result = await processFile(file, "08/2026");

    expect(result.competencia).toBe("2026-08");
    expect(result.validos).toHaveLength(1);
  });

  it("prioriza Iniciado sobre Criado quando as duas colunas existem", async () => {
    const file = upload(
      "datas.csv",
      "Protocolo,User ID,Criado,Iniciado,Fim,Setores,Rating\n1,Ana Sofia,31/07/2026 23:50,01/08/2026 08:00,01/08/2026 09:00,Suporte,5",
    );

    await expect(detectCompetence(file)).resolves.toBe("2026-08");
    const result = await processFile(file, "08/2026");
    expect(result.validos[0].inicio).toBe("2026-08-01T08:00:00");
    expect(result.mapeamento.inicio).toBe("Iniciado");
  });

  it("rejeita datas de calendário inexistentes", () => {
    expect(parseDate("31/02/2026 10:00")).toBeNull();
    expect(parseDate("2026-02-31 10:00")).toBeNull();
  });

  it("repara linhas CSV encapsuladas e reconhece Suporte no campo de transferência", async () => {
    const encapsulated = `"1,Ana Sofia,10/08/2026 10:00,10/08/2026 11:00,bot,""bot, Suporte"",5"`;
    const file = upload("chatmobi.csv", `${header}\n${encapsulated}`);

    const result = await processFile(file, "08/2026");

    expect(result.validos).toHaveLength(1);
    expect(result.mapeamento.filasTransfers).toBe("Setores Transfers");
  });

  it("inclui finalizações automáticas, mas protege sua duração de Tempo e TMA", async () => {
    const rows = Array.from({ length: 20 }, (_, index) =>
      `${index + 1},Ana Sofia,31/08/2026 10:${String(index).padStart(2, "0")},01/09/2026 02:47,Suporte,,5`,
    );
    const result = await processFile(upload("automaticos.csv", [header, ...rows].join("\n")), "08/2026");

    expect(result.validos).toHaveLength(20);
    expect(result.estatisticas.AUTOMATICOS_VALIDOS).toBe(20);
    expect(result.estatisticas.AUTOMATICOS_RECUPERADOS).toBe(20);
    expect(result.validos.every((row) => !row.duracaoConsiderada)).toBe(true);
    expect(result.ranking[0].pontosTempo + result.ranking[0].pontosTma).toBeCloseTo(31.5, 6);
  });

  it("aplica exclusão parcial de nomes sem rejeitar os demais atendentes", async () => {
    const file = upload(
      "nomes.csv",
      [
        header,
        "1,Fabíola Santos,10/08/2026 10:00,10/08/2026 11:00,Suporte,,5",
        "2,Ana Sofia,10/08/2026 10:00,10/08/2026 11:00,Suporte,,8",
      ].join("\n"),
    );

    const result = await processFile(file, "08/2026", "Fabíola");

    expect(result.validos.map((row) => row.atendente)).toEqual(["Ana Sofia"]);
    expect(result.excluidos[0].motivoCodigo).toBe("ATENDENTE_EXCLUIDO");
    expect(result.validos[0].avaliacao).toBeNull();
  });

  it("marca somente os três maiores entre quatro elegíveis", async () => {
    const names = ["Ana", "Bruna", "Carla", "Diana"];
    const ratings = [5, 4.9, 4.8, 4.7];
    const rows = names.flatMap((name, employeeIndex) =>
      Array.from({ length: 10 }, (_, rowIndex) =>
        `${employeeIndex + 1}-${rowIndex + 1},${name},10/08/2026 10:${String(rowIndex).padStart(2, "0")},10/08/2026 11:${String(rowIndex).padStart(2, "0")},Suporte,,${ratings[employeeIndex]}`,
      ),
    );
    const result = await processFile(upload("ranking.csv", [header, ...rows].join("\n")), "08/2026");

    expect(result.ranking.every((row) => row.elegivel)).toBe(true);
    expect(result.ranking.filter((row) => row.premiado).map((row) => row.atendente)).toEqual(["Ana", "Bruna", "Carla"]);
    expect(result.ranking.find((row) => row.atendente === "Diana")?.premiado).toBe(false);
  });
});
