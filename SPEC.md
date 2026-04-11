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
**Git HEAD**: `ed5fa19` — fix: hide delete (X) button for cancelled and completed appointments

---

## 0.1 待解決問題 (Known Issues)

> 記錄所有已知未完成的問題，後續開發必須依序完成這些項目才能達到 Production 標準。

| ID | 模組 | 問題描述 | 嚴重程度 | 優先順序 | 備註 |
|----|------|---------|---------|---------|------|
| #K01 | DataContext | `alerts / vitals / allergies / soap / prescriptions` 後端只有 per-patient 端點，DataContext 初始化時無法預載這些數據，目前為空陣列 | 中 | 中 | 需要新增對應的全域 API 或調整 DataContext 加載策略 |
| #K02 | Appointments | ~~`deleteAppointment()` 後端 API 不存在~~ ✅ 已修復；~~前端刪除按鈕對所有狀態都顯示~~ ✅ 已修復；後端 API 阻擋 completed/cancelled 刪除（commit `744e2b1`）；前端取消/刪除按鈕對 completed/cancelled 狀態均隱藏（commit `ed5fa19`） | 高 | 高 | ✅ `DELETE /api/appointments/:id`；✅ 前端按鈕 visibility 正確 |
| #K03 | Documents | ~~`addDocument` 後端無對應 API~~ ✅ 已修復 (P0-1) | 中 | 中 | ✅ 已使用 `api.uploadDocument(patientId, formData)` |
| #K05 | 時區 | ~~前端 `new Date().toISOString()` 使用 UTC，後端 `CURDATE()` 使用 CST (+8)，每日 00:00~00:59 會出現 1 天偏差~~ ✅ 已修復 (P0-3) | 中 | 中 | init-data.js 已改用 CST (+8h offset) |
| #K06 | Appointments | ~~`PUT /appointments/:id/complete` 端點返回 500 伺服器錯誤~~ ⚠️ 部分修復 | 高 | 高 | 直接 `PUT /appointments/:id` 加 `{"status":"completed"}` 可用，但專用 `/complete` 端點仍返回 500（需传入 consultation_type/consultation_notes 否則 consultation_notes 為 NULL） |
| #K04 | 即時同步 | 多人同時使用系統時，無 WebSocket 機制，其他人需要手動刷新才能看到更新 | 高 | 高 | 行業標準：任何資料庫寫入後應即時推送至所有在線客戶端 |
| #K07 | Documents | `DataContext.updateDocument` 只更新本地 state，後端無 `PUT /documents/:id` 端點（文件上傳使用 POST，無單獨更新 metadata 端點） | 低 | 低 | 日後如需更新文件 metadata，需新增對應端點 |
| #K08 | RBAC/Doctors | ~~醫生角色刪除病人返回 403，但 RBAC 矩陣顯示有完整 CRUD~~ ✅ 已解決：後端 `constants.js` doctor.delete=false 正確，前端刪除按鈕現已限定僅 admin 可見 | 中 | 中 | ✅ 已解決（commit `734abd0`）：前端刪除按鈕 `user?.role === 'admin'` 才渲染 |

> ⚠️ **日後新增問題**：任何新發現的未完成問題，都必須立即記錄在此區塊，格式同上，不得遺漏。

---

# 電子病歷系統 (EMR System) - 規格文檔

## 1. 概念與願景

這是一個專為醫療機構設計的簡潔實用電子病歷系統，旨在取代複雜專業的現有系統。系統以用戶友善為核心，提供清晰的介面佈局和直覺的操作流程。採用專業的醫療風格配色（藍色系），結合現代化的卡片式設計，營造專業可信賴的醫療環境。

## 2. 設計語言

### 2.1 美學方向
- **風格**: 專業醫療風格 - 簡潔、清晰、專業
- **參考**: 現代醫療軟體 + 企業級儀表板
- **特點**: 大面積留白、清晰的信息層次、柔和的色彩過渡

### 2.2 色彩系統
```
Primary:     #2B5D3A (綠色 - 專業、信任)
Secondary:   #4A90E2 (藍色 - 輔助)
Accent:      #F5A623 (橙色 - 強調)
Warning:     #F59E0B (橙黃色 - 警示)
Danger:      #EF4444 (紅色 - 危險/高警示)
Background:  #F8FAFC (淺灰背景)
Card:        #FFFFFF (白色卡片)
Border:      #E2E8F0 (邊框)
Text:        #1E293B (主文字)
TextMuted:   #64748B (次要文字)
```

### 2.3 字體
- **主字體**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **中文字體**: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif
- **等寬字體**: "JetBrains Mono", Consolas, monospace (用於代碼/數值)

### 2.4 間距系統
- 基準間距: 4px
- 常用間距: 8px, 12px, 16px, 24px, 32px, 48px
- 卡片內邊距: 24px
- 頁面邊距: 24px (桌面) / 16px (平板)

### 2.5 動效哲學
- 過渡時長: 150ms (快速) / 300ms (標準)
- 緩動函數: ease-in-out
- 載入動畫: 骨架屏 (Skeleton)
- 成功反饋: 綠色 checkmark 動畫
- 錯誤提示: 紅色 shake 動畫

## 3. 用戶角色與權限

### 3.1 角色定義
| 角色 | 角色代碼 | 說明 |
|------|----------|------|
| 管理員 | admin | 系統管理員，負責系統設定與用戶管理 |
| 職員 | staff | 櫃台接待員，負責預約登記 |
| 醫生 | doctor | 負責診斷與處方 |
| 護士 | nurse | 負責護理記錄與生命體徵 |
| 病人 | patient | 病人/患者本人 |

### 3.2 權限矩陣
| 功能模組 | 管理員 | 職員 | 醫生 | 護士 | 病人 |
|----------|--------|------|------|------|------|
| 用戶管理 | CRUD | - | - | - | - |
| 系統設定 | CRUD | - | - | - | - |
| 病人管理 | CRUD | R | CRUD | RU | R(自己的) |
| 預約管理 | CRUD | CRU | RU | R | CR(自己的) |
| SOAP記錄 | CRUD | - | CRUD | R | R(自己的) |
| 處方管理 | CRUD | - | CRUD | R | R(自己的) |
| 生命體徵 | CRUD | - | R | CRUD | R(自己的) |
| 過敏記錄 | CRUD | - | CRUD | CRUD | R(自己的) |
| 特別警示 | CRUD | - | CRUD | CRUD | R(自己的) |
| 文件管理 | CRUD | CRU | CRUD | CRUD | CR(自己的) |
| 藥物標籤列印 | R | R | R | R | R |
| 數據統計 | R | R | R | R | R |
| 操作紀錄 | R | - | - | - | - |

### 3.3 通用功能（所有角色）
- 查看和編輯個人資料（名稱、職位、簡介、性別）
- 修改密碼
- 登出系統

## 4. 功能模組詳細規格

### 4.1 電子病歷 (Electronic Medical Records)

#### 4.1.1 病人基本信息
- **必填欄位**: 病人編號 (Patient Number, 唯一識別碼)、姓名
- **可選欄位**: 性別、出生日期、身份證號、電話、Email、地址、緊急聯絡人、緊急電話、保險類型、保險號碼
- **操作**: 新增、編輯、刪除、搜索

#### 4.1.2 特別警示 (Special Alerts)
- **欄位**: 等級 (高/中/低)、類型 (過敏/疾病/藥物/其他)、內容、是否啟用
- **顯示**: 病歷頂部紅色醒目標籤

#### 4.1.3 生命體徵記錄 (Vital Signs)
- **欄位**: 體溫、血壓(收縮壓/舒張壓)、心率、呼吸頻率、血氧飽和度、體重、身高、記錄時間、備註
- **護士权限**: 可新增和編輯
- **顯示**: 表格形式，可按時間排序

#### 4.1.4 過敏記錄 (Allergy Records)
- **欄位**: 過敏原、過敏類型 (藥物/食物/環境/其他)、嚴重程度 (輕度/中度/重度/危及生命)、反應症狀
- **操作**: 新增、編輯、刪除

#### 4.1.5 SOAP就診記錄
- **SOAP結構**:
  - S (Subjective): 病人主訴
  - O (Objective): 客觀檢查
  - A (Assessment): 評估診斷 (整合ICD-10)
  - P (Plan): 治療計劃
- **ICD-10整合**: 輸入關鍵字搜尋，顯示分類供選擇
- **備註欄位**: 額外說明

#### 4.1.6 處方紀錄 (Prescription Records)
- **藥物項目**: 藥物名稱、劑量、頻率、用藥途徑 (口服/外用/注射/吸入/其他)、療程天數
- **用藥途徑選項**: 口服 (Oral)、外用 (Topical)、注射 (Injection)、吸入 (Inhalation)、其他 (Other)
- **狀態**: 有效/已調劑/已過期
- **藥物資料表整合**: 輸入關鍵字搜尋，選擇藥物快速添加

#### 4.1.7 病人文件庫 (Patient Document Library)
- **分類頁**: 化驗報告 (Lab)、影像檢查 (Imaging)、手術記錄 (Surgery)、其他 (Other)
- **文件欄位**: 名稱、日期、分類、上傳者、上傳時間
- **操作**: 上傳文件、預覽、下載、刪除

### 4.2 預約就診系統 (Appointment System)

#### 4.2.1 預約管理
- **必填欄位**: 病人編號、診症日期
- **可選欄位**: 醫生、時段、預約類型 (初診/複診/急診)、備註
- **狀態**: 已預約 (pending)、已報到 (checked-in)、已完成 (completed)、已取消 (cancelled)
- **刪除限制**: 僅 `pending` / `checked-in` 狀態可刪除；`completed` / `cancelled` 狀態的預約屬正式就診記錄，無法刪除（後端 API 層阻擋）

#### 4.2.2 候診名單
- **顯示**: 已報到病人列表
- **操作**: 醫生可點擊進入線上診室

#### 4.2.3 線上診室 (Online Consultation Room)
- **功能**:
  - 查看病人基本信息與警示
  - 填寫/編輯 SOAP 記錄
  - 開立處方藥物
  - 提交就診記錄

#### 4.2.4 就診記錄提交
- **就診分類**: 診症 (consultation) / 其他 (other)
- **診症類型**: 填寫完整 SOAP + 備註
- **其他類型**: 僅填寫備註
- **提交效果**:
  - 預約狀態改為「已完成」
  - 從候診名單移除
  - 診症人數 +1

#### 4.2.5 取消預約
- **必填**: 取消原因
- **可選**: 上傳證明文件
- **文件流向**: 上傳至病人文件庫的「其他」分類
- **記錄關聯**: 自動寫入就診記錄的備註

### 4.3 列印藥物標籤 (Print Medication Labels)

#### 4.3.1 列印功能
- **權限**: 所有登入用戶
- **觸發位置**: 處方藥物顯示區域

#### 4.3.2 標籤自訂
- **可編輯內容**:
  - 病人姓名
  - 藥物名稱
  - 劑量
  - 用藥頻率
  - 用藥天數
  - 用藥途徑
  - 醫療機構名稱
  - 日期

#### 4.3.3 批量列印
- **支援**: 單次就診的所有藥物一次性列印
- **格式**: 預設為藥袋標籤尺寸 (3" x 2")

### 4.4 數據統計 (Statistics)

#### 4.4.1 概覽統計
- 今日預約總人數
- 今日已完成診症人數
- 今日候診人數

#### 4.4.2 篩選統計
- 按病人篩選 + 指定期間 → 顯示就診次數
- 按期間篩選 → 顯示預約人數、完成診症人數

#### 4.4.3 ICD-10疾病分類統計
- 按 ICD-10 大類統計就診次數
- 可下鑽查看詳細分類

### 4.5 ICD-10疾病分類資料表

#### 4.5.1 用途
- 增強 SOAP 記錄中「評估 (Assessment)」欄位的填寫
- 澳門衛生局官方 ICD-10 疾病列表，含中/英/葡三語

#### 4.5.2 功能
- **搜尋**: 輸入 ICD-10 編碼、中文名、英文名、葡文名均可匹配
- **選擇**: 點擊選擇自動填入 Assessment，自動取代當前輸入的關鍵字
- **顯示**: ICD-10 編碼 + 中文分類 + 中文名 + 英文名

### 4.6 藥物資料表 (Medication Database)

#### 4.6.1 用途
- 增強處方藥物的快速填寫
- 澳門藥物監督管理局 (ISAF) 藥品資料（共 9,122 筆）

#### 4.6.2 功能
- **搜尋**: 輸入藥物名稱關鍵字
- **選擇**: 點擊添加至處方
- **顯示**: 藥物名稱、學名、劑量、途徑

### 4.7 管理員系統設定

#### 4.7.1 用戶管理
- 新增所有角色用戶
- 編輯用戶資料與角色
- 停用/啟用用戶

#### 4.7.2 權限設定
- 各角色對各模組的檢視/編輯/刪除權限
- 圖形化權限矩陣

#### 4.7.3 就診記錄修改時限
- **設定**: 提交後 N 小時內可由同一醫生修改
- **預設值**: 48 小時
- **範圍**: 0-168 小時 (0 = 不限制)

#### 4.7.4 操作紀錄
- **記錄內容**: 用戶、操作時間、操作類型、操作模組、操作詳情、IP 地址
- **篩選**: 按用戶、日期範圍、操作類型

## 5. 技術架構

### 5.1 前端技術棧
- **框架**: React 18 + TypeScript
- **路由**: React Router v6
- **狀態管理**: React Context + Hooks
- **樣式**: Tailwind CSS
- **UI 組件**: Radix UI
- **圖表**: Recharts
- **表單**: React Hook Form + Zod
- **日期處理**: date-fns
- **響應式設計**: 支援桌面(≥1024px)和平板(768px-1023px)

### 5.2 後端技術棧
- **Runtime**: Node.js 18+
- **框架**: Express.js
- **資料庫**: MySQL 8.0
- **ORM**: mysql2 (原生 SQL，無 Prisma)
- **認證**: JWT (JSON Web Tokens)
- **密碼加密**: bcrypt

### 5.3 數據庫設計

#### 5.3.1 用戶表 (users)
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'staff', 'doctor', 'nurse', 'patient') NOT NULL,
  title VARCHAR(50),
  bio TEXT,
  gender ENUM('male', 'female', 'other', 'unspecified') DEFAULT 'unspecified',
  avatar VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 5.3.2 病人表 (patients)
```sql
CREATE TABLE patients (
  id VARCHAR(36) PRIMARY KEY,
  patient_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(20),
  birth_date DATE,
  id_card VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  insurance_type VARCHAR(50),
  insurance_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 5.3.3 警示表 (alerts)
```sql
CREATE TABLE alerts (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  level ENUM('high', 'medium', 'low') NOT NULL,
  type ENUM('allergy', 'disease', 'drug', 'other') NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

#### 5.3.4 生命體徵表 (vital_signs)
```sql
CREATE TABLE vital_signs (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  temperature DECIMAL(4,1),
  blood_pressure_systolic INT,
  blood_pressure_diastolic INT,
  heart_rate INT,
  respiratory_rate INT,
  oxygen_saturation DECIMAL(4,1),
  weight DECIMAL(5,1),
  height DECIMAL(5,1),
  notes TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_by VARCHAR(36) NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);
```

#### 5.3.5 過敏記錄表 (allergies)
```sql
CREATE TABLE allergies (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  allergen VARCHAR(100) NOT NULL,
  type ENUM('drug', 'food', 'environmental', 'other') NOT NULL,
  severity ENUM('mild', 'moderate', 'severe', 'life-threatening') NOT NULL,
  reaction TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

#### 5.3.6 SOAP 記錄表 (soap_notes)
```sql
CREATE TABLE soap_notes (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  visit_date DATE NOT NULL,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  doctor_id VARCHAR(36) NOT NULL,
  notes TEXT,
  appointment_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);
```

#### 5.3.7 處方表 (prescriptions)
```sql
CREATE TABLE prescriptions (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  doctor_id VARCHAR(36) NOT NULL,
  appointment_id VARCHAR(36),
  date DATE NOT NULL,
  notes TEXT,
  status ENUM('active', 'filled', 'expired') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);
```

#### 5.3.8 處方藥物表 (prescription_medications)
```sql
CREATE TABLE prescription_medications (
  id VARCHAR(36) PRIMARY KEY,
  prescription_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  dosage VARCHAR(50) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  route ENUM('oral', 'topical', 'injection', 'inhalation', 'other') NOT NULL,
  duration INT NOT NULL,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
);
```

#### 5.3.9 預約表 (appointments)
```sql
CREATE TABLE appointments (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  doctor_id VARCHAR(36),
  date DATE NOT NULL,
  time TIME,
  type ENUM('first', 'followup', 'urgent') DEFAULT 'first',
  status ENUM('pending', 'checked-in', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  cancel_reason TEXT,
  cancel_document_url VARCHAR(255),
  consultation_type ENUM('consultation', 'other') DEFAULT 'consultation',
  consultation_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
);
```

#### 5.3.10 文件表 (documents)
```sql
CREATE TABLE documents (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  category ENUM('lab', 'imaging', 'surgery', 'other') NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_url VARCHAR(500) NOT NULL,
  file_size INT,
  uploaded_by VARCHAR(36) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
```

#### 5.3.11 ICD-10 分類表 (icd10_codes)
```sql
CREATE TABLE icd10_codes (
  id VARCHAR(10) PRIMARY KEY,           -- ICD代碼（去除*號，如 H28）
  code VARCHAR(10) NOT NULL,            -- 完整代碼（含*號，如 H28*）
  name_tc VARCHAR(255) NOT NULL,        -- 中文名稱
  name_en VARCHAR(255),                  -- 英文名稱
  name_pt VARCHAR(500),                  -- 葡文名稱
  category_tc VARCHAR(200),              -- 中文分類
  category_en VARCHAR(200),              -- 英文分類
  category_pt VARCHAR(200),              -- 葡文分類
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX uk_code (code)
);
```

#### 5.3.12 藥物資料表 (medications)
```sql
CREATE TABLE medications (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  generic_name VARCHAR(100),
  dosage VARCHAR(50),
  route VARCHAR(50),
  frequency VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.3.13 系統設定表 (system_settings)
```sql
CREATE TABLE system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 5.3.14 操作紀錄表 (audit_logs)
```sql
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 6. API 端點設計

### 6.1 認證相關
| 方法 | 端點 | 說明 |
|------|------|------|
| POST | /api/auth/login | 登入 |
| POST | /api/auth/logout | 登出 |
| GET | /api/auth/me | 獲取當前用戶資訊 |
| PUT | /api/auth/password | 修改密碼 |

### 6.2 用戶管理 (管理員)
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | /api/users | 獲取所有用戶列表 |
| POST | /api/users | 新增用戶 |
| GET | /api/users/:id | 獲取單個用戶 |
| PUT | /api/users/:id | 更新用戶 |
| DELETE | /api/users/:id | 刪除用戶 |

### 6.3 病人管理
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | /api/patients | 獲取病人列表 |
| POST | /api/patients | 新增病人 |
| GET | /api/patients/:id | 獲取病人詳情 |
| PUT | /api/patients/:id | 更新病人 |
| DELETE | /api/patients/:id | 刪除病人 |

### 6.4 病歷記錄
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | /api/patients/:id/alerts | 獲取警示 |
| POST | /api/patients/:id/alerts | 新增警示 |
| PUT | /api/alerts/:id | 更新警示 |
| DELETE | /api/alerts/:id | 刪除警示 |
| GET | /api/patients/:id/vitals | 獲取生命體徵 |
| POST | /api/patients/:id/vitals | 新增生命體徵 |
| PUT | /api/vitals/:id | 更新生命體徵 |
| DELETE | /api/vitals/:id | 刪除生命體徵 |
| GET | /api/patients/:id/allergies | 獲取過敏記錄 |
| POST | /api/patients/:id/allergies | 新增過敏記錄 |
| PUT | /api/allergies/:id | 更新過敏記錄 |
| DELETE | /api/allergies/:id | 刪除過敏記錄 |

### 6.5 SOAP 與處方
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | /api/patients/:id/soap | 獲取 SOAP 記錄 |
| POST | /api/patients/:id/soap | 新增 SOAP 記錄 |
| PUT | /api/soap/:id | 更新 SOAP 記錄 |
| DELETE | /api/soap/:id | 刪除 SOAP 記錄 |
| GET | /api/patients/:id/prescriptions | 獲取處方 |
| POST | /api/patients/:id/prescriptions | 新增處方 |
| PUT | /api/prescriptions/:id | 更新處方 |
| DELETE | /api/prescriptions/:id | 刪除處方 |

### 6.6 文件管理
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | /api/patients/:id/documents | 獲取文件列表 |
| POST | /api/patients/:id/documents | 上傳文件 |
| GET | /api/documents/:id/download | 下載文件 |
| DELETE | /api/patients/:patientId/documents/:id | 刪除文件 |

### 6.7 預約管理
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | /api/appointments | 獲取預約列表 |
| POST | /api/appointments | 新增預約 |
| GET | /api/appointments/:id | 獲取預約詳情 |
| PUT | /api/appointments/:id | 更新預約 |
| PUT | /api/appointments/:id/check-in | 報到 |
| PUT | /api/appointments/:id/complete | 完成就診 |
| PUT | /api/appointments/:id/cancel | 取消預約 |
| DELETE | /api/appointments/:id | 刪除預約（僅限 pending / checked-in 狀態） |
| GET | /api/appointments/waiting | 候診名單 |

### 6.8 查找功能
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | /api/lookup/icd10 | 獲取所有 ICD-10 |
| GET | /api/lookup/icd10/search | ICD-10 搜尋 |
| GET | /api/lookup/medications | 獲取所有藥物 |
| GET | /api/lookup/medications/search | 藥物資料搜尋 |

### 6.9 統計
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | /api/statistics/overview | 概覽統計 |
| GET | /api/statistics/appointments | 預約統計 |
| GET | /api/statistics/icd10 | ICD-10 疾病統計 |

### 6.10 系統設定 (管理員)
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | /api/settings | 獲取設定 |
| PUT | /api/settings | 更新設定 |
| GET | /api/audit-logs | 操作紀錄 |

## 7. 響應式設計

### 7.1 斷點定義
- **桌面 (Desktop)**: ≥1024px
- **平板 (Tablet)**: 768px - 1023px
- **手機 (Mobile)**: <768px (基本支援)

### 7.2 佈局調整
- **桌面**: 側邊欄固定導航 + 主內容區
- **平板**: 側邊欄可折疊漢堡選單 + 主內容區
- **手機**: 底部導航欄 + 單欄佈局

## 8. 安全考量

### 8.1 認證
- JWT Token 有效期: 24 小時
- Token 刷新機制
- 登出時清除 Token

### 8.2 授權
- 基於角色的訪問控制 (RBAC)
- 每個 API 端點權限檢查
- 敏感操作日誌記錄

### 8.3 數據安全
- 密碼使用 bcrypt 加密
- SQL 注入防護 (Prisma ORM)
- XSS 防護 (React 自動轉義)
- CORS 配置

## 9. 預設登入資訊

| 角色 | 用戶名 | 密碼 |
|------|--------|------|
| 管理員 | admin | admin123 |
| 醫生 | doctor1 | doctor123 |
| 護士 | nurse1 | nurse123 |
| 職員 | staff1 | staff123 |
| 病人 | patient1 | patient123 |

## 10. 預設就診記錄修改時限
- **預設值**: 48 小時
- **說明**: 提交就診記錄後，48 小時內可由同一醫生修改 SOAP 及處方藥物

---

## 11. 資料庫結構 (Database Schema)

### 11.1 資料庫資訊
- **資料庫名稱**: simple_medical_db（由 .env 設定；初始化腳本 init.sql 預設名為 emr_system，使用前請確認一致性）
- **字元集**: utf8mb4
- **排序**: utf8mb4_unicode_ci

### 11.2 資料庫 Seed Scripts（獨立可執行）

每次部署後可一鍵注入參考資料，採用 `TRUNCATE + INSERT` 策略（idempotent，重複執行結果一致）。

| Script | 說明 | 執行方式 |
|--------|------|---------|
| `scripts/import_icd10_to_db.py` | ICD-10 疾病分類（澳門衛生局，2,049 筆，含中/英/葡三語） | `cd backend && NODE_PATH=./node_modules python3 ../scripts/import_icd10_to_db.py` |
| `data/medications/seed-medications.cjs` | 藥物資料庫（204 筆常見西藥） | `NODE_PATH=./node_modules node ../data/medications/seed-medications.cjs` |

> **idempotent 設計**：每次執行都會先 `TRUNCATE TABLE`（清空舊資料）再完整重新插入，確保開發/投產環境結果一致。

### 11.3 資料表清單

| 資料表 | 說明 |
|--------|------|
| users | 用戶資料 |
| patients | 病人資料 |
| appointments | 預約記錄 |
| soap_notes | SOAP 就診記錄 |
| prescriptions | 處方主表 |
| prescription_medications | 處方藥物明細 |
| vital_signs | 生命體徵 |
| allergies | 過敏記錄 |
| alerts | 特別警示 |
| documents | 文件管理 |
| icd10_codes | ICD-10 疾病分類 |
| medications | 藥物資料庫 |
| system_settings | 系統設定 |
| audit_logs | 操作日誌 |

### 11.3 用戶表 (users)

| 欄位 | 類型 | 可空 | 鍵 | 默認值 |
|------|------|------|-----|---------|
| id | varchar(36) | NO | PRI | |
| username | varchar(50) | NO | UNI | |
| password | varchar(255) | NO | | |
| name | varchar(100) | NO | | |
| role | enum('admin','staff','doctor','nurse','patient') | NO | MUL | |
| title | varchar(50) | YES | | |
| bio | text | YES | | |
| gender | enum('male','female','other','unspecified') | YES | | unspecified |
| avatar | varchar(255) | YES | | |
| is_active | tinyint(1) | YES | | 1 |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP |
| updated_at | timestamp | YES | | CURRENT_TIMESTAMP |

### 11.4 病人表 (patients)

| 欄位 | 類型 | 可空 | 鍵 | 默認值 |
|------|------|------|-----|---------|
| id | varchar(36) | NO | PRI | |
| patient_number | varchar(20) | NO | UNI | |
| name | varchar(100) | NO | MUL | |
| gender | varchar(20) | YES | | |
| birth_date | date | YES | | |
| id_card | varchar(20) | YES | | |
| phone | varchar(20) | YES | | |
| email | varchar(100) | YES | | |
| address | text | YES | | |
| emergency_contact | varchar(100) | YES | | |
| emergency_phone | varchar(20) | YES | | |
| insurance_type | varchar(50) | YES | | |
| insurance_number | varchar(50) | YES | | |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP |
| updated_at | timestamp | YES | | CURRENT_TIMESTAMP |

### 11.5 預約表 (appointments)

| 欄位 | 類型 | 可空 | 鍵 | 默認值 |
|------|------|------|-----|---------|
| id | varchar(36) | NO | PRI | |
| patient_id | varchar(36) | NO | MUL | |
| doctor_id | varchar(36) | YES | MUL | |
| date | date | NO | MUL | |
| time | time | YES | | |
| type | enum('first','followup','urgent') | YES | | first |
| status | enum('pending','checked-in','completed','cancelled') | YES | MUL | pending |
| notes | text | YES | | |
| cancel_reason | text | YES | | |
| cancel_document_url | varchar(255) | YES | | |
| consultation_type | enum('consultation','other') | YES | | consultation |
| consultation_notes | text | YES | | |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP |
| updated_at | timestamp | YES | | CURRENT_TIMESTAMP |

### 11.6 SOAP 記錄表 (soap_notes)

| 欄位 | 類型 | 可空 | 鍵 | 默認值 |
|------|------|------|-----|---------|
| id | varchar(36) | NO | PRI | |
| patient_id | varchar(36) | NO | MUL | |
| visit_date | date | NO | | |
| subjective | text | YES | | |
| objective | text | YES | | |
| assessment | text | YES | | |
| plan | text | YES | | |
| doctor_id | varchar(36) | NO | MUL | |
| notes | text | YES | | |
| appointment_id | varchar(36) | YES | MUL | |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP |
| updated_at | timestamp | YES | | CURRENT_TIMESTAMP |

### 11.7 處方主表 (prescriptions)

| 欄位 | 類型 | 可空 | 鍵 | 默認值 |
|------|------|------|-----|---------|
| id | varchar(36) | NO | PRI | |
| patient_id | varchar(36) | NO | MUL | |
| doctor_id | varchar(36) | NO | MUL | |
| appointment_id | varchar(36) | YES | MUL | |
| date | date | NO | | |
| notes | text | YES | | |
| status | enum('active','filled','expired') | YES | | active |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP |
| updated_at | timestamp | YES | | CURRENT_TIMESTAMP |

### 11.8 處方藥物表 (prescription_medications)

| 欄位 | 類型 | 可空 | 鍵 | 默認值 |
|------|------|------|-----|---------|
| id | varchar(36) | NO | PRI | |
| prescription_id | varchar(36) | NO | | |
| name | varchar(100) | NO | | |
| dosage | varchar(50) | NO | | |
| frequency | varchar(100) | NO | | |
| route | enum('oral','topical','injection','inhalation','other') | NO | | |
| duration | int | NO | | |

### 11.9 生命體徵表 (vital_signs)

| 欄位 | 類型 | 可空 | 鍵 | 默認值 |
|------|------|------|-----|---------|
| id | varchar(36) | NO | PRI | |
| patient_id | varchar(36) | NO | MUL | |
| temperature | decimal(4,1) | YES | | |
| blood_pressure_systolic | int | YES | | |
| blood_pressure_diastolic | int | YES | | |
| heart_rate | int | YES | | |
| respiratory_rate | int | YES | | |
| oxygen_saturation | decimal(4,1) | YES | | |
| weight | decimal(5,1) | YES | | |
| height | decimal(5,1) | YES | | |
| notes | text | YES | | |
| recorded_at | timestamp | YES | | CURRENT_TIMESTAMP |
| recorded_by | varchar(36) | NO | MUL | |

### 11.10 過敏記錄表 (allergies)

| 欄位 | 類型 | 可空 | 鍵 | 默認值 |
|------|------|------|-----|---------|
| id | varchar(36) | NO | PRI | |
| patient_id | varchar(36) | NO | MUL | |
| allergen | varchar(100) | NO | | |
| type | enum('drug','food','environmental','other') | NO | | |
| severity | enum('mild','moderate','severe','life-threatening') | NO | | |
| reaction | text | YES | | |
| recorded_at | timestamp | YES | | CURRENT_TIMESTAMP |

### 11.11 特別警示表 (alerts)

| 欄位 | 類型 | 可空 | 鍵 | 默認值 |
|------|------|------|-----|---------|
| id | varchar(36) | NO | PRI | |
| patient_id | varchar(36) | NO | MUL | |
| level | enum('high','medium','low') | NO | | |
| type | enum('allergy','disease','drug','other') | NO | | |
| content | text | NO | | |
| is_active | tinyint(1) | YES | | 1 |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP |

### 11.12 文件表 (documents)

| 欄位 | 類型 | 可空 | 鍵 | 默認值 |
|------|------|------|-----|---------|
| id | varchar(36) | NO | PRI | |
| patient_id | varchar(36) | NO | MUL | |
| category | enum('lab','imaging','surgery','other') | NO | MUL | |
| name | varchar(255) | NO | | |
| file_type | varchar(50) | YES | | |
| file_url | varchar(500) | NO | | |
| file_size | int | YES | | |
| uploaded_by | varchar(36) | NO | MUL | |
| uploaded_at | timestamp | YES | | CURRENT_TIMESTAMP |

### 11.13 ICD-10 分類表 (icd10_codes)

| 欄位 | 類型 | 可空 | 鍵 | 默認值 |
|------|------|------|-----|---------|
| id | varchar(10) | NO | PRI | |
| code | varchar(10) | NO | UNI | |
| name_tc | varchar(255) | NO | | |
| name_en | varchar(255) | YES | | |
| name_pt | varchar(500) | YES | | |
| category_tc | varchar(200) | YES | | |
| category_en | varchar(200) | YES | | |
| category_pt | varchar(200) | YES | | |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP |

### 11.14 藥物資料表 (medications)

| 欄位 | 類型 | 可空 | 鍵 | 默認值 |
|------|------|------|-----|---------|
| id | varchar(36) | NO | PRI | |
| name | varchar(100) | NO | | |
| generic_name | varchar(100) | YES | | |
| dosage | varchar(50) | YES | | |
| route | varchar(50) | YES | | |
| frequency | varchar(100) | YES | | |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP |

### 11.15 系統設定表 (system_settings)

| 欄位 | 類型 | 可空 | 鍵 | 默認值 |
|------|------|------|-----|---------|
| id | int | NO | PRI | AUTO_INCREMENT |
| setting_key | varchar(50) | NO | UNI | |
| setting_value | text | YES | | |
| description | varchar(255) | YES | | |
| updated_at | timestamp | YES | | CURRENT_TIMESTAMP |

### 11.16 操作日誌表 (audit_logs)

| 欄位 | 類型 | 可空 | 鍵 | 默認值 |
|------|------|------|-----|---------|
| id | varchar(36) | NO | PRI | |
| user_id | varchar(36) | NO | MUL | |
| action | varchar(50) | NO | | |
| module | varchar(50) | NO | | |
| details | text | YES | | |
| ip_address | varchar(45) | YES | | |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP |

---

## 13. 待開發功能 (Future Development Roadmap)

### 13.1 藥物資料庫與資料表重整
- 使用官方正式已註冊藥物資料庫（澳門藥物監督管理局 ISAF）替代現有Seed資料
- 重整 `medications` 資料表結構，與官方欄位對齊
- 來源：https://app.isaf.gov.mo/pubisafweb/Daf/frmDafWeb.aspx

### 13.2 標籤列印
- 處方藥物標籤列印功能
- 支援快速選取本機印表機
- 支援整張處方一次列印
- 標籤內容：藥物名稱、劑量、用法、病人姓名

### 13.3 文件上傳
- 支援上傳化驗報告、影像報告等文件
- 病人文件庫：分類、上傳、下載、預覽
- 支援圖片/PDF 預覽

### 13.4 批量輸入預約（Excel 匯入）
- 支援上傳 Excel 檔案批量建立預約
- 格式驗證、錯誤提示、衝突檢測
- 適用於大量預約的初期建立

### 13.5 系統設定
- 可自訂系統名稱、機構名稱
- 可上傳機構圖示 / Logo
- 設定頁面由管理員訪問

### 13.6 預約排序功能
- 在現有預約列表中支援自訂排序
- 可按以下欄位排序：病人地址、病人名稱、診症時間
- 預設按時間正序

### 13.7 預約管理日期快速切換
- 在預約管理頁面加入日期篩選器
- 左右箭嘴按鈕快速切換至前一天 / 後一天
- 可直接點選日期選擇器跳轉

### 13.8 批量分配醫生
- 在預約列表中支援勾選多筆未指定醫生的預約
- 一次過批量指定同一醫生
- 提升門診大量排班的效率

### 13.9 權限設定
- 完整的 RBAC 權限管理介面
- 可自訂各角色對各模組的 CRUD 權限
- 支援建立自訂角色

### 13.10 線上診症頁面增強
- 病人列表增加「只看自己的病人」篩選模式（按當前登入醫生過濾）
- 支援按預約類型（初診/複診/急診）篩選
- 支援自訂排序：按病人地址、病人姓名、預約時間
- 默認顯示今日已報到的病人

### 13.11 外部系統數據互聯
- 透過 API 與其他外部系統建立數據連接
- 支援接收並更新病人以下欄位：
  - 姓名（中文）、外文姓名
  - 電話、身份證類別、身份證號碼
  - 醫療卡號碼
  - 居住地址、聯絡地址
  - 緊急聯絡人資訊（姓名、電話、關係）
- 雙向數據同步：外部系統可主動推送更新，亦可由系統主動拉取
- 變更日誌：所有外部來源的數據更新均需記錄 audit log

---

### 13.12 病人資料表重整
- 保留原有欄位，盡量不破壞現有數據遷移
- 欄位說明：

| 新欄位 | 說明 | 約束 |
|--------|------|------|
| `id` | UUID 主鍵 | PK, NOT NULL |
| `patient_number` | 病人編號 | UNIQUE, NOT NULL |
| `medical_number` | 醫療號碼（系統內部流水號） | UNIQUE, NULL |
| `gender` | 性別 | NULL |
| `birth_date` | 出生日期 | NULL |
| `gold_card_number` | 金咭編號 | UNIQUE, NULL |
| `name_tc` | 中文名稱（系統預設姓名） | NOT NULL |
| `name_en` | 外文姓名 | NULL |
| `phone1` | 電話1（「國際碼-電話號碼」格式） | UNIQUE, NULL |
| `phone2` | 電話2 | NULL |
| `id_type` | 身份識別類型 | NULL |
| `id_card` | 身份證號（若 id_type='99無證' 可重複；否則 id_type + id_card 合併唯一） | NULL |
| `address` | 居住地址 | NULL |
| `email` | 電郵 | NULL |
| `contact_address` | 聯絡地址 | NULL |
| `created_at` | 建立日期 | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | 更新日期 | ON UPDATE CURRENT_TIMESTAMP |
| `created_by` | 建立者 ID | FK → users.id, NULL |
| `created_by_name` | 建立人名稱 | NULL |
| `insurance_type` | 保險類型 | NULL |
| `insurance_number` | 保險號碼 | NULL |
| `emergency_contact_name` | 緊急聯絡人姓名 | NULL |
| `emergency_contact_address` | 緊急聯絡人通訊地址 | NULL |
| `emergency_contact_phone1` | 緊急聯絡人電話1 | NULL |
| `emergency_contact_phone2` | 緊急聯絡人電話2 | NULL |

- **遷移說明**：`name` → `name_tc`；`phone` → `phone1`；`id_card` → `id_card`（id_type 新增）；`address` → `address`（新增 contact_address）；`emergency_contact` → `emergency_contact_name`；`emergency_phone` → `emergency_contact_phone1`

---

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

