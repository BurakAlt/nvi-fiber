"""
WhatsApp Webhook + Claude AI Yanıt Motoru
WAHA → FastAPI → Claude API → WAHA (yanıt gönder)
"""

import os
import httpx
from fastapi import APIRouter, Request, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db, Subscriber, Conversation, Message
from app.services.mikrotik_client import enable_subscriber


router = APIRouter()

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
WAHA_URL = os.getenv("WAHA_URL", "http://waha:3000")
WAHA_SESSION = os.getenv("WAHA_SESSION", "default")


# ── WAHA Webhook Endpoint ──────────────────────────────────

@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """WAHA'dan gelen mesajları işle"""
    payload = await request.json()
    
    # Sadece gelen mesajları işle
    if payload.get("event") != "message":
        return {"ok": True}
    
    msg_data = payload.get("payload", {})
    
    # Grup mesajlarını atla
    if msg_data.get("from", "").endswith("@g.us"):
        return {"ok": True}
    
    chat_id = msg_data.get("from")              # "905551234567@c.us"
    message_body = msg_data.get("body", "")
    wa_message_id = msg_data.get("id")
    
    if not chat_id or not message_body:
        return {"ok": True}
    
    # Telefon numarasını normalize et
    phone = chat_id.replace("@c.us", "").replace("@s.whatsapp.net", "")
    phone_normalized = normalize_phone(phone)
    
    # Arka planda işle (webhook hızlıca dönmeli)
    background_tasks.add_task(
        process_message,
        chat_id=chat_id,
        phone_normalized=phone_normalized,
        message_body=message_body,
        wa_message_id=wa_message_id
    )
    
    return {"ok": True}


def normalize_phone(phone: str) -> str:
    """Telefon numarasını +90 formatına getir"""
    phone = re.sub(r'\D', '', phone)
    if phone.startswith('90') and len(phone) == 12:
        return f"+{phone}"
    elif phone.startswith('0') and len(phone) == 11:
        return f"+9{phone}"
    elif len(phone) == 10:
        return f"+90{phone}"
    return f"+{phone}"


import re
from datetime import datetime


async def process_message(
    chat_id: str,
    phone_normalized: str,
    message_body: str,
    wa_message_id: str
):
    """
    Mesaj işleme ana akışı:
    1. Aboneyi bul
    2. Konuşma oluştur/devam ettir
    3. Claude ile yanıt üret
    4. Gerekirse MikroTik aksiyonu al
    5. WhatsApp'a yanıt gönder
    """
    from app.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        # ── Abone Ara ──────────────────────────────────────
        result = await db.execute(
            select(Subscriber).where(Subscriber.phone_normalized == phone_normalized)
        )
        subscriber = result.scalar_one_or_none()
        
        # ── Konuşma Bul veya Oluştur ───────────────────────
        conv_result = await db.execute(
            select(Conversation).where(
                Conversation.wa_chat_id == chat_id,
                Conversation.status == "open"
            ).order_by(Conversation.created_at.desc()).limit(1)
        )
        conversation = conv_result.scalar_one_or_none()
        
        if not conversation:
            conversation = Conversation(
                wa_chat_id=chat_id,
                phone_normalized=phone_normalized,
                subscriber_id=subscriber.id if subscriber else None,
                status="open",
                last_message_at=datetime.now()
            )
            db.add(conversation)
            await db.flush()
        
        # Mesajı kaydet
        msg = Message(
            conversation_id=conversation.id,
            direction="inbound",
            content=message_body,
            wa_message_id=wa_message_id
        )
        db.add(msg)
        conversation.message_count += 1
        conversation.last_message_at = datetime.now()
        
        # ── Son mesajları getir (context için) ─────────────
        recent_msgs = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.sent_at.desc())
            .limit(10)
        )
        history = list(reversed(recent_msgs.scalars().all()))
        
        # ── Claude ile Yanıt Üret ──────────────────────────
        reply, action = await generate_ai_response(
            subscriber=subscriber,
            message=message_body,
            history=history
        )
        
        # ── MikroTik Aksiyonu ──────────────────────────────
        if action == "enable_connection" and subscriber:
            if subscriber.payment_status == "paid":
                result = await enable_subscriber(subscriber)
                if result.success:
                    reply += "\n\n✅ Hattınız aktifleştirildi. Bağlantınızı kontrol edebilirsiniz."
                    subscriber.is_active = True
                else:
                    reply += f"\n\n⚠️ Teknik bir sorun oluştu. Ekibimiz bilgilendirildi."
            else:
                reply += "\n\n⚠️ Ödemeniz sisteme yansımamış. Ödeme yaptıysanız lütfen dekont paylaşın."
        
        # Yanıtı kaydet
        out_msg = Message(
            conversation_id=conversation.id,
            direction="outbound",
            content=reply
        )
        db.add(out_msg)
        await db.commit()
        
        # ── WhatsApp'a Gönder ──────────────────────────────
        await send_whatsapp_message(chat_id, reply)


async def generate_ai_response(
    subscriber,
    message: str,
    history: list
) -> tuple[str, str | None]:
    """
    Claude API ile bağlam-duyarlı yanıt üret.
    Returns: (yanıt_metni, aksiyon | None)
    Aksiyonlar: 'enable_connection', 'escalate', None
    """
    
    # Abone bilgisi hazırla
    if subscriber:
        subscriber_context = f"""
ABONE BİLGİSİ:
- İsim: {subscriber.full_name}
- Abone No: {subscriber.abone_no}
- Paket: {subscriber.package_name} ({subscriber.package_speed} Mbps)
- Bağlantı: {subscriber.connection_type.upper()}
- Ödeme Durumu: {"ÖDENDİ ✅" if subscriber.payment_status == 'paid' else "ÖDENMEDİ ❌"}
- Hat Durumu: {"AKTİF" if subscriber.is_active else "KAPALI"}
- İlçe: {subscriber.district} / {subscriber.village}
"""
    else:
        subscriber_context = "ABONE BİLGİSİ: Bu numara sistemde kayıtlı değil."
    
    # Konuşma geçmişi
    history_text = ""
    for msg in history[-6:]:  # Son 6 mesaj
        prefix = "Müşteri" if msg.direction == "inbound" else "Destek"
        history_text += f"{prefix}: {msg.content}\n"
    
    system_prompt = f"""Sen Altıparmak Telekom'un müşteri destek asistanısın. Çankırı'da yerel bir internet servis sağlayıcısısın.

{subscriber_context}

KURALLARIN:
1. Kısa, net, samimi yanıt ver. Resmi değil ama profesyonel ol.
2. Türkçe yaz. Emoji kullanabilirsin ama az.
3. Müşterinin problemini anlayıp çözmeye çalış.
4. Eğer hat açma talebi varsa VE ödeme yapılmışsa, yanıtının EN SONUNA tam olarak şunu ekle: [ACTION:enable_connection]
5. Eğer konuyu çözemezsen: [ACTION:escalate]
6. Ödeme sorunlarında: dekontu WhatsApp'tan iletmelerini iste.
7. Teknik sorunlarda: router'ı kapatıp açmayı, kabloları kontrol etmeyi öner.

ÖNEMLİ: Sadece abone varsa hat açabilirsin. Kayıtsız numara ise yardım et ama hat işlemi yapma."""

    messages_payload = [{"role": "user", "content": f"Konuşma geçmişi:\n{history_text}\n\nYeni mesaj: {message}"}]
    
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": CLAUDE_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 500,
                "system": system_prompt,
                "messages": messages_payload
            }
        )
        data = response.json()
    
    reply_text = data["content"][0]["text"]
    
    # Aksiyonu çıkar
    action = None
    if "[ACTION:enable_connection]" in reply_text:
        action = "enable_connection"
        reply_text = reply_text.replace("[ACTION:enable_connection]", "").strip()
    elif "[ACTION:escalate]" in reply_text:
        action = "escalate"
        reply_text = reply_text.replace("[ACTION:escalate]", "").strip()
    
    return reply_text, action


async def send_whatsapp_message(chat_id: str, text: str):
    """WAHA üzerinden WhatsApp mesajı gönder"""
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(
            f"{WAHA_URL}/api/sendText",
            json={
                "session": WAHA_SESSION,
                "chatId": chat_id,
                "text": text
            }
        )
