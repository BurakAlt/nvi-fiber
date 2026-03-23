"""
MikroTik RouterOS REST API Client
Karma yapı: PPPoE + Static IP desteği
"""

import os
import httpx
import asyncio
from typing import Optional
from dataclasses import dataclass


MIKROTIK_HOST = os.getenv("MIKROTIK_HOST", "192.168.1.1")
MIKROTIK_USER = os.getenv("MIKROTIK_USER", "admin")
MIKROTIK_PASS = os.getenv("MIKROTIK_PASS", "")


@dataclass
class ActionResult:
    success: bool
    message: str
    details: dict = None


class MikroTikClient:
    """RouterOS REST API v7+ client"""
    
    def __init__(self, host: str = None, user: str = None, password: str = None):
        self.host = host or MIKROTIK_HOST
        self.user = user or MIKROTIK_USER
        self.password = password or MIKROTIK_PASS
        self.base_url = f"https://{self.host}/rest"
        self.auth = (self.user, self.password)
    
    async def _request(self, method: str, path: str, data: dict = None) -> dict:
        async with httpx.AsyncClient(verify=False, timeout=10) as client:
            url = f"{self.base_url}{path}"
            response = await client.request(
                method, url,
                auth=self.auth,
                json=data
            )
            response.raise_for_status()
            return response.json() if response.content else {}
    
    # ── PPPoE İşlemleri ────────────────────────────────────
    
    async def get_pppoe_secret(self, username: str) -> Optional[dict]:
        """PPPoE secret bilgisini getir"""
        result = await self._request("GET", f"/ppp/secret?name={username}")
        return result[0] if result else None
    
    async def enable_pppoe(self, username: str) -> ActionResult:
        """PPPoE kullanıcısını aktifleştir"""
        try:
            secret = await self.get_pppoe_secret(username)
            if not secret:
                return ActionResult(False, f"PPPoE kullanıcısı bulunamadı: {username}")
            
            secret_id = secret[".id"]
            await self._request("PATCH", f"/ppp/secret/{secret_id}", {"disabled": "false"})
            
            # Aktif session'ı yoksa sorun yok, sonraki bağlantıda açılır
            return ActionResult(True, f"PPPoE aktifleştirildi: {username}", secret)
        
        except Exception as e:
            return ActionResult(False, f"PPPoE enable hatası: {str(e)}")
    
    async def disable_pppoe(self, username: str) -> ActionResult:
        """PPPoE kullanıcısını devre dışı bırak + aktif session'ı kes"""
        try:
            secret = await self.get_pppoe_secret(username)
            if not secret:
                return ActionResult(False, f"PPPoE kullanıcısı bulunamadı: {username}")
            
            secret_id = secret[".id"]
            await self._request("PATCH", f"/ppp/secret/{secret_id}", {"disabled": "true"})
            
            # Aktif session'ı kes
            await self.disconnect_active_session(username)
            
            return ActionResult(True, f"PPPoE devre dışı: {username}")
        
        except Exception as e:
            return ActionResult(False, f"PPPoE disable hatası: {str(e)}")
    
    async def disconnect_active_session(self, username: str) -> bool:
        """Aktif PPPoE oturumunu sonlandır"""
        try:
            sessions = await self._request("GET", f"/ppp/active?name={username}")
            for session in sessions:
                await self._request("POST", "/ppp/active/remove", {".id": session[".id"]})
            return True
        except:
            return False
    
    # ── Static IP İşlemleri ────────────────────────────────
    
    async def enable_static_ip(self, ip_address: str) -> ActionResult:
        """Static IP için firewall kuralını kaldır (bloğu aç)"""
        try:
            # Önce bu IP'yi engelleyen kural var mı bak
            rules = await self._request("GET", f"/ip/firewall/filter?src-address={ip_address}&comment~=ISP_BLOCK")
            
            for rule in rules:
                rule_id = rule[".id"]
                await self._request("PATCH", f"/ip/firewall/filter/{rule_id}", {"disabled": "true"})
            
            # Address-list'ten de çıkar (varsa)
            addr_list = await self._request("GET", f"/ip/firewall/address-list?address={ip_address}&list=blocked")
            for entry in addr_list:
                await self._request("DELETE", f"/ip/firewall/address-list/{entry['.id']}")
            
            return ActionResult(True, f"Static IP erişimi açıldı: {ip_address}")
        
        except Exception as e:
            return ActionResult(False, f"Static IP enable hatası: {str(e)}")
    
    async def disable_static_ip(self, ip_address: str) -> ActionResult:
        """Static IP'yi blocked listesine ekle"""
        try:
            await self._request("PUT", "/ip/firewall/address-list", {
                "list": "blocked",
                "address": ip_address,
                "comment": f"ISP_BLOCK_AUTO"
            })
            return ActionResult(True, f"Static IP engellendi: {ip_address}")
        
        except Exception as e:
            return ActionResult(False, f"Static IP disable hatası: {str(e)}")
    
    # ── Bant Genişliği Bilgisi ─────────────────────────────
    
    async def get_interface_stats(self) -> list[dict]:
        """Tüm interface istatistikleri"""
        return await self._request("GET", "/interface")
    
    async def get_active_sessions(self) -> list[dict]:
        """Aktif PPPoE oturumları"""
        return await self._request("GET", "/ppp/active")
    
    async def get_resource(self) -> dict:
        """Router CPU/RAM/uptime bilgisi"""
        return await self._request("GET", "/system/resource")


# ── Yardımcı fonksiyon: Abone tipine göre aç/kapat ────────

async def enable_subscriber(subscriber) -> ActionResult:
    """
    Aboneyi bağlantı tipine göre aktifleştir.
    PPPoE veya Static — otomatik karar verir.
    """
    client = MikroTikClient(host=subscriber.mikrotik_router)
    
    if subscriber.connection_type == "pppoe" and subscriber.mikrotik_user:
        return await client.enable_pppoe(subscriber.mikrotik_user)
    
    elif subscriber.connection_type == "static" and subscriber.mikrotik_ip:
        return await client.enable_static_ip(subscriber.mikrotik_ip)
    
    else:
        return ActionResult(
            False,
            f"Bağlantı bilgisi eksik: tip={subscriber.connection_type}, "
            f"user={subscriber.mikrotik_user}, ip={subscriber.mikrotik_ip}"
        )


async def disable_subscriber(subscriber) -> ActionResult:
    """Aboneyi bağlantı tipine göre devre dışı bırak"""
    client = MikroTikClient(host=subscriber.mikrotik_router)
    
    if subscriber.connection_type == "pppoe" and subscriber.mikrotik_user:
        return await client.disable_pppoe(subscriber.mikrotik_user)
    
    elif subscriber.connection_type == "static" and subscriber.mikrotik_ip:
        return await client.disable_static_ip(subscriber.mikrotik_ip)
    
    else:
        return ActionResult(False, "Bağlantı bilgisi eksik")
