"""Store — abstração de persistência no ChromaDB."""

import chromadb
from chromadb.utils import embedding_functions
from rich.console import Console
from rich.progress import track

from .config import CHROMA_HOST, CHROMA_PORT, BATCH_SIZE

console = Console()

# Embedding local (sem API externa — atende RNF05)
EMBED_FN = embedding_functions.DefaultEmbeddingFunction()


def connect() -> chromadb.HttpClient:
    """Conecta ao ChromaDB."""
    console.print(f"\n[bold]🔗 Conectando ao ChromaDB[/] ({CHROMA_HOST}:{CHROMA_PORT})")
    client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
    client.heartbeat()
    console.print("[green]✓ ChromaDB conectado[/]")
    return client


def upsert(client: chromadb.HttpClient, name: str, description: str, docs: list[dict]) -> int:
    """Insere documentos no ChromaDB em batches. Retorna total de docs."""
    collection = client.get_or_create_collection(
        name=name,
        embedding_function=EMBED_FN,
        metadata={"description": description},
    )

    total = len(docs)
    console.print(f"  💾 Inserindo {total:,} documentos na collection '{name}'...")

    for i in track(range(0, total, BATCH_SIZE), description="  Ingerindo"):
        batch = docs[i : i + BATCH_SIZE]
        collection.upsert(
            ids=[d["id"] for d in batch],
            documents=[d["document"] for d in batch],
            metadatas=[d["metadata"] for d in batch],
        )

    count = collection.count()
    console.print(f"  [green]✓ Collection '{name}' — {count:,} documentos[/]")
    return count


def list_collections(client: chromadb.HttpClient) -> list:
    """Lista todas as collections do ChromaDB."""
    return client.list_collections()
