import type { Prioridade, Situacao } from "@/data/support-data-runtime";
import type { StatusTone } from "@/components/ui-ext/status-badge";

export function situacaoTone(s: Situacao): StatusTone {
  if (s === "Premiado") return "success";
  if (s === "Elegível — fora do Top 3") return "warning";
  return "danger";
}

export function prioridadeTone(p: Prioridade): StatusTone {
  if (p === "Alta") return "danger";
  if (p === "Média") return "warning";
  return "success";
}
