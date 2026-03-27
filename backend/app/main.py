import time
import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import analyze
from app.db.database import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TestoReale API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api")


@app.on_event("startup")
async def startup_event() -> None:
    await init_db()
    try:
        import nltk
        nltk.data.find("tokenizers/punkt_tab")
    except LookupError:
        import nltk
        nltk.download("punkt_tab")
        nltk.download("averaged_perceptron_tagger_eng")
    logger.info("TestoReale backend started")


@app.get("/api/health")
async def health_check() -> dict:
    return {"status": "ok", "timestamp": int(time.time())}


@app.get("/api/stats")
async def stats(request: Request) -> dict:
    admin_secret = os.getenv("ADMIN_SECRET", "")
    provided = request.headers.get("X-Admin-Secret", "")
    if not admin_secret or provided != admin_secret:
        return JSONResponse(status_code=403, content={"error": "Forbidden"})

    from app.db.database import get_stats
    return await get_stats()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"},
    )
