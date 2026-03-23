"""
Abone Router
- CSV import (CRM verisi)
- CRUD operasyonları
- Profil sorgulama
"""

import io
import csv
import re
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db, Subscriber

router = APIRouter()


def normalize_phone(phone: str) -> str:
    if not phone:
        return None
    phone = re.sub(r'\D', '', str(phone))
    if phone.startswith('90') and len(phone) == 12:
        return f"+{phone}"
    elif phone.startswith('0') and len(phone) == 11:
        return f"+9{phone}"
    elif len(phone) == 10:
        return f"+90{phone}"
    return f"+{phone}" if phone else None


@router.post("/import-csv")
async def import_subscribers_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    CRM abone listesini CSV'den içe aktar.
    
    Beklenen kolonlar (en az):
    abone_no, full_name, phone, district, village,
    package_name, package_speed, connection_type,
    mikrotik_user, mikrotik_ip, mikrotik_router, payment_amount
    """
    content = await file.read()
    
    for encoding in ['utf-8-sig', 'windows-1254', 'utf-8']:
        try:
            text = content.decode(encoding)
            break
        except:
            continue
    
    # Delimiter tespiti
    delimiter = ';' if ';' in text.split('\n')[0] else ','
    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    
    created = updated = errors = 0
    
    for row in reader:
        try:
            abone_no = str(row.get('abone_no', row.get('Abone No', ''))).strip()
            if not abone_no:
                continue
            
            # Mevcut abone var mı?
            existing = (await db.execute(
                select(Subscriber).where(Subscriber.abone_no == abone_no)
            )).scalar_one_or_none()
            
            phone_raw = row.get('phone', row.get('Telefon', ''))
            phone_norm = normalize_phone(phone_raw)
            
            data = {
                "abone_no": abone_no,
                "full_name": row.get('full_name', row.get('Ad Soyad', '')).strip(),
                "phone": phone_raw,
                "phone_normalized": phone_norm,
                "district": row.get('district', row.get('İlçe', '')).strip(),
                "village": row.get('village', row.get('Köy', '')).strip(),
                "package_name": row.get('package_name', row.get('Paket', '')).strip(),
                "package_speed": int(row.get('package_speed', row.get('Hız', 0)) or 0),
                "connection_type": row.get('connection_type', 'pppoe').strip().lower(),
                "mikrotik_user": row.get('mikrotik_user', row.get('PPPoE User', '')).strip() or None,
                "mikrotik_ip": row.get('mikrotik_ip', row.get('IP', '')).strip() or None,
                "mikrotik_router": row.get('mikrotik_router', row.get('Router IP', '')).strip() or None,
                "payment_amount": float(row.get('payment_amount', row.get('Aidat', 0)) or 0),
            }
            
            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
                updated += 1
            else:
                sub = Subscriber(**data)
                db.add(sub)
                created += 1
        
        except Exception as e:
            errors += 1
            continue
    
    await db.commit()
    return {"created": created, "updated": updated, "errors": errors}


@router.get("/")
async def list_subscribers(
    search: str = None,
    district: str = None,
    payment_status: str = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Abone listesi (filtreleme destekli)"""
    query = select(Subscriber)
    
    if search:
        query = query.where(or_(
            Subscriber.full_name.ilike(f"%{search}%"),
            Subscriber.abone_no.ilike(f"%{search}%"),
            Subscriber.phone.ilike(f"%{search}%")
        ))
    if district:
        query = query.where(Subscriber.district == district)
    if payment_status:
        query = query.where(Subscriber.payment_status == payment_status)
    
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    subscribers = result.scalars().all()
    
    return [sub.__dict__ for sub in subscribers]


@router.get("/{abone_no}")
async def get_subscriber(abone_no: str, db: AsyncSession = Depends(get_db)):
    sub = (await db.execute(
        select(Subscriber).where(Subscriber.abone_no == abone_no)
    )).scalar_one_or_none()
    
    if not sub:
        raise HTTPException(404, "Abone bulunamadı")
    return sub.__dict__


@router.patch("/{subscriber_id}/payment-status")
async def update_payment_status(
    subscriber_id: int,
    status: str,
    db: AsyncSession = Depends(get_db)
):
    """Manuel ödeme durumu güncelleme"""
    sub = await db.get(Subscriber, subscriber_id)
    if not sub:
        raise HTTPException(404, "Abone bulunamadı")
    
    sub.payment_status = status
    await db.commit()
    return {"ok": True}
