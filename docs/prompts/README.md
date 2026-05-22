# Prompts dos Agentes ÁncorA

Prompts de sistema para os 6 agentes de IA do workflow n8n.  
Cada arquivo contém o **System Prompt pronto para colar** + notas de implementação.

## Agentes

| Arquivo | Nó n8n | Função |
|---|---|---|
| [01-gemini-vision.md](01-gemini-vision.md) | `Gemini Vision` | Analisa fotos de emergência |
| [02-gemini-transcricao.md](02-gemini-transcricao.md) | `Gemini Transcrição` | Transcreve áudios WhatsApp |
| [03-classificador.md](03-classificador.md) | `Classificador` | Classifica risco e roteia |
| [04-agente-info.md](04-agente-info.md) | `Agente Info` | Triagem e atendimento geral |
| [05-executor-salvador.md](05-executor-salvador.md) | `Executor Salvador` | Resposta a emergências em SSA |
| [06-gera-alerta.md](06-gera-alerta.md) | `Gera Alerta` | Disparo ativo Defesa Civil |

## Como Aplicar no n8n

1. Abra o nó correspondente no canvas
2. Localize o campo **"System Message"** (dentro de Options ou direto no agente)
3. Copie o bloco entre os ``` do arquivo .md
4. Cole no campo e salve

## Mudanças Importantes no Campo Text

O **Agente Info** (04) requer atualização no campo **Text** do nó:

```
NOME: {{ $json.nome }}
PANIC: {{ $json.panicScore }}
CIDADE: {{ $json.cidadeDetectada }}
IS_SALVADOR: {{ $json.isSalvador }}
INTENCAO: {{ $json.intencao }}
MENSAGEM: {{ $json.message }}
```

O **Classificador** (03) passa a retornar o campo `intencao` — o nó `Extrair JSON`
já propaga todos os campos do JSON, então nenhuma mudança é necessária lá.
