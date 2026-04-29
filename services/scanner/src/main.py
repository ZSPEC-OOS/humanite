from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.scan import router as scan_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading scanner models…")
    from .detection.classifier import _load_model
    from .detection.perplexity import _model as _gpt2   # triggers load
    _load_model()
    logger.info("Scanner models ready.")
    yield


app = FastAPI(
    title="Humanite Scanner",
    version="0.5.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan_router)


@app.get("/v1/health")
async def health():
    from .detection.classifier import _model_available
    return {
        "status": "ok",
        "service": "scanner",
        "version": "0.5.0",
        "model_loaded": _model_available,
    }
