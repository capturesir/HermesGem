-- =============================================================================
-- ISAF 藥物資料庫建表腳本
-- 版本：v1.0
-- 日期：2026-05-31
-- 資料來源：澳門衛生局 ISAF 藥物資料（data/isaf_medicines.json）
-- 說明：建立藥物主資料表及關聯的活性成分、ATC 分類表
-- 相容：SQLite 3.x
-- =============================================================================

-- 啟用外鍵約束
PRAGMA foreign_keys = ON;

-- =============================================================================
-- 1. isaf_drugs — 藥物主資料表
-- =============================================================================
-- 每筆藥物登記記錄對應一行，包含三語名稱、劑型、給藥途徑、
-- 法律分類、製造商及經銷商資訊。

CREATE TABLE IF NOT EXISTS isaf_drugs (
    id                  INTEGER     PRIMARY KEY AUTOINCREMENT,
    mednbr              TEXT        NOT NULL,                        -- ISAF 藥物登記編號

    -- 產品名稱（三語）
    product_name_zh     TEXT,                                        -- 中文
    product_name_pt     TEXT,                                        -- 葡文
    product_name_en     TEXT,                                        -- 英文

    -- 劑型（三語）
    form_zh             TEXT,                                        -- 中文（如：膠囊、片劑、注射劑）
    form_pt             TEXT,                                        -- 葡文
    form_en             TEXT,                                        -- 英文

    -- 給藥途徑（三語）
    route_zh            TEXT,                                        -- 中文（如：口服、外用、靜脈內）
    route_pt            TEXT,                                        -- 葡文
    route_en            TEXT,                                        -- 英文

    -- 法律分類（三語）
    classification_zh   TEXT,                                        -- 中文（處方藥物/非處方藥物/只供醫院使用）
    classification_pt   TEXT,                                        -- 葡文
    classification_en   TEXT,                                        -- 英文

    -- 製造商（三語）
    manufacturer_zh     TEXT,                                        -- 中文
    manufacturer_pt     TEXT,                                        -- 葡文
    manufacturer_en     TEXT,                                        -- 英文

    -- 經銷商（三語 + 代碼）
    distributor_code    TEXT,                                        -- 經銷商編號（如 FI0220）
    distributor_zh      TEXT,                                        -- 中文
    distributor_pt      TEXT,                                        -- 葡文
    distributor_en      TEXT,                                        -- 英文

    -- 系統欄位
    created_at          DATETIME    DEFAULT (datetime('now')),
    updated_at          DATETIME    DEFAULT (datetime('now')),

    CONSTRAINT uk_mednbr UNIQUE (mednbr)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_drug_product_name_zh ON isaf_drugs(product_name_zh);
CREATE INDEX IF NOT EXISTS idx_drug_product_name_en ON isaf_drugs(product_name_en);
CREATE INDEX IF NOT EXISTS idx_drug_manufacturer_zh ON isaf_drugs(manufacturer_zh);
CREATE INDEX IF NOT EXISTS idx_drug_classification  ON isaf_drugs(classification_zh);
CREATE INDEX IF NOT EXISTS idx_drug_form_zh         ON isaf_drugs(form_zh);
CREATE INDEX IF NOT EXISTS idx_drug_route_zh        ON isaf_drugs(route_zh);

-- =============================================================================
-- 2. isaf_drug_ingredients — 活性成分表
-- =============================================================================
-- 一對多關係：每種藥物可含多種活性成分。
-- display_order 用於保持成分在原始資料中的排列順序。

CREATE TABLE IF NOT EXISTS isaf_drug_ingredients (
    id              INTEGER     PRIMARY KEY AUTOINCREMENT,
    drug_id         INTEGER     NOT NULL,
    name_zh         TEXT,                                            -- 活性成分名稱（中文）
    name_pt         TEXT,                                            -- 活性成分名稱（葡文）
    name_en         TEXT,                                            -- 活性成分名稱（英文）
    display_order   INTEGER     NOT NULL DEFAULT 0,

    CONSTRAINT fk_ingredient_drug
        FOREIGN KEY (drug_id) REFERENCES isaf_drugs(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_ingredient_drug     ON isaf_drug_ingredients(drug_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_name_zh  ON isaf_drug_ingredients(name_zh);
CREATE INDEX IF NOT EXISTS idx_ingredient_name_en  ON isaf_drug_ingredients(name_en);

-- =============================================================================
-- 3. isaf_drug_atc_codes — ATC 分類表
-- =============================================================================
-- 一對多關係：每種藥物可對應多個 ATC 分類代碼。
-- atc_code 存儲分類代碼（如 R01B），完整名稱存於 name_* 欄位。

CREATE TABLE IF NOT EXISTS isaf_drug_atc_codes (
    id              INTEGER     PRIMARY KEY AUTOINCREMENT,
    drug_id         INTEGER     NOT NULL,
    atc_code        TEXT,                                            -- ATC 代碼（如 R01B、B02B）
    name_zh         TEXT,                                            -- 分類名稱（中文）
    name_pt         TEXT,                                            -- 分類名稱（葡文）
    name_en         TEXT,                                            -- 分類名稱（英文）
    display_order   INTEGER     NOT NULL DEFAULT 0,

    CONSTRAINT fk_atc_drug
        FOREIGN KEY (drug_id) REFERENCES isaf_drugs(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_atc_drug    ON isaf_drug_atc_codes(drug_id);
CREATE INDEX IF NOT EXISTS idx_atc_code    ON isaf_drug_atc_codes(atc_code);
CREATE INDEX IF NOT EXISTS idx_atc_name_zh ON isaf_drug_atc_codes(name_zh);

-- =============================================================================
-- 完成提示
-- =============================================================================
-- 表建立完成。可使用以下語句驗證：
--   SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'isaf_%';
--
-- 預計資料量：
--   isaf_drugs:             ~9,089 筆
--   isaf_drug_ingredients:  ~13,600 筆（平均 1.5 筆/藥物）
--   isaf_drug_atc_codes:    ~10,000 筆（平均 1.1 筆/藥物）
