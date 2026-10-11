
from time import perf_counter

from aws_lambda_powertools import Logger
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router

logger = Logger(service="jalloop-ai")

app = FastAPI(
    title="JalLoop Analysis Service",
    description=(
        "Deterministic hydrology calculations and optional "
        "Strands Agents explanations. Does not write to the main database."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8080",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        logger.exception({
            "event": "http_request_failed",
            "method": request.method,
            "path": request.url.path,
        })
        raise

    duration_ms = round((perf_counter() - start_time) * 1000, 2)

    logger.info({
        "event": "http_request_completed",
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "duration_ms": duration_ms,
    })

    return response


app.include_router(router)


@app.get("/health")
def health():
    return {
        "status": "UP",
        "service": "jalloop-ai",
        "writesDatabase": False,
    }
