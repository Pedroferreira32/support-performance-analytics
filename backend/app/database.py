from __future__ import annotations

from copy import deepcopy
import json
import os
from pathlib import Path
import sqlite3
from typing import Any, Iterable


SCHEMA = {
    "competencias": """
        CREATE TABLE IF NOT EXISTS competencias (
            competencia TEXT PRIMARY KEY,
            competencia_br TEXT NOT NULL,
            origem TEXT NOT NULL,
            processado_em TEXT NOT NULL,
            total_linhas INTEGER NOT NULL,
            configuracao TEXT NOT NULL,
            mapeamento TEXT NOT NULL,
            estatisticas TEXT NOT NULL,
            avisos TEXT NOT NULL,
            snapshot TEXT NOT NULL
        )
    """,
    "resultados": """
        CREATE TABLE IF NOT EXISTS resultados (
            competencia TEXT NOT NULL REFERENCES competencias(competencia) ON DELETE CASCADE,
            atendente TEXT NOT NULL,
            posicao INTEGER NOT NULL,
            atendimentos INTEGER NOT NULL,
            horas_total REAL NOT NULL,
            tma_medio_min REAL,
            avaliacao_media REAL,
            nota_final REAL NOT NULL,
            elegivel BOOLEAN NOT NULL,
            premiado BOOLEAN NOT NULL,
            feedback TEXT NOT NULL,
            payload TEXT NOT NULL,
            PRIMARY KEY (competencia, atendente)
        )
    """,
    "atendimentos_validos": """
        CREATE TABLE IF NOT EXISTS atendimentos_validos (
            competencia TEXT NOT NULL REFERENCES competencias(competencia) ON DELETE CASCADE,
            linha_origem INTEGER NOT NULL,
            protocolo TEXT NOT NULL,
            atendente TEXT NOT NULL,
            inicio TEXT NOT NULL,
            fim TEXT NOT NULL,
            suspeito_automatico BOOLEAN NOT NULL,
            duracao_considerada BOOLEAN NOT NULL,
            payload TEXT NOT NULL,
            PRIMARY KEY (competencia, linha_origem)
        )
    """,
    "exclusoes": """
        CREATE TABLE IF NOT EXISTS exclusoes (
            competencia TEXT NOT NULL REFERENCES competencias(competencia) ON DELETE CASCADE,
            linha_origem INTEGER NOT NULL,
            protocolo TEXT NOT NULL,
            atendente TEXT NOT NULL,
            motivo_codigo TEXT NOT NULL,
            motivo TEXT NOT NULL,
            payload TEXT NOT NULL,
            PRIMARY KEY (competencia, linha_origem)
        )
    """,
    "idx_resultados_atendente": "CREATE INDEX IF NOT EXISTS idx_resultados_atendente ON resultados(atendente)",
    "idx_validos_atendente": "CREATE INDEX IF NOT EXISTS idx_validos_atendente ON atendimentos_validos(atendente)",
    "idx_exclusoes_motivo": "CREATE INDEX IF NOT EXISTS idx_exclusoes_motivo ON exclusoes(motivo_codigo)",
}


def default_database_url() -> str:
    value = os.getenv("DATABASE_URL", "").strip()
    if value:
        return value
    path = Path(__file__).resolve().parents[1] / "data" / "support_performance.db"
    path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{path}"


def _json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, allow_nan=False, separators=(",", ":"))


class SnapshotRepository:
    """Persistência idempotente em SQLite ou PostgreSQL usando DB-API."""

    def __init__(self, database_url: str | None = None) -> None:
        self.database_url = database_url or default_database_url()
        self.dialect = "postgresql" if self.database_url.startswith(("postgres://", "postgresql://")) else "sqlite"

    def _connect(self):
        if self.dialect == "postgresql":
            try:
                import psycopg
            except ImportError as error:
                raise RuntimeError("Instale psycopg para utilizar PostgreSQL.") from error
            return psycopg.connect(self.database_url)
        prefix = "sqlite:///"
        if not self.database_url.startswith(prefix):
            raise ValueError("DATABASE_URL deve usar postgresql:// ou sqlite:///.")
        path = self.database_url.removeprefix(prefix)
        if path != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(path)
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    @property
    def placeholder(self) -> str:
        return "%s" if self.dialect == "postgresql" else "?"

    def initialize(self) -> None:
        with self._connect() as connection:
            cursor = connection.cursor()
            for statement in SCHEMA.values():
                cursor.execute(statement)

    def _insert(self, cursor, table: str, columns: list[str], rows: Iterable[tuple[Any, ...]]) -> None:
        values = list(rows)
        if not values:
            return
        placeholders = ",".join([self.placeholder] * len(columns))
        cursor.executemany(
            f"INSERT INTO {table} ({','.join(columns)}) VALUES ({placeholders})",
            values,
        )

    def save(self, snapshot: dict[str, Any]) -> dict[str, Any]:
        competence = str(snapshot["competencia"])
        stored = deepcopy(snapshot)
        with self._connect() as connection:
            cursor = connection.cursor()
            for table in ("resultados", "atendimentos_validos", "exclusoes"):
                cursor.execute(f"DELETE FROM {table} WHERE competencia = {self.placeholder}", (competence,))
            cursor.execute(f"DELETE FROM competencias WHERE competencia = {self.placeholder}", (competence,))
            self._insert(
                cursor,
                "competencias",
                [
                    "competencia",
                    "competencia_br",
                    "origem",
                    "processado_em",
                    "total_linhas",
                    "configuracao",
                    "mapeamento",
                    "estatisticas",
                    "avisos",
                    "snapshot",
                ],
                [
                    (
                        competence,
                        stored["competenciaBr"],
                        stored["origem"],
                        stored["processadoEm"],
                        stored["totalLinhas"],
                        _json(stored["config"]),
                        _json(stored["mapeamento"]),
                        _json(stored["estatisticas"]),
                        _json(stored["avisos"]),
                        _json(stored),
                    )
                ],
            )
            self._insert(
                cursor,
                "resultados",
                [
                    "competencia",
                    "atendente",
                    "posicao",
                    "atendimentos",
                    "horas_total",
                    "tma_medio_min",
                    "avaliacao_media",
                    "nota_final",
                    "elegivel",
                    "premiado",
                    "feedback",
                    "payload",
                ],
                (
                    (
                        competence,
                        row["atendente"],
                        row["rank"],
                        row["atendimentos"],
                        row["horasTotal"],
                        row["tmaMedioMin"],
                        row["avaliacaoMedia"],
                        row["notaFinal"],
                        row["elegivel"],
                        row["premiado"],
                        row["feedback"],
                        _json(row),
                    )
                    for row in stored["ranking"]
                ),
            )
            self._insert(
                cursor,
                "atendimentos_validos",
                [
                    "competencia",
                    "linha_origem",
                    "protocolo",
                    "atendente",
                    "inicio",
                    "fim",
                    "suspeito_automatico",
                    "duracao_considerada",
                    "payload",
                ],
                (
                    (
                        competence,
                        row["linhaOrigem"],
                        row["protocolo"],
                        row["atendente"],
                        row["inicio"],
                        row["fim"],
                        row["suspeitoAutomatico"],
                        row["duracaoConsiderada"],
                        _json(row),
                    )
                    for row in stored["validos"]
                ),
            )
            self._insert(
                cursor,
                "exclusoes",
                ["competencia", "linha_origem", "protocolo", "atendente", "motivo_codigo", "motivo", "payload"],
                (
                    (
                        competence,
                        row["linhaOrigem"],
                        row["protocolo"],
                        row["atendente"],
                        row["motivoCodigo"],
                        row["motivo"],
                        _json(row),
                    )
                    for row in stored["excluidos"]
                ),
            )
        return stored

    def list(self) -> list[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.cursor().execute("SELECT snapshot FROM competencias ORDER BY competencia").fetchall()
            return [json.loads(row[0]) for row in rows]

    def get(self, competence: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            row = connection.cursor().execute(
                f"SELECT snapshot FROM competencias WHERE competencia = {self.placeholder}",
                (competence,),
            ).fetchone()
            return json.loads(row[0]) if row else None

    def update_feedback(self, competence: str, attendant: str, feedback: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            cursor = connection.cursor()
            row = cursor.execute(
                f"SELECT snapshot FROM competencias WHERE competencia = {self.placeholder}",
                (competence,),
            ).fetchone()
            if not row:
                return None
            snapshot = json.loads(row[0])
            ranking_row = next((item for item in snapshot["ranking"] if item["atendente"] == attendant), None)
            if ranking_row is None:
                return None
            ranking_row["feedback"] = feedback
            cursor.execute(
                f"UPDATE competencias SET snapshot = {self.placeholder} WHERE competencia = {self.placeholder}",
                (_json(snapshot), competence),
            )
            cursor.execute(
                f"UPDATE resultados SET feedback = {self.placeholder}, payload = {self.placeholder} "
                f"WHERE competencia = {self.placeholder} AND atendente = {self.placeholder}",
                (feedback, _json(ranking_row), competence, attendant),
            )
            return snapshot

