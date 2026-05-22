"""Chunkers — transformam DataFrames em documentos textuais para vetorização."""

import pandas as pd

# Registro de chunkers disponíveis (resolvidos pelo main via config)
CHUNKERS = {}


def register(name: str):
    """Decorator para registrar um chunker pelo nome."""
    def decorator(fn):
        CHUNKERS[name] = fn
        return fn
    return decorator


def get(name: str):
    """Retorna o chunker pelo nome registrado."""
    if name not in CHUNKERS:
        raise ValueError(f"Chunker '{name}' não registrado. Disponíveis: {list(CHUNKERS.keys())}")
    return CHUNKERS[name]


@register("bahia")
def chunk_bahia(df: pd.DataFrame) -> list[dict]:
    """Cada linha diária vira um documento com texto descritivo + metadata."""
    docs = []
    for _, row in df.iterrows():
        texto = (
            f"Estação {row['estacao']}, data {row['data']}, "
            f"precipitação total {row['precip_total']:.1f}mm, "
            f"temperatura média {row['temp_media']:.1f}°C "
            f"(min {row['temp_min']:.1f}°C, max {row['temp_max']:.1f}°C), "
            f"umidade média {row['umidade_media']:.0f}%, "
            f"rajada máxima {row['rajada_max']:.1f}km/h, "
            f"vento médio {row['vento_medio']:.1f}km/h."
        )
        docs.append({
            "id": f"bahia-{row['estacao']}-{row['data']}",
            "document": texto,
            "metadata": {
                "estacao": str(row["estacao"]),
                "data": str(row["data"]),
                "precip_total": float(row["precip_total"]),
                "temp_media": float(row["temp_media"]),
                "temp_max": float(row["temp_max"]),
                "temp_min": float(row["temp_min"]),
            },
        })
    return docs


@register("salvador")
def chunk_salvador(df: pd.DataFrame) -> list[dict]:
    """Cada linha do XLSX vira um documento textual genérico + metadata."""
    docs = []
    for i, row in df.iterrows():
        partes = [f"{col}: {row[col]}" for col in df.columns if pd.notna(row[col])]
        texto = f"Salvador — {', '.join(partes)}"

        meta = {}
        for col in df.columns:
            val = row[col]
            if pd.notna(val):
                if isinstance(val, (int, float)):
                    meta[col] = float(val)
                else:
                    meta[col] = str(val)[:500]

        docs.append({
            "id": f"salvador-{i}",
            "document": texto,
            "metadata": meta,
        })
    return docs


@register("orgaos")
def chunk_orgaos(df: pd.DataFrame) -> list[dict]:
    """Cada órgão vira um documento textual com telefone e cobertura."""
    docs = []
    for i, row in df.iterrows():
        texto = (
            f"{row['orgao']} — Telefone: {row['telefone']}. "
            f"Tipo: {row['tipo']}. Cobertura: {row['cobertura']}. "
            f"{row['descricao']}. "
            f"Acionar quando risco for {row['risco_minimo']} ou superior."
        )
        docs.append({
            "id": f"orgao-{i}",
            "document": texto,
            "metadata": {
                "orgao": str(row["orgao"]),
                "telefone": str(row["telefone"]),
                "tipo": str(row["tipo"]),
                "cobertura": str(row["cobertura"]),
                "risco_minimo": str(row["risco_minimo"]),
            },
        })
    return docs



@register("abrigos")
def chunk_abrigos(df: pd.DataFrame) -> list[dict]:
    """Cada abrigo vira um documento textual com localização e serviços."""
    docs = []
    for i, row in df.iterrows():
        nome = str(row.get("nome", ""))
        bairro = str(row.get("bairro", ""))
        endereco = str(row.get("endereco", "")) if pd.notna(row.get("endereco")) else bairro
        servicos = str(row.get("servicos_oferecidos", "")) if pd.notna(row.get("servicos_oferecidos")) else ""
        area_risco = str(row.get("area_risco_associada", "")) if pd.notna(row.get("area_risco_associada")) else ""
        modo_ativacao = str(row.get("modo_ativacao", "")) if pd.notna(row.get("modo_ativacao")) else ""
        telefone = str(row.get("telefone", "")) if pd.notna(row.get("telefone")) else ""

        texto = (
            f"Abrigo: {nome}. "
            f"Bairro: {bairro}, Salvador. "
            f"Endereço: {endereco}. "
            f"Área de risco: {area_risco}. "
            f"Modo de ativação: {modo_ativacao}. "
            f"Serviços: {servicos}."
        )

        lat = float(row["latitude"]) if pd.notna(row.get("latitude")) else -12.9714
        lng = float(row["longitude"]) if pd.notna(row.get("longitude")) else -38.5014

        meta = {
            "nome": nome,
            "bairro": bairro,
            "endereco": endereco,
            "latitude": lat,
            "longitude": lng,
            "area_risco": area_risco,
            "modo_ativacao": modo_ativacao,
            "servicos": servicos,
        }
        if telefone:
            meta["telefone"] = telefone

        docs.append({
            "id": f"abrigo-{i}",
            "document": texto,
            "metadata": meta,
        })
    return docs
