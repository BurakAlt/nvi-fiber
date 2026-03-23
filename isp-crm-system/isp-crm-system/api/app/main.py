"""
Altıparmak Telekom — ISP CRM Backend
FastAPI Ana Uygulama
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import init_db
from app.routers import whatsapp, subscribers, payments, mikrotik, admin, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Altıparmak ISP CRM",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Router'ları bağla ────────────────────────────────────
app.include_router(auth.router,        prefix="/auth",        tags=["Auth"])
app.include_router(whatsapp.router,    prefix="/webhook",     tags=["WhatsApp"])
app.include_router(subscribers.router, prefix="/subscribers", tags=["Subscribers"])
app.include_router(payments.router,    prefix="/payments",    tags=["Payments"])
app.include_router(mikrotik.router,    prefix="/mikrotik",    tags=["MikroTik"])
app.include_router(admin.router,       prefix="/admin",       tags=["Admin"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Altıparmak ISP CRM"}
