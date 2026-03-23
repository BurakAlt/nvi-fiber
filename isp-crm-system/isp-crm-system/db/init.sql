-- ═══════════════════════════════════════════════════════════
-- Altıparmak Telekom — ISP CRM Veritabanı Şeması
-- ═══════════════════════════════════════════════════════════

-- Müşteri tablosu (CSV'den import edilir)
CREATE TABLE IF NOT EXISTS subscribers (
    id              SERIAL PRIMARY KEY,
    abone_no        VARCHAR(20) UNIQUE NOT NULL,      -- "01247"
    full_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),                       -- WhatsApp numarası
    phone_normalized VARCHAR(20),                      -- +90 formatında
    district        VARCHAR(50),                       -- İlçe
    village         VARCHAR(50),                       -- Köy/mahalle
    package_name    VARCHAR(50),                       -- "25Mbps", "50Mbps"
    package_speed   INTEGER,                           -- Mbps
    connection_type VARCHAR(10) DEFAULT 'pppoe',       -- 'pppoe' | 'static'
    mikrotik_user   VARCHAR(100),                      -- PPPoE username
    mikrotik_ip     VARCHAR(15),                       -- Static IP (varsa)
    mikrotik_router VARCHAR(50),                       -- Hangi router (ip)
    is_active       BOOLEAN DEFAULT true,
    payment_status  VARCHAR(20) DEFAULT 'unpaid',      -- 'paid' | 'unpaid' | 'partial'
    payment_amount  DECIMAL(10,2),                     -- Ödenmesi gereken
    balance         DECIMAL(10,2) DEFAULT 0,           -- Fazla ödeme bakiye
    last_payment_date DATE,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Banka ödemeleri (CSV parse sonucu)
CREATE TABLE IF NOT EXISTS bank_transactions (
    id              SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    sender_name     VARCHAR(200),                      -- Havale gönderen adı
    sender_iban     VARCHAR(34),
    amount          DECIMAL(10,2) NOT NULL,
    description     TEXT,                              -- Açıklama alanı
    reference_no    VARCHAR(100),
    
    -- Eşleştirme sonucu
    match_status    VARCHAR(20) DEFAULT 'pending',     -- 'auto_matched' | 'manual_review' | 'unmatched' | 'confirmed'
    match_score     DECIMAL(5,2),                      -- 0-100 fuzzy score
    matched_subscriber_id INTEGER REFERENCES subscribers(id),
    match_reason    TEXT,                              -- Neden eşleşti/eşleşmedi
    
    -- Manuel onay
    reviewed_by     VARCHAR(50),
    reviewed_at     TIMESTAMP,
    
    -- İşlem durumu
    payment_applied BOOLEAN DEFAULT false,
    applied_at      TIMESTAMP,
    
    created_at      TIMESTAMP DEFAULT NOW()
);

-- WhatsApp konuşmalar
CREATE TABLE IF NOT EXISTS conversations (
    id              SERIAL PRIMARY KEY,
    wa_chat_id      VARCHAR(50) NOT NULL,              -- "905551234567@c.us"
    phone_normalized VARCHAR(20),
    subscriber_id   INTEGER REFERENCES subscribers(id),
    
    -- Konuşma durumu
    status          VARCHAR(20) DEFAULT 'open',        -- 'open' | 'resolved' | 'escalated'
    intent          VARCHAR(50),                       -- 'payment_complaint' | 'speed_issue' | 'info' | 'other'
    
    -- AI context
    message_count   INTEGER DEFAULT 0,
    last_message_at TIMESTAMP,
    resolved_at     TIMESTAMP,
    
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Mesaj logları
CREATE TABLE IF NOT EXISTS messages (
    id              SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    direction       VARCHAR(10) NOT NULL,              -- 'inbound' | 'outbound'
    content         TEXT NOT NULL,
    wa_message_id   VARCHAR(100),
    sent_at         TIMESTAMP DEFAULT NOW()
);

-- MikroTik işlem logları
CREATE TABLE IF NOT EXISTS mikrotik_actions (
    id              SERIAL PRIMARY KEY,
    subscriber_id   INTEGER REFERENCES subscribers(id),
    action          VARCHAR(50) NOT NULL,              -- 'enable' | 'disable' | 'speed_change'
    router_ip       VARCHAR(15),
    target_user     VARCHAR(100),
    result          VARCHAR(20),                       -- 'success' | 'failed'
    error_msg       TEXT,
    triggered_by    VARCHAR(50),                       -- 'payment_auto' | 'admin' | 'whatsapp'
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Admin kullanıcılar
CREATE TABLE IF NOT EXISTS admin_users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50) UNIQUE NOT NULL,
    password_hash   VARCHAR(200) NOT NULL,
    role            VARCHAR(20) DEFAULT 'staff',       -- 'admin' | 'staff'
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── İndeksler ────────────────────────────────────────────
CREATE INDEX idx_subscribers_phone ON subscribers(phone_normalized);
CREATE INDEX idx_subscribers_abone ON subscribers(abone_no);
CREATE INDEX idx_bank_tx_status ON bank_transactions(match_status);
CREATE INDEX idx_bank_tx_date ON bank_transactions(transaction_date);
CREATE INDEX idx_conversations_phone ON conversations(phone_normalized);
CREATE INDEX idx_conversations_status ON conversations(status);

-- ─── Örnek Admin ──────────────────────────────────────────
-- Şifre: admin123 (bcrypt hash — üretimde değiştir!)
INSERT INTO admin_users (username, password_hash, role) VALUES 
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMlJbekRBhFXOeMsIHhKQKQqii', 'admin')
ON CONFLICT DO NOTHING;
