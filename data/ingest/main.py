"""Main — orquestrador do pipeline de ingestão."""

import sys
from datetime import datetime, timezone

from rich.console import Console

from .config import DATASETS, DATA_DIR
from . import registry
from . import loaders
from . import chunkers
from . import store

console = Console()


def ingest_dataset(client, key: str, reg: dict) -> bool:
    """Ingere um dataset. Retorna True se houve ingestão."""
    config = DATASETS[key]
    file_path = DATA_DIR / config["file"]

    if not file_path.exists():
        console.print(f"  [yellow]⚠️  Arquivo não encontrado: {file_path}[/]")
        return False

    if not registry.needs_update(reg, file_path):
        console.print(f"  [dim]↷ {config['file']} sem alteração — pulando[/]")
        return False

    # Resolver loader e chunker dinamicamente via config
    load = loaders.get(config["loader"])
    chunk = chunkers.get(config["chunker"])

    df = load(file_path)
    docs = chunk(df)

    # Store
    count = store.upsert(client, config["collection"], config["description"], docs)

    # Registry
    reg[file_path.name] = {
        "sha256": registry.sha256(file_path),
        "collection": config["collection"],
        "status": "ok",
        "ingested_at": datetime.now(timezone.utc).isoformat(),
        "documents": count,
    }
    registry.save(reg)
    return True


def run():
    """Ponto de entrada do pipeline."""
    console.print("\n[bold]" + "=" * 60)
    console.print("[bold]  ÁncorA — Ingestão de dados climáticos → ChromaDB")
    console.print("[bold]" + "=" * 60)

    # Determinar targets
    targets = list(DATASETS.keys())
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg not in DATASETS:
            console.print(f"[red]Dataset inválido: {arg}. Use: {', '.join(DATASETS.keys())}")
            sys.exit(1)
        targets = [arg]

    client = store.connect()
    reg = registry.load()

    ingested = 0
    for key in targets:
        console.print(f"\n[bold cyan]── {DATASETS[key]['description']} ──[/]")
        if ingest_dataset(client, key, reg):
            ingested += 1

    # Resumo
    console.print("\n[bold]" + "=" * 60)
    if ingested:
        console.print("[bold green]  ✅ Ingestão completa!")
    else:
        console.print("[bold green]  ✅ Tudo atualizado — nenhuma re-ingestão necessária.")

    console.print("  Collections disponíveis:")
    for col in store.list_collections(client):
        console.print(f"    • {col.name} ({col.count()} docs)")
    console.print("=" * 60 + "\n")
