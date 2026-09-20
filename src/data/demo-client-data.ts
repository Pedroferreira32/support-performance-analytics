import type { ValidRecord } from "@/lib/validation-engine";

export interface DemoClientSnapshot {
  competencia: string;
  competenciaBr: string;
  validos: ValidRecord[];
}

const NAMED_CLIENTS = [
  "Mercado Horizonte — Demo",
  "Farmácia Aurora — Demo",
  "Distribuidora Atlas — Demo",
  "Padaria Primavera — Demo",
  "Restaurante Estação — Demo",
  "Loja Vale Verde — Demo",
  "Empório Central — Demo",
  "Papelaria Integra — Demo",
  "Autopeças Rota Sul — Demo",
  "Clínica Bem-Estar — Demo",
  "Casa do Construtor — Demo",
  "Hotel Serra Azul — Demo",
];

const CLIENT_NAMES = Array.from({ length: 50 }, (_, index) =>
  NAMED_CLIENTS[index] ?? `Empresa Demonstrativa ${String(index + 1).padStart(2, "0")}`,
);

const AGENTS = [
  "Agente Demo 01",
  "Agente Demo 02",
  "Agente Demo 03",
  "Agente Demo 04",
  "Agente Demo 05",
  "Agente Demo 06",
];

function distribute(total: number, size: number, seed: number): number[] {
  const weights = Array.from({ length: size }, (_, index) => size + 20 - index + ((index + seed) % 4));
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  const exact = weights.map((weight) => (total * weight) / weightTotal);
  const result = exact.map(Math.floor);
  let remainder = total - result.reduce((sum, value) => sum + value, 0);
  const priority = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let index = 0; remainder > 0; index += 1, remainder -= 1) {
    result[priority[index % priority.length].index] += 1;
  }
  return result;
}

function timestamp(year: number, month: number, day: number, hour: number, minute: number): string {
  return new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString().slice(0, 19);
}

function buildRecords(
  year: number,
  month: number,
  identifiedTotal: number,
  unidentifiedTotal: number,
  seed: number,
): ValidRecord[] {
  const records: ValidRecord[] = [];
  const counts = distribute(identifiedTotal, CLIENT_NAMES.length, seed);

  counts.forEach((count, clientIndex) => {
    for (let ticketIndex = 0; ticketIndex < count; ticketIndex += 1) {
      const day = ((ticketIndex * 3 + clientIndex * 5 + seed) % 28) + 1;
      const hour = 8 + ((ticketIndex + clientIndex + seed) % 12);
      const minute = (ticketIndex * 7 + clientIndex * 3) % 60;
      const durationMinutes = 4 + ((ticketIndex * 11 + clientIndex) % 52);
      const startedAt = new Date(Date.UTC(year, month - 1, day, hour, minute));
      const finishedAt = new Date(startedAt.getTime() + durationMinutes * 60_000);
      const ratingBase = 4 + (((ticketIndex + clientIndex + seed) % 11) / 10);
      const rating = (ticketIndex + clientIndex) % 9 === 0 ? null : Math.min(5, ratingBase);

      records.push({
        linhaOrigem: records.length + 2,
        protocolo: `DEMO-${year}${String(month).padStart(2, "0")}-${String(records.length + 1).padStart(5, "0")}`,
        cliente: CLIENT_NAMES[clientIndex],
        contato: `55000000${String(1000 + clientIndex).padStart(4, "0")}`,
        atendente: AGENTS[(ticketIndex + clientIndex + seed) % AGENTS.length],
        departamento: "Suporte",
        status: "Finalizado",
        inicio: startedAt.toISOString().slice(0, 19),
        fim: finishedAt.toISOString().slice(0, 19),
        avaliacao: rating,
        duracaoHoras: durationMinutes / 60,
        tmaMinutos: durationMinutes,
        suspeitoAutomatico: false,
        duracaoConsiderada: true,
      });
    }
  });

  for (let index = 0; index < unidentifiedTotal; index += 1) {
    const day = ((index * 5 + seed) % 28) + 1;
    const hour = 8 + ((index + seed) % 12);
    const minute = (index * 13) % 60;
    const durationMinutes = 5 + ((index * 7) % 45);
    records.push({
      linhaOrigem: records.length + 2,
      protocolo: `DEMO-SEM-ID-${year}${String(month).padStart(2, "0")}-${String(index + 1).padStart(3, "0")}`,
      cliente: "",
      contato: "",
      atendente: AGENTS[(index + seed) % AGENTS.length],
      departamento: "Suporte",
      status: "Finalizado",
      inicio: timestamp(year, month, day, hour, minute),
      fim: timestamp(year, month, day, hour, Math.min(59, minute + durationMinutes)),
      avaliacao: index % 8 === 0 ? null : 4.5,
      duracaoHoras: durationMinutes / 60,
      tmaMinutos: durationMinutes,
      suspeitoAutomatico: false,
      duracaoConsiderada: true,
    });
  }

  return records;
}

export const demoClientSnapshots: DemoClientSnapshot[] = [
  {
    competencia: "2026-07",
    competenciaBr: "07/2026",
    validos: buildRecords(2026, 7, 2_220, 129, 3),
  },
  {
    competencia: "2026-08",
    competenciaBr: "08/2026",
    validos: buildRecords(2026, 8, 2_260, 90, 7),
  },
];
