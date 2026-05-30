# ISAF 藥物資料庫表結構設計

> 版本：v1.0
> 日期：2026-05-31
> 作者：Hermes Agent
> 資料來源：澳門衛生局 ISAF 藥物資料（`data/isaf_medicines.json`）

---

## 1. 概述

本文件記錄醫療管理系統（EMR）中藥物資料表的設計方案。資料結構基於澳門衛生局 ISAF 系統的藥物登記資料，包含藥品基本資訊、活性成分、ATC 分類等。

### 1.1 設計目標

- 完整保存 ISAF 系統的藥物登記資料
- 支援中（zh）、葡（pt）、英（en）三語
- 正規化處理多值欄位（活性成分、ATC 分類）
- 相容 SQLite 資料庫引擎
- 便於藥物搜尋及處方引用

### 1.2 資料來源結構（JSON）

```json
{
  "mednbr": "132118",
  "product_name": { "zh": "...", "pt": "...", "en": "..." },
  "pharmaceutical_form": { "zh": "...", "pt": "...", "en": "..." },
  "route_of_administration": { "zh": "...", "pt": "...", "en": "..." },
  "active_ingredients": [
    { "zh": "...", "pt": "...", "en": "..." }
  ],
  "legal_classification": { "zh": "...", "pt": "...", "en": "..." },
  "atc_classifications": [
    { "zh": "...", "pt": "...", "en": "..." }
  ],
  "manufacturer": { "zh": "...", "pt": "...", "en": "..." },
  "distributor": { "code": "...", "zh": "...", "pt": "...", "en": "..." }
}
```

---

## 2. 表結構設計

### 2.1 ER 關係圖

```
┌─────────────────────┐       ┌──────────────────────────┐
│    isaf_drugs        │       │  isaf_drug_ingredients    │
│─────────────────────│       │──────────────────────────│
│ id (PK)             │──┐    │ id (PK)                  │
│ mednbr (UNIQUE)     │  ├───>│ drug_id (FK)             │
│ product_name_zh     │  │    │ name_zh                  │
│ product_name_pt     │  │    │ name_pt                  │
│ product_name_en     │  │    │ name_en                  │
│ form_zh             │  │    │ display_order            │
│ form_pt             │  │    └──────────────────────────┘
│ form_en             │  │
│ route_zh            │  │    ┌──────────────────────────┐
│ route_pt            │  │    │  isaf_drug_atc_codes     │
│ route_en            │  └───>│──────────────────────────│
│ classification_zh   │       │ id (PK)                  │
│ classification_pt   │       │ drug_id (FK)             │
│ classification_en   │       │ atc_code                 │
│ manufacturer_zh     │       │ name_zh                  │
│ manufacturer_pt     │       │ name_pt                  │
│ manufacturer_en     │       │ name_en                  │
│ distributor_code    │       │ display_order            │
│ distributor_zh      │       └──────────────────────────┘
│ distributor_pt      │
│ distributor_en      │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

### 2.2 `isaf_drugs` 主表

藥物基本資料，每筆藥物對應一行。

| 欄位 | 類型 | 必填 | 說明 |
|------|------|:----:|------|
| `id` | INTEGER | ✓ | 自增主鍵 |
| `mednbr` | TEXT | ✓ | ISAF 藥物登記編號（唯一） |
| `product_name_zh` | TEXT | | 產品名稱（中文） |
| `product_name_pt` | TEXT | | 產品名稱（葡文） |
| `product_name_en` | TEXT | | 產品名稱（英文） |
| `form_zh` | TEXT | | 劑型（中文） |
| `form_pt` | TEXT | | 劑型（葡文） |
| `form_en` | TEXT | | 劑型（英文） |
| `route_zh` | TEXT | | 給藥途徑（中文） |
| `route_pt` | TEXT | | 給藥途徑（葡文） |
| `route_en` | TEXT | | 給藥途徑（英文） |
| `classification_zh` | TEXT | | 法律分類（中文） |
| `classification_pt` | TEXT | | 法律分類（葡文） |
| `classification_en` | TEXT | | 法律分類（英文） |
| `manufacturer_zh` | TEXT | | 製造商（中文） |
| `manufacturer_pt` | TEXT | | 製造商（葡文） |
| `manufacturer_en` | TEXT | | 製造商（英文） |
| `distributor_code` | TEXT | | 經銷商編號 |
| `distributor_zh` | TEXT | | 經銷商（中文） |
| `distributor_pt` | TEXT | | 經銷商（葡文） |
| `distributor_en` | TEXT | | 經銷商（英文） |
| `created_at` | DATETIME | | 建立時間 |
| `updated_at` | DATETIME | | 更新時間 |

**索引**：
- `uk_mednbr` — `mednbr` 唯一索引
- `idx_product_name_zh` — 中文產品名搜尋
- `idx_product_name_en` — 英文產品名搜尋
- `idx_manufacturer_zh` — 按製造商查詢
- `idx_classification_zh` — 按法律分類篩選

### 2.3 `isaf_drug_ingredients` 活性成分表

每種藥物可含多種活性成分（一對多關係）。

| 欄位 | 類型 | 必填 | 說明 |
|------|------|:----:|------|
| `id` | INTEGER | ✓ | 自增主鍵 |
| `drug_id` | INTEGER | ✓ | 外鍵 → `isaf_drugs.id` |
| `name_zh` | TEXT | | 活性成分名稱（中文） |
| `name_pt` | TEXT | | 活性成分名稱（葡文） |
| `name_en` | TEXT | | 活性成分名稱（英文） |
| `display_order` | INTEGER | ✓ | 顯示順序（預設 0） |

**索引**：
- `idx_ingredient_drug` — `drug_id`
- `idx_ingredient_name_zh` — 中文成分名搜尋

### 2.4 `isaf_drug_atc_codes` ATC 分類表

每種藥物可對應多個 ATC 分類代碼（一對多關係）。

| 欄位 | 類型 | 必填 | 說明 |
|------|------|:----:|------|
| `id` | INTEGER | ✓ | 自增主鍵 |
| `drug_id` | INTEGER | ✓ | 外鍵 → `isaf_drugs.id` |
| `atc_code` | TEXT | | ATC 代碼（如 R01B） |
| `name_zh` | TEXT | | 分類名稱（中文） |
| `name_pt` | TEXT | | 分類名稱（葡文） |
| `name_en` | TEXT | | 分類名稱（英文） |
| `display_order` | INTEGER | ✓ | 顯示順序（預設 0） |

**索引**：
- `idx_atc_drug` — `drug_id`
- `idx_atc_code` — `atc_code` 搜尋

---

## 3. 與現有系統的關係

### 3.1 現有 `medications` 表

現有 `medications` 表（見 `backend/src/database/init.sql` 第 217-226 行）結構過於簡單，且存在 SQL 語法問題（缺少 `CREATE TABLE IF NOT EXISTS`）。新設計的 `isaf_drugs` 系列表為獨立的藥物主資料表，與處方系統的 `prescription_medications` 表互補：

| 表 | 用途 |
|----|------|
| `isaf_drugs` | 藥物主資料（ISAF 完整資訊） |
| `isaf_drug_ingredients` | 活性成分（一對多） |
| `isaf_drug_atc_codes` | ATC 分類（一對多） |
| `medications` | 簡化藥物列表（處方引用用） |
| `prescription_medications` | 處方明細（個別處方中的藥物） |

### 3.2 未來整合建議

- 處方可引用 `isaf_drugs.mednbr` 作為藥物參考
- 搜尋功能可同時查詢 `isaf_drugs`（完整資料）和 `medications`（快速列表）
- 匯入 ISAF 資料後，可考慮淘汰舊的 `medications` 表

---

## 4. 法律分類對照

| 代碼 | 中文 | 葡文 | 英文 |
|------|------|------|------|
| PMO | 處方藥物 | Medicamento sujeito a receita médica | Prescription Medicine Only |
| OTC | 非處方藥物 | Medicamento não sujeito a receita médica | Over-the-Counter |
| UH | 只供醫院使用之藥物 | Uso Hospitalar | Hospital Use Only |

---

## 5. ATC 分類系統說明

ATC（Anatomical Therapeutic Chemical）代碼結構：

```
第 1 級：解剖學主分類（字母）    → R (呼吸系統)
第 2 級：治療學亞分類（2位數字）  → R01 (鼻用製劑)
第 3 級：藥理學亞分類（字母）     → R01B (全身用抗鼻充血藥)
第 4 級：化學亞分類（字母）       → R01BA
第 5 級：化學物質（2位數字）      → R01BA52
```

ISAF 資料中通常記錄到第 3 級（如 `R01B`）。

---

## 6. 資料統計

根據 `data/isaf_medicines.json`（約 9,089 筆藥物記錄）：

| 統計項目 | 數值 |
|----------|------|
| 總藥物數 | ~9,089 |
| 成功爬取 | ~7,278（成功率 80%） |
| 含中文名 | ~95% |
| 含英文名 | ~98% |
| 含葡文名 | ~15% |
| 平均活性成分數 | ~1.5 |
| 平均 ATC 分類數 | ~1.1 |

---

## 7. SQL 腳本

完整的建表 SQL 請參考：`backend/src/database/create_isaf_drugs.sql`

執行方式：
```bash
cd backend
sqlite3 database/emr.db < src/database/create_isaf_drugs.sql
```

---

## 8. 注意事項

1. **SQLite 相容性**：不使用 MySQL 特有語法（ENUM、AUTO_INCREMENT 等）
2. **三語支援**：所有名稱欄位均提供 zh/pt/en 三語版本
3. **多值欄位正規化**：活性成分和 ATC 分類使用獨立子表
4. **級聯刪除**：刪除藥物時自動清除關聯的成分和分類記錄
5. **時區**：`created_at` 和 `updated_at` 使用 UTC 時間
