# ÁncorA

> *"Flávia não precisa de mais um alerta. Ela precisa de uma âncora."*

Assistente de navegação climática via WhatsApp para comunidades em risco na Bahia.

**Hackathon LIAO 2026 · BaIA Week · UFBA Ondina · 20–22/05/2026**

---

## O que é

ÁncorA conecta moradores de áreas de risco ao abrigo seguro mais próximo via WhatsApp, usando 21 anos de dados do INMET e um modelo de linguagem que adapta a resposta ao nível de desespero da mensagem — o **Panic Score**.

## Pré-requisitos

- Docker 27+ e Docker Compose v2
- Node.js 22 (apenas para desenvolvimento local sem Docker)
- Python 3.11+ (apenas para desenvolvimento local sem Docker)

## Quick Start

### Um comando só

```bash
docker compose up --build
```

Isso sobe **tudo** automaticamente:

| Serviço | URL | Função |
|---|---|---|
| API (Serverless Offline) | http://localhost:4000 | Todas as lambdas (`/hello`, `/climate/risk`, `/climate/health`) |
| WAHA | http://localhost:3000 | Gateway WhatsApp |
| n8n | http://localhost:5678 | Orquestrador de fluxos |
| ChromaDB | http://localhost:8000 | Banco vetorial (RAG) |
| PostgreSQL | localhost:5433 | Abrigos, sessões |
| Redis | localhost:6379 | Cache de estado |
| Ingest | — | Popula ChromaDB e encerra |

> A ingestão dos dados climáticos no ChromaDB acontece automaticamente no startup.
> Na segunda execução, o registry detecta que os dados não mudaram e pula a ingestão.

### Como funciona a busca climática (Lambda 1)

Quando a usuária manda uma mensagem no WhatsApp, o Gemini extrai a cidade e a intenção e envia para o **Climate Search**. O serviço executa um pipeline de 3 etapas:

```
Mensagem: "tá chovendo muito em Feira de Santana"
         ↓  Gemini extrai payload
{ cidade: "Feira de Santana", intencao: "risco_chuva", mensagemOriginal: "..." }
         ↓  Query Expansion
"Feira de Santana chuva forte precipitação alta risco alagamento temporal ..."
         ↓  Busca vetorial (HNSW no ChromaDB — 216.949 documentos, 384 dims)
20 candidatos mais próximos semanticamente
         ↓  Metadata Filter (ex: precipMin=10mm para risco_chuva)
Candidatos relevantes para a intenção
         ↓  Re-ranking (similaridade 40% + severidade 30% + recência 20% + cluster 10%)
Top 10 registros ordenados por relevância real
         ↓  Cálculo de risco (rule-based sobre os registros encontrados)
{ riskLevel: "ALTO", confidence: 0.78, emergencyContacts: [...] }
```

O resultado é devolvido pro n8n, que passa pro Gemini gerar a resposta empática calibrada ao **Panic Score** da usuária.

> Cidades de Salvador são rejeitadas com 400 e roteadas para a Lambda 2 (risk-analysis).

### Compatibilidade de SO

O `docker-compose.yml` vem configurado para **macOS Apple Silicon**. Se estiver em outro SO:

1. Abra `docker-compose.yml`
2. Procure os blocos `WAHA` e `n8n`
3. Comente o bloco ativo e descomente o bloco do seu SO (Linux ou Windows)

### Dataset obrigatório (ingestão ChromaDB)

O dataset `clima_bahia_hackathon.csv` (549MB) não está no repositório por exceder o limite do GitHub. Para a ingestão funcionar:

1. Baixe o dataset fornecido pela **Escavador** (disponibilizado no edital do hackathon)
2. Coloque o arquivo dentro de `data/csv/`:

```bash
cp ~/Downloads/clima_bahia_hackathon.csv data/csv/
```

> Sem esse arquivo, o serviço `ingest` vai pular a collection `clima_bahia` e popular apenas `clima_salvador`.

### Pipeline de Machine Learning (separado)

```bash
pip install -r requirements.txt
python run.py
```

Gera `predictions.csv` e `ml/model.joblib`.

---

## Estrutura do Projeto

```
ancora-core/
├── lambdas/                  ← Funções Lambda
│   ├── hello/handler.js      ← Health check
│   └── climate-search/       ← Lambda 1 — NestJS + ChromaDB
│       └── src/
│           ├── domain/       ← Entidades, Value Objects, Interfaces
│           ├── application/  ← Use Cases e DTOs
│           ├── infrastructure/ ← ChromaDB, estratégias de busca
│           └── presentation/ ← Controllers HTTP
├── data/                     ← Dados e pipeline de ingestão
│   ├── csv/                  ← Datasets climáticos
│   ├── ingest/               ← Módulo Python de ingestão → ChromaDB
│   ├── Dockerfile
│   └── requirements.txt
├── docs/                     ← Documentação técnica
├── docker-compose.yml        ← Sobe tudo com um comando
├── serverless.yml            ← Configuração das Lambdas
└── package.json
```

---

## Documentação

- [Arquitetura do sistema](docs/architecture.md)
- [Pipeline de Machine Learning](docs/ml-pipeline.md)
- [API Reference](docs/api.md)
- [DRS — Documento de Requisitos do Sistema](docs/drs.md)

---

## Time

## Time
| | Nome | Papel |
|---|---|---|
| 🤖 Hacker / CTO | [Éder Natan](https://github.com/edernatanzz) | ML, Backend, Infraestrutura |
| 📊 Dados | [Moises de Jesus](https://github.com/Moises-de-Jesus) | EDA, Feature Engineering |
| 🎨 Design | [Átila Ávila](https://github.com/Avila-Atila) | UI/UX, Pitch |
| Frontend | Marcio Ribeiro | frontend

---

## Stack

`Node.js` `Python` `scikit-learn` `Serverless v3` `PostgreSQL` `Redis` `ChromaDB` `WAHA` `n8n` `Gemini` `Docker`

---

*Hackathon LIAO 2026 · Equipe ÁncorA · Salvador, Bahia*
