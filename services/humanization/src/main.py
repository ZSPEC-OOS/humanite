from contextlib import asynccontextmanager
import logging
import os
import sys

sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(__file__), "../..")))
from shared.logging_config import configure_logging
from shared.tracing import configure_tracing

configure_logging(service_name="humanization")
configure_tracing(service_name="humanization")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.humanize import router as humanize_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Warming up quality gate models…")
    # Force-import to trigger model loads at startup, not first request
    from .gates.bertscore_gate import THRESHOLD as _bs_thresh
    from .gates.nli_gate import THRESHOLD as _nli_thresh
    from .gates.entity_gate import THRESHOLD as _ent_thresh
    logger.info(
        "Models ready. Thresholds: BERTScore=%.2f NLI=%.2f Entity=%.2f",
        _bs_thresh, _nli_thresh, _ent_thresh,
    )
    yield


app = FastAPI(
    title="Humanite Humanization Engine",
    version="0.4.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(humanize_router)


@app.get("/v1/health")
async def health():
    return {"status": "ok", "service": "humanization", "version": "0.4.0"}
