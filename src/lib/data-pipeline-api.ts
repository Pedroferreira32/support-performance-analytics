import {
  detectCompetence,
  processFile,
  type CompetenceSnapshot,
} from "@/lib/validation-engine";

const API_URL = (import.meta.env.VITE_DATA_API_URL ?? "").trim().replace(/\/$/, "");
const ALLOW_LOCAL_FALLBACK = import.meta.env.VITE_ALLOW_LOCAL_PIPELINE_FALLBACK !== "false";
const SAME_ORIGIN_API = import.meta.env.PROD && !API_URL;

export type PipelineMode = "api" | "local";

export interface PipelineResult<T> {
  data: T;
  mode: PipelineMode;
  warning?: string;
}

export function pipelineApiEnabled(): boolean {
  return Boolean(API_URL) || SAME_ORIGIN_API;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json() as { detail?: string };
    if (body.detail) return body.detail;
  } catch {
    // Mantém a mensagem HTTP quando o corpo não é JSON.
  }
  return `A API de dados respondeu com HTTP ${response.status}.`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as T;
}

function fallbackWarning(error: unknown): string {
  const detail = error instanceof Error ? error.message : "Falha de conexão com a API.";
  return `A pipeline central não respondeu (${detail}). O arquivo foi processado pelo motor local de contingência e ainda não foi compartilhado com os demais navegadores.`;
}

export async function detectDataCompetence(file: File): Promise<PipelineResult<string | null>> {
  if (!pipelineApiEnabled()) {
    return { data: await detectCompetence(file), mode: "local" };
  }
  const form = new FormData();
  form.append("file", file);
  try {
    const response = await request<{ competencia: string | null }>("/api/v1/detectar-competencia", {
      method: "POST",
      body: form,
    });
    return { data: response.competencia, mode: "api" };
  } catch (error) {
    if (!ALLOW_LOCAL_FALLBACK) throw error;
    return { data: await detectCompetence(file), mode: "local", warning: fallbackWarning(error) };
  }
}

export async function processDataFile(
  file: File,
  competence: string,
  excludedNames: string,
): Promise<PipelineResult<CompetenceSnapshot>> {
  if (!pipelineApiEnabled()) {
    return { data: await processFile(file, competence, excludedNames), mode: "local" };
  }
  const form = new FormData();
  form.append("file", file);
  form.append("competencia", competence);
  form.append("atendentes_excluidos", excludedNames);
  try {
    const snapshot = await request<CompetenceSnapshot>("/api/v1/competencias/processar", {
      method: "POST",
      body: form,
    });
    return { data: snapshot, mode: "api" };
  } catch (error) {
    if (!ALLOW_LOCAL_FALLBACK) throw error;
    return {
      data: await processFile(file, competence, excludedNames),
      mode: "local",
      warning: fallbackWarning(error),
    };
  }
}

export async function loadPipelineSnapshots(): Promise<CompetenceSnapshot[] | null> {
  if (!pipelineApiEnabled()) return null;
  return await request<CompetenceSnapshot[]>("/api/v1/competencias");
}

export async function persistPipelineFeedback(
  competence: string,
  attendant: string,
  feedback: string,
): Promise<PipelineMode> {
  if (!pipelineApiEnabled()) return "local";
  try {
    await request<CompetenceSnapshot>(
      `/api/v1/competencias/${encodeURIComponent(competence)}/feedback/${encodeURIComponent(attendant)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      },
    );
    return "api";
  } catch (error) {
    if (!ALLOW_LOCAL_FALLBACK) throw error;
    return "local";
  }
}
