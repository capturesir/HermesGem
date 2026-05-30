# ISAF 藥物資料庫表結構設計

> 版本：v2.0
> 日期：2026-05-31
> 作者：Hermes Agent
> 資料來源：澳門衛生局 ISAF 藥物資料（`data/isaf_medicines.json`）

---

## 1. 概述

本文件記錄醫療管理系統（EMR）中藥物資料表的設計方案。資料結構基於澳門衛生局 ISAF 系統的藥物登記資料，**保留原有 `medications` 表欄位名稱**，並擴展支援三語及完整藥物資訊。

### 1.1 設計原則

- **保留原有欄位名稱**：`name`、`generic_name`、`dosage`、`route`、`frequency` 保持不變
- **與 SPEC 1.11 對齊**：新表為 `medications` 表的超集，未來可直接取代
- **三語支援**：中文（name）、英文（generic_name）、葡文（name_pt）
- **正規化**：活性成分和 ATC 分類使用獨立子表
- **相容 SQLite**：不使用 MySQL 特有語法

### 1.2 原有 medications 表結構（SPEC 1.11）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | varchar(36) | UUID 主鍵 |
| name | varchar(100) | 藥物名稱 |
| generic_name | varchar(100) | 學名 |
| dosage | varchar(50) | 劑量 |
| route | varchar(50) | 給藥途徑 |
| frequency | varchar(100) | 用法頻率 |
| created_at | timestamp | 創建時間 |

### 1.3 資料來源結構（ISAF JSON）

```json
{
  "mednbr": "132118",
  "product_name": { "zh": "...", "pt": "...", "en": "..." },
  "pharmaceutical_form": { "zh": "...", "pt": "...", "en": "..." },
  "route_of_administration": { "zh": "...", "pt": "...", "en": "..." },
  "active_ingredients": [{ "zh": "...", "pt": "...", "en": "..." }],
  "legal_classification": { "zh": "...", "pt": "...", "en": "..." },
  "atc_classifications": [{ "zh": "...", "pt": "...", "en": "..." }],
  "manufacturer": { "zh": "...", "pt": "...", "en": "..." },
  "distributor": { "code": "...", "zh": "...", "pt": "...", "en": "..." }
}
```

### 1.4 欄位對應關係

| 原有欄位 | ISAF 來源 | 說明 |
|----------|-----------|------|
| `name` | `product_name.zh` | 藥物中文名稱 |
| `generic_name` | `product_name.en` | 藥物英文名稱（學名） |
| `name_pt` | `product_name.pt` | 藥物葡文名稱（**新增**） |
| `dosage` | — | 劑量（ISAF 缺失，保留供日後補充） |
| `route` | `route_of_administration.zh` | 給藥途徑 |
| `frequency` | — | 用法頻率（ISAF 缺失，保留供日後補充） |
| `remarks` | — | **新增**：備註（服藥指引、禁忌、注意事項） |

---

## 2. 表結構設計

### 2.1 ER 關係圖

```
┌─────────────────────────┐       ┌──────────────────────────┐
│    isaf_drugs            │       │  isaf_drug_ingredients    │
│─────────────────────────│       │──────────────────────────│
│ id (PK, UUID)           │──┐    │ id (PK)                  │
│ mednbr (UNIQUE)         │  ├───>│ drug_id (FK)             │
│ name (= product_name_zh)│  │    │ name_zh                  │
│ generic_name (= en)     │  │    │ name_pt                  │
│ name_pt (新增)           │  │    │ name_en                  │
│ dosage (保留)            │  │    │ display_order            │
│ route (← route_zh)      │  │    └──────────────────────────┘
│ frequency (保留)         │  │
│ remarks (新增)           │  │    ┌──────────────────────────┐
│ form_zh/pt/en           │  │    │  isaf_drug_atc_codes     │
│ classification_zh/pt/en │  │    │──────────────────────────│
│ manufacturer_zh/pt/en   │  │    │ id (PK)                  │
│ distributor_code/zh/... │  └───>│ drug_id (FK)             │
│ created_at              │       │ atc_code                 │
│ updated_at              │       │ name_zh/pt/en            │
└─────────────────────────┘       │ display_order            │
                                  └──────────────────────────┘
```

### 2.2 `isaf_drugs` 主表

藥物基本資料，每筆藥物對應一行。**欄位名稱與原有 `medications` 表相容**。

| 欄位 | 類型 | 必填 | 說明 | 對應原欄位 |
|------|------|:----:|------|:----------:|
| `id` | VARCHAR(36) | ✓ | UUID 主鍵 | ✓ |
| `mednbr` | TEXT | ✓ | ISAF 藥物登記編號（唯一） | — |
| **`name`** | VARCHAR(100) | ✓ | 藥物名稱（中文）= ISAF `product_name.zh` | ✓ |
| **`generic_name`** | VARCHAR(100) | | 學名（英文）= ISAF `product_name.en` | ✓ |
| **`name_pt`** | VARCHAR(100) | | 藥物名稱（葡文）= ISAF `product_name.pt` | **新增** |
| **`dosage`** | VARCHAR(50) | | 劑量（ISAF 缺失，保留供日後補充） | ✓ |
| **`route`** | VARCHAR(50) | | 給藥途徑（中文）= ISAF `route_of_administration.zh` | ✓ |
| **`frequency`** | VARCHAR(100) | | 用法頻率（ISAF 缺失，保留供日後補充） | ✓ |
| **`remarks`** | TEXT | | 備註（服藥指引、禁忌、注意事項等） | **新增** |
| `form_zh` | TEXT | | 劑型（中文） | — |
| `form_pt` | TEXT | | 劑型（葡文） | — |
| `form_en` | TEXT | | 劑型（英文） | — |
| `classification_zh` | TEXT | | 法律分類（中文） | — |
| `classification_pt` | TEXT | | 法律分類（葡文） | — |
| `classification_en` | TEXT | | 法律分類（英文） | — |
| `manufacturer_zh` | TEXT | | 製造商（中文） | — |
| `manufacturer_pt` | TEXT | | 製造商（葡文） | — |
| `manufacturer_en` | TEXT | | 製造商（英文） | — |
| `distributor_code` | TEXT | | 經銷商編號 | — |
| `distributor_zh` | TEXT | | 經銷商（中文） | — |
| `distributor_pt` | TEXT | | 經銷商（葡文） | — |
| `distributor_en` | TEXT | | 經銷商（英文） | — |
| `created_at` | DATETIME | | 建立時間 | ✓ |
| `updated_at` | DATETIME | | 更新時間 | — |

**索引**：
- `uk_mednbr` — `mednbr` 唯一索引
- `idx_drug_name` — `name`（中文名搜尋）
- `idx_drug_generic_name` — `generic_name`（英文名搜尋）
- `idx_drug_route` — `route`（給藥途徑篩選）
- `idx_drug_classification` — `classification_zh`（法律分類篩選）

### 2.3 `isaf_drug_ingredients` 活性成分表

每種藥物可含多種活性成分（一對多關係）。

| 欄位 | 類型 | 必填 | 說明 |
|------|------|:----:|------|
| `id` | INTEGER | ✓ | 自增主鍵 |
| `drug_id` | VARCHAR(36) | ✓ | 外鍵 → `isaf_drugs.id` |
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
| `drug_id` | VARCHAR(36) | ✓ | 外鍵 → `isaf_drugs.id` |
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

### 3.1 欄位相容性

新表 `isaf_drugs` 是原有 `medications` 表的**超集**：

| 原 medications 欄位 | isaf_drugs 對應 | 備註 |
|---------------------|-----------------|------|
| `id` | `id` | 同為 VARCHAR(36) UUID |
| `name` | `name` | 保留原名稱 |
| `generic_name` | `generic_name` | 保留原名稱 |
| `dosage` | `dosage` | 保留（ISAF 缺失，日後補充） |
| `route` | `route` | 保留原名稱 |
| `frequency` | `frequency` | 保留（ISAF 缺失，日後補充） |
| `created_at` | `created_at` | 保留 |

### 3.2 API 端點相容

現有 API 端點可直接指向新表：

- `GET /api/lookup/medications` — 查詢 `isaf_drugs`（返回 `name`, `generic_name` 等）
- `GET /api/lookup/medications/search?q=` — 搜尋 `name`、`generic_name`

### 3.3 未來取代計畫

1. 確認新表結構無誤後，將 `isaf_drugs` 改名為 `medications`（或保留原名並更新 API 指向）
2. 將舊 `medications` 表的 204 筆 seed 資料遷移至新表
3. 更新 `prescription_medications` 表的外鍵引用

---

## 4. 法律分類對照

| 代碼 | 中文 | 葡文 | 英文 |
|------|------|------|------|
| PMO | 處方藥物 | Medicamento sujeito a receita médica | Prescription Medicine Only |
| OTC | 非處方藥物 | Medicamento não sujeito a receita médica | Over-the-Counter |
| UH | 只供醫院使用之藥物 | Uso Hospitalar | Hospital Use Only |

---

## 5. SQL 腳本

完整的建表 SQL 請參考：`backend/src/database/create_isaf_drugs.sql`

執行方式：
```bash
sqlite3 database/emr.db < backend/src/database/create_isaf_drugs.sql
```

---

## 6. 注意事項

1. **欄位名稱保留**：`name`、`generic_name`、`dosage`、`route`、`frequency` 與 SPEC 1.11 一致
2. **新增欄位**：`name_pt`（葡文名）、`remarks`（備註）
3. **三語支援**：劑型、分類、製造商、經銷商均提供 zh/pt/en
4. **多值欄位正規化**：活性成分和 ATC 分類使用獨立子表
5. **級聯刪除**：刪除藥物時自動清除關聯記錄
