FROM python:3.12-slim-bookworm AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

FROM base AS development
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    python -m spacy download en_core_web_lg && \
    python -c "from transformers import pipeline; \
               pipeline('text-classification', model='facebook/bart-large-mnli')" && \
    python -c "from bert_score import score; \
               score(['warmup'], ['warmup'], lang='en', model_type='roberta-large', verbose=False)"
COPY . .
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"]

FROM base AS production
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    python -m spacy download en_core_web_lg && \
    python -c "from transformers import pipeline; \
               pipeline('text-classification', model='facebook/bart-large-mnli')" && \
    python -c "from bert_score import score; \
               score(['warmup'], ['warmup'], lang='en', model_type='roberta-large', verbose=False)"
COPY src/ ./src/
RUN useradd -m -u 1001 appuser && chown -R appuser /app
USER appuser
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8002", "--workers", "2"]
