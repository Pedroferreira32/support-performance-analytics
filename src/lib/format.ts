export function fmtBR(n: number, min = 0, max = 2) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}
