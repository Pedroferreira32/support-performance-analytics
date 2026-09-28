import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadPreviewSnapshots } from "@/lib/preview-data";

describe("prévia pública do histórico sintético", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("carrega seis resumos e os dois meses detalhados mais recentes", async () => {
    const requests: string[] = [];
    vi.stubGlobal("fetch", async (input: string) => {
      requests.push(input);
      const path = new URL(input, "http://localhost").pathname;
      return new Response(readFileSync(`public${path}`));
    });

    const snapshots = await loadPreviewSnapshots();
    expect(requests).toEqual([
      "/demo/manifest.json",
      "/demo/2026-08.bin",
      "/demo/2026-07.bin",
    ]);
    expect(snapshots).toHaveLength(6);
    expect(snapshots.at(-1)?.totalLinhas).toBe(10_000);
    expect(snapshots.at(-1)?.validos).toHaveLength(9_395);
    expect(snapshots.at(-1)?.carteira).toHaveLength(24);
    expect(snapshots[0].validos).toHaveLength(0);
  });

  it("permite selecionar o primeiro mês sem voltar para o último", async () => {
    const requests: string[] = [];
    vi.stubGlobal("fetch", async (input: string) => {
      requests.push(input);
      const path = new URL(input, "http://localhost").pathname;
      return new Response(readFileSync(`public${path}`));
    });

    const snapshots = await loadPreviewSnapshots("2026-03");
    expect(requests).toEqual(["/demo/manifest.json", "/demo/2026-03.bin"]);
    expect(snapshots[0].validos).toHaveLength(8_224);
  });
});
