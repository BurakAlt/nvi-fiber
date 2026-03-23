"""
Admin Router — Dashboard API
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta

from app.database import get_db, Subscriber, BankTransaction, Conversation, MikrotikAction
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("/dashboard")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Ana dashboard istatistikleri"""

    # Toplam abone
    total_subs = (await db.execute(func.count(Subscriber.id))).scalar()

    # Aktif abone
    active_subs = (await db.execute(
        select(func.count(Subscriber.id)).where(Subscriber.is_active == True)
    )).scalar()

    # Ödeme bekleyen
    unpaid = (await db.execute(
        select(func.count(Subscriber.id)).where(Subscriber.payment_status == "unpaid")
    )).scalar()

    # Manuel onay bekleyen işlem
    pending_payments = (await db.execute(
        select(func.count(BankTransaction.id)).where(
            BankTransaction.match_status.in_(["manual_review", "unmatched"])
        )
    )).scalar()

    # Açık WhatsApp konuşmaları
    open_conversations = (await db.execute(
        select(func.count(Conversation.id)).where(Conversation.status == "open")
    )).scalar()

    # Son 30 gün MikroTik işlemleri
    thirty_days_ago = datetime.now() - timedelta(days=30)
    mikrotik_actions = (await db.execute(
        select(func.count(MikrotikAction.id)).where(
            MikrotikAction.created_at >= thirty_days_ago
        )
    )).scalar()

    return {
        "total_subscribers": total_subs,
        "active_subscribers": active_subs,
        "unpaid_subscribers": unpaid,
        "pending_payment_reviews": pending_payments,
        "open_whatsapp_conversations": open_conversations,
        "mikrotik_actions_30d": mikrotik_actions
    }


@router.get("/conversations")
async def list_conversations(
    status: str = "open",
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """WhatsApp konuşma listesi"""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.status == status)
        .order_by(Conversation.last_message_at.desc())
        .limit(limit)
    )
    convs = result.scalars().all()
    return [
        {
            "id": c.id,
            "phone": c.phone_normalized,
            "subscriber_id": c.subscriber_id,
            "status": c.status,
            "intent": c.intent,
            "message_count": c.message_count,
            "last_message_at": str(c.last_message_at)
        }
        for c in convs
    ]


@router.post("/conversations/{conv_id}/resolve")
async def resolve_conversation(
    conv_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    conv = await db.get(Conversation, conv_id)
    if conv:
        conv.status = "resolved"
        conv.resolved_at = datetime.now()
        await db.commit()
    return {"ok": True}


@router.get("/mikrotik-log")
async def mikrotik_log(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = await db.execute(
        select(MikrotikAction)
        .order_by(MikrotikAction.created_at.desc())
        .limit(limit)
    )
    actions = result.scalars().all()
    return [
        {
            "id": a.id,
            "subscriber_id": a.subscriber_id,
            "action": a.action,
            "router_ip": a.router_ip,
            "target": a.target_user,
            "result": a.result,
            "triggered_by": a.triggered_by,
            "created_at": str(a.created_at)
        }
        for a in actions
    ]
