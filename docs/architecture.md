# Arquitetura do Sistema

## Visão Geral

ÁncorA usa uma arquitetura orientada a eventos com microsserviços e orquestração de fluxos para garantir respostas em tempo real.

---

## Fluxo Reativo — A usuária pede ajuda

```
WhatsApp → WAHA → n8n (Gemini LLM)
                      │
          ┌───────────┴────────────┐
          │                        │
     Usuária de               Usuária de
     Salvador                outra cidade
          │                        │
     Lambda 2               Lambda 1
  (NestJS + Postgres)    (Python + VectorDB)
   Abrigo mais próximo    Contexto climático
   Análise de risco        RAG dataset INMET
          │                        │
          └───────────┬────────────┘
                   n8n + Gemini
              Resposta adaptada ao
                  Panic Score
                      │
                  WhatsApp ←
```

**Passo a passo:**

1. Usuária envia mensagem no WhatsApp
2. WAHA intercepta e dispara webhook para o n8n
3. n8n chama Gemini → extrai `{ intencao, local, panic_score }`
4. n8n roteia:
   - **Salvador** → Lambda 2 (NestJS): busca abrigo no Postgres, cruza com análise de risco
   - **Outras cidades** → Lambda 1 (Python): busca semântica no ChromaDB com dados INMET
5. Lambdas retornam JSON com dados puros para o n8n
6. n8n chama Gemini novamente com o JSON + Panic Score → gera resposta empática
7. n8n envia o texto via WAHA para o WhatsApp da usuária

---

## Fluxo Ativo — Defesa Civil dispara alerta

```
Defesa Civil → Backend (lista de contatos JSON)
                    │
                   n8n
                    │
              Gemini (personalização)
                    │
             WhatsApp (broadcast)
```

---

## Componentes de Infraestrutura

| Componente | Tecnologia | Porta | Função |
|---|---|---|---|
| Mensageria | WAHA | 3000 | Gateway WhatsApp, recebe e envia mensagens |
| Orquestração | n8n | 5678 | Coordena fluxos entre WAHA, Gemini e Lambdas |
| Banco relacional | PostgreSQL | 5433 | Abrigos, usuárias, histórico de sessão |
| Cache / Estado | Redis | 6379 | Estado de conversas no n8n |
| VectorDB | ChromaDB | — | RAG com 21 anos de dados INMET |
| LLM | Google Gemini | — | Extração de intenção e geração de resposta |

---

## Panic Score

O Panic Score é calculado por um modelo de scoring ponderado — não um if-else — usando features extraídas da mensagem:

| Feature | Peso |
|---|---|
| Palavras críticas detectadas | Alto |
| Taxa de maiúsculas na mensagem | Médio |
| Pontuação repetida (`!!!`, `???`) | Médio |
| Tamanho da mensagem | Baixo |
| Risco predito pelo `model.pkl` | Alto |

| Score | Tom da resposta |
|---|---|
| 1 | Informativo, dados climáticos gerais |
| 2 | Preventivo, recomendações |
| 3 | Direto, orienta precauções |
| 4 | Curto, rota ao abrigo imediata |
| 5 | Mínimo, ação imediata + botão Defesa Civil |
