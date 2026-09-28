import type { CompetenceSnapshot } from "@/lib/validation-engine";

interface PreviewManifest {
  schemaVersion: number;
  source: string;
  totalTickets: number;
  validTickets: number;
  summaries: CompetenceSnapshot[];
}

export const previewDataEnabled = import.meta.env.VITE_PREVIEW_FIXTURE === "preview";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Não foi possível carregar ${url}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

async function fetchCompressedSnapshot(competence: string): Promise<CompetenceSnapshot> {
  const response = await fetch(`/demo/${encodeURIComponent(competence)}.bin`);
  if (!response.ok || !response.body) throw new Error(`Histórico sintético indisponível: ${competence}`);
  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  const snapshot = await new Response(stream).json() as CompetenceSnapshot;
  if (snapshot.competencia !== competence || !snapshot.origem.startsWith("atendimentos_sinteticos_")) {
    throw new Error(`Histórico sintético inválido: ${competence}`);
  }
  return snapshot;
}

export async function loadPreviewSnapshots(selected?: string | null): Promise<CompetenceSnapshot[]> {
  const manifest = await fetchJson<PreviewManifest>("/demo/manifest.json");
  if (manifest.schemaVersion !== 1 || !manifest.summaries.length ||
      !manifest.source.includes("sintéticos") ||
      manifest.summaries.some((snapshot) => !snapshot.origem.startsWith("atendimentos_sinteticos_"))) {
    throw new Error("O manifesto da demonstração está incompleto.");
  }
  const summaries = manifest.summaries;
  const selectedIndex = selected ? summaries.findIndex((snapshot) => snapshot.competencia === selected) : -1;
  const index = selectedIndex >= 0 ? selectedIndex : summaries.length - 1;
  const keys = [summaries[index]?.competencia, summaries[index - 1]?.competencia]
    .filter((value): value is string => Boolean(value));
  const full = await Promise.all(keys.map(fetchCompressedSnapshot));
  const fullByKey = new Map(full.map((snapshot) => [snapshot.competencia, snapshot]));
  return summaries.map((snapshot) => fullByKey.get(snapshot.competencia) ?? snapshot);
}
