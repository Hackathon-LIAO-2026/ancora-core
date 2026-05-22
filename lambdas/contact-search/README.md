# Lambda 3 — Contact Search

> Busca de contatos no ChromaDB para o n8n disparar mensagens via WAHA.

A IA do n8n decide quando mandar mensagem, chama essa Lambda pra pegar
os números, e ela mesma envia via WAHA.

---

## Endpoints

Base URL: `http://localhost:4000`

### POST /contacts/search

Busca contatos no banco vetorial. Aceita filtro por nome, região ou DDD.

```bash
# Todos os contatos
curl -s -X POST http://localhost:4000/contacts/search \
  -H "Content-Type: application/json" \
  -d '{}' | jq

# Por nome
curl -s -X POST http://localhost:4000/contacts/search \
  -H "Content-Type: application/json" \
  -d '{ "query": "Eder" }' | jq

# Por região
curl -s -X POST http://localhost:4000/contacts/search \
  -H "Content-Type: application/json" \
  -d '{ "regiao": "Salvador" }' | jq

# Por DDD
curl -s -X POST http://localhost:4000/contacts/search \
  -H "Content-Type: application/json" \
  -d '{ "ddd": "71" }' | jq
```

**Response:**
```json
{
  "numbers": ["+557182041743", "+557781309491", "+5571993468650"],
  "contacts": [
    {
      "nome": "Atila Avila",
      "primeiroNome": "Atila",
      "telefone": "+55 71 8204-1743",
      "formatoE164": "+557182041743",
      "ddd": "71",
      "estado": "Bahia"
    }
  ],
  "total": 3,
  "meta": { "query": null, "elapsedMs": 5 }
}
```

### GET /contacts/all

Retorna todos os contatos sem filtro.

```bash
curl -s http://localhost:4000/contacts/all | jq
```

### GET /contacts/health

```bash
curl -s http://localhost:4000/contacts/health | jq
```

---

## Fluxo

```
IA do n8n decide mandar alerta
       ↓
n8n chama POST /contacts/search (com ou sem filtro)
       ↓
Lambda retorna { numbers: [...], contacts: [...] }
       ↓
n8n itera e envia via WAHA
```

---

## Dados

`data/csv/contatos.csv` → collection `contatos` no ChromaDB (via ingest).
