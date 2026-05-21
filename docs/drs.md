# DRS — Documento de Requisitos do Sistema

Versão 1.0 · Elaborado por Éder Natan Azevedo Figueiredo · Maio/2026

Este documento descreve os requisitos do sistema ÁncorA para o Hackathon LIAO 2026. **Qualquer funcionalidade não descrita aqui está fora do escopo do hackathon.**

---

## Entregáveis Obrigatórios

| Entregável | Tipo | Descrição |
|---|---|---|
| `run.py` | Obrigatório | Pipeline ML completo: limpeza → features → treino → predictions.csv |
| `predictions.csv` | Obrigatório | Predições do modelo no dataset de teste oficial |
| `requirements.txt` | Obrigatório | Dependências Python do pipeline |
| `README.md` | Obrigatório | Documentação técnica do repositório |
| `Pitch.pdf` | Obrigatório | Slides da apresentação em 3 minutos |
| Backend NestJS | Produto | API REST com Panic Score e integração ao modelo |
| Frontend Next.js | Produto | Interface de chat para demo no pitch |
| `docker-compose.yml` | Infra | Sobe todo o sistema com um único comando |

---

## Módulo 1 — Pipeline de Machine Learning

*30 pts + 5 bônus no edital.*

### Requisitos
- Ler o dataset oficial via `pd.read_csv()` sem erros
- Tratar valores nulos — sem NaN no dataset de treino
- Criar pelo menos 3 features derivadas com lógica climática
- Split temporal — dados futuros nunca vistos no treino (sem data leakage)
- Treinar modelo scikit-learn com `fit()` — sem regras if-else
- Diferença entre F1 de treino e teste < 0,10
- Gerar `predictions.csv` no diretório raiz
- Imprimir F1-Score, Precision e Recall com 4 casas decimais
- Salvar `model.pkl` via joblib em `ml/`
- **Bônus (+5 pts):** Salvar `confusion_matrix.png`

### Critérios de Aceitação
- `python run.py` executa do início ao fim sem intervenção
- `predictions.csv` gerado no diretório raiz
- Métricas impressas no console
- Diferença de acurácia treino/teste < 0,10

### Fora do Escopo
- Datasets externos — apenas o dataset oficial
- APIs de LLM no pipeline ML
- Interface visual para o modelo

---

## Módulo 2 — Backend API (NestJS)

*30 pts — produto construído ao redor do modelo.*

### POST /api/chat
- Recebe `{ message: string, sessionId: string }`
- Retorna `{ panicLevel, riskLevel, message, shelter?, showEmergencyButton }`
- Tempo de resposta < 3 segundos

### Panic Score
- Score 1–5 baseado em features ponderadas da mensagem
- Modelo de scoring ponderado — não um if-else simples
- Risco predito pelo `model.pkl` entra como feature

### Integração model.pkl
- Carregar `model.pkl` via python-shell ou subprocess
- riskLevel predito entra no cálculo do Panic Score

### Histórico de Sessão
- Armazenar histórico por `sessionId` no PostgreSQL
- `GET /api/chat/:sessionId` retorna o histórico

### Shelters
- `GET /api/shelters` lista todos os abrigos
- Seed com 5 abrigos reais de Salvador (nome, endereço, coordenadas)
- `shelter` aparece no JSON apenas quando `riskLevel >= ALTO`

### Fora do Escopo
- Autenticação de usuários
- Cadastro real de abrigos com vagas em tempo real
- Integração com WhatsApp Business API — **interface é web**

---

## Módulo 3 — Frontend (Next.js)

*20 pts — demo ao vivo no pitch.*

### Interface
- Header com nome 'ÁncorA' e indicador visual do Panic Score
- Bolhas: usuária à direita (verde), bot à esquerda (branco/cinza)
- Scroll automático para a última mensagem
- Input desabilitado durante requisição
- Indicador de digitação (três pontos animados)

### Card de Abrigo
- Exibido automaticamente quando `riskLevel >= ALTO`
- Mostra nome, endereço e distância aproximada

### Botão de Emergência
- Aparece apenas quando `showEmergencyButton = true` (`panicLevel = 5`)
- Texto: "Acionar Defesa Civil agora"
- Cor vermelha

### Responsividade
- Funciona em tela de celular (mínimo 375px)

### Fora do Escopo
- Envio de áudio ou imagem
- Mapa visual com localização do abrigo
- Tela de histórico de conversas anteriores

---

## Requisitos Não Funcionais

| ID | Requisito | Meta |
|---|---|---|
| RNF01 | Tempo de resposta da API | < 3 segundos por mensagem |
| RNF02 | Inicialização do ambiente | `docker-compose up` sobe tudo sem erros |
| RNF03 | Execução do pipeline ML | `python run.py` roda sem intervenção |
| RNF04 | Compatibilidade de navegadores | Chrome e Firefox |
| RNF05 | Independência de API externa no core | `model.pkl` e Panic Score rodam 100% offline |
| RNF06 | Repositório público no GitHub | Link disponível até 15h30 de sexta-feira |
| RNF07 | Dependências declaradas | `pip install -r requirements.txt` sem erros |

---

## Pontuação do Edital

| Critério | Pts | Como o ÁncorA atende |
|---|---|---|
| Pipeline automático (run.py) | 10 | Executa limpeza → treino → predição sem intervenção |
| Auditabilidade do código | 10 | Código modular em `ml/`, estrutura clara |
| Métricas F1, Precision, Recall | 10 | Impressas no console com 4 casas decimais |
| Bônus: Matriz de confusão | +5 | `confusion_matrix.png` gerada pelo run.py |
| Ideia criativa e aplicável | 15 | Panic Score — nenhum outro time terá isso |
| Feature engineering climática | 15 | Features derivadas com lógica climática real |
| Público-alvo + benefícios | 14 | 65% mulheres em risco — dado IBGE verificável |
| Impacto quantificável | 20 | Redução de tempo de evacuação |
| Apresentação da dor e solução | 10 | História da Flávia abre o pitch |
| Defesa técnica da banca | 10 | Éder conhece cada linha do código |
