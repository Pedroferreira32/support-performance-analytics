import LZString from "lz-string";

import type { CompetenceSnapshot } from "@/lib/validation-engine";

const HISTORY_KEY = "support-performance-history-v2";
const SELECTED_KEY = "support-performance-selected-v2";
const EXCLUDED_KEY = "support-performance-excluded-v2";

function browserAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadSnapshots(): CompetenceSnapshot[] {
  if (!browserAvailable()) return [];
  try {
    const packed = window.localStorage.getItem(HISTORY_KEY);
    if (!packed) return [];
    const raw = LZString.decompressFromUTF16(packed);
    const parsed = JSON.parse(raw || "[]") as CompetenceSnapshot[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => a.competencia.localeCompare(b.competencia)) : [];
  } catch {
    return [];
  }
}

export function saveSnapshot(snapshot: CompetenceSnapshot): void {
  if (!browserAvailable()) return;
  const snapshots = loadSnapshots().filter((item) => item.competencia !== snapshot.competencia);
  snapshots.push(snapshot);
  snapshots.sort((a, b) => a.competencia.localeCompare(b.competencia));
  const packed = LZString.compressToUTF16(JSON.stringify(snapshots));
  try {
    window.localStorage.setItem(HISTORY_KEY, packed);
    setSelectedCompetence(snapshot.competencia);
  } catch {
    throw new Error("O navegador não possui espaço suficiente para salvar o histórico. Exporte o Excel e remova competências antigas.");
  }
}

export function replaceSnapshots(snapshots: CompetenceSnapshot[]): void {
  if (!browserAvailable()) return;
  window.localStorage.setItem(
    HISTORY_KEY,
    LZString.compressToUTF16(JSON.stringify(snapshots.sort((a, b) => a.competencia.localeCompare(b.competencia)))),
  );
}

export function selectedCompetence(): string | null {
  if (!browserAvailable()) return null;
  return window.localStorage.getItem(SELECTED_KEY);
}

export function setSelectedCompetence(value: string): void {
  if (!browserAvailable()) return;
  window.localStorage.setItem(SELECTED_KEY, value);
}

export function loadExcludedNames(): string {
  if (!browserAvailable()) return "";
  return window.localStorage.getItem(EXCLUDED_KEY) ?? "";
}

export function saveExcludedNames(value: string): void {
  if (!browserAvailable()) return;
  window.localStorage.setItem(EXCLUDED_KEY, value);
}

export function clearOperationalHistory(): void {
  if (!browserAvailable()) return;
  window.localStorage.removeItem(HISTORY_KEY);
  window.localStorage.removeItem(SELECTED_KEY);
}

export function updateFeedback(competencia: string, atendente: string, feedback: string): void {
  const snapshots = loadSnapshots();
  const snapshot = snapshots.find((item) => item.competencia === competencia);
  const row = snapshot?.ranking.find((item) => item.atendente === atendente);
  if (!snapshot || !row) throw new Error("Resultado não encontrado no histórico local.");
  row.feedback = feedback.trim();
  replaceSnapshots(snapshots);
}
