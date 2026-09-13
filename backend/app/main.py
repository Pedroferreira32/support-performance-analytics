from __future__ import annotations

from contextlib import asynccontextmanager
import os
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .database import SnapshotRepository
from .pipeline import detect_competence, official_config, process_upload


MAX_UPLOAD_BYTES = 50 * 1024 * 1024


class FeedbackBody(BaseModel):
    feedback: str = Field(min_length=1, max_length=4000)


def _origins() -> list[str]:
    raw = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    return [value.strip().rstrip("/") for value in raw.split(",") if value.strip()]


async def _read_file(file: UploadFile) -> bytes:
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if not content:
        raise HTTPException(status_code=400, detail="O arquivo enviado está vazio.")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="O arquivo excede o limite de 50 MB.")
    return content


def create_app(repository: SnapshotRepository | None = None) -> FastAPI:
    repository_error: str | None = None
    repo = repository
    if repo is None:
        try:
            repo = SnapshotRepository()
        except RuntimeError as error:
            repository_error = str(error)

    def require_repository() -> SnapshotRepository:
        if repo is None:
            raise HTTPException(
                status_code=503,
                detail=repository_error or "O armazenamento persistente não está configurado.",
            )
        return repo

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        if repo is not None:
            repo.initialize()
        yield

    app = FastAPI(
        title="Performance do Suporte — Data Pipeline API",
        version="1.0.0",
        description="Pipeline Pandas para limpeza, validação, cálculo e histórico da premiação.",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )
    app.state.repository = repo
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_origins(),
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health() -> dict[str, object]:
        return {
            "status": "ok" if repo is not None else "configuration_required",
            "pipeline": "python-pandas",
            "storage": repo.dialect if repo is not None else "unconfigured",
            "persistent": repo is not None,
            "detail": repository_error,
            "version": app.version,
        }

    @app.get("/api/v1/regras/{competencia}")
    def rule(competencia: str) -> dict[str, object]:
        try:
            return official_config(competencia).to_api()
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error

    @app.post("/api/v1/detectar-competencia")
    async def detect(file: Annotated[UploadFile, File(...)]) -> dict[str, str | None]:
        try:
            content = await _read_file(file)
            return {"competencia": detect_competence(content, file.filename or "arquivo.csv")}
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(status_code=400, detail=str(error)) from error

    @app.post("/api/v1/competencias/processar")
    async def process(
        file: Annotated[UploadFile, File(...)],
        competencia: Annotated[str, Form(...)],
        atendentes_excluidos: Annotated[str, Form()] = "",
    ) -> dict[str, object]:
        try:
            storage = require_repository()
            content = await _read_file(file)
            snapshot = process_upload(
                content,
                file.filename or "arquivo.csv",
                competencia,
                atendentes_excluidos,
            )
            return storage.save(snapshot)
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(status_code=400, detail=str(error)) from error

    @app.get("/api/v1/competencias")
    def list_competences() -> list[dict[str, object]]:
        return require_repository().list()

    @app.get("/api/v1/competencias/{competencia}")
    def get_competence(competencia: str) -> dict[str, object]:
        snapshot = require_repository().get(competencia)
        if snapshot is None:
            raise HTTPException(status_code=404, detail="Competência não encontrada.")
        return snapshot

    @app.patch("/api/v1/competencias/{competencia}/feedback/{atendente}")
    def update_feedback(competencia: str, atendente: str, body: FeedbackBody) -> dict[str, object]:
        snapshot = require_repository().update_feedback(competencia, atendente, body.feedback.strip())
        if snapshot is None:
            raise HTTPException(status_code=404, detail="Resultado não encontrado.")
        return snapshot

    return app


app = create_app()
