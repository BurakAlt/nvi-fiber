"""
Veritabanı bağlantısı ve SQLAlchemy modelleri
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, Numeric, Date, DateTime, Text, ForeignKey, func
from datetime import datetime
from typing import Optional


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://ispuser:password@postgres/ispcrm")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


# ─── Modeller ─────────────────────────────────────────────

class Subscriber(Base):
    __tablename__ = "subscribers"

    id: Mapped[int] = mapped_column(primary_key=True)
    abone_no: Mapped[str] = mapped_column(String(20), unique=True)
    full_name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    phone_normalized: Mapped[Optional[str]] = mapped_column(String(20))
    district: Mapped[Optional[str]] = mapped_column(String(50))
    village: Mapped[Optional[str]] = mapped_column(String(50))
    package_name: Mapped[Optional[str]] = mapped_column(String(50))
    package_speed: Mapped[Optional[int]] = mapped_column(Integer)
    connection_type: Mapped[str] = mapped_column(String(10), default="pppoe")
    mikrotik_user: Mapped[Optional[str]] = mapped_column(String(100))
    mikrotik_ip: Mapped[Optional[str]] = mapped_column(String(15))
    mikrotik_router: Mapped[Optional[str]] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    payment_status: Mapped[str] = mapped_column(String(20), default="unpaid")
    payment_amount: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    balance: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    last_payment_date: Mapped[Optional[datetime]] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())


class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    transaction_date: Mapped[datetime] = mapped_column(Date)
    sender_name: Mapped[Optional[str]] = mapped_column(String(200))
    sender_iban: Mapped[Optional[str]] = mapped_column(String(34))
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    description: Mapped[Optional[str]] = mapped_column(Text)
    reference_no: Mapped[Optional[str]] = mapped_column(String(100))
    match_status: Mapped[str] = mapped_column(String(20), default="pending")
    match_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 2))
    matched_subscriber_id: Mapped[Optional[int]] = mapped_column(ForeignKey("subscribers.id"))
    match_reason: Mapped[Optional[str]] = mapped_column(Text)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(50))
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    payment_applied: Mapped[bool] = mapped_column(Boolean, default=False)
    applied_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    subscriber: Mapped[Optional["Subscriber"]] = relationship("Subscriber", foreign_keys=[matched_subscriber_id])


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    wa_chat_id: Mapped[str] = mapped_column(String(50))
    phone_normalized: Mapped[Optional[str]] = mapped_column(String(20))
    subscriber_id: Mapped[Optional[int]] = mapped_column(ForeignKey("subscribers.id"))
    status: Mapped[str] = mapped_column(String(20), default="open")
    intent: Mapped[Optional[str]] = mapped_column(String(50))
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    subscriber: Mapped[Optional["Subscriber"]] = relationship("Subscriber")
    messages: Mapped[list["Message"]] = relationship("Message", back_populates="conversation")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"))
    direction: Mapped[str] = mapped_column(String(10))
    content: Mapped[str] = mapped_column(Text)
    wa_message_id: Mapped[Optional[str]] = mapped_column(String(100))
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")


class MikrotikAction(Base):
    __tablename__ = "mikrotik_actions"

    id: Mapped[int] = mapped_column(primary_key=True)
    subscriber_id: Mapped[Optional[int]] = mapped_column(ForeignKey("subscribers.id"))
    action: Mapped[str] = mapped_column(String(50))
    router_ip: Mapped[Optional[str]] = mapped_column(String(15))
    target_user: Mapped[Optional[str]] = mapped_column(String(100))
    result: Mapped[Optional[str]] = mapped_column(String(20))
    error_msg: Mapped[Optional[str]] = mapped_column(Text)
    triggered_by: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())


# ─── DB Session dependency ────────────────────────────────

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
