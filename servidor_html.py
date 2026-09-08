"""Servidor do dashboard de analytics de performance.

O servidor usa apenas a biblioteca padrão do Python para entregar a interface
HTML/CSS/JavaScript e reutiliza o motor de validação de ``motor_premiacao``.
"""

from __future__ import annotations

import json
import math
import mimetypes
import os
import tempfile
import threading
import webbrowser
from dataclasses import asdict
from datetime import date, datetime
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, quote, urlparse

import pandas as pd

import motor_premiacao as core
from dados_demonstracao import inicializar_demonstracao


APP_DIR = Path(__file__).resolve().parent
DEMO_MODE = os.environ.get("PREMIACAO_DEMO", "1").strip() != "0"
DB_PATH = Path(
    os.environ.get(
        "PREMIACAO_DB_PATH",
        str(
            Path(tempfile.gettempdir()) / "performance_analytics_demo.db"
            if DEMO_MODE
            else APP_DIR / core.DB_FILENAME
        ),
    )
)
HOST = "0.0.0.0"
PORT = int(os.environ.get("PORT", "8501"))
MAX_UPLOAD_BYTES = 50 * 1024 * 1024

ARQUIVOS_PUBLICOS = {
    "/": "dashboard.html",
    "/dashboard.html": "dashboard.html",
    "/dashboard.css": "dashboard.css",
    "/dashboard.js": "dashboard.js",
    "/powerpoint.js": "powerpoint.js",
    "/social-preview.svg": "social-preview.svg",
    "/vendor/jszip.min.js": "vendor/jszip.min.js",
    "/vendor/pptxgen.min.js": "vendor/pptxgen.min.js",
}


def banco() -> core.BancoHistorico:
    return core.BancoHistorico(DB_PATH)


def limpar_json(valor: Any) -> Any:
    """Converte tipos do pandas/numpy e valores ausentes para JSON estrito."""
    if valor is None:
        return None
    if isinstance(valor, (datetime, date, pd.Timestamp)):
        return valor.isoformat()
    if isinstance(valor, float):
        return None if math.isnan(valor) or math.isinf(valor) else valor
    if isinstance(valor, dict):
        return {str(chave): limpar_json(item) for chave, item in valor.items()}
    if isinstance(valor, (list, tuple)):
        return [limpar_json(item) for item in valor]
    if hasattr(valor, "item"):
        try:
            return limpar_json(valor.item())
        except (TypeError, ValueError):
            pass
    return valor


def registros(df: pd.DataFrame) -> list[dict[str, Any]]:
    return limpar_json(df.to_dict(orient="records"))


def carregar_json(texto: object, padrao: Any) -> Any:
    try:
        return json.loads(str(texto or ""))
    except (TypeError, json.JSONDecodeError):
        return padrao


def competencia_selecionada(query: dict[str, list[str]], db: core.BancoHistorico) -> str | None:
    competencias = db.competencias()[::-1]
    solicitada = query.get("competencia", [""])[0]
    return solicitada if solicitada in competencias else (competencias[0] if competencias else None)


def resumo_competencia(db: core.BancoHistorico, competencia: str | None) -> dict[str, Any]:
    competencias = db.competencias()[::-1]
    payload: dict[str, Any] = {
        "competencias": competencias,
        "competencia": competencia,
        "atendentes": db.atendentes(),
        "ranking": [],
        "info": None,
    }
    if not competencia:
        return payload

    ranking = db.ranking(competencia)
    info = db.competencia_info(competencia)
    if not info:
        return payload

    configuracao = carregar_json(info.get("configuracao_json"), {})
    payload["ranking"] = registros(ranking)
    payload["info"] = {
        **limpar_json(info),
        "configuracao": limpar_json(configuracao),
        "mapeamento": limpar_json(carregar_json(info.get("mapeamento_json"), {})),
        "estatisticas": limpar_json(
            carregar_json(info.get("estatisticas_validacao_json"), {})
        ),
        "avisos": limpar_json(carregar_json(info.get("avisos_json"), [])),
    }
    return payload


def resumo_powerpoint(db: core.BancoHistorico, competencia: str | None) -> dict[str, Any]:
    """Prepara o conjunto consolidado usado na prévia e no arquivo PPTX."""
    atual = resumo_competencia(db, competencia)
    ranking_atual = atual.get("ranking") or []
    if not competencia or not atual.get("info") or not ranking_atual:
        return {
            "competencias": atual.get("competencias", []),
            "competencia": competencia,
            "atual": atual,
            "anterior": None,
            "comparativo": [],
            "quantidade_slides": 0,
            "roteiro": [],
        }

    competencias_anteriores = [item for item in db.competencias() if item < competencia]
    competencia_anterior = competencias_anteriores[-1] if competencias_anteriores else None
    anterior = resumo_competencia(db, competencia_anterior) if competencia_anterior else None
    ranking_anterior = {
        item["atendente"]: item for item in (anterior or {}).get("ranking", [])
    }
    comparativo = []
    for item in ranking_atual:
        antes = ranking_anterior.get(item["atendente"])
        nota_anterior = antes.get("nota_final") if antes else None
        nota_atual = item.get("nota_final")
        comparativo.append(
            {
                "atendente": item.get("atendente"),
                "rank_atual": item.get("rank"),
                "rank_anterior": antes.get("rank") if antes else None,
                "nota_atual": nota_atual,
                "nota_anterior": nota_anterior,
                "delta_nota": (
                    float(nota_atual) - float(nota_anterior)
                    if nota_atual is not None and nota_anterior is not None
                    else None
                ),
            }
        )

    quantidade_individuais = len(ranking_atual)
    roteiro = [
        {"grupo": "Abertura", "titulo": "Capa e apuração executiva", "slides": 2},
        {"grupo": "Resultado", "titulo": "Resumo, regras, metodologia e ranking", "slides": 5},
        {"grupo": "Análise", "titulo": "Comparativos e painel de indicadores", "slides": 3},
        {
            "grupo": "Pessoas",
            "titulo": "Detalhamento individual por funcionário",
            "slides": quantidade_individuais,
        },
        {"grupo": "Fechamento", "titulo": "Oportunidades e recomendação", "slides": 2},
    ]
    return limpar_json(
        {
            "competencias": atual.get("competencias", []),
            "competencia": competencia,
            "competencia_br": core.competencia_para_br(competencia),
            "atual": atual,
            "anterior": anterior,
            "comparativo": comparativo,
            "quantidade_slides": 12 + quantidade_individuais,
            "roteiro": roteiro,
        }
    )


def _oportunidade_linha(row: pd.Series, config: dict[str, Any]) -> dict[str, Any]:
    componentes = [
        ("Quantidade", "pontos_quantidade", float(config.get("peso_quantidade", 0))),
        ("Tempo Total", "pontos_tempo", float(config.get("peso_tempo", 0))),
        ("TMA", "pontos_tma", float(config.get("peso_tma", 0))),
        ("Avaliação", "pontos_avaliacao", float(config.get("peso_avaliacao", 0))),
    ]
    fixos = bool(config.get("pontuacao_tempo_tma_fixa", False))
    candidatos = []
    for nome, campo, peso in componentes:
        protegido = fixos and nome in {"Tempo Total", "TMA"}
        obtido = float(row[campo])
        candidatos.append(
            {
                "indicador": nome,
                "pontos": obtido,
                "peso": peso,
                "gap": 0.0 if protegido else max(0.0, peso - obtido),
                "protegido": protegido,
            }
        )
    variaveis = [item for item in candidatos if not item["protegido"]]
    foco = max(variaveis, key=lambda item: item["gap"]) if variaveis else candidatos[0]
    return limpar_json(foco)


def _perfis_comparaveis(atual: dict[str, Any], anterior: dict[str, Any]) -> bool:
    chaves = (
        "modo",
        "peso_quantidade",
        "peso_tempo",
        "peso_tma",
        "peso_avaliacao",
        "escala_avaliacao_max",
        "max_horas",
        "incluir_fora_expediente",
        "incluir_finalizados_automaticamente",
        "pontuacao_tempo_tma_fixa",
    )
    return all(atual.get(chave) == anterior.get(chave) for chave in chaves)


def resumo_gerencial(
    db: core.BancoHistorico, competencia: str | None
) -> dict[str, Any]:
    """Consolida indicadores gerenciais sem alterar a apuração oficial."""
    atual = resumo_competencia(db, competencia)
    ranking_registros = atual.get("ranking") or []
    if not competencia or not atual.get("info") or not ranking_registros:
        return {
            "competencias": atual.get("competencias", []),
            "competencia": competencia,
            "atual": atual,
            "metricas": {},
            "componentes": [],
            "distribuicao": [],
            "serie_equipe": [],
            "comparativo": [],
            "acoes": [],
            "comparacao_disponivel": False,
            "comparacao_confiavel": False,
        }

    ranking = pd.DataFrame(ranking_registros).sort_values("rank")
    info = atual["info"]
    config = info.get("configuracao") or {}
    estatisticas = info.get("estatisticas") or {}
    total_importado = int(info.get("total_linhas") or 0)
    validos = int(info.get("validos") or 0)
    excluidos = int(info.get("excluidos") or 0)
    avaliacoes = int(pd.to_numeric(ranking["avaliacoes"], errors="coerce").fillna(0).sum())
    avaliacao_soma = float(
        (
            pd.to_numeric(ranking["avaliacao_media"], errors="coerce").fillna(0)
            * pd.to_numeric(ranking["avaliacoes"], errors="coerce").fillna(0)
        ).sum()
    )
    avaliacao_ponderada = avaliacao_soma / avaliacoes if avaliacoes else None
    elegiveis = int(pd.to_numeric(ranking["elegivel"], errors="coerce").fillna(0).sum())
    premiados = int(pd.to_numeric(ranking["premiado"], errors="coerce").fillna(0).sum())
    notas = pd.to_numeric(ranking["nota_final"], errors="coerce")
    atendimentos = pd.to_numeric(ranking["atendimentos"], errors="coerce")
    automaticos = int(estatisticas.get("AUTOMATICOS_VALIDOS", 0))
    top3_volume = int(atendimentos.loc[ranking["rank"].le(3)].sum())

    componentes = []
    definicoes_componentes = [
        ("Quantidade", "pontos_quantidade", float(config.get("peso_quantidade", 0))),
        ("Tempo Total", "pontos_tempo", float(config.get("peso_tempo", 0))),
        ("TMA", "pontos_tma", float(config.get("peso_tma", 0))),
        ("Avaliação", "pontos_avaliacao", float(config.get("peso_avaliacao", 0))),
    ]
    fixos = bool(config.get("pontuacao_tempo_tma_fixa", False))
    for nome, campo, peso in definicoes_componentes:
        media = float(pd.to_numeric(ranking[campo], errors="coerce").mean())
        protegido = fixos and nome in {"Tempo Total", "TMA"}
        componentes.append(
            {
                "indicador": nome,
                "media_pontos": media,
                "peso": peso,
                "aproveitamento": media / peso * 100 if peso else 0,
                "gap_medio": 0.0 if protegido else max(0.0, peso - media),
                "protegido": protegido,
            }
        )
    variaveis = [item for item in componentes if not item["protegido"]]
    principal_alavanca = max(variaveis, key=lambda item: item["gap_medio"])["indicador"]

    metricas = {
        "funcionarios": int(len(ranking)),
        "nota_media": float(notas.mean()),
        "nota_mediana": float(notas.median()),
        "nota_lider": float(notas.max()),
        "amplitude_notas": float(notas.max() - notas.min()),
        "elegiveis": elegiveis,
        "premiados": premiados,
        "taxa_validacao": validos / total_importado * 100 if total_importado else 0,
        "taxa_exclusao": excluidos / total_importado * 100 if total_importado else 0,
        "cobertura_avaliacoes": avaliacoes / validos * 100 if validos else 0,
        "avaliacao_ponderada": avaliacao_ponderada,
        "concentracao_volume_top3": top3_volume / validos * 100 if validos else 0,
        "participacao_automaticos": automaticos / validos * 100 if validos else 0,
        "principal_alavanca": principal_alavanca,
    }

    distribuicao = [
        {"situacao": "Premiados", "quantidade": premiados, "cor": "green"},
        {
            "situacao": "Elegíveis fora do Top 3",
            "quantidade": max(0, elegiveis - premiados),
            "cor": "gold",
        },
        {
            "situacao": "Abaixo da meta",
            "quantidade": max(0, int(len(ranking)) - elegiveis),
            "cor": "slate",
        },
    ]

    competencias_ate_atual = [item for item in db.competencias() if item <= competencia][-6:]
    serie_equipe = []
    configuracao_serie_anterior: dict[str, Any] | None = None
    for item in competencias_ate_atual:
        mensal = db.ranking(item)
        if mensal.empty:
            continue
        info_mensal = db.competencia_info(item) or {}
        configuracao_mensal = carregar_json(
            info_mensal.get("configuracao_json"), {}
        )
        serie_equipe.append(
            {
                "competencia": item,
                "nota_media": float(mensal["nota_final"].mean()),
                "nota_mediana": float(mensal["nota_final"].median()),
                "nota_lider": float(mensal["nota_final"].max()),
                "elegiveis": int(mensal["elegivel"].sum()),
                "premiados": int(mensal["premiado"].sum()),
                "funcionarios": int(len(mensal)),
                "perfil_regra": configuracao_mensal.get(
                    "perfil_regra", "Regra oficial"
                ),
                "comparavel_com_anterior": bool(
                    configuracao_serie_anterior
                    and _perfis_comparaveis(
                        configuracao_mensal, configuracao_serie_anterior
                    )
                ),
            }
        )
        configuracao_serie_anterior = configuracao_mensal

    competencias_anteriores = [item for item in db.competencias() if item < competencia]
    competencia_anterior = competencias_anteriores[-1] if competencias_anteriores else None
    anterior = resumo_competencia(db, competencia_anterior) if competencia_anterior else None
    ranking_anterior = {
        item["atendente"]: item for item in (anterior or {}).get("ranking", [])
    }
    comparativo = []
    for _, row in ranking.iterrows():
        antes = ranking_anterior.get(row["atendente"])
        comparativo.append(
            {
                "atendente": row["atendente"],
                "rank_atual": int(row["rank"]),
                "rank_anterior": int(antes["rank"]) if antes else None,
                "delta_rank": int(antes["rank"] - row["rank"]) if antes else None,
                "nota_atual": float(row["nota_final"]),
                "nota_anterior": float(antes["nota_final"]) if antes else None,
                "delta_nota": float(row["nota_final"] - antes["nota_final"]) if antes else None,
                "atendimentos_atual": int(row["atendimentos"]),
                "atendimentos_anterior": int(antes["atendimentos"]) if antes else None,
                "delta_atendimentos": int(row["atendimentos"] - antes["atendimentos"]) if antes else None,
                "avaliacao_atual": float(row["avaliacao_media"]) if pd.notna(row["avaliacao_media"]) else None,
                "avaliacao_anterior": float(antes["avaliacao_media"]) if antes and antes["avaliacao_media"] is not None else None,
                "delta_avaliacao": (
                    float(row["avaliacao_media"] - antes["avaliacao_media"])
                    if antes and antes["avaliacao_media"] is not None and pd.notna(row["avaliacao_media"])
                    else None
                ),
            }
        )

    nota_terceiro = float(ranking.loc[ranking["rank"].eq(3), "nota_final"].iloc[0]) if len(ranking) >= 3 else None
    maior_quantidade = int(atendimentos.max())
    melhor_avaliacao = float(pd.to_numeric(ranking["avaliacao_media"], errors="coerce").max())
    acoes = []
    for _, row in ranking.iterrows():
        oportunidade = _oportunidade_linha(row, config)
        nota = float(row["nota_final"])
        if bool(row["premiado"]):
            prioridade = "Monitorar"
            situacao = "Premiado"
            objetivo = "Sustentar nota ≥ 85 e posição no Top 3"
        elif bool(row["elegivel"]):
            prioridade = "Média"
            situacao = "Elegível fora do Top 3"
            gap_top3 = max(0.0, (nota_terceiro or nota) - nota)
            unidade = "ponto" if round(gap_top3, 2) == 1 else "pontos"
            objetivo = (
                f"Recuperar {core.numero_br(gap_top3, 2)} {unidade} para a "
                "referência atual do Top 3"
            )
        else:
            prioridade = "Alta"
            situacao = "Abaixo da meta"
            gap_meta = core.META_PADRAO - nota
            unidade = "ponto" if round(gap_meta, 2) == 1 else "pontos"
            objetivo = (
                f"Recuperar {core.numero_br(gap_meta, 2)} {unidade} para a meta"
            )
        if oportunidade["indicador"] == "Quantidade":
            alvo = min(maior_quantidade, int(math.ceil(int(row["atendimentos"]) * 1.05)))
            acao = f"Usar {alvo} atendimentos como referência de curto prazo, preservando a qualidade"
        elif oportunidade["indicador"] == "Avaliação" and pd.notna(row["avaliacao_media"]):
            alvo = min(melhor_avaliacao, float(row["avaliacao_media"]) + 0.05)
            acao = f"Usar avaliação média {core.numero_br(alvo, 2)} como referência, sem reduzir o volume"
        else:
            acao = f"Acompanhar semanalmente o indicador {oportunidade['indicador']}"
        acoes.append(
            {
                "atendente": row["atendente"],
                "rank": int(row["rank"]),
                "nota": nota,
                "situacao": situacao,
                "prioridade": prioridade,
                "foco": oportunidade["indicador"],
                "gap_componente": oportunidade["gap"],
                "objetivo": objetivo,
                "acao": acao,
            }
        )
    ordem_prioridade = {"Alta": 0, "Média": 1, "Monitorar": 2}
    acoes.sort(key=lambda item: (ordem_prioridade[item["prioridade"]], item["rank"]))

    comparacao_confiavel = bool(
        anterior
        and _perfis_comparaveis(config, anterior.get("info", {}).get("configuracao", {}))
    )
    return limpar_json(
        {
            "competencias": atual.get("competencias", []),
            "competencia": competencia,
            "competencia_br": core.competencia_para_br(competencia),
            "competencia_anterior": competencia_anterior,
            "atual": atual,
            "anterior": anterior,
            "metricas": metricas,
            "componentes": componentes,
            "distribuicao": distribuicao,
            "serie_equipe": serie_equipe,
            "dispersao": ranking_registros,
            "comparativo": comparativo,
            "acoes": acoes,
            "comparacao_disponivel": bool(anterior),
            "comparacao_confiavel": comparacao_confiavel,
            "observacao_alvos": (
                "As referências de curto prazo são direcionais. A nota é normalizada pelo melhor resultado da equipe."
            ),
        }
    )


CODIGOS_QUALIDADE = {
    "SEM_ATENDENTE",
    "DATA_INVALIDA",
    "SEM_FINALIZACAO",
    "DURACAO_NEGATIVA",
}
CODIGOS_ESCOPO = {"FORA_SUPORTE", "ATENDENTE_EXCLUIDO", "PERIODO"}
CODIGOS_EXCECAO = {"ACIMA_H"}


def _taxonomia_exclusao(codigo: object) -> str:
    codigo_texto = str(codigo or "")
    if codigo_texto in CODIGOS_QUALIDADE:
        return "Qualidade dos dados"
    if codigo_texto in CODIGOS_ESCOPO:
        return "Fora do escopo"
    if codigo_texto in CODIGOS_EXCECAO:
        return "Exceção operacional"
    return "Outros controles"


def _metricas_operacionais_mes(
    db: core.BancoHistorico, competencia: str
) -> dict[str, Any]:
    info = db.competencia_info(competencia) or {}
    validos = db.validos(competencia)
    exclusoes = db.exclusoes(competencia)
    ranking = db.ranking(competencia)

    if validos.empty:
        tma = pd.Series(dtype=float)
        avaliacoes = pd.Series(dtype=float)
    else:
        regulares = validos.loc[
            pd.to_numeric(validos["suspeito_automatico"], errors="coerce")
            .fillna(0)
            .eq(0)
        ]
        tma = pd.to_numeric(regulares["tma_minutos"], errors="coerce").dropna()
        avaliacoes = pd.to_numeric(validos["avaliacao"], errors="coerce").dropna()

    total_importado = int(info.get("total_linhas") or 0)
    total_validos = int(info.get("validos") or len(validos))
    codigos = (
        exclusoes["motivo_codigo"].astype(str)
        if not exclusoes.empty
        else pd.Series(dtype=str)
    )
    erros_qualidade = int(codigos.isin(CODIGOS_QUALIDADE).sum())
    fora_escopo = int(codigos.isin(CODIGOS_ESCOPO).sum())
    excecoes = int(codigos.isin(CODIGOS_EXCECAO).sum())
    automaticos = int(
        pd.to_numeric(
            validos.get("suspeito_automatico", pd.Series(dtype=float)),
            errors="coerce",
        )
        .fillna(0)
        .sum()
    )
    return {
        "competencia": competencia,
        "total_importado": total_importado,
        "base_premiavel": total_validos,
        "base_operacional_observada": total_validos + excecoes,
        "erros_qualidade": erros_qualidade,
        "fora_escopo": fora_escopo,
        "excecoes_operacionais": excecoes,
        "automaticos": automaticos,
        "tma_medio": float(tma.mean()) if not tma.empty else None,
        "tma_mediano": float(tma.median()) if not tma.empty else None,
        "tma_p90": float(tma.quantile(0.9)) if not tma.empty else None,
        "avaliacao_media": float(avaliacoes.mean()) if not avaliacoes.empty else None,
        "avaliacoes": int(len(avaliacoes)),
        "cobertura_avaliacoes": (
            len(avaliacoes) / total_validos * 100 if total_validos else 0
        ),
        "taxa_validacao": (
            total_validos / total_importado * 100 if total_importado else 0
        ),
        "taxa_qualidade": (
            erros_qualidade / total_importado * 100 if total_importado else 0
        ),
        "participacao_automaticos": (
            automaticos / total_validos * 100 if total_validos else 0
        ),
        "funcionarios": int(len(ranking)),
    }


def resumo_operacional(
    db: core.BancoHistorico, competencia: str | None
) -> dict[str, Any]:
    """Expõe saúde operacional sem misturar a base com a nota da campanha."""
    competencias = db.competencias()[::-1]
    vazio = {
        "competencias": competencias,
        "competencia": competencia,
        "metricas": {},
        "comparacao": {},
        "serie": [],
        "volume_por_dia": [],
        "volume_por_hora": [],
        "atendentes": [],
        "categorias_exclusao": [],
        "info": None,
    }
    if not competencia:
        return vazio

    info = db.competencia_info(competencia)
    if not info:
        return vazio
    validos = db.validos(competencia)
    exclusoes = db.exclusoes(competencia)
    ranking = db.ranking(competencia)
    metricas = _metricas_operacionais_mes(db, competencia)

    anteriores = [item for item in db.competencias() if item < competencia]
    competencia_anterior = anteriores[-1] if anteriores else None
    anterior = (
        _metricas_operacionais_mes(db, competencia_anterior)
        if competencia_anterior
        else None
    )
    comparacao: dict[str, Any] = {
        "competencia_anterior": competencia_anterior,
        "disponivel": bool(anterior),
    }
    for chave in (
        "base_premiavel",
        "base_operacional_observada",
        "tma_mediano",
        "tma_p90",
        "avaliacao_media",
        "cobertura_avaliacoes",
        "erros_qualidade",
        "automaticos",
    ):
        atual_valor = metricas.get(chave)
        anterior_valor = anterior.get(chave) if anterior else None
        comparacao[f"{chave}_anterior"] = anterior_valor
        comparacao[f"delta_{chave}"] = (
            float(atual_valor) - float(anterior_valor)
            if atual_valor is not None and anterior_valor is not None
            else None
        )
        comparacao[f"delta_pct_{chave}"] = (
            (float(atual_valor) / float(anterior_valor) - 1) * 100
            if atual_valor is not None
            and anterior_valor not in (None, 0)
            else None
        )

    volume_por_dia: list[dict[str, Any]] = []
    volume_por_hora: list[dict[str, Any]] = []
    atendentes: list[dict[str, Any]] = []
    if not validos.empty:
        base = validos.copy()
        base["inicio_dt"] = pd.to_datetime(base["inicio"], errors="coerce")
        base["avaliacao_num"] = pd.to_numeric(base["avaliacao"], errors="coerce")
        base["tma_num"] = pd.to_numeric(base["tma_minutos"], errors="coerce")
        base_regular = base.loc[
            pd.to_numeric(base["suspeito_automatico"], errors="coerce")
            .fillna(0)
            .eq(0)
        ].copy()

        diarios = (
            base.dropna(subset=["inicio_dt"])
            .assign(data=lambda frame: frame["inicio_dt"].dt.strftime("%Y-%m-%d"))
            .groupby("data", as_index=False)
            .agg(atendimentos=("protocolo", "size"), avaliacoes=("avaliacao_num", "count"))
        )
        volume_por_dia = registros(diarios)

        horarios = (
            base.dropna(subset=["inicio_dt"])
            .assign(hora=lambda frame: frame["inicio_dt"].dt.hour)
            .groupby("hora", as_index=False)
            .agg(atendimentos=("protocolo", "size"))
            .sort_values("hora")
        )
        volume_por_hora = registros(horarios)

        cobertura = (
            base.groupby("atendente", as_index=False)
            .agg(
                atendimentos_observados=("protocolo", "size"),
                avaliacoes_observadas=("avaliacao_num", "count"),
                avaliacao_media_observada=("avaliacao_num", "mean"),
                automaticos=("suspeito_automatico", "sum"),
            )
        )
        tma_atendente = (
            base_regular.groupby("atendente", as_index=False)
            .agg(
                tma_mediano=("tma_num", "median"),
                tma_p90=("tma_num", lambda serie: serie.quantile(0.9)),
            )
        )
        cobertura = cobertura.merge(tma_atendente, on="atendente", how="left")
        cobertura["cobertura_avaliacoes"] = (
            cobertura["avaliacoes_observadas"]
            / cobertura["atendimentos_observados"].replace(0, pd.NA)
            * 100
        )
        cobertura["participacao_volume"] = (
            cobertura["atendimentos_observados"] / max(1, len(base)) * 100
        )
        if not ranking.empty:
            cobertura = cobertura.merge(
                ranking[["atendente", "rank", "nota_final", "elegivel", "premiado"]],
                on="atendente",
                how="left",
            )
        cobertura = cobertura.sort_values("atendimentos_observados", ascending=False)
        atendentes = registros(cobertura)

    categorias_exclusao = []
    if not exclusoes.empty:
        categorizada = exclusoes.copy()
        categorizada["categoria"] = categorizada["motivo_codigo"].map(
            _taxonomia_exclusao
        )
        agrupada = (
            categorizada.groupby("categoria", as_index=False)
            .size()
            .rename(columns={"size": "quantidade"})
        )
        ordem = {
            "Qualidade dos dados": 0,
            "Fora do escopo": 1,
            "Exceção operacional": 2,
            "Outros controles": 3,
        }
        agrupada["ordem"] = agrupada["categoria"].map(ordem).fillna(9)
        categorias_exclusao = registros(agrupada.sort_values("ordem").drop(columns="ordem"))

    serie = [
        _metricas_operacionais_mes(db, item)
        for item in [comp for comp in db.competencias() if comp <= competencia][-6:]
    ]
    return limpar_json(
        {
            "competencias": competencias,
            "competencia": competencia,
            "competencia_br": core.competencia_para_br(competencia),
            "info": {
                **limpar_json(info),
                "configuracao": carregar_json(info.get("configuracao_json"), {}),
            },
            "metricas": metricas,
            "comparacao": comparacao,
            "serie": serie,
            "volume_por_dia": volume_por_dia,
            "volume_por_hora": volume_por_hora,
            "atendentes": atendentes,
            "categorias_exclusao": categorias_exclusao,
            "notas_metodologicas": [
                "TMA observado calculado somente sobre atendimentos regulares da base premiável.",
                "Encerramentos automáticos permanecem no volume e são retirados da leitura de tempo.",
                "Casos acima do limite integram exceções operacionais e não desaparecem da visão gerencial.",
                "Volume observado não equivale a produtividade por hora; jornada e complexidade não constam na fonte.",
            ],
        }
    )


def resumo_automaticos(
    db: core.BancoHistorico, competencia: str | None
) -> dict[str, Any]:
    """Explica e detalha o tratamento dos encerramentos automáticos."""
    competencias = db.competencias()[::-1]
    payload: dict[str, Any] = {
        "competencias": competencias,
        "competencia": competencia,
        "info": None,
        "metricas": {},
        "registros": [],
        "requer_reprocessamento": False,
    }
    if not competencia:
        return payload

    info = db.competencia_info(competencia)
    if not info:
        return payload
    configuracao = carregar_json(info.get("configuracao_json"), {})
    estatisticas = carregar_json(info.get("estatisticas_validacao_json"), {})
    validos = db.validos(competencia)
    automaticos = validos.loc[validos["suspeito_automatico"].eq(1)].copy()
    if not automaticos.empty:
        automaticos["gatilho_identificacao"] = automaticos["fim"].map(
            lambda valor: (
                "Encerramento exatamente às 06:00"
                if valor and str(valor)[11:16] == "06:00"
                else "20 ou mais encerramentos no mesmo minuto"
            )
        )
        if configuracao.get("pontuacao_tempo_tma_fixa", False):
            tratamento = "Incluído; Tempo/TMA fixos para toda a equipe"
        elif configuracao.get("neutralizar_tempo_automaticos", False):
            tratamento = "Duração desconsiderada em Tempo/TMA"
        else:
            tratamento = "Regra histórica da competência"
        automaticos["tratamento"] = tratamento

    regra_esperada = competencia == "2026-07" or competencia >= "2026-08"
    regra_gravada = bool(
        configuracao.get("modo") == "neutralizado"
        if competencia == "2026-07"
        else configuracao.get("incluir_finalizados_automaticamente", False)
        and configuracao.get("pontuacao_tempo_tma_fixa", False)
    )
    payload.update(
        {
            "info": {
                **limpar_json(info),
                "configuracao": limpar_json(configuracao),
                "estatisticas": limpar_json(estatisticas),
                "avisos": limpar_json(carregar_json(info.get("avisos_json"), [])),
            },
            "metricas": {
                "identificados": int(
                    estatisticas.get(
                        "AUTOMATICOS_IDENTIFICADOS", len(automaticos)
                    )
                ),
                "incluidos": int(
                    estatisticas.get("AUTOMATICOS_VALIDOS", len(automaticos))
                ),
                "recuperados": int(
                    estatisticas.get("AUTOMATICOS_RECUPERADOS", 0)
                ),
                "excluidos": int(
                    estatisticas.get("AUTOMATICOS_EXCLUIDOS", 0)
                ),
                "regulares_validos": int(
                    estatisticas.get(
                        "REGULARES_VALIDOS", max(0, int(info["validos"]) - len(automaticos))
                    )
                ),
            },
            "registros": registros(automaticos),
            "requer_reprocessamento": bool(regra_esperada and not regra_gravada),
        }
    )
    return limpar_json(payload)


def perfil_competencia(competencia_texto: str) -> dict[str, Any]:
    competencia = core.competencia_para_iso(competencia_texto)
    config = core.configuracao_oficial(competencia)
    periodo = (
        "Sem exclusão por horário ou domingo"
        if config.incluir_fora_expediente
        else f"Segunda a sábado, {config.hora_inicio}–{config.hora_fim}"
    )
    if config.modo == "neutralizado":
        duracao = "Tempo/TMA neutralizados"
    elif config.pontuacao_tempo_tma_fixa:
        duracao = (
            f"Até {core.numero_br(config.max_horas, 1)} horas para manuais; "
            "Tempo/TMA fixos em 31,5"
        )
    else:
        duracao = f"Até {core.numero_br(config.max_horas, 1)} horas"
    return limpar_json(
        {
            "competencia": competencia,
            "competencia_br": core.competencia_para_br(competencia),
            "configuracao": asdict(config),
            "periodo": periodo,
            "duracao": duracao,
        }
    )


class PainelHandler(BaseHTTPRequestHandler):
    server_version = "PerformanceAnalytics/1.0"

    def log_message(self, formato: str, *args: object) -> None:
        if os.environ.get("PREMIACAO_LOG_HTTP") == "1":
            super().log_message(formato, *args)

    def enviar_json(self, payload: Any, status: HTTPStatus = HTTPStatus.OK) -> None:
        corpo = json.dumps(
            limpar_json(payload), ensure_ascii=False, allow_nan=False, separators=(",", ":")
        ).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(corpo)

    def enviar_erro(self, mensagem: str, status: HTTPStatus = HTTPStatus.BAD_REQUEST) -> None:
        self.enviar_json({"ok": False, "erro": mensagem}, status)

    def servir_arquivo(self, caminho_url: str) -> None:
        nome = ARQUIVOS_PUBLICOS.get(caminho_url)
        if not nome:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        caminho = APP_DIR / nome
        if not caminho.exists():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        corpo = caminho.read_bytes()
        tipo = mimetypes.guess_type(caminho.name)[0] or "application/octet-stream"
        if tipo.startswith("text/") or tipo in {"application/javascript", "application/json"}:
            tipo += "; charset=utf-8"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(corpo)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        try:
            if parsed.path in ARQUIVOS_PUBLICOS:
                self.servir_arquivo(parsed.path)
                return
            if parsed.path == "/api/resumo":
                db = banco()
                competencia = competencia_selecionada(query, db)
                self.enviar_json(resumo_competencia(db, competencia))
                return
            if parsed.path == "/api/gerencial":
                db = banco()
                competencia = competencia_selecionada(query, db)
                self.enviar_json(resumo_gerencial(db, competencia))
                return
            if parsed.path == "/api/operacional":
                db = banco()
                competencia = competencia_selecionada(query, db)
                self.enviar_json(resumo_operacional(db, competencia))
                return
            if parsed.path == "/api/perfil":
                texto = query.get("competencia", [datetime.now().strftime("%m/%Y")])[0]
                self.enviar_json(perfil_competencia(texto))
                return
            if parsed.path == "/api/historico":
                atendente = query.get("atendente", [""])[0].strip()
                if not atendente:
                    self.enviar_erro("Informe o atendente.")
                    return
                db = banco()
                self.enviar_json(
                    {
                        "atendente": atendente,
                        "historico": registros(db.historico(atendente)),
                    }
                )
                return
            if parsed.path == "/api/auditoria":
                db = banco()
                competencia = competencia_selecionada(query, db)
                if not competencia:
                    self.enviar_json({"competencia": None, "exclusoes": [], "validos": []})
                    return
                info = db.competencia_info(competencia) or {}
                exclusoes = db.exclusoes(competencia)
                validos = db.validos(competencia)
                resumo = []
                if not exclusoes.empty:
                    resumo = registros(
                        exclusoes.groupby(["motivo_codigo", "motivo"], as_index=False)
                        .size()
                        .sort_values("size", ascending=False)
                    )
                self.enviar_json(
                    {
                        "competencia": competencia,
                        "info": {
                            **limpar_json(info),
                            "configuracao": carregar_json(info.get("configuracao_json"), {}),
                            "mapeamento": carregar_json(info.get("mapeamento_json"), {}),
                            "estatisticas": carregar_json(
                                info.get("estatisticas_validacao_json"), {}
                            ),
                            "avisos": carregar_json(info.get("avisos_json"), []),
                        },
                        "resumo_exclusoes": resumo,
                        "exclusoes": registros(exclusoes),
                        "validos": registros(validos.head(500)),
                        "validos_total": len(validos),
                    }
                )
                return
            if parsed.path == "/api/automaticos":
                db = banco()
                competencia = competencia_selecionada(query, db)
                self.enviar_json(resumo_automaticos(db, competencia))
                return
            if parsed.path == "/api/powerpoint-resumo":
                db = banco()
                competencia = competencia_selecionada(query, db)
                self.enviar_json(resumo_powerpoint(db, competencia))
                return
            if parsed.path == "/api/exportar":
                self.exportar_excel(query)
                return
            if parsed.path == "/api/saude":
                self.enviar_json(
                    {
                        "ok": True,
                        "versao": "Versão 4.0",
                        "meta_elegibilidade": core.META_PADRAO,
                        "demonstracao": DEMO_MODE,
                    }
                )
                return
            self.send_error(HTTPStatus.NOT_FOUND)
        except Exception as exc:  # resposta amigável para a interface local
            self.enviar_erro(str(exc), HTTPStatus.INTERNAL_SERVER_ERROR)

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        try:
            if DEMO_MODE:
                self.enviar_erro(
                    "A demonstração pública é somente leitura e utiliza dados sintéticos.",
                    HTTPStatus.FORBIDDEN,
                )
                return
            if parsed.path == "/api/processar":
                self.processar_upload(query)
                return
            if parsed.path == "/api/feedback":
                self.salvar_feedback()
                return
            self.send_error(HTTPStatus.NOT_FOUND)
        except Exception as exc:
            self.enviar_erro(str(exc), HTTPStatus.BAD_REQUEST)

    def ler_corpo(self, limite: int = MAX_UPLOAD_BYTES) -> bytes:
        tamanho_texto = self.headers.get("Content-Length", "0")
        try:
            tamanho = int(tamanho_texto)
        except ValueError as exc:
            raise ValueError("Tamanho da requisição inválido.") from exc
        if tamanho <= 0:
            raise ValueError("A requisição não contém dados.")
        if tamanho > limite:
            raise ValueError("O arquivo excede o limite de 50 MB.")
        return self.rfile.read(tamanho)

    def processar_upload(self, query: dict[str, list[str]]) -> None:
        competencia_texto = query.get("competencia", [""])[0]
        competencia = core.competencia_para_iso(competencia_texto)
        nome_arquivo = Path(query.get("arquivo", ["atendimentos.xlsx"])[0]).name
        extensao = Path(nome_arquivo).suffix.lower()
        if extensao not in {".csv", ".txt", ".xlsx", ".xls", ".xlsm"}:
            raise ValueError("Formato não suportado. Use CSV, TXT, XLSX, XLS ou XLSM.")
        atendentes_excluidos = query.get(
            "excluidos", [core.ATENDENTES_FORA_CAMPANHA]
        )[0].strip()
        conteudo = self.ler_corpo()
        caminho_temp: Path | None = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=extensao) as arquivo_temp:
                arquivo_temp.write(conteudo)
                caminho_temp = Path(arquivo_temp.name)
            dados, avisos = core.carregar_arquivo(str(caminho_temp))
            mapeamento = core.mapear_colunas(dados)
            inicios = core.serie_datas(dados[mapeamento["inicio"]]).dropna()
            if not inicios.empty:
                meses = inicios.dt.strftime("%Y-%m")
                predominante = str(meses.value_counts().index[0])
                proporcao = float((meses == predominante).mean())
                if proporcao >= 0.75 and predominante != competencia:
                    raise ValueError(
                        "A competência informada não corresponde ao arquivo. "
                        f"A maioria dos atendimentos pertence a "
                        f"{core.competencia_para_br(predominante)}, mas foi informado "
                        f"{core.competencia_para_br(competencia)}. Corrija a competência "
                        "e processe novamente."
                    )
            config = core.configuracao_oficial(competencia)
            config.atendentes_excluidos = atendentes_excluidos
            db = banco()
            resultado = core.processar_dados(
                dados, config, db, origem=nome_arquivo, avisos=avisos
            )
            db.salvar(resultado)
        finally:
            if caminho_temp and caminho_temp.exists():
                caminho_temp.unlink(missing_ok=True)

        self.enviar_json(
            {
                "ok": True,
                "competencia": competencia,
                "competencia_br": core.competencia_para_br(competencia),
                "validos": len(resultado.validos),
                "excluidos": len(resultado.excluidos),
                "atendentes": len(resultado.ranking),
                "avisos": resultado.avisos,
                "estatisticas": resultado.estatisticas_validacao,
            }
        )

    def salvar_feedback(self) -> None:
        corpo = self.ler_corpo(limite=256 * 1024)
        try:
            dados = json.loads(corpo.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ValueError("Dados do feedback inválidos.") from exc
        competencia = str(dados.get("competencia", "")).strip()
        atendente = str(dados.get("atendente", "")).strip()
        feedback = str(dados.get("feedback", "")).strip()
        if not competencia or not atendente or not feedback:
            raise ValueError("Competência, atendente e feedback são obrigatórios.")
        banco().atualizar_feedback(competencia, atendente, feedback)
        self.enviar_json({"ok": True, "mensagem": "Feedback atualizado."})

    def exportar_excel(self, query: dict[str, list[str]]) -> None:
        competencia = query.get("competencia", [""])[0]
        if competencia not in banco().competencias():
            self.enviar_erro("Competência não encontrada.", HTTPStatus.NOT_FOUND)
            return
        caminho_temp: Path | None = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as arquivo_temp:
                caminho_temp = Path(arquivo_temp.name)
            core.exportar_competencia(banco(), competencia, str(caminho_temp))
            corpo = caminho_temp.read_bytes()
        finally:
            if caminho_temp and caminho_temp.exists():
                caminho_temp.unlink(missing_ok=True)
        nome = f"Premiacao_Suporte_{competencia}.xlsx"
        self.send_response(HTTPStatus.OK)
        self.send_header(
            "Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        self.send_header(
            "Content-Disposition", f"attachment; filename*=UTF-8''{quote(nome)}"
        )
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)


def abrir_navegador() -> None:
    webbrowser.open(f"http://localhost:{PORT}")


def main() -> None:
    if DEMO_MODE:
        inicializar_demonstracao(DB_PATH)
    else:
        banco()  # cria ou migra o banco antes de abrir a interface
    servidor = ThreadingHTTPServer((HOST, PORT), PainelHandler)
    print("=" * 62)
    print("  PERFORMANCE ANALYTICS — DASHBOARD")
    print(f"  Endereço: http://localhost:{PORT}")
    print(f"  Modo: {'demonstração pública' if DEMO_MODE else 'operação local'}")
    print("  Para encerrar, feche esta janela ou pressione Ctrl+C.")
    print("=" * 62)
    if os.environ.get("PREMIACAO_OPEN_BROWSER", "0" if DEMO_MODE else "1") == "1":
        threading.Timer(1.0, abrir_navegador).start()
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nDashboard encerrado.")
    finally:
        servidor.server_close()


if __name__ == "__main__":
    main()
