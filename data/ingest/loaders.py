"""Loaders — responsáveis por ler cada formato de dados."""

from pathlib import Path

import pandas as pd
from rich.console import Console

from .config import CSV_COLUMNS

console = Console()

# Registro de loaders disponíveis (resolvidos pelo main via config)
LOADERS = {}


def register(name: str):
    """Decorator para registrar um loader pelo nome."""
    def decorator(fn):
        LOADERS[name] = fn
        return fn
    return decorator


def get(name: str):
    """Retorna o loader pelo nome registrado."""
    if name not in LOADERS:
        raise ValueError(f"Loader '{name}' não registrado. Disponíveis: {list(LOADERS.keys())}")
    return LOADERS[name]


@register("csv")
def load_csv(path: Path) -> pd.DataFrame:
    """Lê o CSV INMET e agrupa por estação + dia."""
    console.print(f"  📂 Lendo CSV: [bold]{path.name}[/]")

    df = pd.read_csv(path, header=None, names=CSV_COLUMNS)
    console.print(f"     Linhas brutas: {len(df):,}")

    df["data"] = pd.to_datetime(df["data"], errors="coerce")
    df = df.dropna(subset=["data", "estacao"])

    daily = df.groupby(["estacao", df["data"].dt.date]).agg({
        "precipitacao": "sum",
        "temp_media": "mean",
        "temp_max": "max",
        "temp_min": "min",
        "umidade_media": "mean",
        "rajada_vento": "max",
        "vento_velocidade": "mean",
    }).reset_index()

    daily.columns = [
        "estacao", "data", "precip_total",
        "temp_media", "temp_max", "temp_min",
        "umidade_media", "rajada_max", "vento_medio",
    ]

    console.print(f"     Documentos diários: {len(daily):,}")
    return daily


@register("xlsx")
def load_xlsx(path: Path) -> pd.DataFrame:
    """Lê o XLSX de análise integrada de Salvador."""
    console.print(f"  📂 Lendo XLSX: [bold]{path.name}[/]")

    df = pd.read_excel(path)
    console.print(f"     Colunas: {df.columns.tolist()}")
    console.print(f"     Linhas: {len(df):,}")
    return df
