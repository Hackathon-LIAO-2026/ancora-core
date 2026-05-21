# Pipeline de Machine Learning

## Execução

```bash
pip install -r requirements.txt
python run.py
```

O script roda do início ao fim sem intervenção manual.

---

## Dataset

`clima_bahia_hackathon.csv` — 21 anos de dados históricos das estações meteorológicas do INMET na Bahia.

---

## Etapas do Pipeline

### 1. Carregamento e Limpeza
- `pd.read_csv()` sem erros
- Tratamento de valores nulos
- Print do shape e colunas no console

### 2. Feature Engineering Climática
Mínimo 3 features derivadas com lógica meteorológica:

| Feature | Descrição |
|---|---|
| `precip_acumulada_72h` | Precipitação acumulada nas últimas 72h |
| `variacao_temp_24h` | Variação de temperatura nas últimas 24h |
| `umidade_relativa_media` | Média de umidade relativa no período |
| *(+ features do Investigador)* | Definidas durante o EDA |

### 3. Treino
- Split **temporal** — dados futuros nunca vistos no treino (sem data leakage)
- Modelo scikit-learn com `fit()` — sem regras if-else
- Diferença entre F1 de treino e teste < 0,10

### 4. Avaliação
Métricas impressas no console com 4 casas decimais:
```
F1-Score:  0.XXXX
Precision: 0.XXXX
Recall:    0.XXXX
```

---

## Saídas

| Arquivo | Localização | Descrição |
|---|---|---|
| `predictions.csv` | raiz do projeto | Predições do modelo no dataset de teste |
| `model.pkl` | `ml/model.pkl` | Modelo serializado via joblib |
| `confusion_matrix.png` | `ml/confusion_matrix.png` | Bônus +5 pts no edital |

---

## Integração com o Backend

O NestJS carrega `ml/model.pkl` via `python-shell` (npm) para inferir o nível de risco a partir da área/contexto da mensagem. O risco predito entra como feature no cálculo do Panic Score.

```
mensagem → NestJS → python-shell → model.pkl → riskLevel → Panic Score
```

---

## Estrutura de arquivos ML

```
ml/
├── preprocessing.py    ← limpeza e feature engineering
├── model.py            ← treino e avaliação
├── model.pkl           ← modelo salvo (gerado pelo run.py)
└── confusion_matrix.png
```
