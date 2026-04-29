from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield  # startup/shutdown hooks go here in later phases


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
