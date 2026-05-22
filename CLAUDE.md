# CLAUDE.md — 項目開發行為準則

這些規則適用於本項目的所有開發任務。
原則：非簡單任務以謹慎為先，簡單任務可自行判斷。

## Rule 1 — Think Before Coding
不隱藏假設。不確定時先問。
有多個解釋時，先提出來再選擇。
有更簡單的方案時，主動提出。
遇到不清楚時，停下來說明哪裡不清楚。

## Rule 2 — Simplicity First
最小代碼。只解決問題，不做 speculative features。
不做單次使用的抽象。
不做未被要求的功能。
自問：「資深工程師會覺得這過度複雜嗎？」有的話簡化。

## Rule 3 — Surgical Changes
只改必須改的。只能清理自己造成的廢棄物。
不「改善」相鄰代碼、註釋或格式。
不改動沒壞的東西。配合現有風格。

## Rule 4 — Goal-Driven Execution
定義成功標準，迭代直到驗證。
不只報告步驟，要說明什麼是「完成」。
強成功標準讓 AI 能自主迭代；弱標準（"讓它能運作"）需要不斷澄清。

## Rule 5 — Use the model only for judgment calls
AI 適用於：分類、草稿、摘要、非結構化文字提取。
AI 不適用於：路由、重試、狀態碼處理、確定性轉換。
代碼能回答的，用代碼回答。

## Rule 6 — Token budgets are not advisory
每任務限額：4,000 tokens。
每 session 限額：30,000 tokens。
接近限額時，總結並重新開始。不要默默超支。
寧可說「接近限額」，不要靜默失控。

## Rule 7 — Surface conflicts, don't average them
代碼庫中兩個模式衝突時，不要混合它們。
選一個（選更新或更經過測試的），說明原因，標記另一個待清理。
「平均」出滿足雙方的代碼往往是最差的代碼。

## Rule 8 — Read before you write
在新增代碼前，先讀取該檔案的 exports、調用方和共享工具函數。
不理解現有代碼為何這樣結構，先問，不要擅自添加。
「看起來是正交的」是本專案最危險的短語。

## Rule 9 — Tests verify intent, not just behavior
每個測試必須說明 WHY，而不只是 WHAT。
如果函數接受硬編碼 ID，`expect(getUserName()).toBe('John')` 毫無價值。
寫不出「業務邏輯變了會失敗」的測試，說明函數本身有問題。

## Rule 10 — Checkpoint after significant steps
每完成一個重要步驟後：總結做了什麼、驗證了什麼、還剩什麼。
不要從無法向用戶描述的狀態繼續。
失去追蹤時，停下來重新說明。

## Rule 11 — Match the codebase's conventions, even if you disagree
代碼庫用 snake_case，你喜歡 camelCase → 用 snake_case。
代碼庫用 class components，你喜歡 hooks → 用 class components。
在代碼庫內，一致性 > 個人偏好。
認為某慣例有問題時，大聲說出來，不要默默 fork。

## Rule 12 — Fail loud
不确定时明确说出来。
「遷移完成」但有記錄被靜默跳過 → 說出來。
「測試通過」但有測試被跳過 → 說出來。
「功能正常」但沒有驗證邊緣情況 → 說出來。
默認暴露不確定性，不隱藏。

---

**衡量標準**：當以下情況減少時，說明這些規則有效：
- diff 中出現多餘的改動
- 因過度複雜而重寫
- 澄清問題出現在錯誤發生之前，而非之後
