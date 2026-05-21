# ÁncorA

> *"Flávia não precisa de mais um alerta. Ela precisa de uma âncora."*

Assistente de navegação climática via WhatsApp para comunidades em risco na Bahia.

**Hackathon LIAO 2026 · BaIA Week · UFBA Ondina · 20–22/05/2026**

---

## O que é

ÁncorA conecta moradores de áreas de risco ao abrigo seguro mais próximo via WhatsApp, usando 21 anos de dados do INMET e um modelo de linguagem que adapta a resposta ao nível de desespero da mensagem — o **Panic Score**.

## Quick Start

```bash
# Sobe a infraestrutura (Postgres, Redis, WAHA, n8n)
docker-compose up -d

# Roda o pipeline de ML
pip install -r requirements.txt
python run.py

# Backend
cd backend && npm install && npm run start:dev

# Frontend
cd frontend && npm install && npm run dev
```

Interface: `http://localhost:3000` · API: `http://localhost:3001`

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

`Python` `scikit-learn` `NestJS` `Next.js` `PostgreSQL` `Redis` `WAHA` `n8n` `Gemini` `Docker`

---

*Hackathon LIAO 2026 · Equipe ÁncorA · Salvador, Bahia*
