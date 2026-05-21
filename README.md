# ÁncorA

> *"Flávia não precisa de mais um alerta. Ela precisa de uma âncora."*

Assistente de navegação climática via WhatsApp para comunidades em risco na Bahia.

**Hackathon LIAO 2026 · BaIA Week · UFBA Ondina · 20–22/05/2026**

---

## O que é

ÁncorA conecta moradores de áreas de risco ao abrigo seguro mais próximo via WhatsApp, usando 21 anos de dados do INMET e um modelo de linguagem que adapta a resposta ao nível de desespero da mensagem — o **Panic Score**.

## Pré-requisitos

- Node.js 22 (`nvm use 22`)
- Python 3.11+
- Docker 27+
- Serverless Framework v3 (`npm install -g serverless@3`)

## Quick Start

### 1. Infraestrutura local

```bash
docker-compose up -d
```

| Serviço | URL |
|---|---|
| WAHA (WhatsApp gateway) | http://localhost:3000 |
| n8n (orquestrador) | http://localhost:5678 |
| PostgreSQL | localhost:5433 |
| Redis | localhost:6379 |

### 2. Lambdas (API)

```bash
npm install
npm run dev
```

API disponível em `http://localhost:4000`.

| Endpoint | Função |
|---|---|
| `GET /hello` | Health check |

### 3. Pipeline de Machine Learning

```bash
pip install -r requirements.txt
python run.py
```

Gera `predictions.csv` e `ml/model.joblib`.

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

`Node.js` `Python` `scikit-learn` `Serverless v3` `PostgreSQL` `Redis` `WAHA` `n8n` `Gemini` `Docker`

---

*Hackathon LIAO 2026 · Equipe ÁncorA · Salvador, Bahia*
