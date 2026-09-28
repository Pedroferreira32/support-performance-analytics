from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.database import SnapshotRepository
from backend.app.main import create_app


def test_full_api_flow(tmp_path) -> None:
    repository = SnapshotRepository(f"sqlite:///{tmp_path / 'api.db'}")
    app = create_app(repository)
    content = (
        "Protocolo,User ID,Iniciado,Fim,Setores,Rating\n"
        "1,Ana,10/08/2026 10:00,10/08/2026 11:00,Suporte,5"
    ).encode()

    with TestClient(app) as client:
        health = client.get("/api/health").json()
        assert health["pipeline"] == "python-pandas"
        assert health["persistent"] is True
        detection = client.post(
            "/api/v1/detectar-competencia",
            files={"file": ("agosto.csv", content, "text/csv")},
        )
        assert detection.status_code == 200
        assert detection.json()["competencia"] == "2026-08"

        response = client.post(
            "/api/v1/competencias/processar",
            files={"file": ("agosto.csv", content, "text/csv")},
            data={"competencia": "08/2026", "atendentes_excluidos": ""},
        )
        assert response.status_code == 200
        assert response.json()["ranking"][0]["premiado"] is True
        assert len(client.get("/api/v1/competencias").json()) == 1
        summary = client.get("/api/v1/competencias/resumo")
        assert summary.status_code == 200
        assert summary.json()[0]["validos"] == []
        assert summary.json()[0]["excluidos"] == []

        compact = client.post(
            "/api/v1/competencias/processar",
            files={"file": ("agosto.csv", content, "text/csv")},
            data={
                "competencia": "08/2026",
                "atendentes_excluidos": "",
                "resposta_compacta": "true",
            },
        )
        assert compact.status_code == 200
        assert compact.json()["validos"] == []
        assert compact.json()["excluidos"] == []

        updated = client.patch(
            "/api/v1/competencias/2026-08/feedback/Ana",
            json={"feedback": "Manter o resultado."},
        )
        assert updated.status_code == 200
        assert updated.json()["ranking"][0]["feedback"] == "Manter o resultado."


def test_public_demo_rejects_writes_and_preserves_history(tmp_path) -> None:
    repository = SnapshotRepository(f"sqlite:///{tmp_path / 'demo.db'}")
    writable = create_app(repository, read_only=False)
    content = (
        "Protocolo,User ID,Iniciado,Fim,Setores,Rating\n"
        "1,Ana,10/08/2026 10:00,10/08/2026 11:00,Suporte,5"
    ).encode()
    with TestClient(writable) as client:
        assert client.post("/api/v1/competencias/processar",
            files={"file": ("agosto.csv", content, "text/csv")},
            data={"competencia": "08/2026"}).status_code == 200

    with TestClient(create_app(repository, read_only=True)) as client:
        assert client.get("/api/health").json()["readOnly"] is True
        assert len(client.get("/api/v1/competencias").json()) == 1
        assert client.post("/api/v1/competencias/processar",
            files={"file": ("agosto.csv", content, "text/csv")},
            data={"competencia": "08/2026"}).status_code == 403
        assert client.post("/api/v1/detectar-competencia",
            files={"file": ("agosto.csv", content, "text/csv")}).status_code == 403
        assert client.patch("/api/v1/competencias/2026-08/feedback/Ana",
            json={"feedback": "Tentativa pública"}).status_code == 403
        assert client.get("/api/v1/competencias/2026-08").json()["ranking"][0]["feedback"] != "Tentativa pública"


def test_vercel_enables_read_only_by_default(tmp_path, monkeypatch) -> None:
    monkeypatch.setenv("VERCEL", "1")
    repository = SnapshotRepository(f"sqlite:///{tmp_path / 'preview.db'}")
    with TestClient(create_app(repository)) as client:
        assert client.get("/api/health").json()["readOnly"] is True


def test_shared_postgres_defaults_to_read_only_without_vercel_variables(monkeypatch) -> None:
    monkeypatch.delenv("VERCEL", raising=False)
    monkeypatch.delenv("VERCEL_ENV", raising=False)
    app = create_app(SnapshotRepository("postgresql://example.invalid/demo"))
    client = TestClient(app)
    assert client.get("/api/health").json()["readOnly"] is True
