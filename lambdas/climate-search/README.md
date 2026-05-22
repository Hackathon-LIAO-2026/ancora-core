# Lambda 1 — Climate Search (Outras Cidades)

> **Bounded Context:** Contexto Climático Regional  
> **Domínio:** Busca semântica de dados históricos INMET para cidades da Bahia **fora de Salvador**.  
> **Jornada:** Fluxo Reativo (usuária pede ajuda)

---

## O que essa Lambda faz

1. Recebe o payload do n8n (extraído pelo Gemini da mensagem da usuária)
2. **Valida** que a cidade não é Salvador (se for, retorna 400 — Salvador vai pra Lambda 2)
3. **Busca semanticamente** no ChromaDB registros climáticos históricos similares à situação descrita
4. **Re-rankeia** os resultados por relevância, severidade e recência
5. **Calcula o nível de risco** baseado nos padrões históricos encontrados
6. **Retorna JSON** pro n8n, que passa pro Gemini gerar a resposta empática

---

## Sobre a Planilha (Dataset)

### Origem

`clima_bahia_hackathon.csv` — dados do **INMET** (Instituto Nacional de Meteorologia), cobrindo **21 anos** (2000–2021) de medições horárias de **49 estações automáticas** espalhadas pela Bahia.

### Estrutura do CSV (sem header)

| Coluna | Campo | Exemplo | Descrição |
|---|---|---|---|
| 1 | `estacao` | `A401` | Código da estação INMET |
| 2 | `data` | `2021-01-01` | Data da medição |
| 3 | `hora` | `0`, `100`, `200`... | Hora UTC (0 = meia-noite, 100 = 1h, etc.) |
| 4 | `precipitacao` | `2.4` | Precipitação em mm |
| 5 | `pressao_media` | `1008.0` | Pressão atmosférica média (hPa) |
| 6 | `pressao_max` | `1008.2` | Pressão máxima |
| 7 | `pressao_min` | `1007.9` | Pressão mínima |
| 8 | `radiacao` | *(vazio)* | Radiação solar (muitos nulos) |
| 9 | `temp_media` | `26.0` | Temperatura média (°C) |
| 10 | `temp_orvalho` | `20.9` | Temperatura do ponto de orvalho |
| 11 | `temp_max` | `26.3` | Temperatura máxima |
| 12 | `temp_min` | `25.9` | Temperatura mínima |
| 13 | `orvalho_max` | `21.3` | Orvalho máximo |
| 14 | `orvalho_min` | `20.6` | Orvalho mínimo |
| 15 | `umidade_max` | `74.0` | Umidade relativa máxima (%) |
| 16 | `umidade_min` | `72.0` | Umidade mínima |
| 17 | `umidade_media` | `73.0` | Umidade média |
| 18 | `rajada_vento` | `93.0` | Rajada máxima de vento (km/h) |
| 19 | `vento_velocidade` | `5.2` | Velocidade média do vento |
| 20 | `vento_direcao` | `1.5` | Direção do vento (graus) |

### Códigos das Estações

Os códigos `A4XX` são estações automáticas do INMET na Bahia. Cada código representa uma localização geográfica fixa (ex: A401 = Salvador/Ondina, A402 = Feira de Santana, etc.). O dataset tem **49 estações** cobrindo todo o estado.

### Volume

- **5.206.752 linhas** (medições horárias)
- Após agrupamento por estação + dia → **216.949 documentos** no ChromaDB

---

## Como a Ingestão Funciona

```
CSV (5.2M linhas horárias)
       │
  [Agrupamento por estação + dia]
       │
  216.949 documentos diários
       │
  [Cada documento vira texto descritivo]
       │
  "Estação A402, data 2023-06-15, precipitação total 112.0mm,
   temperatura média 22.1°C (min 18.5°C, max 26.5°C),
   umidade média 89%, rajada máxima 95.0km/h..."
       │
  [ChromaDB gera embedding vetorial do texto]
       │
  Vetor de 384 dimensões armazenado com metadata
```

---

## Algoritmos Utilizados

### 1. HNSW (Hierarchical Navigable Small World) — Busca Vetorial

**O que é:** Algoritmo de grafos multicamada para busca aproximada de vizinhos mais próximos (ANN). É o estado da arte em vector search.

**Como funciona:**
- Constrói um grafo navegável com múltiplas camadas (hierárquico)
- Camadas superiores = poucos nós, conexões longas (navegação rápida)
- Camadas inferiores = muitos nós, conexões curtas (precisão)
- A busca começa no topo e desce, como um "zoom" progressivo

**Complexidade:** O(log n) — muito mais eficiente que busca linear O(n)  
**Precisão:** ~95% recall@10 comparado com busca exata (brute force)

**Por que não BFS/DFS/Dijkstra?**
- BFS/DFS são O(n) — inviáveis com 216k documentos
- Dijkstra é pra grafos com pesos de aresta (caminhos mínimos), não similaridade vetorial
- HNSW é especificamente projetado pra busca por similaridade em alta dimensão

### 2. Expansão de Query (Query Expansion)

**O que é:** Técnica de Information Retrieval que adiciona sinônimos/termos relacionados à query original pra melhorar o recall.

**Como funciona no ÁncorA:**
```
"chuva" → "chuva precipitação temporal alagamento"
"calor" → "calor temperatura alta onda de calor"
"vento" → "vento rajada ventania vendaval"
"frio"  → "frio temperatura baixa friagem"
"seca"  → "seca estiagem sem chuva precipitação zero"
```

> **Nota:** apenas o **primeiro termo que der match** é expandido por query (comportamento do `SearchQuery.expandedText`). A expansão por intenção (`risco_chuva`, `alagamento`, etc.) ocorre separadamente em `SearchClimateUseCase.buildSearchText`.

Isso garante que a busca semântica encontre documentos relevantes mesmo que usem termos diferentes da mensagem original.

### 3. Re-ranking com Score Ponderado (Learning-to-Rank simplificado)

**O que é:** Após a busca vetorial retornar candidatos, recalcula a relevância usando múltiplos fatores.

**Pesos:**

| Fator | Peso | Lógica |
|---|---|---|
| Similaridade semântica | 40% | Distância vetorial (HNSW) convertida em similaridade |
| Severidade climática | 30% | Eventos extremos (precip > 50mm, temp > 35°C, rajada > 60km/h) |
| Recência temporal | 20% | Decay exponencial — dados recentes pesam mais (half-life: 365 dias) |
| Cluster bonus | 10% | Múltiplos resultados da mesma estação = padrão consistente |

### 4. Cálculo de Risco (Rule-based scoring)

**Baseado nos registros históricos encontrados:**

| Condição | Nível |
|---|---|
| ≥60% eventos extremos OU precipitação média > 80mm | CRÍTICO |
| ≥40% eventos extremos OU precipitação média > 50mm | ALTO |
| ≥20% eventos extremos OU precipitação média > 30mm | MÉDIO |
| Caso contrário | BAIXO |

---

## O que a IA (Embedding) faz exatamente

O ChromaDB usa o modelo **all-MiniLM-L6-v2** (384 dimensões) pra transformar texto em vetores numéricos.

```
Texto: "Estação A402, precipitação total 112mm, rajada 95km/h"
       ↓
Embedding: [0.023, -0.156, 0.089, ..., 0.041]  (384 números)
```

Quando a usuária manda "tá chovendo muito em Feira de Santana", o modelo transforma essa frase no mesmo espaço vetorial e busca os documentos mais próximos geometricamente — ou seja, os registros climáticos que descrevem situações mais parecidas.

**Não é keyword matching** — é compreensão semântica. "Tá alagando" encontra registros com "precipitação 120mm" mesmo sem a palavra "alagando" no documento.

---

## Validação de Domínio

Se a cidade for Salvador (ou variantes: "ssa", "soteropolis"), a Lambda retorna **400 Bad Request**:

```json
{
  "statusCode": 400,
  "message": "Cidade \"Salvador\" deve ser roteada para a Lambda 2 (risk-analysis). Esta Lambda atende apenas cidades fora de Salvador.",
  "error": "Bad Request"
}
```

---

## Órgãos de Emergência

Quando o `riskLevel` é **ALTO** ou **CRÍTICO**, a Lambda busca automaticamente no ChromaDB (collection `orgaos_emergencia`) os órgãos de emergência relevantes pra cidade da usuária.

**Dataset:** `data/csv/orgaos_emergencia_bahia.csv`

| Órgão | Telefone | Cobertura | Risco mínimo |
|---|---|---|---|
| Defesa Civil Estadual | (71) 3116-5399 | Bahia | ALTO |
| SAMU | 192 | Nacional | ALTO |
| Bombeiros | 193 | Nacional | ALTO |
| Defesa Civil Feira de Santana | (75) 3602-8200 | Feira de Santana | ALTO |
| Defesa Civil Ilhéus | (73) 3234-5600 | Ilhéus | ALTO |
| CEMADEN | 199 | Nacional | ALTO |
| Cruz Vermelha Bahia | (71) 3336-2200 | Bahia | ALTO |

**Lógica:**
- `riskLevel == BAIXO ou MÉDIO` → `emergencyContacts: []` (vazio)
- `riskLevel == ALTO ou CRÍTICO` → busca semântica na collection `orgaos_emergencia`, filtra por cobertura (cidade, estado ou nacional)

> **Nota:** nenhum contato é retornado para nível MÉDIO. O risco mínimo para acionar qualquer órgão é **ALTO**.

**Exemplo no response:**
```json
{
  "riskLevel": "ALTO",
  "emergencyContacts": [
    {
      "orgao": "Defesa Civil Feira de Santana",
      "telefone": "(75) 3602-8200",
      "tipo": "defesa_civil",
      "cobertura": "Feira de Santana"
    },
    {
      "orgao": "Defesa Civil Estadual",
      "telefone": "(71) 3116-5399",
      "tipo": "defesa_civil",
      "cobertura": "Bahia"
    },
    {
      "orgao": "Bombeiros 193",
      "telefone": "193",
      "tipo": "bombeiros",
      "cobertura": "Nacional"
    }
  ]
}
```

---

## Separação por Domínio (DDD)

| Lambda | Bounded Context | Collection | Responsabilidade |
|---|---|---|---|
| **Lambda 1** (climate-search) | Contexto Climático Regional | `clima_bahia` | Busca semântica + risco genérico |
| **Lambda 2** (risk-analysis) | Análise de Risco Salvador | `clima_salvador` + Postgres | Risco local + abrigos + rota |

---

## Endpoints

### POST /climate/risk

**Request:**
```bash
curl -X POST http://localhost:3001/climate/risk \
  -H "Content-Type: application/json" \
  -d '{
    "cidade": "Feira de Santana",
    "intencao": "risco_chuva",
    "panicScore": 3,
    "mensagemOriginal": "tá chovendo muito aqui, será que vai alagar?"
  }'
```

**Response:**
```json
{
  "riskLevel": "ALTO",
  "confidence": 0.78,
  "summary": "Análise de 10 registros históricos para Feira de Santana...",
  "historicalPattern": "Padrão: 4 eventos extremos. Precipitação máxima: 112.0mm.",
  "context": [...],
  "meta": {
    "cidade": "Feira de Santana",
    "collection": "clima_bahia",
    "totalResults": 10,
    "elapsedMs": 98
  }
}
```

**Campos do request:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `cidade` | string | ✅ | Cidade extraída pelo Gemini |
| `bairro` | string | — | Bairro (enriquece busca semântica) |
| `lat` | number | — | Latitude |
| `lng` | number | — | Longitude |
| `intencao` | string | — | `risco_chuva`, `previsao`, `alagamento`, `clima_geral`, `historico` |
| `panicScore` | number | — | Score de pânico (1–5) |
| `mensagemOriginal` | string | — | Mensagem original da usuária |

### GET /climate/health

```bash
curl http://localhost:3001/climate/health
```

---

## Arquitetura do Código (Clean Architecture)

```
src/
├── domain/              ← Regras de negócio (zero dependência externa)
│   ├── entities/        → ClimateRecord (severityScore, isExtremeEvent)
│   ├── value-objects/   → SearchQuery (expansão), RelevanceScore (pesos)
│   └── interfaces/      → IClimateRepository (contrato)
├── application/         ← Use Cases (orquestração)
│   ├── SearchClimateUseCase (validação + roteamento + busca)
│   └── dto/             → SearchRequestDto, SearchResponseDto
├── infrastructure/      ← Implementações concretas
│   ├── chromadb/        → ChromaDbClimateRepository
│   └── search/
│       └── strategies/
│           ├── SemanticSearch   (HNSW via ChromaDB)
│           ├── MetadataFilter   (pré-filtragem por estação/precip)
│           └── Reranking        (score ponderado multi-fator)
└── presentation/        ← Controller HTTP
    └── POST /climate/risk, GET /climate/health
```

---

## Desenvolvimento

```bash
cd lambdas/climate-search
npm install
npm run start:dev
```

Ou via Docker:
```bash
docker compose up --build
```
