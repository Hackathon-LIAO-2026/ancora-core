"""Configurações centralizadas do pipeline de ingestão."""

import os
from pathlib import Path

# ChromaDB
CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", 8000))

# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "csv"
REGISTRY_PATH = BASE_DIR / "registry.json"

# Ingestão
BATCH_SIZE = 500

# Datasets disponíveis
# Cada dataset declara seu loader e chunker — o main resolve dinamicamente.
DATASETS = {
    "bahia": {
        "file": "clima_bahia_hackathon.csv",
        "collection": "clima_bahia",
        "description": "Dados climáticos INMET da Bahia — agrupados por estação/dia",
        "loader": "csv",
        "chunker": "bahia",
    },
    "salvador": {
        "file": "clima_salvador_analise_integrada.xlsx",
        "collection": "clima_salvador",
        "description": "Análise integrada do clima de Salvador",
        "loader": "xlsx",
        "chunker": "salvador",
    },
}

# Colunas do CSV INMET (sem header)
CSV_COLUMNS = [
    "estacao", "data", "hora", "precipitacao",
    "pressao_media", "pressao_max", "pressao_min", "radiacao",
    "temp_media", "temp_orvalho", "temp_max", "temp_min",
    "orvalho_max", "orvalho_min", "umidade_max",
    "umidade_min", "umidade_media", "rajada_vento",
    "vento_velocidade", "vento_direcao",
]
