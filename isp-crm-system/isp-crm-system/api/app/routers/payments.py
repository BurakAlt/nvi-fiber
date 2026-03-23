"""
Ödeme Router
- CSV import (İş Bankası formatı)
- Fuzzy matching engine
- Manuel onay kuyruğu
- Ödeme onaylandığında MikroTik'i aç
"""

import io
import csv
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional

from app.database import get_db, BankTransaction, Subscriber, MikrotikAction
from app.services.payment_matcher import find_match
from app.services.mikrotik_client import enable_subscriber

router = APIRouter()


# ── CSV Import ─────────────────────────────────────────────

@router.post("/import-csv")
async def import_bank_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    İş Bankası CSV'sini yükle ve fuzzy matching çalıştır.
    
    Beklenen CSV kolonları (İş Bankası formatı):
    Tarih, Açıklama, Borç, Alacak, Bakiye, Karşı Hesap Adı, Karşı Hesap No (IBAN), Referans No
    """
    content = await file.read()
    
    # Encoding tespiti (İş Bankası genelde Windows-1254 veya UTF-8-BOM)
    for encoding in ['utf-8-sig', 'windows-1254', 'utf-8', 'latin-1']:
        try:
            text = content.decode(encoding)
            break
        except:
            continue
    
    reader = csv.DictReader(io.StringIO(text), delimiter=';')
    
    imported = 0
    matched_auto = 0
    needs_review = 0
    errors = 0
    
    for row in reader:
        try:
            # Yalnızca alacak (gelen ödeme) kayıtları
            alacak_str = row.get('Alacak', row.get('Tutar', '0')).replace('.', '').replace(',', '.')
            alacak = float(alacak_str) if alacak_str else 0
            
            if alacak <= 0:
                continue
            
            # Tarih parse
            tarih_str = row.get('Tarih', row.get('İşlem Tarihi', ''))
            try:
                tarih = datetime.strptime(tarih_str.strip(), '%d.%m.%Y').date()
            except:
                tarih = datetime.today().date()
            
            tx = BankTransaction(
                transaction_date=tarih,
                sender_name=row.get('Karşı Hesap Adı', row.get('Gönderen', '')).strip(),
                sender_iban=row.get('Karşı Hesap No (IBAN)', row.get('IBAN', '')).strip(),
                amount=alacak,
                description=row.get('Açıklama', '').strip(),
                reference_no=row.get('Referans No', '').strip(),
            )
            
            # Fuzzy matching çalıştır
            match = await find_match(tx, db)
            
            tx.match_status = match.status
            tx.match_score = match.score
            tx.matched_subscriber_id = match.subscriber_id
            tx.match_reason = match.reason
            
            db.add(tx)
            await db.flush()
            
            # Otomatik eşleşti → hemen uygula
            if match.status == "auto_matched" and match.subscriber:
                await apply_payment(tx, match.subscriber, db, triggered_by="csv_auto")
                matched_auto += 1
            elif match.status == "manual_review":
                needs_review += 1
            
            imported += 1
        
        except Exception as e:
            errors += 1
            continue
    
    await db.commit()
    
    return {
        "imported": imported,
        "auto_matched": matched_auto,
        "needs_review": needs_review,
        "unmatched": imported - matched_auto - needs_review,
        "errors": errors
    }


# ── Manuel Onay Kuyruğu ────────────────────────────────────

@router.get("/pending-review")
async def get_pending_transactions(db: AsyncSession = Depends(get_db)):
    """Manuel onay bekleyen işlemleri listele"""
    result = await db.execute(
        select(BankTransaction)
        .where(BankTransaction.match_status.in_(["manual_review", "unmatched", "pending"]))
        .order_by(BankTransaction.transaction_date.desc())
    )
    transactions = result.scalars().all()
    
    return [
        {
            "id": tx.id,
            "date": str(tx.transaction_date),
            "sender_name": tx.sender_name,
            "amount": float(tx.amount),
            "description": tx.description,
            "match_status": tx.match_status,
            "match_score": float(tx.match_score) if tx.match_score else None,
            "matched_subscriber_id": tx.matched_subscriber_id,
            "match_reason": tx.match_reason,
            "subscriber": {
                "full_name": tx.subscriber.full_name,
                "abone_no": tx.subscriber.abone_no,
                "package_name": tx.subscriber.package_name
            } if tx.subscriber else None
        }
        for tx in transactions
    ]


@router.post("/{tx_id}/approve")
async def approve_transaction(
    tx_id: int,
    subscriber_id: int,
    reviewed_by: str = "admin",
    db: AsyncSession = Depends(get_db)
):
    """Manuel olarak işlemi onayla ve aboneyi aktifleştir"""
    tx = await db.get(BankTransaction, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="İşlem bulunamadı")
    
    subscriber = await db.get(Subscriber, subscriber_id)
    if not subscriber:
        raise HTTPException(status_code=404, detail="Abone bulunamadı")
    
    tx.matched_subscriber_id = subscriber_id
    tx.match_status = "confirmed"
    tx.reviewed_by = reviewed_by
    tx.reviewed_at = datetime.now()
    
    mikrotik_result = await apply_payment(tx, subscriber, db, triggered_by="admin_manual")
    
    await db.commit()
    
    return {
        "ok": True,
        "payment_applied": tx.payment_applied,
        "mikrotik": mikrotik_result
    }


@router.post("/{tx_id}/reject")
async def reject_transaction(
    tx_id: int,
    reviewed_by: str = "admin",
    db: AsyncSession = Depends(get_db)
):
    """İşlemi reddet (iade gerekebilir)"""
    tx = await db.get(BankTransaction, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="İşlem bulunamadı")
    
    tx.match_status = "rejected"
    tx.reviewed_by = reviewed_by
    tx.reviewed_at = datetime.now()
    
    await db.commit()
    return {"ok": True}


# ── Yardımcı: Ödeme Uygula ────────────────────────────────

async def apply_payment(
    tx: BankTransaction,
    subscriber: Subscriber,
    db: AsyncSession,
    triggered_by: str = "system"
) -> dict:
    """Ödemeyi aboneye uygula ve MikroTik'i aç"""
    
    # Abone ödeme durumunu güncelle
    subscriber.payment_status = "paid"
    subscriber.last_payment_date = tx.transaction_date
    subscriber.is_active = True
    
    # Fazla ödeme bakiyeye ekle
    expected = float(subscriber.payment_amount or 0)
    paid = float(tx.amount)
    if paid > expected:
        subscriber.balance = (float(subscriber.balance) or 0) + (paid - expected)
    
    tx.payment_applied = True
    tx.applied_at = datetime.now()
    
    # MikroTik'te aç
    mikrotik_result = await enable_subscriber(subscriber)
    
    # Log
    action_log = MikrotikAction(
        subscriber_id=subscriber.id,
        action="enable",
        router_ip=subscriber.mikrotik_router,
        target_user=subscriber.mikrotik_user or subscriber.mikrotik_ip,
        result="success" if mikrotik_result.success else "failed",
        error_msg=mikrotik_result.message if not mikrotik_result.success else None,
        triggered_by=triggered_by
    )
    db.add(action_log)
    
    return {
        "success": mikrotik_result.success,
        "message": mikrotik_result.message
    }
