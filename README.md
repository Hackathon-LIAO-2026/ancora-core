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
| API (Serverless Offline) | http://localhost:4000 | Lambdas Node.js |
| WAHA | http://localhost:3000 | Gateway WhatsApp |
| n8n | http://localhost:5678 | Orquestrador de fluxos |
| ChromaDB | http://localhost:8000 | Banco vetorial (RAG) |
| PostgreSQL | localhost:5433 | Abrigos, sessões |
| Redis | localhost:6379 | Cache de estado |
| Ingest | — | Popula ChromaDB e encerra |

> A ingestão dos dados climáticos no ChromaDB acontece automaticamente no startup.
> Na segunda execução, o registry detecta que os dados não mudaram e pula a ingestão.

### Compatibilidade de SO

O `docker-compose.yml` vem configurado para **macOS Apple Silicon**. Se estiver em outro SO:

1. Abra `docker-compose.yml`
2. Procure os blocos `WAHA` e `n8n`
3. Comente o bloco ativo e descomente o bloco do seu SO (Linux ou Windows)

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
├── lambdas/                  ← Funções Lambda (Serverless)
│   └── hello/handler.js
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

| | Nome | Papel |
|---|---|---|
| Hacker / CTO | Éder Natan Azevedo Figueiredo | ML, Backend, Infraestrutura |
| Dev | Marcio Ribeiro | Frontend, Integração API |
| Dados | Moises de Jesus | EDA, Feature Engineering |
| Design | Atila Avila Garcia | UI/UX, Pitch |

---

## Stack

`Node.js` `Python` `scikit-learn` `Serverless v3` `PostgreSQL` `Redis` `ChromaDB` `WAHA` `n8n` `Gemini` `Docker`

---

*Hackathon LIAO 2026 · Equipe ÁncorA · Salvador, Bahia*
