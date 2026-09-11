import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { exportExcel, exportPowerPoint } from "@/lib/report-export";
import { processFile, type UploadFile } from "@/lib/validation-engine";

const originalDirectory = process.cwd();
let temporaryDirectory = "";

function upload(contents: string): UploadFile {
  return {
    name: "amostra.csv",
    async arrayBuffer() {
      return new TextEncoder().encode(contents).buffer;
    },
  };
}

afterEach(async () => {
  process.chdir(originalDirectory);
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = "";
});

describe("exportações executivas", () => {
  it("gera arquivos Excel e PowerPoint válidos", async () => {
    const snapshot = await processFile(
      upload([
        "Protocolo,User ID,Iniciado,Fim,Setores,Rating",
        "1,Ana,10/08/2026 10:00,10/08/2026 11:00,Suporte,5",
        "2,Bruna,10/08/2026 10:00,10/08/2026 11:00,Suporte,4.9",
      ].join("\n")),
      "08/2026",
    );
    temporaryDirectory = await mkdtemp(join(tmpdir(), "support-exports-"));
    process.chdir(temporaryDirectory);

    await exportExcel(snapshot, [snapshot]);
    await exportPowerPoint(snapshot, [snapshot]);

    const excel = join(temporaryDirectory, "Premiacao_Suporte_08-2026.xlsx");
    const presentation = join(temporaryDirectory, "Premiacao_Suporte_08-2026.pptx");
    expect((await stat(excel)).size).toBeGreaterThan(5_000);
    expect((await stat(presentation)).size).toBeGreaterThan(10_000);
    expect((await readFile(excel)).subarray(0, 2).toString()).toBe("PK");
    expect((await readFile(presentation)).subarray(0, 2).toString()).toBe("PK");
  }, 20_000);
});
