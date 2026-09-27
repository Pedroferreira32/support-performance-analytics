from __future__ import annotations

import csv
from datetime import date, datetime, time, timedelta
from pathlib import Path
import random


OUTPUT_DIR = Path(__file__).resolve().parents[1] / "generated_demo_history"

AGENTS = [
    "Marina Costa",
    "Lucas Rocha",
    "Camila Alves",
    "Rafael Lima",
    "Juliana Melo",
    "Bruno Souza",
    "Diego Santos",
]

NAMED_CLIENTS = [
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
]

CLIENTS = NAMED_CLIENTS + [
    f"Empresa Demonstrativa {index:02d}" for index in range(13, 81)
]

RESELLERS = [
    "Revenda Atlas — Demo",
    "Revenda Conecta — Demo",
    "Revenda Horizonte — Demo",
    "Revenda Integra — Demo",
    "Revenda Vale — Demo",
    "Revenda Prisma — Demo",
    "Revenda Evolução — Demo",
    "Revenda Central — Demo",
    "Revenda Nexo — Demo",
    "Revenda Vértice — Demo",
    "Revenda Aurora — Demo",
    "Revenda Rota — Demo",
    "Revenda Pioneira — Demo",
    "Revenda Essencial — Demo",
    "Revenda Dinâmica — Demo",
    "Revenda Líder — Demo",
    "Revenda Impacto — Demo",
    "Revenda União — Demo",
    "Revenda Digital — Demo",
    "Revenda Prime — Demo",
    "Revenda Sul — Demo",
    "Revenda Sudeste — Demo",
    "Revenda Nordeste — Demo",
    "Revenda Nacional — Demo",
]

MONTHS = {
    "2026-03": {
        "rows": 8800,
        "shares": [0.147, 0.144, 0.141, 0.136, 0.139, 0.148, 0.145],
        "ratings": [9.42, 9.55, 9.31, 9.08, 8.92, 8.75, 8.58],
        "coverage": 0.835,
        "automatic": 0,
    },
    "2026-04": {
        "rows": 9000,
        "shares": [0.153, 0.145, 0.143, 0.137, 0.139, 0.142, 0.141],
        "ratings": [9.48, 9.58, 9.38, 9.14, 9.01, 8.81, 8.66],
        "coverage": 0.848,
        "automatic": 0,
    },
    "2026-05": {
        "rows": 9200,
        "shares": [0.158, 0.147, 0.145, 0.139, 0.137, 0.139, 0.135],
        "ratings": [9.51, 9.61, 9.41, 9.20, 9.05, 8.88, 8.72],
        "coverage": 0.861,
        "automatic": 0,
    },
    "2026-06": {
        "rows": 9400,
        "shares": [0.163, 0.150, 0.145, 0.139, 0.136, 0.135, 0.132],
        "ratings": [4.74, 4.82, 4.68, 4.53, 4.45, 4.31, 4.18],
        "coverage": 0.874,
        "automatic": 0,
    },
    "2026-07": {
        "rows": 9600,
        "shares": [0.166, 0.152, 0.146, 0.141, 0.135, 0.132, 0.128],
        "ratings": [4.76, 4.84, 4.71, 4.55, 4.47, 4.34, 4.20],
        "coverage": 0.886,
        "automatic": 0,
    },
    "2026-08": {
        "rows": 10000,
        "shares": [0.170, 0.153, 0.147, 0.141, 0.132, 0.130, 0.127],
        "ratings": [4.77, 4.82, 4.73, 4.52, 4.44, 4.29, 4.09],
        "coverage": 0.891,
        "automatic": 0,
    },
}

HEADERS = [
    "Protocolo",
    "Contact ID",
    "Contact Number",
    "Revenda",
    "Atendente",
    "Filas",
    "Iniciado",
    "Data Última Mensagem",
    "Rating",
    "Status",
]


def month_days(year: int, month: int) -> list[date]:
    cursor = date(year, month, 1)
    result: list[date] = []
    while cursor.month == month:
        if cursor.weekday() != 6:
            result.append(cursor)
        cursor += timedelta(days=1)
    return result


def choose_weighted_index(rng: random.Random, weights: list[float]) -> int:
    return rng.choices(range(len(weights)), weights=weights, k=1)[0]


def choose_client(rng: random.Random) -> int:
    weights = [1 / ((index + 2) ** 0.83) for index in range(len(CLIENTS))]
    return choose_weighted_index(rng, weights)


def rounded_rating(rng: random.Random, mean: float, maximum: float) -> str:
    value = max(0.0, min(maximum, rng.gauss(mean, 0.42 if maximum == 10 else 0.23)))
    return f"{round(value * 2) / 2:.1f}"


def normal_start(rng: random.Random, days: list[date]) -> datetime:
    selected = rng.choice(days)
    hour = rng.choices(
        list(range(8, 20)),
        weights=[5, 8, 11, 13, 14, 12, 12, 11, 9, 7, 5, 3],
        k=1,
    )[0]
    minute = rng.randrange(0, 60)
    return datetime.combine(selected, time(hour, minute))


def valid_duration_minutes(rng: random.Random, agent_index: int) -> int:
    centers = [18, 16, 19, 22, 21, 24, 27]
    value = int(rng.lognormvariate(2.3, 0.58) + centers[agent_index] - 10)
    return max(3, min(185, value))


def exclusion_kind(rng: random.Random, competence: str) -> str | None:
    roll = rng.random()
    thresholds = [
        (0.018, "outside_support"),
        (0.026, "missing_attendant"),
        (0.035, "missing_end"),
        (0.041, "negative_duration"),
        (0.047, "invalid_start"),
    ]
    if competence != "2026-07":
        thresholds.extend([(0.054, "too_long"), (0.061, "out_of_period")])
    for threshold, kind in thresholds:
        if roll < threshold:
            return kind
    return None


def build_month(competence: str, config: dict[str, object]) -> list[dict[str, str]]:
    year, month = map(int, competence.split("-"))
    rng = random.Random(202600 + month)
    days = month_days(year, month)
    rows: list[dict[str, str]] = []
    automatic_left = int(config["automatic"])
    maximum_rating = 10.0 if competence <= "2026-05" else 5.0
    total_rows = int(config["rows"])
    agent_shares = list(config["shares"])
    agent_ratings = list(config["ratings"])
    coverage = float(config["coverage"])

    for index in range(total_rows):
        agent_index = choose_weighted_index(rng, agent_shares)
        client_index = choose_client(rng)
        started = normal_start(rng, days)
        duration = valid_duration_minutes(rng, agent_index)
        finished = started + timedelta(minutes=duration)
        kind = exclusion_kind(rng, competence)

        is_automatic = automatic_left > 0 and kind is None and rng.random() < (automatic_left / max(1, total_rows - index))
        if is_automatic:
            finished = datetime.combine(started.date() + timedelta(days=1), time(6, 0))
            automatic_left -= 1

        attendant = AGENTS[agent_index]
        department = "Suporte"
        started_text = started.strftime("%Y-%m-%d %H:%M:%S")
        finished_text = finished.strftime("%Y-%m-%d %H:%M:%S")

        if kind == "outside_support":
            department = rng.choice(["Comercial", "Financeiro", "Implantação"])
        elif kind == "missing_attendant":
            attendant = ""
        elif kind == "missing_end":
            finished_text = ""
        elif kind == "negative_duration":
            finished_text = (started - timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S")
        elif kind == "invalid_start":
            started_text = "PENDENTE"
        elif kind == "too_long":
            finished_text = (started + timedelta(hours=10, minutes=15)).strftime("%Y-%m-%d %H:%M:%S")
        elif kind == "out_of_period":
            started = datetime.combine(started.date(), time(7, rng.randrange(0, 45)))
            finished = started + timedelta(minutes=duration)
            started_text = started.strftime("%Y-%m-%d %H:%M:%S")
            finished_text = finished.strftime("%Y-%m-%d %H:%M:%S")

        rating = (
            rounded_rating(rng, float(agent_ratings[agent_index]), maximum_rating)
            if rng.random() < coverage
            else ""
        )
        rows.append(
            {
                "Protocolo": f"DEMO-{year}{month:02d}-{index + 1:05d}",
                "Contact ID": CLIENTS[client_index],
                "Contact Number": f"55000000{1000 + client_index:04d}",
                "Revenda": RESELLERS[(client_index * 7 + client_index // 3) % len(RESELLERS)],
                "Atendente": attendant,
                "Filas": department,
                "Iniciado": started_text,
                "Data Última Mensagem": finished_text,
                "Rating": rating,
                "Status": "Finalizado",
            }
        )

    return rows


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for competence, config in MONTHS.items():
        rows = build_month(competence, config)
        target = OUTPUT_DIR / f"atendimentos_sinteticos_{competence}.csv"
        with target.open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=HEADERS)
            writer.writeheader()
            writer.writerows(rows)
        print(f"{competence}: {len(rows)} linhas -> {target}")


if __name__ == "__main__":
    main()
