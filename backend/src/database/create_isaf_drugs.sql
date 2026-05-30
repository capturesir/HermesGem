-- =============================================================================
-- ISAF 藥物資料庫建表腳本
-- 版本：v2.0
-- 日期：2026-05-31
-- 資料來源：澳門衛生局 ISAF 藥物資料（data/isaf_medicines.json）
-- 說明：建立藥物主資料表及關聯的活性成分、ATC 分類表
--       欄位名稱保留原有 medications 表（SPEC 1.11），未來可直接取代
-- 相容：SQLite 3.x
-- =============================================================================

-- 啟用外鍵約束
PRAGMA foreign_keys = ON;

-- =============================================================================
-- 1. isaf_drugs — 藥物主資料表
-- =============================================================================
-- 欄位名稱與原有 medications 表（SPEC 1.11）相容：
--   id, name, generic_name, dosage, route, frequency, created_at
-- 新增欄位：
--   name_pt, remarks, mednbr, form_*, classification_*, manufacturer_*, distributor_*

CREATE TABLE IF NOT EXISTS isaf_drugs (
    id                  VARCHAR(36) PRIMARY KEY,                       -- UUID 主鍵（與原表一致）
    mednbr              TEXT        NOT NULL,                          -- ISAF 藥物登記編號

    -- === 原有 medications 欄位（保留） ===
    name                VARCHAR(100) NOT NULL,                         -- 藥物名稱（中文）= ISAF product_name.zh
    generic_name        VARCHAR(100),                                  -- 學名（英文）= ISAF product_name.en
    dosage              VARCHAR(50),                                   -- 劑量（ISAF 缺失，保留供日後補充）
    route               VARCHAR(50),                                   -- 給藥途徑 = ISAF route_of_administration.zh
    frequency           VARCHAR(100),                                  -- 用法頻率（ISAF 缺失，保留供日後補充）

    -- === 新增欄位 ===
    name_pt             VARCHAR(100),                                  -- 藥物名稱（葡文）= ISAF product_name.pt
    remarks             TEXT,                                          -- 備註（服藥指引、禁忌、注意事項等）

    -- ISAF 劑型（三語）
    form_zh             TEXT,                                          -- 劑型（中文）
    form_pt             TEXT,                                          -- 劑型（葡文）
    form_en             TEXT,                                          -- 劑型（英文）

    -- ISAF 法律分類（三語）
    classification_zh   TEXT,                                          -- 法律分類（中文）
    classification_pt   TEXT,                                          -- 法律分類（葡文）
    classification_en   TEXT,                                          -- 法律分類（英文）

    -- ISAF 製造商（三語）
    manufacturer_zh     TEXT,                                          -- 製造商（中文）
    manufacturer_pt     TEXT,                                          -- 製造商（葡文）
    manufacturer_en     TEXT,                                          -- 製造商（英文）

    -- ISAF 經銷商（三語 + 代碼）
    distributor_code    TEXT,                                          -- 經銷商編號（如 FI0220）
    distributor_zh      TEXT,                                          -- 經銷商（中文）
    distributor_pt      TEXT,                                          -- 經銷商（葡文）
    distributor_en      TEXT,                                          -- 經銷商（英文）

    -- 系統欄位
    created_at          DATETIME    DEFAULT (datetime('now')),
    updated_at          DATETIME    DEFAULT (datetime('now')),

    CONSTRAINT uk_mednbr UNIQUE (mednbr)
);

-- 索引（與原有 medications 表相容）
CREATE INDEX IF NOT EXISTS idx_drug_name            ON isaf_drugs(name);
CREATE INDEX IF NOT EXISTS idx_drug_generic_name    ON ISaf_drugs(generic_name);
CREATE INDEX IF NOT EXISTS idx_drug_route           ON isaf_drugs(route);
CREATE INDEX IF NOT EXISTS idx_drug_classification  ON isaf_drugs(classification_zh);
CREATE INDEX IF NOT EXISTS idx_drug_form_zh         ON isaf_drugs(form_zh);
CREATE INDEX IF NOT EXISTS idx_drug_manufacturer_zh ON isaf_drugs(manufacturer_zh);

-- =============================================================================
-- 2. isaf_drug_ingredients — 活性成分表
-- =============================================================================
-- 一對多關係：每種藥物可含多種活性成分。
-- display_order 用於保持成分在原始資料中的排列順序。

CREATE TABLE IF NOT EXISTS isaf_drug_ingredients (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    drug_id         VARCHAR(36)     NOT NULL,
    name_zh         TEXT,                                            -- 活性成分名稱（中文）
    name_pt         TEXT,                                            -- 活性成分名稱（葡文）
    name_en         TEXT,                                            -- 活性成分名稱（英文）
    display_order   INTEGER         NOT NULL DEFAULT 0,

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
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    drug_id         VARCHAR(36)     NOT NULL,
    atc_code        TEXT,                                            -- ATC 代碼（如 R01B、B02B）
    name_zh         TEXT,                                            -- 分類名稱（中文）
    name_pt         TEXT,                                            -- 分類名稱（葡文）
    name_en         TEXT,                                            -- 分類名稱（英文）
    display_order   INTEGER         NOT NULL DEFAULT 0,

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
--
-- 欄位相容性：
--   原 medications 表所有欄位（id, name, generic_name, dosage, route, frequency, created_at）
--   均保留在 isaf_drugs 表中，API 端點可直接切換使用。
