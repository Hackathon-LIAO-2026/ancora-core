# Dados — ÁncorA

## Datasets

| Arquivo | Descrição |
|---|---|
| `csv/clima_bahia_hackathon.csv` | 21 anos de dados INMET — estações meteorológicas da Bahia |
| `csv/clima_salvador_analise_integrada.xlsx` | Análise integrada do clima de Salvador |
| `csv/orgaos_emergencia_bahia.csv` | Órgãos de emergência da Bahia com telefones |

## Uso

Esses datasets são a fonte de ingestão para o ChromaDB (vetorização).

```bash
# 1. Instalar dependências
pip install -r data/requirements.txt

# 2. Subir o ChromaDB
docker compose up chromadb -d

# 3. Rodar ingestão (1 vez só)
python data/ingest.py
```

## Collections no ChromaDB

| Collection | Fonte | Descrição |
|---|---|---|
| `clima_bahia` | `clima_bahia_hackathon.csv` | Dados diários agrupados por estação (INMET) |
| `clima_salvador` | `clima_salvador_analise_integrada.xlsx` | Análise integrada de Salvador |
| `orgaos_emergencia` | `orgaos_emergencia_bahia.csv` | Órgãos de emergência com telefones |
