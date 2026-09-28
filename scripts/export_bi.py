from __future__ import annotations

import argparse
import csv
from pathlib import Path

from backend.app.database import SnapshotRepository


ATTENDANCE_FIELDS = [
    "competencia", "revenda", "cliente", "protocolo", "atendente", "inicio",
    "fim", "tma_minutos", "avaliacao", "suspeito_automatico",
]
PORTFOLIO_FIELDS = ["competencia", "revenda", "clientes_ativos", "assinaturas_ativas"]


def export(repository: SnapshotRepository, output_dir: Path) -> tuple[int, int]:
    """Produce two facts with the same month/reseller keys for a BI star model."""
    output_dir.mkdir(parents=True, exist_ok=True)
    attendances = 0
    portfolio = 0
    with (output_dir / "fato_atendimentos.csv").open("w", encoding="utf-8-sig", newline="") as ticket_file, \
         (output_dir / "fato_carteira_mensal.csv").open("w", encoding="utf-8-sig", newline="") as portfolio_file:
        ticket_writer = csv.DictWriter(ticket_file, fieldnames=ATTENDANCE_FIELDS)
        portfolio_writer = csv.DictWriter(portfolio_file, fieldnames=PORTFOLIO_FIELDS)
        ticket_writer.writeheader()
        portfolio_writer.writeheader()
        for snapshot in repository.list():
            competence = snapshot["competencia"]
            for row in snapshot.get("validos", []):
                ticket_writer.writerow({
                    "competencia": competence,
                    "revenda": row.get("revenda", ""),
                    "cliente": row.get("cliente", ""),
                    "protocolo": row["protocolo"],
                    "atendente": row["atendente"],
                    "inicio": row["inicio"],
                    "fim": row["fim"],
                    "tma_minutos": row["tmaMinutos"],
                    "avaliacao": row["avaliacao"],
                    "suspeito_automatico": row["suspeitoAutomatico"],
                })
                attendances += 1
            for row in snapshot.get("carteira", []):
                portfolio_writer.writerow({
                    "competencia": competence,
                    "revenda": row["revenda"],
                    "clientes_ativos": row["clientesAtivos"],
                    "assinaturas_ativas": row["assinaturasAtivas"],
                })
                portfolio += 1
    return attendances, portfolio


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Exporta somente os fatos necessários ao modelo Power BI.")
    parser.add_argument("--database-url", required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    print(f"Exportados {export(SnapshotRepository(args.database_url), args.output_dir)} registros.")
