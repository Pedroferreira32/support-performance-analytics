from __future__ import annotations

import csv
from io import StringIO

import pytest

from backend.app.portfolio import parse_monthly_portfolio
from scripts.generate_synthetic_history import MONTHS, build_month, monthly_portfolio


def portfolio_csv(rows: list[dict]) -> bytes:
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "Competência", "Revenda", "Clientes ativos", "Assinaturas ativas"
    ])
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue().encode("utf-8-sig")


def test_generator_keeps_clients_inside_their_reseller_portfolio() -> None:
    competence = "2026-08"
    portfolio = monthly_portfolio(competence)
    rows = build_month(competence, MONTHS[competence])
    by_reseller = {row["Revenda"]: int(row["Clientes ativos"]) for row in portfolio}
    contacted = {name: set() for name in by_reseller}
    for row in rows:
        contacted[row["Revenda"]].add(row["Contact ID"])
    assert len(rows) == 10_000
    assert len(portfolio) == 24
    assert sum(map(len, contacted.values())) > 5_000
    assert all(len(contacted[name]) <= active for name, active in by_reseller.items())
    assert build_month(competence, MONTHS[competence])[:10] == rows[:10]


def test_portfolio_rejects_missing_resellers_and_bad_denominators() -> None:
    rows = [
        {"Competência": "2026-08", "Revenda": "A", "Clientes ativos": 70, "Assinaturas ativas": 82},
        {"Competência": "2026-08", "Revenda": "B", "Clientes ativos": 10, "Assinaturas ativas": 12},
    ]
    assert len(parse_monthly_portfolio(portfolio_csv(rows), "2026-08", {"A", "B"})) == 2
    with pytest.raises(ValueError, match="não cobre"):
        parse_monthly_portfolio(portfolio_csv(rows[:1]), "2026-08", {"A", "B"})
    rows[1]["Assinaturas ativas"] = 8
    with pytest.raises(ValueError, match="inconsistentes"):
        parse_monthly_portfolio(portfolio_csv(rows), "2026-08", {"A", "B"})
