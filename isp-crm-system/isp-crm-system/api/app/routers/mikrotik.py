"""
MikroTik Router — Manuel hat açma/kapama endpoint'leri
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db, Subscriber, MikrotikAction
from app.services.mikrotik_client import enable_subscriber, disable_subscriber, MikroTikClient
from app.routers.auth import get_current_user
from datetime import datetime

router = APIRouter()


@router.post("/{subscriber_id}/enable")
async def enable(
    subscriber_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Aboneyi manuel olarak aktifleştir"""
    sub = await db.get(Subscriber, subscriber_id)
    if not sub:
        raise HTTPException(404, "Abone bulunamadı")

    result = await enable_subscriber(sub)

    log = MikrotikAction(
        subscriber_id=sub.id,
        action="enable",
        router_ip=sub.mikrotik_router,
        target_user=sub.mikrotik_user or sub.mikrotik_ip,
        result="success" if result.success else "failed",
        error_msg=result.message if not result.success else None,
        triggered_by=f"admin:{current_user.username}"
    )
    db.add(log)

    if result.success:
        sub.is_active = True

    await db.commit()
    return {"success": result.success, "message": result.message}


@router.post("/{subscriber_id}/disable")
async def disable(
    subscriber_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Aboneyi manuel olarak devre dışı bırak"""
    sub = await db.get(Subscriber, subscriber_id)
    if not sub:
        raise HTTPException(404, "Abone bulunamadı")

    result = await disable_subscriber(sub)

    log = MikrotikAction(
        subscriber_id=sub.id,
        action="disable",
        router_ip=sub.mikrotik_router,
        target_user=sub.mikrotik_user or sub.mikrotik_ip,
        result="success" if result.success else "failed",
        error_msg=result.message if not result.success else None,
        triggered_by=f"admin:{current_user.username}"
    )
    db.add(log)

    if result.success:
        sub.is_active = False

    await db.commit()
    return {"success": result.success, "message": result.message}


@router.get("/active-sessions")
async def active_sessions(
    router_ip: str = None,
    current_user=Depends(get_current_user)
):
    """Aktif PPPoE oturumları"""
    import os
    host = router_ip or os.getenv("MIKROTIK_HOST")
    client = MikroTikClient(host=host)
    sessions = await client.get_active_sessions()
    return sessions


@router.get("/router-stats")
async def router_stats(
    router_ip: str = None,
    current_user=Depends(get_current_user)
):
    """Router CPU/RAM/uptime"""
    import os
    host = router_ip or os.getenv("MIKROTIK_HOST")
    client = MikroTikClient(host=host)
    resource = await client.get_resource()
    interfaces = await client.get_interface_stats()
    return {"resource": resource, "interfaces": interfaces}
