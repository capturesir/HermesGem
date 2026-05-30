-- =============================================================================
-- 藥物資料庫建表腳本
-- 版本：v4.0
-- 日期：2026-05-31
-- 資料來源：澳門衛生局 ISAF 藥物資料（data/isaf_medicines.json）
-- 說明：建立藥物主資料表及關聯的活性成分、ATC 分類表
--       表名沿用 medications（與 SPEC 1.11 一致），可直接取代舊表
-- 相容：SQLite 3.x
-- =============================================================================

-- 啟用外鍵約束
PRAGMA foreign_keys = ON;

-- =============================================================================
-- 1. medications — 藥物主資料表
-- =============================================================================
-- 表名及欄位名稱與原有 medications 表（SPEC 1.11）相容：
--   id, name, generic_name, dosage, route, frequency, created_at
-- 新增欄位：
--   name_pt, route_en, route_pt, remarks
--   mednbr, form_*, classification_*, manufacturer_*, distributor_*

CREATE TABLE IF NOT EXISTS medications (
    id                  VARCHAR(36) PRIMARY KEY,                       -- UUID 主鍵（與原表一致）
    mednbr              TEXT        NOT NULL,                          -- ISAF 藥物登記編號

    -- === 原有 medications 欄位（保留） ===
    name                VARCHAR(100) NOT NULL,                         -- 藥物名稱（中文）= ISAF product_name.zh
    generic_name        VARCHAR(100),                                  -- 學名（英文）= ISAF product_name.en
    dosage              VARCHAR(50),                                   -- 劑量（ISAF 缺失，保留供日後補充）
    route               VARCHAR(50),                                   -- 給藥途徑（中文）= ISAF route_of_administration.zh
    frequency           VARCHAR(100),                                  -- 用法頻率（ISAF 缺失，保留供日後補充）

    -- === 新增欄位 ===
    name_pt             VARCHAR(100),                                  -- 藥物名稱（葡文）= ISAF product_name.pt
    route_en            VARCHAR(50),                                   -- 給藥途徑（英文）= ISAF route_of_administration.en
    route_pt            VARCHAR(50),                                   -- 給藥途徑（葡文）= ISAF route_of_administration.pt
    remarks             TEXT,                                          -- 備註（服藥指引、禁忌、注意事項等）

    -- ISAF 劑型（三語）
    form_zh             TEXT,                                          -- 劑型（中文）
    form_pt             TEXT,                                          -- 劑型（葡文）
    form_en             TEXT,                                          -- 劑型（英文）

    -- ISAF 法定分類（三語）
    classification_zh   TEXT,                                          -- 法定分類（中文）
    classification_en   TEXT,                                          -- 法定分類（英文）
    classification_pt   TEXT,                                          -- 法定分類（葡文）

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

-- 索引（搜尋欄位以英文為主）
CREATE INDEX IF NOT EXISTS idx_med_name               ON medications(name);
CREATE INDEX IF NOT EXISTS idx_med_generic_name       ON medications(generic_name);
CREATE INDEX IF NOT EXISTS idx_med_route_en           ON medications(route_en);
CREATE INDEX IF NOT EXISTS idx_med_classification_en  ON medications(classification_en);

-- =============================================================================
-- 2. medication_ingredients — 活性成分表
-- =============================================================================
-- 一對多關係：每種藥物可含多種活性成分。
-- display_order 用於保持成分在原始資料中的排列順序。

CREATE TABLE IF NOT EXISTS medication_ingredients (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    medication_id   VARCHAR(36)     NOT NULL,
    name_zh         TEXT,                                            -- 活性成分名稱（中文）
    name_pt         TEXT,                                            -- 活性成分名稱（葡文）
    name_en         TEXT,                                            -- 活性成分名稱（英文）
    display_order   INTEGER         NOT NULL DEFAULT 0,

    CONSTRAINT fk_ingredient_med
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
);

-- 索引（以英文成分名搜尋）
CREATE INDEX IF NOT EXISTS idx_ingredient_med      ON medication_ingredients(medication_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_name_en  ON medication_ingredients(name_en);

-- =============================================================================
-- 3. medication_atc_codes — ATC 分類表
-- =============================================================================
-- 一對多關係：每種藥物可對應多個 ATC 分類代碼。
-- atc_code 存儲分類代碼（如 R01B），完整名稱存於 name_* 欄位。

CREATE TABLE IF NOT EXISTS medication_atc_codes (
    id              INTEGER         PRIMARY KEY AUTOINCREMENT,
    medication_id   VARCHAR(36)     NOT NULL,
    atc_code        TEXT,                                            -- ATC 代碼（如 R01B、B02B）
    name_zh         TEXT,                                            -- 分類名稱（中文）
    name_pt         TEXT,                                            -- 分類名稱（葡文）
    name_en         TEXT,                                            -- 分類名稱（英文）
    display_order   INTEGER         NOT NULL DEFAULT 0,

    CONSTRAINT fk_atc_med
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_atc_med     ON medication_atc_codes(medication_id);
CREATE INDEX IF NOT EXISTS idx_atc_code    ON medication_atc_codes(atc_code);

-- =============================================================================
-- 完成提示
-- =============================================================================
-- 表建立完成。可使用以下語句驗證：
--   SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'medication%';
--
-- 預計資料量（匯入 ISAF 資料後，數量視爬取結果而定）：
--   medications:              ~7,000+ 筆
--   medication_ingredients:   ~10,000+ 筆
--   medication_atc_codes:     ~8,000+ 筆
--
-- 欄位相容性：
--   原 medications 表所有欄位（id, name, generic_name, dosage, route, frequency, created_at）
--   均保留在本表中，API 端點無需修改即可使用。
--
-- 定期更新流程：
--   1. 執行 ISAF 爬蟲取得最新藥物資料
--   2. DELETE FROM medications（子表因外鍵級聯自動清除）
--   3. 執行 import_isaf_to_db.py 重新匯入
--   4. 驗證匯入結果
