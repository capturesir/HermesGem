/**
 * 將駝峰式欄位名稱轉換為蛇底式（camelCase → snake_case）
 * 用於前端表單數據與後端 API 的格式對接
 */
export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}
