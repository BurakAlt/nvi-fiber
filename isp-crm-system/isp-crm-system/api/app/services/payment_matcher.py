"""
Banka Havalesi Fuzzy Matching Engine
─────────────────────────────────────
Problem: Müşteriler yanlış/eksik isim veya abone no yazıyor.
Çözüm: Çok katmanlı eşleştirme + AI destekli belirsiz case'ler.
"""

import re
import unicodedata
from difflib import SequenceMatcher
from typing import Optional
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import Subscriber, BankTransaction


@dataclass
class MatchResult:
    subscriber_id: Optional[int]
    subscriber: Optional[Subscriber]
    score: float               # 0-100
    method: str                # Nasıl eşleşti
    reason: str                # Açıklama
    status: str                # 'auto_matched' | 'manual_review' | 'unmatched'


def normalize_text(text: str) -> str:
    """Türkçe karakterleri normalize et, küçük harf, boşluk temizle"""
    if not text:
        return ""
    # Türkçe → ASCII
    replacements = {
        'ı': 'i', 'İ': 'i', 'ğ': 'g', 'Ğ': 'g',
        'ü': 'u', 'Ü': 'u', 'ş': 's', 'Ş': 's',
        'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c'
    }
    for tr, en in replacements.items():
        text = text.replace(tr, en)
    
    # Küçük harf, özel karakter temizle
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def extract_abone_no(text: str) -> Optional[str]:
    """Açıklama veya isimden abone no çıkar"""
    if not text:
        return None
    
    # Patterns: "1247", "01247", "abone:1247", "no:1247", "#1247"
    patterns = [
        r'\babone\s*[:#]?\s*(\d{3,6})\b',
        r'\bno\s*[:#]?\s*(\d{3,6})\b',
        r'#(\d{3,6})\b',
        r'\b0?(\d{4,5})\b',  # 4-5 haneli sayı
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).lstrip('0') or '0'  # Öndeki sıfırları kaldır
    
    return None


def name_similarity(name1: str, name2: str) -> float:
    """İki isim arasındaki benzerlik skoru (0-100)"""
    n1 = normalize_text(name1)
    n2 = normalize_text(name2)
    
    if not n1 or not n2:
        return 0.0
    
    # Tam eşleşme
    if n1 == n2:
        return 100.0
    
    # SequenceMatcher
    ratio = SequenceMatcher(None, n1, n2).ratio()
    
    # Token (kelime) bazlı kontrol — sıra farklı olabilir
    tokens1 = set(n1.split())
    tokens2 = set(n2.split())
    
    if tokens1 and tokens2:
        common = tokens1.intersection(tokens2)
        token_score = len(common) / max(len(tokens1), len(tokens2))
        # İkisinin ortalaması
        ratio = (ratio + token_score) / 2
    
    return round(ratio * 100, 2)


async def find_match(
    tx: BankTransaction,
    db: AsyncSession
) -> MatchResult:
    """
    Tek bir banka işlemi için en iyi abone eşleşmesini bul.
    
    Öncelik sırası:
    1. Abone no tam eşleşme (açıklama veya isimde)
    2. IBAN eşleşme (daha önce aynı IBAN'dan ödeme yapıldıysa)
    3. İsim fuzzy match (>= 85 skor → otomatik)
    4. İsim fuzzy match (60-84 → manuel review)
    5. Eşleşme yok
    """
    
    all_subscribers = (await db.execute(select(Subscriber))).scalars().all()
    
    # ── Adım 1: Abone No Kontrolü ──────────────────────────
    search_text = f"{tx.sender_name or ''} {tx.description or ''}"
    extracted_no = extract_abone_no(search_text)
    
    if extracted_no:
        for sub in all_subscribers:
            sub_no = sub.abone_no.lstrip('0')
            if extracted_no == sub_no:
                return MatchResult(
                    subscriber_id=sub.id,
                    subscriber=sub,
                    score=100.0,
                    method="abone_no",
                    reason=f"Abone no eşleşti: {extracted_no}",
                    status="auto_matched"
                )
    
    # ── Adım 2: IBAN Kontrolü ──────────────────────────────
    if tx.sender_iban:
        prev_tx = await db.execute(
            select(BankTransaction)
            .where(
                BankTransaction.sender_iban == tx.sender_iban,
                BankTransaction.matched_subscriber_id.isnot(None),
                BankTransaction.payment_applied == True
            )
            .order_by(BankTransaction.transaction_date.desc())
            .limit(1)
        )
        prev = prev_tx.scalar_one_or_none()
        if prev and prev.matched_subscriber_id:
            sub = await db.get(Subscriber, prev.matched_subscriber_id)
            if sub:
                return MatchResult(
                    subscriber_id=sub.id,
                    subscriber=sub,
                    score=95.0,
                    method="iban",
                    reason=f"Aynı IBAN'dan daha önce ödeme alındı: {sub.full_name}",
                    status="auto_matched"
                )
    
    # ── Adım 3 & 4: İsim Fuzzy Match ──────────────────────
    if not tx.sender_name:
        return MatchResult(
            subscriber_id=None, subscriber=None,
            score=0, method="none",
            reason="Gönderen adı yok, eşleştirilemedi",
            status="unmatched"
        )
    
    best_score = 0.0
    best_sub = None
    
    for sub in all_subscribers:
        score = name_similarity(tx.sender_name, sub.full_name)
        if score > best_score:
            best_score = score
            best_sub = sub
    
    if best_score >= 85 and best_sub:
        return MatchResult(
            subscriber_id=best_sub.id,
            subscriber=best_sub,
            score=best_score,
            method="fuzzy_name",
            reason=f"İsim benzerliği %{best_score:.0f}: '{tx.sender_name}' → '{best_sub.full_name}'",
            status="auto_matched"
        )
    
    elif best_score >= 60 and best_sub:
        return MatchResult(
            subscriber_id=best_sub.id,
            subscriber=best_sub,
            score=best_score,
            method="fuzzy_name_low",
            reason=f"Düşük benzerlik %{best_score:.0f}: '{tx.sender_name}' → '{best_sub.full_name}' — MANUEL ONAY GEREKLİ",
            status="manual_review"
        )
    
    return MatchResult(
        subscriber_id=None, subscriber=None,
        score=best_score,
        method="none",
        reason=f"Eşleşme bulunamadı. En yakın: '{best_sub.full_name if best_sub else '-'}' (%{best_score:.0f})",
        status="unmatched"
    )
