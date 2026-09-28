import { describe, expect, it } from "vitest";

import { buildResellerIntelligence } from "@/lib/reseller-intelligence";
import type { CompetenceSnapshot, ResellerSummary } from "@/lib/validation-engine";

const reseller = (revenda: string, atendimentos: number, clientes: number): ResellerSummary => ({
  revenda, atendimentos, clientes, atendentes: 1, diasAtivos: 1,
  avaliacaoMedia: 4, avaliacoes: atendimentos, coberturaAvaliacao: 100, tmaMedioMin: 20,
});

describe("reseller intelligence", () => {
  it("ranks by demand relative to active clients and includes silent resellers", () => {
    const snapshot = {
      revendas: [reseller("A", 2, 2), reseller("B", 8, 5)],
      carteira: [
        { revenda: "A", clientesAtivos: 70, assinaturasAtivas: 82 },
        { revenda: "B", clientesAtivos: 10, assinaturasAtivas: 12 },
        { revenda: "C", clientesAtivos: 25, assinaturasAtivas: 30 },
      ],
    } as CompetenceSnapshot;
    const result = buildResellerIntelligence(snapshot);
    expect(result.rows.map((row) => row.revenda)).toEqual(["B", "A", "C"]);
    expect(result.rows[0].taxaPor100).toBe(80);
    expect(result.rows[1].taxaPor100).toBeCloseTo(2.86, 1);
    expect(result.rows[2].taxaPor100).toBe(0);
    expect(result.totalActiveClients).toBe(105);
    expect(result.overallRate).toBeCloseTo(10 / 105 * 100);
    expect(result.overallReach).toBeCloseTo(7 / 105 * 100);
  });

  it("does not invent rates for historical snapshots without a portfolio", () => {
    const result = buildResellerIntelligence({
      revendas: [reseller("A", 20, 2)],
    } as CompetenceSnapshot);
    expect(result.hasPortfolio).toBe(false);
    expect(result.overallRate).toBeNull();
    expect(result.rows[0].taxaPor100).toBeNull();
    expect(result.rows[0].signal).toBe("Sem carteira");
  });
});
