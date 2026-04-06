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

/**
 * 將蛇底式欄位名稱轉換為駝峰式（snake_case → camelCase）
 * 用於後端 API 回應數據轉換為前端 types 格式
 */
export function toCamelCase<T = Record<string, unknown>>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      const value = (obj as Record<string, unknown>)[key];
      result[camelKey] = typeof value === 'object' && value !== null ? toCamelCase(value) : value;
    }
    return result as T;
  }
  return obj as T;
}
