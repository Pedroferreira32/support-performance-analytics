from __future__ import annotations

import csv
from io import StringIO


def parse_monthly_portfolio(
    content: bytes, competence: str, expected_resellers: set[str]
) -> list[dict[str, str | int]]:
    """Validate the independent monthly reseller portfolio used as a KPI denominator."""
    reader = csv.DictReader(StringIO(content.decode("utf-8-sig")))
    required = {"Competência", "Revenda", "Clientes ativos", "Assinaturas ativas"}
    if not reader.fieldnames or not required.issubset(reader.fieldnames):
        raise ValueError("A carteira deve conter competência, revenda, clientes e assinaturas ativas.")

    result: list[dict[str, str | int]] = []
    seen: set[str] = set()
    for number, row in enumerate(reader, start=2):
        reseller = (row["Revenda"] or "").strip()
        if (row["Competência"] or "").strip() != competence or not reseller or reseller in seen:
            raise ValueError(f"Carteira inválida na linha {number}: competência ou revenda duplicada.")
        try:
            clients = int(row["Clientes ativos"] or "")
            subscriptions = int(row["Assinaturas ativas"] or "")
        except ValueError as error:
            raise ValueError(f"Carteira inválida na linha {number}: contagens não inteiras.") from error
        if clients <= 0 or subscriptions < clients:
            raise ValueError(f"Carteira inválida na linha {number}: contagens inconsistentes.")
        seen.add(reseller)
        result.append({
            "revenda": reseller,
            "clientesAtivos": clients,
            "assinaturasAtivas": subscriptions,
        })

    if not expected_resellers.issubset(seen):
        raise ValueError(
            "A carteira não cobre todas as revendas com atendimentos: "
            f"faltam {sorted(expected_resellers - seen)}."
        )
    return result
