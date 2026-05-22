# Lambda 3 — Contact Search

> Busca de contatos para broadcast de alertas via n8n/WhatsApp.

Quando a Defesa Civil dispara um alerta, o n8n chama esta Lambda pra pegar
os números de telefone e enviar mensagens personalizadas via WAHA.

---

## Endpoints

Base URL: `http://localhost:4000`

---

### POST /contacts/broadcast

**Endpoint principal pro n8n** — retorna todos os números E.164 prontos pra envio.

```bash
curl -s -X POST http://localhost:4000/contacts/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "mensagem": "⚠️ ALERTA: Chuva forte prevista para Salvador nas próximas 3h. Procure abrigo seguro."
  }' | jq
```

**Response:**
```json
{
  "numbers": ["+557182041743", "+557781309491", "+5571993468650"],
  "recipients": [
    { "nome": "Atila Avila", "primeiroNome": "Atila", "numero": "+557182041743" },
    { "nome": "Eder Natan", "primeiroNome": "Eder", "numero": "+557781309491" },
    { "nome": "Moises de Jesus", "primeiroNome": "Moises", "numero": "+5571993468650" }
  ],
  "total": 3,
  "mensagem": "⚠️ ALERTA: Chuva forte prevista para Salvador nas próximas 3h. Procure abrigo seguro."
}
```

### POST /contacts/broadcast (com filtro por região)

```bash
curl -s -X POST http://localhost:4000/contacts/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "mensagem": "Alerta de alagamento em Salvador",
    "regiao": "Salvador"
  }' | jq
```

### POST /contacts/broadcast (excluindo números)

```bash
curl -s -X POST http://localhost:4000/contacts/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "mensagem": "Alerta geral",
    "excluir": ["+557182041743"]
  }' | jq
```

---

### POST /contacts/search

Busca semântica por contatos.

```bash
curl -s -X POST http://localhost:4000/contacts/search \
  -H "Content-Type: application/json" \
  -d '{ "query": "Eder" }' | jq
```

### GET /contacts/all

Lista todos os contatos.

```bash
curl -s http://localhost:4000/contacts/all | jq
```

### GET /contacts/health

```bash
curl -s http://localhost:4000/contacts/health | jq
```

---

## Fluxo no n8n

```
Defesa Civil dispara alerta
       ↓
n8n chama POST /contacts/broadcast com a mensagem
       ↓
Lambda retorna { numbers: [...], recipients: [...], mensagem: "..." }
       ↓
n8n itera sobre recipients e envia via WAHA (personalizado com primeiroNome)
```

---

## Dados

Contatos ingeridos automaticamente pelo serviço `ingest` a partir de:
`data/csv/contatos.csv` → collection `contatos` no ChromaDB.
