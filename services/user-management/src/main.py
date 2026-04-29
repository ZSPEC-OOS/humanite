from contextlib import asynccontextmanager
import logging
import os
import sys

sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(__file__), "../..")))
from shared.logging_config import configure_logging
from shared.tracing import configure_tracing

configure_logging(service_name="user-management")
configure_tracing(service_name="user-management")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.auth import router as auth_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("User management service starting…")
    yield
    logger.info("User management service shutting down.")


app = FastAPI(title="Humanite User Management", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/v1/health")
async def health() -> dict:
    return {"status": "ok", "service": "user-management", "version": "0.2.0"}
