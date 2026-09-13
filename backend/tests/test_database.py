from __future__ import annotations

from backend.app.database import SnapshotRepository
from backend.app.pipeline.engine import process_upload


def snapshot(rating: int = 5) -> dict:
    content = (
        "Protocolo,User ID,Iniciado,Fim,Setores,Rating\n"
        f"1,Ana,10/08/2026 10:00,10/08/2026 11:00,Suporte,{rating}"
    ).encode()
    return process_upload(content, "agosto.csv", "08/2026")


def test_reprocessing_replaces_competence_without_duplicates(tmp_path) -> None:
    repository = SnapshotRepository(f"sqlite:///{tmp_path / 'history.db'}")
    repository.initialize()
    repository.save(snapshot(5))
    repository.save(snapshot(4))

    stored = repository.list()
    assert len(stored) == 1
    assert stored[0]["ranking"][0]["avaliacaoMedia"] == 4


def test_feedback_is_updated_in_canonical_snapshot(tmp_path) -> None:
    repository = SnapshotRepository(f"sqlite:///{tmp_path / 'history.db'}")
    repository.initialize()
    repository.save(snapshot())

    updated = repository.update_feedback("2026-08", "Ana", "Acompanhar cobertura semanalmente.")
    assert updated is not None
    assert repository.get("2026-08")["ranking"][0]["feedback"] == "Acompanhar cobertura semanalmente."

