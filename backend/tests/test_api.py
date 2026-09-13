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
        assert client.get("/health").json()["pipeline"] == "python-pandas"
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

        updated = client.patch(
            "/api/v1/competencias/2026-08/feedback/Ana",
            json={"feedback": "Manter o resultado."},
        )
        assert updated.status_code == 200
        assert updated.json()["ranking"][0]["feedback"] == "Manter o resultado."

