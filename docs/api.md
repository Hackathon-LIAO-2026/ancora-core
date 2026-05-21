# API Reference

Base URL: `http://localhost:3001`

---

## POST /api/chat

Processa uma mensagem da usuária, calcula o Panic Score e retorna a resposta adaptada.

**Request**
```json
{
  "message": "a água tá subindo na minha rua!",
  "sessionId": "flavia-001"
}
```

**Response**
```json
{
  "panicLevel": 5,
  "riskLevel": "CRÍTICO",
  "message": "Flávia, saia agora. Vá para o abrigo mais próximo.",
  "shelter": {
    "name": "Escola Municipal Castro Alves",
    "address": "Rua da Paz, 120 — Liberdade, Salvador",
    "distance": "480m"
  },
  "showEmergencyButton": true
}
```

**Campos da resposta**

| Campo | Tipo | Descrição |
|---|---|---|
| `panicLevel` | `1–5` | Score de pânico calculado |
| `riskLevel` | `BAIXO \| MÉDIO \| ALTO \| CRÍTICO` | Risco predito pelo modelo |
| `message` | `string` | Resposta adaptada ao Panic Score |
| `shelter` | `object \| null` | Aparece apenas quando `riskLevel >= ALTO` |
| `showEmergencyButton` | `boolean` | `true` apenas quando `panicLevel = 5` |

---

## GET /api/chat/:sessionId

Retorna o histórico de mensagens de uma sessão.

**Response**
```json
[
  {
    "role": "user",
    "content": "qual a previsão do tempo?",
    "timestamp": "2026-05-21T14:30:00Z"
  },
  {
    "role": "assistant",
    "content": "Olá! Para Salvador, a previsão indica...",
    "panicLevel": 1,
    "timestamp": "2026-05-21T14:30:02Z"
  }
]
```

---

## GET /api/shelters

Lista todos os abrigos cadastrados em Salvador.

**Response**
```json
[
  {
    "id": 1,
    "name": "Escola Municipal Castro Alves",
    "address": "Rua da Paz, 120 — Liberdade",
    "neighborhood": "Liberdade",
    "lat": -12.9714,
    "lng": -38.5014,
    "capacity": 200
  }
]
```

---

## Critérios de Aceitação

- `POST /api/chat` responde em menos de 3 segundos
- `panicLevel` sobe para 4 ou 5 ao enviar *"a água tá subindo"*
- `panicLevel` fica em 1 ou 2 ao enviar *"qual a previsão do tempo?"*
- `shelter` aparece no JSON apenas quando `riskLevel >= ALTO`
- `showEmergencyButton: true` apenas quando `panicLevel = 5`
