"""Registry — controle de hash para evitar re-ingestão desnecessária."""

import json
import hashlib
from pathlib import Path

from .config import REGISTRY_PATH


def sha256(path: Path) -> str:
    """Calcula hash SHA-256 do arquivo."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()


def load() -> dict:
    """Carrega o registry do disco."""
    if REGISTRY_PATH.exists():
        return json.loads(REGISTRY_PATH.read_text())
    return {}


def save(registry: dict):
    """Persiste o registry no disco."""
    REGISTRY_PATH.write_text(json.dumps(registry, indent=2, ensure_ascii=False))


def needs_update(registry: dict, file_path: Path) -> bool:
    """Verifica se o arquivo mudou desde a última ingestão."""
    current_hash = sha256(file_path)
    entry = registry.get(file_path.name, {})
    return not (entry.get("sha256") == current_hash and entry.get("status") == "ok")
