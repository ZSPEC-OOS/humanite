from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .middleware.errors import global_error_handler
from .routers.humanize import router as humanize_router
from .routers.jobs import router as jobs_router
from .routers.scan import router as scan_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Orchestration service starting…")
    yield
    logger.info("Orchestration service shutting down.")


app = FastAPI(
    title="Humanite Orchestration",
    version="0.6.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(Exception, global_error_handler)

app.include_router(humanize_router)
app.include_router(scan_router)
app.include_router(jobs_router)


@app.get("/v1/health")
async def health():
    return {"status": "ok", "service": "orchestration", "version": "0.6.0"}
