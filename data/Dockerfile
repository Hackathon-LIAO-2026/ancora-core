FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY csv/ ./csv/
COPY ingest/ ./ingest/

CMD ["python", "-m", "ingest"]
