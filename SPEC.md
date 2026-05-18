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

**上次檢查**: 2026-05-18 06:08 (Asia/Macau)
**本次檢查**: 2026-05-19 06:08 (Asia/Macau)
**Git HEAD**: `6f39328` — docs: 更新開發進度檢查記錄（2026-05-18 18:08）含 K19 發現，K15 未觸發
**DB 狀態**: 26 patients, 17 appointments（測試後已清理）
**後端**: ✅ 運行中 (port 3000) — `/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`

---

## 開發進度檢查記錄 (Dev Check Log)

### 2026-05-16 06:08 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 26 patients, 17 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0516A-MAX, id:424ace09）→ 新增預約 ✅（type:first, date:2026-05-16, time:10:00, id:d90c355d, status:pending）→ 列表確認出現 ✅（ID d90c355d 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: testdev0516max, id:c10804cf）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ✅（200 OK，status:completed，DB 確認 completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ GET 回 HTTP 404 ✅ → 搜索列表確認消失 ✅（search=TEST-0516A-MAX → found:0）→ DB 直接確認刪除 ✅ → 已清理
- **K01-K18**: 所有已知問題狀態不變，無新問題發現；K15 本次未觸發（列表正常消失）
- No new issues found

### 2026-05-18 18:08 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 26 patients, 17 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0518-MAX, id:d81a657d）→ 新增預約 ✅（type:first, date:2026-05-18, time:10:00, id:b0161cb0, status:pending）→ 列表確認出現 ✅（ID b0161cb0 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: testdev0518max, id:2535b366）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ❌（PUT /api/appointments/:id 返回 `{"error":"預約不存在"}`）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ 列表確認消失 ✅（search=TEST-0518-MAX → found:0）→ 已清理
- **K19 發現**：預約 `checked-in→completed` 轉換時後端回傳「預約不存在」；懷疑 `completeAppointment` 函式使用 `current_status` 欄位查詢，但 appointments 表只有 `status` 欄位；已追加至 Known Issues；其餘已知問題 K01-K18 狀態不變
- **K01-K18**: 其餘已知問題狀態不變，無其他新問題發現

### 2026-05-19 06:08 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 26 patients, 17 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0519-MAX, id:e3cd99cd）→ 新增預約 ✅（type:first, date:2026-05-19, time:10:00, id:317dc9c3, status:pending）→ 列表確認出現 ✅（ID 317dc9c3 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: testdev0519max, id:f532f439）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ✅（200 OK，status:completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ 列表確認消失 ✅（search=TEST-0519-MAX → found:0）→ DB 直接確認刪除 ✅（COUNT=0）→ 已清理
- **K01-K19**: 所有已知問題狀態不變，無新問題發現；K15 本次未觸發（列表正常消失）；K19 本次未觸發（`checked-in→completed` 正常）
- No new issues found

### 2026-05-18 06:08 (上次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 26 patients, 17 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0517-18-MAX, id:6ad5ea71）→ 新增預約 ✅（type:first, date:2026-05-17, time:10:00, id:1b5e6bbe, status:pending）→ 列表確認出現 ✅（ID 1b5e6bbe 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: testdev051718, id:b2ad9fc2）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ✅（200 OK，status:completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ 列表確認消失 ✅（search=TEST-0517-18-MAX → 未找到）→ 已清理
- **K01-K18**: 所有已知問題狀態不變，無新問題發現；K15 本次未觸發（列表正常消失）
- No new issues found

### 2026-05-17 18:08 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 26 patients, 17 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0517-MAX, id:d01b8c14）→ 新增預約 ✅（type:first, date:2026-05-17, time:10:00, id:b250d232, status:pending）→ 列表確認出現 ✅（ID b250d232 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: testdev0517max, id:666a3bc8）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ✅（200 OK，status:completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ 列表確認消失 ✅ → DB 直接確認刪除 ✅ → 已清理
- **K01-K18**: 所有已知問題狀態不變，無新問題發現；K15 本次未觸發
- No new issues found

### 2026-05-17 06:08 (上次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 26 patients, 17 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0517A-MAX, id:2d3ff6a0）→ 新增預約 ✅（type:first, date:2026-05-17, time:10:00, id:09ae36e0, status:pending）→ 列表確認出現 ✅（ID 09ae36e0 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: testdev0517, id:675affc5）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ✅（200 OK，status:completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ 搜索列表確認消失 ✅（search=TEST-0517A-MAX → found:0）→ DB 直接確認刪除 ✅ → 已清理
- **K01-K18**: 所有已知問題狀態不變，無新問題發現；K15 本次未觸發（列表正常消失）
- No new issues found

### 2026-05-15 18:08 (上次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 26 patients, 17 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0515-MAX, id:8b1d8eb9）→ 新增預約 ✅（type:first, date:2026-05-15, time:10:00, id:8780e16f, status:pending）→ 列表確認出現 ✅（ID 8780e16f 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: td0515max_a, id:a62a13e7）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ✅（200 OK，status:completed，DB 確認 completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ GET 回 HTTP 404 ✅ → 搜索列表確認消失 ✅（search=TEST-0515-MAX → found:0）→ DB 直接確認刪除 ✅ → 已清理
- **K01-K17**: 所有已知問題狀態不變，無新問題發現；K15 本次未觸發（列表正常消失）
- No new issues found

### 2026-05-15 06:08 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 26 patients, 17 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0515-MAX, id:056ba1bd）→ 新增預約 ✅（type:first, date:2026-05-15, time:10:00, id:a94923dd, status:pending）→ 列表確認出現 ✅（ID a94923dd 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: testdev0515max, id:6ee7f822）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ✅（200 OK，status:completed，DB 確認 completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ DB 確認該病人已不存在（mysql 直接查詢empty）→ GET 列表確認消失 ✅（search=TEST-0515-MAX → found:0）→ 已清理
- **K01-K17**: 所有已知問題狀態不變，無新問題發現；K15 本次未觸發（列表正常消失）
- No new issues found

### 2026-05-14 18:08 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 26 patients, 17 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0514-MAX, id:3738928c）→ 新增預約 ✅（type:first, date:2026-05-14, time:10:00, id:efded510, status:pending）→ 列表確認出現 ✅（ID efded510 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: testdev0514a, id:bbf28b64）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ✅（200 OK，status:completed，DB 確認 completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ DB 確認該病人已不存在（mysql 直接查詢empty）→ GET /api/patients/:id 未測試（token過期需重新取得）；搜索列表確認消失 ✅（search=TEST-0514-MAX → found:0）→ 已清理
- **K01-K17**: 所有已知問題狀態不變，無新問題發現；K15 本次未觸發（列表正常消失）
- No new issues found

### 2026-05-14 06:08 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 26 patients, 17 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0514-MAX, id:357d2743）→ 新增預約 ✅（type:first, date:2026-05-14, time:10:00, id:c8df4578, status:pending）→ 列表確認出現 ✅（ID c8df4578 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: testdev0514, id:dd76c54b）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ✅（200 OK，status:completed，DB 確認）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ DB 確認該病人已不存在 → GET 列表確認消失 ✅（search=TEST-0514-MAX → found:0）→ 已清理
- **K01-K17**: 所有已知問題狀態不變，無新問題發現；K15 本次未觸發（列表正常消失）
- No new issues found

### 2026-05-08 18:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0508-MAX, id:ee016bb6）→ 新增預約 ✅（type:first, date:2026-05-08, time:09:00, id:a1aefc4e）→ DB 直接確認寫入 ✅（status=pending）；K17 未觸發，本次順利寫入
- Test b) admin → 新增用戶 ✅（username: devtest0508, id:6b487774）→ DB 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（200 OK, status: checked-in，DB 確認）→ `checked-in→completed` ✅（200 OK, DB 確認 status=completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ DB 確認該病人已不存在 → 已清理
- **K01-K17**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-05-12 18:08 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 25 patients, 16 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0512-MAX, id:b3498f1e）→ 新增預約 ✅（type:followup, date:2026-05-12, time:14:00, id:ac124c8d, status:pending）→ 列表確認出現 ✅（ID ac124c8d 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: testdev0512f, id:0feb3de6）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ✅（200 OK，status:completed，DB 確認）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ DB 確認該病人已不存在 → GET API 列表確認消失 ✅（search=TEST-0512-MAX → found:0）→ 已清理
- **K01-K17**: 所有已知問題狀態不變，無新問題發現；K15 本次未觸發（列表正常消失）
- No new issues found

### 2026-05-12 06:08 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 25 patients, 16 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0512-MAX, id:31cc873d）→ 新增預約 ✅（type:followup, date:2026-05-12, time:10:00, id:8e3a134c, status:pending）→ 列表確認出現 ✅（ID 8e3a134c 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: testdev0512, id:9653abda）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ✅（200 OK，status:completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ GET 列表確認消失 ✅（search=TEST-0512-MAX → found:0）→ 已清理
- **K01-K17**: 所有已知問題狀態不變，無新問題發現；K15 本次未觸發（列表正常消失）
- No new issues found

### 2026-05-11 18:08 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 25 patients, 16 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0518-MAX, id:a3311a55）→ 新增預約 ✅（type:first, date:2026-05-18, time:09:00, id:c3366069, status:pending）→ 列表確認出現 ✅（ID c3366069 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: devtest0518, id:ba021bf4）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ✅（200 OK，status:completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ API 列表確認消失 ✅ → DB 確認已刪除 → 已清理
- **K01-K17**: 所有已知問題狀態不變，無新問題發現；K15 本次未觸發（列表正常消失）
- No new issues found

### 2026-05-11 14:08 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 25 patients, 16 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-05110609, id:b8dd3f80）→ 新增預約 ✅（type:first, date:2026-05-11, time:09:00, id:cd44c305, status:pending）→ 列表確認出現 ✅（ID cd44c305 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: devtest05110610, id:634f6b02）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ✅（200 OK，DB 確認 status=completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ DB 確認刪除（mysql 直接查詢無該病人）；⚠️ GET /api/patients 列表仍返回該病人（K15 未修復）
- **K01-K17**: K15 仍未修復（見 K15 描述）；其餘已知問題狀態不變，無新問題發現
- No new issues found

### 2026-05-11 07:12 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 25 patients, 16 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0510-MAX, id:f89155b5）→ 新增預約 ✅（type:first, date:2026-05-10, time:09:00, id:8067cb35, status:pending）→ 列表確認出現 ✅（ID 8067cb35 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: devtest0510, id:f7825fc0）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，status:checked-in）→ `checked-in→completed` ✅（200 OK，status:completed）
- Test d) doctor 刪除病人 → ✅ 後端正確拦截（「您沒有delete權限」）；admin token 刪除 ✅ → 列表確認消失 → 已清理
- **K01-K17**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-05-10 18:08 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 25 patients, 16 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-05101811, id:35138f8f）→ 新增預約 ✅（type:first, date:2026-05-15, time:10:00, id:bdfe0c44, status:pending）→ 列表確認出現 ✅（ID bdfe0c44 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: devtest05101811, id:5830221d）→ 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，200 OK，DB 確認 status=checked-in）→ `checked-in→completed` ✅（200 OK，DB 確認 status=completed）
- Test d) doctor 刪除病人 → ✅ 後端正確拦截（「您沒有delete權限」），但需以 admin token 或 header 才能成功刪除
- **K01-K17**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-05-10 06:08 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- DB: 25 patients, 16 appointments
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0510-MAX, id:e67869f4）→ 新增預約 ✅（type:first, date:2026-05-10, time:09:00, id:53cd6026, status:pending）→ 列表確認出現 ✅（ID 53cd6026 確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: devtest0510, id:4839b02f）→ DB 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（200 OK, DB 確認 status=checked-in）→ `checked-in→completed` ✅（200 OK, DB 確認 status=completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ DB 確認已不存在 → 已清理
- **K01-K17**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-05-09 18:08 (本次)
- **後端運行中** ✅（`/api/health` 回應 `{"status":"ok","message":"EMR System API is running"}`）
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0509-MAX, id:edcefa08）→ 新增預約 ✅（type:first, date:2026-05-09, time:14:00, id:dd12f12a, status:pending）→ DB 直接確認寫入 ✅
- Test b) admin → 新增用戶 ✅（username: devtest0509c, id:aa4efa41）→ DB 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（PUT /api/appointments/:id，DB 確認 status=checked-in）→ `checked-in→completed` ✅（DB 確認 status=completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ DB 確認已不存在 → 已清理
- **K01-K17**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-05-09 06:08 (本次)
- **後端重啟**：後端進程不在，需重啟 → 已啟動（`backend/src/server.js`，PID 3740414），`/api/health` 回應 ✅
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0509-MAX, id:24ae3a0f）→ 新增預約 ✅（type:first, date:2026-05-09, time:09:00, id:e21c3529）→ DB 直接確認寫入 ✅（status=pending）；K17 未觸發，順利寫入
- Test b) admin → 新增用戶 ✅（username: devtest0509, id:83964f38）→ DB 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（200 OK, status: checked-in）→ `checked-in→completed` ✅（200 OK, DB 確認 status=completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ DB 確認已不存在 → 已清理
- **K01-K17**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-05-08 06:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0508A-MAX, id:c3b34f16）→ 新增預約 ✅（type:first, date:2026-05-08, time:09:00, id:95238af2）→ DB 確認寫入 ✅（status=pending）
- Test b) admin → 新增用戶 ✅（username: devtest0508, id:c048b77c）→ DB 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（200 OK, status: checked-in）→ `checked-in→completed` ✅（200 OK, DB 確認 status=completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ GET 回 HTTP 404 ✅ → 已清理
- **K01-K17**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-05-05 18:08 (本次)

### 2026-05-06 06:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0506A-MAX, id:e3d75928）→ 新增預約 ✅（type:first, date:2026-05-06, time:09:00, id:ccacad39）→ 列表確認出現 ✅（APT_ID ccacad39 已確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: devtest0506, id:5503cb1e）→ DB 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅ → `checked-in→completed` ✅（DB 直接確認 status=completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ GET 回 HTTP 404 ✅ → 已清理
- **K01-K16**: 所有已知問題狀態不變，無新問題發現

### 2026-05-07 18:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0507B-MAX, id:1bcb629e）→ 新增預約 ✅（type:first, date:2026-05-07, time:15:00, id:dc5ebe91）→ GET /appointments/:id 確認 ✅
  - ⚠️ 首次執行時 appointment 返回 201+UUID 但未寫入 DB（K17）；重測後正常寫入；非確定性問題
- Test b) admin → 新增用戶 ✅（username: devtest0507f, id:fb1c9051）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（200 OK, status: checked-in）→ `checked-in→completed` ✅（200 OK, DB 確認 status=completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ GET 回 HTTP 404 ✅ → 已清理
- **K17 發現**：預約創建 POST 返回 201 + 有效 UUID，但非確定性未持久化到 DB；懷疑 transaction 時序問題；已追加至 Known Issues
- **K01-K16, K17**: 其餘已知問題狀態不變

### 2026-05-07 06:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0507B-MAX, id:9cccc3b8）→ 新增預約 ✅（type:first, date:2026-05-07, time:10:00, id:a554459d）→ 列表確認出現 ✅（APT_ID a554459d 存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: devtest0507, id:145230b1）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（200 OK, status: checked-in）→ `checked-in→completed` ✅（200 OK, DB 確認 status=completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ GET 回 HTTP 404 ✅ → 已清理
- **K01-K16**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-05-06 18:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0506D-MAX, id:40bb0b48）→ 新增預約 ✅（type:first, date:2026-05-06, time:15:00, id:455856a8）→ 列表確認出現 ✅（APT_ID 455856a8 存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: devtest0506d, id:b6ed6f18）→ DB 確認寫入成功 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅（200 OK）→ `checked-in→completed` ✅（200 OK, DB 確認 status=completed）
- Test d) admin 刪除病人 → ✅ 成功刪除（message:病人已刪除）→ GET 回 HTTP 404 ✅ → 已清理
- **K01-K16**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-05-04 18:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0504B-MAX, id:a273c646）→ 新增預約 ✅（type:first, date:2026-05-04, time:14:00, id:047194a8）→ 列表確認出現 ✅
- Test b) admin → 新增用戶 ✅（username: devtest0504b, id:8dbcc8bf）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 → `pending→checked-in` ✅ → `checked-in→completed` ✅（DB 即時確認寫入）
- Test d) admin 刪除病人 → ✅ 成功刪除 → HTTP 404 ✅ → 已清理
- **K01-K16**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-05-04 06:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0504A-MAX, id:e3b0a347）→ 新增預約 ✅（type:first, date:2026-05-04, time:10:00, id:179812a7）→ 列表確認出現 ✅（K12 body 方式 ✅）
- Test b) admin → 新增用戶 ✅（username: devtest0504, id:c3332fb8）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 → completed ✅（DB 直接確認寫入成功）；⚠️ `pending→checked-in`（PUT /api/appointments/:id + body `{"status":"checked-in"}`）→ 500 伺服器錯誤，但 `pending→completed` 直接成功；`checked-in` → `completed` 也成功；`booked`（新狀態）→ `checked-in` 失敗；懷疑與狀態轉移時的時序或資料庫欄位約束有關；已發現 `updateAppointment` 直接寫 status 到 ENUM 欄位（不檢查 current_status），而 `checkInAppointment`/`completeAppointment` 有狀態轉移檢查；目前 GET list 直接確認 ✅
- Test d) admin 刪除病人 → ✅ 成功刪除，「病人已刪除」確認 → HTTP 404 ✅ → 已清理
- **K13-K15**: 狀態不變
- **K16 結案**：初次 `checked-in` 500 是因為測試用 appointment 早已 `completed`，並非 API 問題；使用全新 pending appointment 測試，`pending→checked-in`→`checked-in→completed` 全部 ✅
- **密碼修正**：init-data.js 使用 `doctor123`/`admin123`，cron 測試舊指引使用 `clinic123` 導致登入失敗；已使用正確密碼完成所有測試
- **K01-K15**: 其餘已知問題狀態不變

### 2026-05-03 06:08 (上次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0503E-MAX, id:28a7bc20）→ 新增預約 ✅（type:first, date:2026-05-03, time:10:00, id:928fbee5）→ ⚠️ 列表確認失敗：GET /api/appointments 可見所有 appointments（包括新建的），但 POST /api/appointments {date:'2026-05-03'} 返回 400；使用 GET /api/appointments（無 filter）確認 appointment 存在 ✅
- Test b) admin → 新增用戶 ✅（username: devtest0503e, id:11ea8dfc）→ ⚠️ 用戶存在於 DB（mysql 直接確認），但 GET /api/users 返回以數字 index 作為 key 的 array（非 `users` key），測試 script `.users` 存取失敗；實際資料正常 → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→DB確認) ✅（status 已確認寫入）
- Test d) admin 刪除病人 → ✅ 成功刪除，「病人已刪除」確認 → HTTP 404 ✅ → 已清理
- **K13 發現**：GET /api/appointments（無參數）✅ 正常；POST /api/appointments {date} 返回 400「診症日期為必填項」（與 K12 相關，body 方式對 list 操作也有問題？）
- **K14 發現**：GET /api/users 回應格式異常（array 作為 numeric keys 而非 `users` array），可能影響前端顯示
- **K01-K12**: 其餘已知問題狀態不變

### 2026-05-02 18:08 (上次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0502A-MAX, id:57d20fe6）→ 新增預約 ✅（type:first, date:2026-05-02, time:14:00, id:c1285bc4）→ 列表確認出現 ✅（K12 body 方式 ✅，query param 方式需用 body）
- Test b) admin → 新增用戶 ✅（username: devtest0502b, id:見用戶列表）→ 確認存在於用戶列表 ✅（共30人）→ 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→列表確認) ✅（completed 狀態已確認寫入）
- Test d) admin 刪除病人 → ✅ 成功刪除，「病人已刪除」確認 → HTTP 404 ✅ → 已清理
- **K01-K12**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-05-02 06:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0502-MAX, id:f1d32089）→ 新增預約 ✅（type:first, date:2026-05-02, time:09:00, id:d43854dd）→ 列表確認出現 ✅（K12 body 方式 ✅）
- Test b) admin → 新增用戶 ✅（username: devtest0502, id:b026ebc8）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→列表確認) ✅（completed 狀態已確認寫入）
- Test d) admin 刪除病人 → ✅ 成功刪除，「病人已刪除」確認 → HTTP 404 ✅ → 已清理
- **K01-K12**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-05-01 18:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0501-MAX, id:fd454fda）→ 新增預約 ⚠️ K12：API 要求 `patient_id` 在 request body，`?patient_id=X` 方式失效；改用 body 方式後 ✅（type:first, date:2026-05-01, time:10:00, id:15ad564e）→ 列表確認出現 ✅
- Test b) admin → 新增用戶 ✅（username: devtest0501, id:a93bf8ee）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→列表確認) ✅
- Test d) admin 刪除病人 → ✅ 成功刪除，「病人已刪除」確認 → HTTP 404 ✅ → 已清理
- **K12 發現**：POST `/api/appointments` 要求 `patient_id` 在 request body，但 cron 測試歷史長期使用 `?patient_id=X`（query param），導致 400；真實前端是否受影響待確認
- **K01-K11**: 其餘已知問題狀態不變

### 2026-04-30 18:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0430-MAX, id:ff907fd3）→ 新增預約 ✅（type:first, date:2026-04-30, time:10:00, id:ceb0d38e）→ 列表確認出現 ✅（ID ceb0d38e 確認存在於 appointments 列表）
- Test b) admin → 新增用戶 ✅（username: devtest0430, id:31b4c252）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→列表確認) ✅（completed 狀態已確認寫入）
- Test d) admin 刪除病人 → ✅ 成功刪除，「病人已刪除」確認 → 再次查詢 GET /patients/:id → HTTP 404 ✅ → 已清理
- **K01-K11**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-04-30 06:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0430B-MAX, id:f22f4a8c）→ 新增預約 ✅（type:first, date:2026-04-30, time:10:00, id:f22f4a8c）→ 列表確認出現 ✅（appointments 陣列長度=1，ID 完全吻合）
- Test b) admin → 新增用戶 ✅（username: devtest0430, id:855d9796）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→列表確認) ✅
- Test d) admin 刪除病人 → ✅ 成功刪除，「病人已刪除」確認 → 「病人不存在」確認 ✅ → 已清理
- **K01-K11**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-04-29 18:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0429-MAX, id:b8ff73db）→ 新增預約 ✅（type:first, date:2026-04-29, time:14:00, id:922b94e9）→ 列表確認出現 ✅
- Test b) admin → 新增用戶 ✅（username: devtest0429, id:6ff2c6fe）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→列表確認) ✅
- Test d) admin 刪除病人 → ✅ 成功刪除，「病人不存在」確認消失 ✅ → 已清理
- **K01-K11**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-04-28 18:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0428-MAX, id:d62316fd）→ 新增預約 ✅（type:first, date:2026-04-28, time:09:00, id:f40745cd）→ 列表確認出現 ✅
- Test b) admin → 新增用戶 ✅（username: devtest0428, id:43607894）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→列表確認) ✅
- Test d) admin 刪除病人 → ✅ 成功刪除，GET 回? 404，「病人已刪除」確認 ✅
- **K01-K11**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-04-28 06:08 (本次)

### 2026-04-27 18:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0427-MAX2, id:66e2c0e8）→ 新增預約 ✅（type:first, date:2026-04-27, time:14:00, id:359be1f9）→ 列表確認出現 ✅
- Test b) admin → 新增用戶 ✅（username: devtest0427b, id:1950b287）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→列表確認) ✅
- Test d) admin 刪除病人 → ✅ 成功刪除，「病人不存在」確認消失 ✅
- **K01-K11**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-04-27 06:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0427-MAX, id:0fdea9c3）→ 新增預約 ✅（type:first, date:2026-04-27, time:10:00, id:d31247ba）→ 列表確認出現 ✅（`?date=2026-04-27` 查詢成功）
- Test b) admin → 新增用戶 ✅（username: devtest0427）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→列表確認) ✅（PUT /api/appointments/:id，需用 PUT 非 /status endpoint）
- Test d) admin 刪除病人 → ✅ 成功刪除，「病人不存在」確認消失 ✅
- **K01-K11**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-04-26 18:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0426-MAX, id:20dfb55f）→ 新增預約 ✅（type:first, date:2026-04-26, time:10:00, id:337afe8d）→ 列表確認出現 ✅
- Test b) admin → 新增用戶 ✅（username: devtest0426180929）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→list確認) ✅
- Test d) admin 刪除病人 → ✅ 成功刪除，「病人不存在」確認消失 ✅
- **K01-K11**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-04-26 06:08 (上次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0425-MAX, id:74d45370）→ 新增預約 ✅（type:first, date:2026-04-25, time:14:00, id:ba82fe66）→ 列表確認出現 ✅
- Test b) admin → 新增用戶 ✅（username: devtest0425）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→list確認) ✅
- Test d) doctor1 嘗試刪除病人 → ✅ 後端正確拦截（「您沒有delete權限」）
- Test d) admin 刪除病人 → ✅ 成功刪除，DB COUNT 從 1→0，病人從系統消失 ✅
- **K01-K11**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-04-25 06:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0425-001, id:1657b386）→ 新增預約 ✅（type:first, date:2026-04-25, id:3e00bf55）→ 列表確認出現 ✅
- Test b) admin → 新增用戶 ✅（username: devtest0425）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→list確認) ✅
- Test d) doctor1 嘗試刪除病人 → ✅ 後端正確拦截（「您沒有delete權限」）
- Test d) admin 刪除病人 → ✅ 成功刪除，DB COUNT 從 1→0，病人從系統消失 ✅
- **K01-K11**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-04-24 18:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0424-001）→ 新增預約 ✅（type:first, date:2026-04-24, id:fd23f85d）→ 列表確認出現 ✅
- Test b) admin → 新增用戶 ✅（username: devtest0424）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→list確認) ✅
- Test d) doctor1 嘗試刪除病人 → ✅ 後端正確拦截（「您沒有delete權限」）
- Test d) admin 刪除病人 → ✅ 成功刪除，DB COUNT 從 1→0，病人從系統消失 ✅
- **K02-K11**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-04-21 18:08 (本次)

### 2026-04-22 18:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0422-001）→ 新增預約 ✅（type:first, date:2026-04-22, id:b3f43041）→ 列表確認出現 ✅
- Test b) admin → 新增用戶 ✅（username: devtest0422）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→list確認) ✅
- Test d) doctor1 嘗試刪除病人 → ✅ 後端正確拦截（「您沒有delete權限」）
- Test d) admin 刪除病人 → ✅ 成功刪除，DB COUNT 從 1→0，病人從系統消失 ✅
- **K02-K11**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-04-22 06:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0422-001）→ 新增預約 ✅（type:first, date:2026-04-22, id:2a3afb58）→ 列表確認出現 ✅
- Test b) admin → 新增用戶 ✅（username: devtest0422）→ 確認存在於用戶列表 ✅ → 已清理
- Test c) 預約狀態更新 (pending→checked-in→completed→list確認) ✅
- Test d) doctor1 嘗試刪除病人 → ✅ 後端正確拦截（「您沒有delete權限」）
- Test d) admin 刪除病人 → ✅ 成功刪除，DB COUNT 從 1→0，病人從系統消失 ✅
- **K02-K11**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-04-21 06:08 (本次)
- Test a) doctor1 → 新增病人 ✅（patient_number: TEST-0421-001）→ 新增預約 ✅（`date` 欄位，`type:first`）→ 出現在列表 ✅
- Test b) admin → 新增用戶 ✅（username: devtest0421）→ 確認存在於用戶列表 ✅
- Test c) 預約狀態更新 (pending→checked-in→completed→list確認) ✅
- Test d) doctor1 嘗試刪除病人 → ✅ 後端正確拦截（403: 您沒有delete權限）
- Test d) admin 刪除病人 → ✅ 成功刪除，病人從系統消失 ✅
- **K02-K11**: 所有已知問題狀態不變，無新問題發現
- No new issues found

### 2026-04-20 06:08 (上次)
- Test a) doctor1 → 新增病人 ✅（patient_number 必填）→ 新增預約 ✅（`date` 欄位，`type:followup`）→ 出現在列表 ✅
- Test b) admin → 新增用戶 ✅ → 確認存在於用戶列表 ✅
- Test c) 預約狀態更新 (pending→checked-in→completed→list確認) ✅
- Test d) doctor 刪除病人 → ✅ 後端正確拦截（403: 您沒有delete權限）
- Test d) admin 刪除病人 → ✅ 成功刪除，列表確認消失 ✅
- **K11 仍未修復**：後端 API `POST /appointments` 仍只接受 `date` 欄位，`appointment_date` 導致「診症日期為必填項」
- **K10 未修復**：前端新25欄重構（13.13，P0）仍待開發
- No new issues found

### 2026-04-17 18:08 (上次)
- Test a) doctor1 → 新增病人 ✅ → 新增預約 ✅（用 `date` 欄位成功）→ ⚠️ K11 仍存在（`appointment_date` 仍被後端忽略）
- Test b) admin → 新增用戶 ✅ → 確認存在 ✅
- Test c) 預約狀態更新 (pending→checked-in→completed) ✅
- Test d) doctor 刪除病人 → ✅ 後端正確拦截
- Test d) admin 刪除病人 → ✅ 成功刪除，列表確認消失
- **K11 仍未修復**：後端建立/更新預約使用 `date` 欄位，`appointment_date` 仍回「診症日期為必填項」
- K10: 前端病人頁面配合新25欄重構 — 仍在待開發（13.13，P0）

### 2026-04-16 18:10 (上次)
- Test a) doctor1 → 新增病人 ✅ → 新增預約 ⚠️ K11 仍存在（`appointment_date` 欄位被後端忽略，須用 `date`）
- Test b) admin → 新增用戶 ✅ → 確認存在 ✅
- Test c) 預約狀態更新 (pending→checked-in→completed) ✅（需用 PUT 非 PATCH）
- Test d) doctor 刪除病人 → ✅ 後端正確拦截（需再驗證）
- Test d) admin 刪除病人 → ✅ 成功，列表確認消失
- **K11 仍未修復**：後端 Controller 統一使用 `req.body.date` 和 `req.query.date`，前端表單傳 `appointment_date` 導致新建預約失敗

### 2026-04-15 18:08 (上次)
- Test a) doctor1 登入 → 新增病人 ✅ → 新增預約 ⚠️ (需用 `date` 而非 `appointment_date`，K11)
- Test b) admin 登入 → 新增用戶 ✅ → 確認存在 ✅
- Test c) 預約狀態更新 (pending→checked-in→completed) ✅
- Test d) 刪除病人（doctor）✅ 正確被後端權限拦截
- Test d) 刪除病人（admin）✅ 成功刪除，列表確認消失
- **New Issue Found**: K11 - 預約 API `date` vs `appointment_date` 欄位不一致
  - 後端 Controller 讀取 `req.body.date`（欄位名即 `date`）
  - 但前端表單可能傳 `appointment_date`，導致 400 「診症日期為必填項」
  - GET 列表查詢則用 query `appointment_date`，三者不一致
  - 建議：統一改後端支援 `appointment_date`（更明確的欄位名）
---

## 0.1 待解決問題 (Known Issues)

| 優先 | ID | 模組 | 問題描述 | 備註 |
|------|----|------|---------|------|
| ✅ P0 | K01 | ~~前端保安~~ | ~~Doctor 可刪除任意病人，需修正後端權限或前端限制~~ → 已解決：後端 requirePermission 攔截 + 前端 admin 可見刪除鈕 | 高優先 |
| P0 | K02 | 後端效能 | slow_query_log 未開啟，大量查詢無優化；建議建立必要索引 | 高優先 |
| P1 | K03 | 前端日誌 | 日誌頁面及功能不完整 | 中優先 |
| P1 | K04 | 前端效能 | 前端過度請求問題，懶加載未全面實施 | 中優先 |
| P1 | K05 | 病人就診 | PatientDetail 未顯示同一病人前一次 SOAP 就診記錄 | 中優先 |
| P1 | K06 | 前端審核 | 刪改操作未完整記錄操作人員身份 | 中優先 |
| P1 | K07 | 前端效能 | 全部模組一口氣請求，影響首頁載入速度 | 中優先 |
| P2 | K08 | 身份驗證 | 只支援帳號密碼登入，無雙重驗證（2FA）| 低優先 |
| ✅ P1 | K09 | 預約 API | 錯誤訊息誤導：「病人編號和診症日期為必填項」但實際是 `type` 欄位 enum 不接受 `new/follow-up`，後端 log 可見 `Data truncated for column 'type'`；前端傳 `type:new` 或 `type:follow-up` 均失敗，需用 `first/followup/urgent` | 中優先 |
| P0 | K10 | 前端病人頁面 | 病人資料庫結構已更新（新增 emergency_contact_phone2、contact_address、emergency_contact_address、name_en、id_type、gold_card_number、insurance_type、insurance_number 等欄位），前端表單及列表頁尚未配合重構 | 高優先 |
| ✅ P0 | K11 | 預約 API 欄位不一致 | → 已解決：`appointments.type` 預設值改為 `followup`，前後端統一使用 `date` 欄位（`681b521`）| 高優先，影響新建預約功能 |
| P0 | K12 | 預約 POST API `patient_id` 位置不一致 | 後端 `createAppointment` 讀取 `req.body.patient_id`（需在 JSON body），但 cron 測試長期使用 `?patient_id=X`（query param），導致 400「病人編號為必填項」；API 本體正常（body 方式 ✅），需修正 cron 測試指引；真實前端是否有相同問題待確認 | 高優先 |
| P0 | K13 | 預約列表 API POST body 方式失效 | POST `/api/appointments` 作為列表查詢時（用 `date` filter），後端回應 400「診症日期為必填項」；懷疑後端 GET handler 對某些路徑有特殊處理，POST body 方式不符合預期；GET /api/appointments（無參數）✅ 正常 | 高優先 |
| P0 | K14 | 用戶列表 API 回應格式異常 | GET `/api/users` 回應為 array 但以數字 index 作為 key（非 `users` 陣列包裝），導致 client 端 `.users` 存取失敗；真實前端是否受影響待確認 | 高優先 |
| P0 | K15 | 病人刪除 API 回應異常 | DELETE `/api/patients/:id` 回應 `200 {"message":"病人已刪除"}` 但病人仍在列表；DB 確認刪除成功（mysql 直接查詢無該病人），懷疑 GET `/api/patients` 有快取或返回意外格式；需檢查後端刪除後的列表查詢邏輯 | 高優先 |
| P0 | K17 | 預約創建非確定性持久化 | 預約 POST 有時返回 201 + 有效 UUID，但資料未實際寫入資料庫（mysql 直接查詢無該記錄）；第二次測試可正常創建並查詢到；懷疑後端在異步流程中 transaction 延遲 rollback 或 commit 時序問題；cron 測試已多次重現 | 高優先 |
| P0 | K18 | 前端創建預約請求格式錯誤 | `POST /api/appointments` 時前端 JSON 格式錯誤：`"patientId":,"doctorId"`（`patientId` 為空值導致 `,` 殘留，且 `doctorId` 丢失）；懷疑某些場景下 `currentConsultation.patient.id` 或 `user?.id` 為空，序列化時產生畸形 JSON；已多次重現於真實用戶操作 | 高優先 |
| P0 | K19 | 預約 `checked-in→completed` 回傳「預約不存在」| `pending→checked-in` ✅ 成功，但 `checked-in→completed`（PUT /api/appointments/:id）返回 `{"error":"預約不存在"}`；懷疑 `completeAppointment` 使用 `current_status` 欄位查詢，但 appointments 表只有 `status` 欄位（無 `current_status`）；2026-05-18 18:08 首次發現 | 高優先 |

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
| R08 | K11 預約 API 欄位不一致 | ~~後端 `date` vs 前端 `appointment_date`~~ 前後端統一使用 `date`，`type` 預設值改為 `followup` | `681b521` |
| R09 | K09 預約 API type 驗證 | ~~錯誤訊息誤導「病人編號和診症日期為必填項」~~ 後端新增 type ENUM 驗證 + 清楚錯誤訊息 + normalizeAppointmentType | `945511a` |
| R10 | K16 預約狀態更新 `checked-in` | ~~`pending→checked-in` 返回 500~~ 已驗證非 API 問題（測試用 appointment 已 completed）；全新 pending appointment 全流程正常 | 已驗證 |


## 1. 資料庫結構 (Database Schema)

> ⚠️ **注意**：日後若有資料庫結構變更，請同步更新本節。若同時有 init.sql 變更，請在 commit 訊息中標註「含資料庫結構變更」。

共 14 張資料表：

---

### 1.1 patients（病人資料）
| 欄位 | 類型 | 可空 | 鍵 | 預設 | 說明 |
|------|------|------|----|------|------|
| id | varchar(36) | NO | PRI | | UUID 主鍵 |
| patient_number | varchar(20) | NO | UNI | | 病人編號 |
| medical_number | varchar(50) | YES | UNI | | 醫療卡號 |
| name | varchar(100) | NO | MUL | | 姓名 |
| name_en | varchar(100) | YES | | | 英文姓名 |
| gender | varchar(20) | YES | | | 性別 |
| birth_date | date | YES | | | 出生日期 |
| gold_card_number | varchar(50) | YES | UNI | | 金卡號 |
| id_card | varchar(20) | YES | | | 身份證號 |
| id_type | varchar(20) | YES | | | 證件類型 |
| phone | varchar(20) | YES | | | 電話 |
| phone2 | varchar(30) | YES | | | 電話2 |
| email | varchar(100) | YES | | | 電郵 |
| address | text | YES | | | 地址 |
| contact_address | text | YES | | | 聯絡地址 |
| emergency_contact | varchar(100) | YES | | | 緊急聯絡人 |
| emergency_contact_address | text | YES | | | 緊急聯絡人地址 |
| emergency_phone | varchar(20) | YES | | | 緊急聯絡人電話 |
| emergency_contact_phone2 | varchar(30) | YES | | | 緊急聯絡人電話2 |
| insurance_type | varchar(50) | YES | | | 保險類型 |
| insurance_number | varchar(50) | YES | | | 保險號碼 |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP | 創建時間 |
| created_by | varchar(36) | NO | | | 創建人 ID |
| created_by_name | varchar(100) | NO | | | 創建人姓名 |
| updated_at | timestamp | YES | | CURRENT_TIMESTAMP | 更新時間 |

---

### 1.2 users（使用者）
| 欄位 | 類型 | 可空 | 鍵 | 預設 | 說明 |
|------|------|------|------|------|------|
| id | varchar(36) | NO | PRI | | UUID 主鍵 |
| username | varchar(50) | NO | UNI | | 登入帳號 |
| password | varchar(255) | NO | | | 密碼（bcrypt）|
| name | varchar(100) | NO | | | 姓名 |
| role | enum('admin','staff','doctor','nurse','patient') | NO | MUL | | 角色 |
| title | varchar(50) | YES | | | 職稱 |
| bio | text | YES | | | 個人簡介 |
| gender | enum('male','female','other','unspecified') | YES | | unspecified | 性別 |
| avatar | varchar(255) | YES | | | 頭像 URL |
| is_active | tinyint(1) | YES | | 1 | 是否啟用 |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP | 創建時間 |
| updated_at | timestamp | YES | | CURRENT_TIMESTAMP | 更新時間 |

---

### 1.3 appointments（預約）
| 欄位 | 類型 | 可空 | 鍵 | 預設 | 說明 |
|------|------|------|------|------|------|
| id | varchar(36) | NO | PRI | | UUID 主鍵 |
| patient_id | varchar(36) | NO | MUL | | 病人 ID |
| doctor_id | varchar(36) | YES | MUL | | 醫生 ID |
| date | date | NO | MUL | | 診症日期 |
| time | time | YES | | | 診症時間 |
| type | enum('first','followup','urgent') | YES | | followup | 預約類型 |
| status | enum('pending','checked-in','completed','cancelled') | YES | MUL | pending | 狀態 |
| notes | text | YES | | | 備註 |
| cancel_reason | text | YES | | | 取消原因 |
| cancel_document_url | varchar(255) | YES | | | 取消文件 URL |
| consultation_type | enum('consultation','other') | YES | | consultation | 診症類型 |
| consultation_notes | text | YES | | | 診症備註 |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP | 創建時間 |
| updated_at | timestamp | YES | | CURRENT_TIMESTAMP | 更新時間 |

---

### 1.4 soap_notes（診症記錄）
| 欄位 | 類型 | 可空 | 鍵 | 預設 | 說明 |
|------|------|------|------|------|------|
| id | varchar(36) | NO | PRI | | UUID 主鍵 |
| patient_id | varchar(36) | NO | MUL | | 病人 ID |
| visit_date | date | NO | | | 就診日期 |
| subjective | text | YES | | | 主觀症狀（S）|
| objective | text | YES | | | 客觀發現（O）|
| assessment | text | YES | | | 評估（A）|
| plan | text | YES | | | 計劃（P）|
| doctor_id | varchar(36) | NO | MUL | | 醫生 ID |
| notes | text | YES | | | 額外備註 |
| appointment_id | varchar(36) | YES | MUL | | 關聯預約 ID |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP | 創建時間 |
| updated_at | timestamp | YES | | CURRENT_TIMESTAMP | 更新時間 |

---

### 1.5 prescriptions（處方）
| 欄位 | 類型 | 可空 | 鍵 | 預設 | 說明 |
|------|------|------|------|------|------|
| id | varchar(36) | NO | PRI | | UUID 主鍵 |
| patient_id | varchar(36) | NO | MUL | | 病人 ID |
| doctor_id | varchar(36) | NO | MUL | | 醫生 ID |
| appointment_id | varchar(36) | YES | MUL | | 關聯預約 ID |
| date | date | NO | | | 開方日期 |
| notes | text | YES | | | 備註 |
| status | enum('active','filled','expired') | YES | | active | 狀態 |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP | 創建時間 |
| updated_at | timestamp | YES | | CURRENT_TIMESTAMP | 更新時間 |

---

### 1.6 prescription_medications（處方藥物）
| 欄位 | 類型 | 可空 | 鍵 | 預設 | 說明 |
|------|------|------|------|------|------|
| id | varchar(36) | NO | PRI | | UUID 主鍵 |
| prescription_id | varchar(36) | NO | MUL | | 處方 ID |
| name | varchar(100) | NO | | | 藥物名稱 |
| dosage | varchar(50) | NO | | | 劑量 |
| frequency | varchar(100) | NO | | | 用法頻率 |
| route | enum('oral','topical','injection','inhalation','other') | NO | | | 給藥途徑 |
| duration | int | NO | | | 療程天數 |

---

### 1.7 documents（病人文件）
| 欄位 | 類型 | 可空 | 鍵 | 預設 | 說明 |
|------|------|------|------|------|------|
| id | varchar(36) | NO | PRI | | UUID 主鍵 |
| patient_id | varchar(36) | NO | MUL | | 病人 ID |
| category | enum('lab','imaging','surgery','other') | NO | MUL | | 文件類別 |
| name | varchar(255) | NO | | | 文件名稱 |
| file_type | varchar(50) | YES | | | 檔案類型 |
| file_url | varchar(500) | NO | | | 檔案 URL |
| file_size | int | YES | | | 檔案大小 |
| uploaded_by | varchar(36) | NO | MUL | | 上傳者 ID |
| uploaded_at | timestamp | YES | | CURRENT_TIMESTAMP | 上傳時間 |

---

### 1.8 vital_signs（生命體徵）
| 欄位 | 類型 | 可空 | 鍵 | 預設 | 說明 |
|------|------|------|------|------|------|
| id | varchar(36) | NO | PRI | | UUID 主鍵 |
| patient_id | varchar(36) | NO | MUL | | 病人 ID |
| temperature | decimal(4,1) | YES | | | 體溫（°C）|
| blood_pressure_systolic | int | YES | | | 收縮壓（mmHg）|
| blood_pressure_diastolic | int | YES | | | 舒張壓（mmHg）|
| heart_rate | int | YES | | | 心率（bpm）|
| respiratory_rate | int | YES | | | 呼吸率（/min）|
| oxygen_saturation | decimal(4,1) | YES | | | 血氧飽和度（%）|
| weight | decimal(5,1) | YES | | | 體重（kg）|
| height | decimal(5,1) | YES | | | 身高（cm）|
| notes | text | YES | | | 備註 |
| recorded_at | timestamp | YES | | CURRENT_TIMESTAMP | 記錄時間 |
| recorded_by | varchar(36) | NO | MUL | | 記錄者 ID |

---

### 1.9 allergies（過敏記錄）
| 欄位 | 類型 | 可空 | 鍵 | 預設 | 說明 |
|------|------|------|------|------|------|
| id | varchar(36) | NO | PRI | | UUID 主鍵 |
| patient_id | varchar(36) | NO | MUL | | 病人 ID |
| allergen | varchar(100) | NO | | | 過敏原 |
| type | enum('drug','food','environmental','other') | NO | | | 過敏類型 |
| severity | enum('mild','moderate','severe','life-threatening') | NO | | | 嚴重程度 |
| reaction | text | YES | | | 過敏反應 |
| recorded_at | timestamp | YES | | CURRENT_TIMESTAMP | 記錄時間 |

---

### 1.10 alerts（病人警示）
| 欄位 | 類型 | 可空 | 鍵 | 預設 | 說明 |
|------|------|------|------|------|------|
| id | varchar(36) | NO | PRI | | UUID 主鍵 |
| patient_id | varchar(36) | NO | MUL | | 病人 ID |
| level | enum('high','medium','low') | NO | | | 警示等級 |
| type | enum('allergy','disease','drug','other') | NO | | | 警示類型 |
| content | text | NO | | | 警示內容 |
| is_active | tinyint(1) | YES | | 1 | 是否啟用 |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP | 創建時間 |

---

### 1.11 medications（藥物資料庫）
| 欄位 | 類型 | 可空 | 鍵 | 預設 | 說明 |
|------|------|------|------|------|------|
| id | varchar(36) | NO | PRI | | UUID 主鍵 |
| name | varchar(100) | NO | MUL | | 藥物名稱 |
| generic_name | varchar(100) | YES | | | 學名 |
| dosage | varchar(50) | YES | | | 劑量 |
| route | varchar(50) | YES | | | 給藥途徑 |
| frequency | varchar(100) | YES | | | 用法頻率 |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP | 創建時間 |

---

### 1.12 icd10_codes（ICD-10 診斷碼）
| 欄位 | 類型 | 可空 | 鍵 | 預設 | 說明 |
|------|------|------|------|------|------|
| id | varchar(10) | NO | PRI | | 主鍵 |
| code | varchar(10) | NO | UNI | | ICD-10 代碼 |
| name_tc | varchar(255) | NO | | | 中文名稱 |
| name_en | varchar(255) | YES | | | 英文名稱 |
| name_pt | varchar(500) | YES | | | 葡文名稱 |
| category_tc | varchar(200) | YES | | | 所屬類別（中文）|
| category_en | varchar(200) | YES | | | 所屬類別（英文）|
| category_pt | varchar(200) | YES | | | 所屬類別（葡文）|
| created_at | timestamp | YES | | CURRENT_TIMESTAMP | 創建時間 |

---

### 1.13 audit_logs（審計日誌）
| 欄位 | 類型 | 可空 | 鍵 | 預設 | 說明 |
|------|------|------|------|------|------|
| id | varchar(36) | NO | PRI | | UUID 主鍵 |
| user_id | varchar(36) | NO | MUL | | 操作者 ID |
| action | varchar(50) | NO | | | 操作類型（CREATE/UPDATE/DELETE）|
| module | varchar(50) | NO | | | 模組名稱 |
| details | json | YES | | | 操作的具體內容（JSON）|
| ip_address | varchar(45) | YES | | | IP 地址 |
| created_at | timestamp | YES | MUL | CURRENT_TIMESTAMP | 操作時間 |

---

### 1.14 system_settings（系統設定）
| 欄位 | 類型 | 可空 | 鍵 | 預設 | 說明 |
|------|------|------|------|------|------|
| id | int | NO | PRI | AUTO_INCREMENT | 主鍵 |
| setting_key | varchar(50) | NO | UNI | | 設定鍵名 |
| setting_value | text | YES | | | 設定值 |
| description | varchar(255) | YES | | | 說明 |
| updated_at | timestamp | YES | | CURRENT_TIMESTAMP | 更新時間 |

## 13. 待開發功能 (Future Development Roadmap)

> 優先次序：P0 = 立即　P1 = 短期　P2 = 中期

### 優先次序總表

| 優先 | 編號 | 事項 | 說明 |
|------|------|------|------|
| P0 | 13.13 | 新增/修改病人頁面配合新25欄結構 | 前端表單急需對應，病人就診功能起點 |
| P0 | 13.23 | 重要資料表統一審計欄位（資料庫層面，純遷移）| 未來會逐一擴增核心資料表的資料欄位（patients、appointments、soap_notes、prescriptions、documents 等），以加入 `created_by` / `created_by_name` / `created_at` / `updated_by` / `updated_by_name` / `updated_at` 等相應欄位為目標；儘量先保持原有欄位名稱不變（已有相同意義欄位者保留原名，只做擴增不作強行改名）；每個資料表需獨立 migration；純資料庫層面遷移，**不涉及 ORM 中介軟體**，暂不修改代碼，留待未來逐一處理 |
| P1 | 13.3 | 文件上傳 | 化驗報告、影像上傳及病人文件庫 |
| P1 | 13.4 | 批量輸入預約（Excel）| 大量排班需求 |
| P2 | 13.11 | 外部系統數據互聯 | API 對接澳門衛生局 |
| P1 | 13.14 | 重新審視藥物資料表結構（ISAF 11,259筆）| ISAF 澳門藥物資料（app.isaf.gov.mo）爬蟲重寫；現有爬蟲（9,122筆）有明顯缺漏，正確應有 11,259 筆。**爬蟲邏輯（重要）**：
- 搜尋 `%%` 返回 11,259 記錄（勿用其他方式）
- 點擊任一藥品名稱 → 該連接的文字即為該藥品名稱（可能是中文/英文/葡文），**先記住此名稱**
- 按「詳情」進入詳細頁，表格第一列為「產品名稱」，該名稱 = 先前記住之名稱 + 另一語言之名稱（拼接而成）
  - 例如：若點擊時記住的是英文名，進頁後可見「產品名稱」= `「英文名 + 中文名」`，取前半為英文名（已記），後半為中文名
  - 若點擊時記住中文名，進頁後可見「產品名稱」= `「中文名 + 英文名」`，取前半為中文名，取後半為英文名
- **每個項目的第一個 `<td>`** 均為：中文字項目名 + `<br>` + 葡文字項目名 + `<br>` + 英文字項目名
- **每個項目的第二個 `<td>`** 為資料，順序固定為：`中文資料 + <br> + 葡文資料 + <br> + 英文資料`
  - **但若缺少葡文名，第二個 `<td>` 內會直接是中文 + 英文（跳過葡文位置）**，解析時需自動判斷並正確填入中文/葡文/英文欄位
- **活性成份**有多個，每個成份內含中/葡/英三語名（以單個 `<br>` 分隔），多個成份之間以**雙 `<br><br>`** 分隔
- **資料表欄位設計**：每個項目均分為中文、葡文、英文三個欄位；活性成份分為中文成份、葡文成份、英文成份（各可有多個，以指定分隔符連接）
| P1 | 13.15 | 完善的角色權限資料庫結構（RBAC）| 無法細粒度控制醫生刪除病人的問題 |
| P1 | 13.16 | SOAP 超時後不能修改 | 完成診症後鎖定記錄，不可編輯 |
| P1 | 13.17 | 診症時建立覆診預約 | 完成診症前可直接新增覆診 |
| P1 | 13.18 | 覆診跟進（醫生專屬）| 醫生建立覆診計劃，追蹤下次就診 |
| P2 | 13.19 | 文件輸出（模板系統）| 轉介專科、驗單、醫療記錄、建議書、報告書、返港 |
| P1 | 13.24 | AI 語音輔助診症（SOAP 自動填寫）| 醫生在診症過程中支援錄取與病人對話，AI 即時分析對話內容，自動生成 SOAP 記錄（主觀症狀、客觀發現、評估、計劃），醫生確認後一鍵寫入，大幅減少文書時間 |
| P2 | 13.25 | AI 病人輔助助手（僅參考病人數據）| 在病人主介面加入 AI 輔助功能，進入輔助介面後 AI 僅參考該病人的醫療記錄及文件提供意見；使用權限僅限管理員及醫生；所有問答內容及使用者身份均作記錄（審計日誌） |
| P2 | 13.26 | 線上諮詢服務（積分制）| 支援病人使用系統積分（付款）向聯網醫生發起線上諮詢，醫生接單後作答；適用於非緊急健康諮詢，系統從中收取服務費用 |
| P1 | 13.27 | 智能提醒功能 | 主動提醒醫生病人覆診期快到；同時支援護士、病人、其他人士的各自提醒場景（具體待定）|

| P1 | 13.20 | 支援多語言介面 | 中文/英文/葡文三語界面，切換靈活 |
| P1 | 13.20 | 支援多語言介面 | 中文/英文/葡文三語界面，切換靈活 |
| P1 | 13.21 | 支援系統多顏色主題 | 多套主題切換，支援深色模式 |
| P1 | 13.22 | 審計日誌自動化（Prisma $extends / TypeORM Subscriber）| **核心改變**：拋棄目前各 Controller / Service 內人手呼叫 `logAudit()` 的方式，全面改用 ORM 中介軟體自動攔截所有 UPDATE/CREATE/DELETE 操作，寫入 audit_logs 表。具體效益：① **自動獲取當前登入者 ID 和姓名**（中介軟體可直 接從 Request Context 拿），毋須每處人手傳遞；② **零遺漏**——所有經過 ORM 的操作一律自動記錄，唔會因 developer 忘記擺 `logAudit()` 而漏記；③ **代碼整潔易調試**——業務邏碼與審計日誌完全解耦。`details` 欄位已改為 MySQL JSON 型別，13.22 ORM 中介軟體自動填寫變更前後的具體差異；**與 13.23 配套**——13.23 在業務資料表擴增 created_by/updated_by 等欄位，13.22 中介軟體自動讀取並寫入 audit_logs.details，令操作完整追溯；相關 issue：K06 |
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

