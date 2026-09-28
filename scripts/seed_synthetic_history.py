from __future__ import annotations

import argparse
import csv
from io import StringIO

from backend.app.database import SnapshotRepository
from backend.app.pipeline.engine import process_upload
from backend.app.portfolio import parse_monthly_portfolio
from scripts.generate_synthetic_history import (
    HEADERS,
    MONTHS,
    PORTFOLIO_HEADERS,
    build_month,
    monthly_portfolio,
)


def as_csv(rows: list[dict], headers: list[str]) -> bytes:
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue().encode("utf-8-sig")


def seed(repository: SnapshotRepository, months: list[str]) -> None:
    repository.initialize()
    for competence in months:
        rows = build_month(competence, MONTHS[competence])
        snapshot = process_upload(
            as_csv(rows, HEADERS), f"atendimentos_sinteticos_{competence}.csv", competence
        )
        snapshot["carteira"] = parse_monthly_portfolio(
            as_csv(monthly_portfolio(competence), PORTFOLIO_HEADERS),
            competence,
            {row["revenda"] for row in snapshot["revendas"]},
        )
        repository.save(snapshot)
        print(f"{competence}: {len(rows)} registros, {len(snapshot['carteira'])} revendas")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Carrega somente dados sintéticos em uma base de teste.")
    parser.add_argument("--database-url", required=True, help="Use uma base isolada, como sqlite:///tmp/demo.db")
    parser.add_argument("--month", choices=MONTHS, action="append", help="Omitir para as seis competências")
    args = parser.parse_args()
    seed(SnapshotRepository(args.database_url), args.month or list(MONTHS))
