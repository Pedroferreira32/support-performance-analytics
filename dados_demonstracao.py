"""Geração determinística da base sintética usada na demonstração pública."""

from __future__ import annotations

import calendar
import random
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd

import motor_premiacao as core


AGENTES = (
    {"nome": "Marina Costa", "participacao": 0.170, "avaliacao": 4.82, "tma": 52},
    {"nome": "Lucas Rocha", "participacao": 0.160, "avaliacao": 4.90, "tma": 45},
    {"nome": "Camila Alves", "participacao": 0.150, "avaliacao": 4.75, "tma": 50},
    {"nome": "Rafael Lima", "participacao": 0.145, "avaliacao": 4.55, "tma": 60},
    {"nome": "Juliana Melo", "participacao": 0.135, "avaliacao": 4.45, "tma": 55},
    {"nome": "Bruno Souza", "participacao": 0.125, "avaliacao": 4.30, "tma": 70},
    {"nome": "Diego Santos", "participacao": 0.115, "avaliacao": 4.10, "tma": 75},
)

# Os volumes reproduzem a escala do case, mas todas as pessoas e linhas são fictícias.
COMPETENCIAS = (
    ("2026-06", 2214, 120),
    ("2026-07", 2484, 135),
    ("2026-08", 2477, 127),
)


def _distribuir(total: int, pesos: list[float]) -> list[int]:
    soma = sum(pesos)
    valores = [int(total * peso / soma) for peso in pesos]
    for indice in range(total - sum(valores)):
        valores[indice % len(valores)] += 1
    return valores


def _dias_trabalho(ano: int, mes: int) -> list[datetime]:
    return [
        datetime(ano, mes, dia)
        for dia in range(1, calendar.monthrange(ano, mes)[1] + 1)
        if datetime(ano, mes, dia).weekday() < 6
    ]


def _domingos(ano: int, mes: int) -> list[datetime]:
    return [
        datetime(ano, mes, dia)
        for dia in range(1, calendar.monthrange(ano, mes)[1] + 1)
        if datetime(ano, mes, dia).weekday() == 6
    ]


def _linha(
    protocolo: str,
    atendente: str,
    inicio: datetime,
    fim: datetime | None,
    avaliacao: float | str,
    departamento: str = "Suporte",
) -> dict[str, object]:
    return {
        "Protocolo": protocolo,
        "User ID": atendente,
        "Filas": departamento,
        "Filas Transfers": "",
        "Status": "Finalizado" if fim else "Pendente",
        "Iniciado": inicio.strftime("%d/%m/%Y %H:%M"),
        "Fim": fim.strftime("%d/%m/%Y %H:%M") if fim else "",
        "Rating": avaliacao,
    }


def gerar_competencia(
    competencia: str, total_linhas: int, total_invalidas: int
) -> pd.DataFrame:
    """Cria atendimentos sintéticos com variação, outliers e avaliações ausentes."""
    ano, mes = (int(parte) for parte in competencia.split("-"))
    indice_mes = mes - 6
    rng = random.Random(202600 + mes)
    dias = _dias_trabalho(ano, mes)
    domingos = _domingos(ano, mes)
    total_validas_planejado = total_linhas - total_invalidas

    pesos = [
        agente["participacao"] * (1 + 0.035 * ((indice + indice_mes) % 3 - 1))
        for indice, agente in enumerate(AGENTES)
    ]
    volumes = _distribuir(total_validas_planejado, pesos)
    registros: list[dict[str, object]] = []
    sequencia = 1

    for indice_agente, (agente, volume) in enumerate(zip(AGENTES, volumes)):
        for indice in range(volume):
            dia = dias[(indice * 3 + indice_agente * 5 + indice_mes) % len(dias)]
            hora = 8 + ((indice + indice_agente * 2) % 11)
            minuto = (indice * 7 + indice_agente * 11) % 60
            inicio = dia.replace(hour=hora, minute=minuto)

            duracao_media = agente["tma"] * (1.06 - indice_mes * 0.025)
            duracao = int(max(12, min(210, rng.gauss(duracao_media, 14))))
            fim = inicio + timedelta(minutes=duracao)

            # Simula encerramentos automáticos presentes nas competências recentes.
            if competencia >= "2026-07" and indice > 0 and indice % 53 == 0:
                fim = (inicio + timedelta(days=1)).replace(hour=6, minute=0)

            avaliacao_media = agente["avaliacao"] + (indice_mes - 2) * 0.035
            avaliacao: float | str = round(
                max(1.0, min(5.0, rng.gauss(avaliacao_media, 0.28))), 1
            )
            if rng.random() < 0.11:
                avaliacao = ""

            registros.append(
                _linha(
                    f"DEMO-{competencia.replace('-', '')}-{sequencia:05d}",
                    agente["nome"],
                    inicio,
                    fim,
                    avaliacao,
                )
            )
            sequencia += 1

    tipos_padrao = (
        "departamento",
        "sem_atendente",
        "sem_fim",
        "negativa",
        "duracao",
        "periodo",
    )
    tipos_julho = ("departamento", "sem_atendente", "sem_fim", "negativa")
    tipos = tipos_julho if competencia == "2026-07" else tipos_padrao

    for indice in range(total_invalidas):
        tipo = tipos[indice % len(tipos)]
        agente = AGENTES[indice % len(AGENTES)]["nome"]
        dia = dias[(indice * 5) % len(dias)]
        inicio = dia.replace(hour=10 + indice % 6, minute=(indice * 13) % 60)
        fim: datetime | None = inicio + timedelta(minutes=45 + indice % 35)
        departamento = "Suporte"

        if tipo == "departamento":
            departamento = "Comercial"
        elif tipo == "sem_atendente":
            agente = ""
        elif tipo == "sem_fim":
            fim = None
        elif tipo == "negativa":
            fim = inicio - timedelta(minutes=20)
        elif tipo == "duracao":
            fim = inicio + timedelta(hours=10, minutes=15)
        elif tipo == "periodo":
            domingo = domingos[indice % len(domingos)]
            inicio = domingo.replace(hour=7, minute=15)
            fim = inicio + timedelta(minutes=50)

        registros.append(
            _linha(
                f"DEMO-{competencia.replace('-', '')}-X{indice + 1:04d}",
                agente,
                inicio,
                fim,
                4.5,
                departamento,
            )
        )

    dados = pd.DataFrame(registros)
    return dados.sample(frac=1, random_state=ano * 100 + mes).reset_index(drop=True)


def inicializar_demonstracao(caminho_banco: Path) -> core.BancoHistorico:
    """Recria o histórico sintético quando a demonstração ainda não está pronta."""
    esperadas = [item[0] for item in COMPETENCIAS]
    banco = core.BancoHistorico(caminho_banco)
    if banco.competencias() == esperadas:
        return banco

    if caminho_banco.exists():
        caminho_banco.unlink()
    banco = core.BancoHistorico(caminho_banco)

    for competencia, total, invalidas in COMPETENCIAS:
        dados = gerar_competencia(competencia, total, invalidas)
        configuracao = core.configuracao_oficial(competencia)
        configuracao.atendentes_excluidos = ""
        resultado = core.processar_dados(
            dados,
            configuracao,
            banco,
            origem=f"atendimentos_sinteticos_{competencia}.csv",
            avisos=[
                "Base sintética criada exclusivamente para demonstração de portfólio."
            ],
        )
        banco.salvar(resultado)

    return banco

