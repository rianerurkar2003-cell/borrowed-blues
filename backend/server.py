"""FastAPI app entrypoint. Wires config, DB, routers, middleware, seed."""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from db import client, create_indexes
from routers import auth as auth_router
from routers import client as client_router
from routers import public as public_router
from routers import therapist as therapist_router
from seed import seed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-7s %(name)s :: %(message)s",
)
logger = logging.getLogger("borrowed_blues")

app = FastAPI(title="Borrowed Blues API", version="1.0.0")

# ---------- Middleware ----------
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Routers (all prefixed with /api) ----------
app.include_router(public_router.router,    prefix="/api")
app.include_router(auth_router.router,      prefix="/api")
app.include_router(therapist_router.router, prefix="/api")
app.include_router(client_router.router,    prefix="/api")


# ---------- Centralised exception handlers ----------
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ---------- Lifespan ----------
@app.on_event("startup")
async def on_startup():
    try:
        await create_indexes()
        await seed()
        logger.info("Startup complete: indexes ensured, seed complete.")
    except Exception as e:
        logger.exception(f"Startup failed: {e}")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
