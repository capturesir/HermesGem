---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 30450221009ef1268986dc196e0d14bba822eaf57a0d6fff692a99d2a99020e24f5ba8404f02206a8222843c19ffcce55dfec2bb8d7af80754e2db90be8d5d05f42268ac66daa6
    ReservedCode2: 30450221009fbe463b70a1df461f272f55059fe7b67da07b1d845d0fb736742d78aace190f0220785f8a70157b424e47018176782aa5006a09d267c4a7f36017b6d7223f154ae0
---

## 0. 開發狀態 (Development Status)

| 項目 | 狀態 |
|------|------|
| 初始化版本 | ✅ 完成 (commit `1b6cee2`) |
| 資料初始化修復 | ✅ 完成 (commit `fcc03a6`) |
| 預約狀態修正 | ✅ 完成 (commit `a7afe78`) |
| SPEC.md 色彩修正 | ✅ 完成 (commit `9faabfb`) |
| SPEC.md Schema 修正 | ✅ 完成 (commit `164ad1b`) |
| SPEC.md ORM/DB 修正 | ✅ 完成 (commit `ae0ace7`) |
| 前端構建 (chunk size) | ⚠️ 1432 KB JS，需代碼分割 |
| TypeScript | ✅ 無錯誤 |
| 後端服務 | ✅ 運行中 (port 3000) |
| 前端服務 | ✅ 運行中 (port 5176) |

**上次檢查**: 2026-04-09 06:08 (Asia/Macau)
**Git HEAD**: `2c82602` — feat: add created_by and created_by_name columns to patients table

---

## 0.1 待解決問題 (Known Issues)

| 優先 | ID | 模組 | 問題描述 | 備註 |
|------|----|------|---------|------|
| P0 | K01 | ~~前端保安~~ | ~~Doctor 可刪除任意病人，需修正後端權限或前端限制~~ → 已解決：後端 requirePermission 攔截 + 前端 admin 可見刪除鈕 | 高優先 |
| P0 | K02 | 後端效能 | slow_query_log 未開啟，大量查詢無優化；建議建立必要索引 | 高優先 |
| P1 | K03 | 前端日誌 | 日誌頁面及功能不完整 | 中優先 |
| P1 | K04 | 前端效能 | 前端過度請求問題，懶加載未全面實施 | 中優先 |
| P1 | K05 | 病人就診 | PatientDetail 未顯示同一病人前一次 SOAP 就診記錄 | 中優先 |
| P1 | K06 | 前端審核 | 刪改操作未完整記錄操作人員身份 | 中優先 |
| P1 | K07 | 前端效能 | 全部模組一口氣請求，影響首頁載入速度 | 中優先 |
| P2 | K08 | 身份驗證 | 只支援帳號密碼登入，無雙重驗證（2FA）| 低優先 |

## 0.2 已完成問題 (Resolved Issues)

| ID | 模組 | 問題描述 | 修復 commit |
|----|------|---------|------------|
| R01 | Appointments | ~~後端 `DELETE /appointments/:id` API 不存在~~ 已修復 | `744e2b1` |
| R02 | Appointments | ~~刪除按鈕對 completed/cancelled 可見~~ 已修復 | `ed5fa19` |
| R03 | 文件上傳 | ~~上傳路由回應 400~~ 已修復 multer 配置 | `b1dbcc0` |
| R04 | RBAC | ~~醫生刪除病人返回 403~~ 已修復（前端限制 admin 可見）| `a2efcf3` |
| R05 | 前端效能 | ~~首次載入過慢~~ 部分代碼分割已實施 | `7f57f85` |
| R06 | Appointments | ~~就診狀態更新覆蓋問題~~ 已修復 | `c5fe82f` |
| R07 | 前端保安 | ~~Doctor 可刪除任意病人~~ 後端 requirePermission 拦截（doctor.delete=false）+ 前端 admin 可見刪除鈕 | `a2efcf3` + constants.js |

## 13. 待開發功能 (Future Development Roadmap)

> 優先次序：P0 = 立即　P1 = 短期　P2 = 中期

### 優先次序總表

| 優先 | 編號 | 事項 | 說明 |
|------|------|------|------|
| P0 | 13.13 | 新增/修改病人頁面配合新25欄結構 | 前端表單急需對應，病人就診功能起點 |
| P0 | 13.23 | 重要資料表統一審計欄位（資料庫層面）| 核心資料表（patients、appointments、soap_notes、prescriptions、documents 等）逐一加入 `created_by` / `created_by_name` / `created_at` / `updated_by` / `updated_by_name` / `updated_at` 欄位；由 ORM 中介軟體自動填充（不需業務代碼手動填寫）；確保操作可追溯至具體人員；每個資料表需獨立 migration；暂不修改代碼，留待未來逐一處理 |
| P1 | 13.3 | 文件上傳 | 化驗報告、影像上傳及病人文件庫 |
| P1 | 13.4 | 批量輸入預約（Excel）| 大量排班需求 |
| P2 | 13.11 | 外部系統數據互聯 | API 對接澳門衛生局 |
| P1 | 13.14 | 重新審視藥物資料表結構（ISAF 9,122筆）| ISAF 爬蟲數據閒置 |
| P1 | 13.15 | 完善的角色權限資料庫結構（RBAC）| 無法細粒度控制醫生刪除病人的問題 |
| P1 | 13.16 | SOAP 超時後不能修改 | 完成診症後鎖定記錄，不可編輯 |
| P1 | 13.17 | 診症時建立覆診預約 | 完成診症前可直接新增覆診 |
| P1 | 13.18 | 覆診跟進（醫生專屬）| 醫生建立覆診計劃，追蹤下次就診 |
| P2 | 13.19 | 文件輸出（模板系統）| 轉介專科、驗單、醫療記錄、建議書、報告書、返港 |

| P1 | 13.20 | 支援多語言介面 | 中文/英文/葡文三語界面，切換靈活 |
| P1 | 13.20 | 支援多語言介面 | 中文/英文/葡文三語界面，切換靈活 |
| P1 | 13.21 | 支援系統多顏色主題 | 多套主題切換，支援深色模式 |
| P1 | 13.22 | 審計日誌自動化（Prisma $extends / TypeORM Subscriber）| 利用 ORM 中介軟體自動攔截所有 UPDATE/CREATE/DELETE 操作，寫入 audit_logs 表；`details` 欄位改為 MySQL JSON 型別；支援查詢操作者、 時間、IP、變更內容；相關 issue：K06 |
| P2 | 13.5 | 系統設定（名稱/Logo 自訂）| 管理功能 |
| P2 | 13.6 | 預約排序功能 | 按地址/姓名/時間排序 |
| P2 | 13.7 | 預約管理日期快速切換 | 左右箭嘴快速切換日期 |
| P2 | 13.8 | 批量分配醫生 | 勾選多筆預約一次指定 |
| P2 | 13.10 | 線上診症頁面增強 | 病人列表篩選/排序 |
| Done | 13.12 | 病人資料表重整 | 25欄已完成遷移 |

---

### 13.1 藥物資料庫與資料表重整 [P2]
- 使用官方正式已註冊藥物資料庫（澳門藥物監督管理局 ISAF）替代現有Seed資料
- 重整 `medications` 資料表結構，與官方欄位對齊
- 來源：https://app.isaf.gov.mo/pubisafweb/Daf/frmDafWeb.aspx

### 13.2 標籤列印 [P1]
- 處方藥物標籤列印功能
- 支援快速選取本機印表機；支援整張處方一次列印
- 標籤內容：藥物名稱、劑量、用法、病人姓名

### 13.3 文件上傳 [P1]
- 支援上傳化驗報告、影像報告等文件
- 病人文件庫：分類、上傳、下載、預覽
- 支援圖片/PDF 預覽

### 13.4 批量輸入預約（Excel 匯入）[P1]
- 支援上傳 Excel 檔案批量建立預約
- 格式驗證、錯誤提示、衝突檢測

### 13.5 系統設定 [P2]
- 可自訂系統名稱、機構名稱
- 可上傳機構圖示 / Logo
- 設定頁面由管理員訪問

### 13.6 預約排序功能 [P2]
- 可按以下欄位排序：病人地址、病人名稱、診症時間
- 預設按時間正序

### 13.7 預約管理日期快速切換 [P2]
- 左右箭嘴按鈕快速切換至前一天 / 後一天
- 可直接點選日期選擇器跳轉

### 13.8 批量分配醫生 [P2]
- 支援勾選多筆未指定醫生的預約，批量指定同一醫生

### 13.9 權限設定（見 13.15）

### 13.10 線上診症頁面增強 [P2]
- 病人列表增加「只看自己的病人」篩選模式
- 支援按預約類型（初診/複診/急診）篩選
- 支援自訂排序：按病人地址、病人姓名、預約時間
- 默認顯示今日已報到的病人

### 13.11 外部系統數據互聯 [P2]
- 透過 API 與其他外部系統建立數據連接
- 支援接收並更新病人以下欄位：姓名（中文/外文）、電話、身份證類別及號碼、醫療卡號碼、居住地址、聯絡地址、緊急聯絡人資訊
- 雙向數據同步：外部系統可主動推送更新，亦可由系統主動拉取
- 變更日誌：所有外部來源的數據更新均需記錄 audit log

### 13.12 病人資料表重整 [Done]
- 資料庫已完成遷移（25欄）；原有名稱全部保留，不作修改

| 欄位 | 說明 | 約束 |
|------|------|------|
| `id` | UUID 主鍵 | PK, NOT NULL |
| `patient_number` | 病人編號 | UNIQUE, NOT NULL |
| `medical_number` | 醫療號碼（用戶自填，可留空）| UNIQUE, NULL |
| `name` | 中文姓名（系統預設姓名）| NOT NULL |
| `name_en` | 外文姓名 | NULL |
| `gender` | 性別 | NULL |
| `birth_date` | 出生日期 | NULL |
| `gold_card_number` | 金咭編號 | UNIQUE, NULL |
| `id_type` | 身份識別類型（例如 `01macauID`、`99other`）| NULL |
| `id_card` | 身份證號 | NULL |
| `phone` | 電話（「國際碼-電話號碼」格式）| UNIQUE, NULL |
| `phone2` | 電話2 | NULL |
| `address` | 居住地址 | NULL |
| `email` | 電郵 | NULL |
| `contact_address` | 聯絡地址 | NULL |
| `insurance_type` | 保險類型 | NULL |
| `insurance_number` | 保險號碼 | NULL |
| `emergency_contact` | 緊急聯絡人姓名 | NULL |
| `emergency_contact_address` | 緊急聯絡人通訊地址 | NULL |
| `emergency_contact_phone` | 緊急聯絡人電話1 | NULL |
| `emergency_contact_phone2` | 緊急聯絡人電話2 | NULL |
| `created_at` | 建立日期 | DEFAULT |
| `created_by` | 建立者 ID（外來鍵→users.id）| NOT NULL |
| `created_by_name` | 建立人名稱 | NOT NULL |
| `updated_at` | 更新日期 | ON UPDATE |

### 13.13 新增病人頁面配合新資料表結構 [P0]
- 因應病人資料表已擴展至 25 欄，需更新：
  - 新增病人頁面（NewPatient.tsx）：加入所有新欄位的輸入欄位（name_en、medical_number、gold_card_number、id_type、phone2、contact_address、emergency_contact_address、emergency_contact_phone2）
  - 修改病人頁面（PatientDetail.tsx）：同步顯示及編輯所有新欄位
  - 驗證規則：id_type 格式為「兩位數字+英文文字」；phone 格式為「國際碼-電話號碼」
  - 欄位排序：基本資料 → 證件資料 → 聯絡資料 → 緊急聯絡人 → 保險 → 系統資訊

### 13.14 重新審視藥物資料表結構 [P1]
- 現有 `medications` 表僅 204 筆 Seed 資料，需對比澳門藥物監督管理局（ISAF）已爬取的 9,122 筆藥物資料
- 評估現有欄位是否足夠（name、generic_name、dosage、route、frequency）
- 新欄位候選：product_registration_number、holder、manufacturer、active_ingredients、pharmaceutical_form、legal_classification、atc_code 等
- 制定資料遷移方案

### 13.15 完善的角色權限資料庫結構 [P1]
- 目前 `users.role` 為 ENUM 硬編碼，缺乏靈活性
- 建立完整 RBAC 權限模型：
  - `roles` 表：角色定義（admin、doctor、nurse、staff、patient，及自訂角色）
  - `permissions` 表：權限定義（module + action，例如 `patients:create`、`appointments:delete`）
  - `role_permissions` 表：角色與權限的多對多映射
- 前端權限控制：路由守衛（role-based routing）+ UI 按鈕隱藏 + API 中間件驗證

### 13.16 SOAP 超時後不能修改 [P1]
- 完成診症後，SOAP 記錄鎖定不可編輯
- 防止事後篡改就診記錄，確保醫療文件完整性
- 由管理員或指定角色可解除鎖定

### 13.17 診症時建立覆診預約 [P1]
- 醫生在完成本次診症前，可直接新增覆診預約
- 覆診時間、醫生、診所均可指定
- 減少病人漏跟進的情況

### 13.18 覆診跟進（醫生專屬）[P1]
- 醫生可建立覆診計劃，系統追蹤下次就診時間
- 每次就診後可更新覆診狀態（待覆診、已完成、延後）
- 只有醫生角色可建立和管理覆診跟進記錄
- 護士可查看覆診計劃以安排日程

### 13.19 文件輸出（模板系統）[P2]
- 全部角色均可新增、修改、下載文件
- 支援模板：轉介專科、驗單、醫療記錄、建議書、報告書、返港
- 文件與病人就診記錄關聯，可追溯來歷
- 支援 PDF 導出及列印

### 13.20 支援多語言介面 [P1]
- 系統同時支援中文（繁體）、英文、葡文三種語言界面
- 支援全系統即時語言切換，無需重新整理頁面
- 所有前端介面文字、提示訊息、報表標題均完整翻譯
- 後端 API 錯誤訊息、系統通知同樣支援多語言
- 使用語言代碼：zh-TW（繁中）、en（英文）、pt（葡文）

### 13.21 支援系統多顏色主題 [P1]
- 系統提供多套預設顏色主題（如：綠色醫療風格、藍色商務風格、暗色模式）
- 用戶可按個人喜好自由切換，無需管理員操作
- 主題涵蓋：Primary/Secondary/Accent/Warning/Danger/Background 等所有色值
- 支援深色模式（Dark Mode），並可跟隨系統設定自動切換
- 使用者主題偏好寫入 localStorage，支援跨裝置同步（可選）

## 14. 系統連接資訊

| 項目 | 設定值 |
|------|--------|
| 資料庫主機 | localhost |
| 資料庫名稱 | simple_medical_db （初始化腳本 init.sql 預設為 emr_system，以 .env 設定為準）|
| 資料庫用戶 | root |
| 資料庫密碼 | clinic123 |
| 後端 API 端口 | 3000 |
| 前端端口 | 5176 |
| JWT 密鑰 | emr_system_secret_key_2024 |
| JWT 有效期 | 24 小時 |

