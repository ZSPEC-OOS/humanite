FROM python:3.12-slim-bookworm AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

FROM base AS development
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    python -m spacy download en_core_web_sm && \
    python -m nltk.downloader punkt punkt_tab stopwords && \
    python -c "\
from transformers import GPT2LMHeadModel, GPT2TokenizerFast; \
GPT2LMHeadModel.from_pretrained('gpt2'); \
GPT2TokenizerFast.from_pretrained('gpt2')" && \
    python -c "\
from transformers import AutoTokenizer, AutoModelForSequenceClassification; \
AutoTokenizer.from_pretrained('roberta-base'); \
AutoModelForSequenceClassification.from_pretrained('roberta-base')"
COPY . .
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8003", "--reload"]

FROM base AS production
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    python -m spacy download en_core_web_sm && \
    python -m nltk.downloader punkt punkt_tab stopwords && \
    python -c "\
from transformers import GPT2LMHeadModel, GPT2TokenizerFast; \
GPT2LMHeadModel.from_pretrained('gpt2'); \
GPT2TokenizerFast.from_pretrained('gpt2')"
COPY src/ ./src/
RUN useradd -m -u 1001 appuser && chown -R appuser /app
USER appuser
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8003", "--workers", "2"]
