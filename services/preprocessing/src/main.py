from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.preprocess import router as preprocess_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up spaCy models at startup — avoids first-request latency spike
    logger.info("Loading spaCy models…")
    from .pipeline.fact_locker import _NLP_LG  # noqa: F401
    from .pipeline.complexity import _NLP_SM   # noqa: F401
    logger.info("spaCy models loaded: en_core_web_lg, en_core_web_sm")
    yield


app = FastAPI(
    title="Humanite Preprocessing",
    version="0.3.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(preprocess_router)


@app.get("/v1/health")
async def health() -> dict:
    return {"status": "ok", "service": "preprocessing", "version": "0.3.0"}
