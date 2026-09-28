"""Export a reproducible, read-only browser preview from the isolated synthetic DB."""

from __future__ import annotations

import argparse
import gzip
import json
from pathlib import Path

from backend.app.database import SnapshotRepository


def export(repository: SnapshotRepository, destination: Path) -> dict:
    snapshots = repository.list()
    if not snapshots:
        raise ValueError("A base de demonstração está vazia.")
    if any(not snapshot["origem"].startswith("atendimentos_sinteticos_") for snapshot in snapshots):
        raise ValueError("A prévia pública só pode conter dados sintéticos gerados pelo projeto.")

    destination.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schemaVersion": 1,
        "source": "Demonstração pública com dados 100% sintéticos",
        "totalTickets": sum(snapshot["totalLinhas"] for snapshot in snapshots),
        "validTickets": sum(len(snapshot["validos"]) for snapshot in snapshots),
        "summaries": [],
    }
    for snapshot in snapshots:
        key = snapshot["competencia"]
        if not key.startswith("2026-") or len(snapshot.get("carteira", [])) != 24:
            raise ValueError(f"Competência ou carteira sintética incompleta: {key}")
        raw = json.dumps(snapshot, ensure_ascii=False, allow_nan=False, separators=(",", ":")).encode("utf-8")
        (destination / f"{key}.bin").write_bytes(gzip.compress(raw, compresslevel=9, mtime=0))
        manifest["summaries"].append({**snapshot, "validos": [], "excluidos": []})

    (destination / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database-url", required=True, help="Banco SQLite isolado já populado pelo seed.")
    parser.add_argument("--output", default="public/demo", help="Diretório estático da prévia.")
    args = parser.parse_args()
    result = export(SnapshotRepository(args.database_url), Path(args.output))
    print(f"{len(result['summaries'])} meses, {result['totalTickets']} chamados sintéticos exportados.")
