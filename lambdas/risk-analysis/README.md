# Lambda 2 — Risk Analysis

> Análise de risco e busca de abrigos para Salvador via ChromaDB.

Quando o n8n identifica que a usuária é de Salvador, roteia para esta Lambda.
Busca semântica na collection `abrigos_salvador` do ChromaDB, ordena por distância
geográfica e retorna o abrigo mais próximo + nível de risco + contatos de emergência.

---

## Endpoints

Base URL: `http://localhost:4000`

---

### POST /risk/analyze

Endpoint principal — recebe payload do n8n/Gemini e retorna análise de risco com abrigo.

### GET /risk/shelters

Lista abrigos. Aceita `?bairro=Lobato`.

### GET /risk/health

Healthcheck — verifica se a collection `abrigos_salvador` está populada no ChromaDB.

---

## Testando com cURL

> **Pré-requisito:** `docker compose up --build` (o serviço `ingest` popula a collection `abrigos_salvador` automaticamente).

### Healthcheck

```bash
curl -s http://localhost:4000/risk/health | jq
```

### Busca por coordenadas — Pernambués

```bash
curl -s -X POST http://localhost:4000/risk/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "cidade": "Salvador",
    "bairro": "Pernambués",
    "lat": -12.9580,
    "lng": -38.4590,
    "intencao": "alagamento",
    "panicScore": 4,
    "mensagemOriginal": "a água tá subindo aqui em Pernambués"
  }' | jq
```

### Panic Score 5 — botão de emergência

```bash
curl -s -X POST http://localhost:4000/risk/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "cidade": "Salvador",
    "bairro": "Pernambués",
    "lat": -12.9580,
    "lng": -38.4590,
    "panicScore": 5,
    "intencao": "alagamento",
    "mensagemOriginal": "SOCORRO A AGUA TA ENTRANDO NA MINHA CASA!!!"
  }' | jq
```

### Busca por bairro (sem coordenadas)

```bash
curl -s -X POST http://localhost:4000/risk/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "cidade": "Salvador",
    "bairro": "Lobato",
    "intencao": "risco_chuva",
    "panicScore": 3
  }' | jq
```

### Risco baixo — shelter NÃO aparece

```bash
curl -s -X POST http://localhost:4000/risk/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "cidade": "Salvador",
    "panicScore": 1,
    "intencao": "previsao",
    "mensagemOriginal": "qual a previsão do tempo?"
  }' | jq
```

### Listar abrigos

```bash
curl -s http://localhost:4000/risk/shelters | jq
curl -s "http://localhost:4000/risk/shelters?bairro=Lobato" | jq
```

---

## Lógica de Risco

| Panic Score | Intenção de risco | Nível resultante |
|---|---|---|
| 1 | qualquer | BAIXO |
| 2 | qualquer | BAIXO |
| 3 | geral | MÉDIO |
| 3 | alagamento/chuva | ALTO (boost +1) |
| 4 | qualquer | ALTO |
| 5 | qualquer | CRÍTICO |

- `shelter` só aparece quando `riskLevel >= ALTO`
- `showEmergencyButton = true` apenas quando `panicScore = 5`
- `emergencyContacts` só aparece quando `riskLevel >= ALTO`

---

## Dados

Os abrigos são ingeridos automaticamente pelo serviço `ingest` a partir de:
`data/csv/abrigos_salvador_bahia_v2.csv` → collection `abrigos_salvador` no ChromaDB.

Cada abrigo é vetorizado com texto descritivo + metadata (nome, bairro, lat, lng, serviços, etc).
A busca é semântica (por bairro/contexto) e o re-ranking é por distância geográfica (Haversine).
