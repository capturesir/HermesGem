/**
 * 日期工具函數 — 統一使用 CST (+8) 時區，與後端 CURDATE() 保持一致
 */

const CST_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * 取得當前日期（YYYY-MM-DD），使用 CST 時區
 * 例如：澳門 2026-04-07 00:30 → "2026-04-07"
 */
export function getCSTDateString(): string {
  const d = new Date(Date.now() + CST_OFFSET_MS);
  return d.toISOString().split('T')[0];
}

/**
 * 取得當前完整時間（ISO 字串），使用 CST 時區
 * 例如：澳門 2026-04-07 00:30:00 → "2026-04-07T00:30:00.000Z"
 */
export function getCSTISOString(): string {
  return new Date(Date.now() + CST_OFFSET_MS).toISOString();
}

/**
 * 將任意 Date 或 ISO 字串轉換為 CST 日期字串（YYYY-MM-DD）
 */
export function toCSTDateString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getTime() + CST_OFFSET_MS).toISOString().split('T')[0];
}

/**
 * 格式化日期顯示（中文本地化，CST 時區）
 */
export function formatDateCST(date: string | Date, locale = 'zh-TW'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // 加上 CST offset 再用 toLocaleDateString，確保顯示正確
  return new Date(d.getTime() + CST_OFFSET_MS).toLocaleDateString(locale, {
    timeZone: 'Asia/Macau',
  });
}

/**
 * 格式化時間顯示（中文本地化，CST 時區）
 */
export function formatTimeCST(date: string | Date, locale = 'zh-TW'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getTime() + CST_OFFSET_MS).toLocaleTimeString(locale, {
    timeZone: 'Asia/Macau',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 取得 CST 時區的當前年份
 */
export function getCSTYear(): number {
  return new Date(Date.now() + CST_OFFSET_MS).getUTCFullYear();
}

/**
 * 取得 CST 時區的當前月份（0-11）
 */
export function getCSTMonth(): number {
  return new Date(Date.now() + CST_OFFSET_MS).getUTCMonth();
}
