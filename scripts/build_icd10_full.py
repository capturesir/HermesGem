#!/usr/bin/env python3
"""
澳門 ICD-10 疾病列表產生器
從澳門衛生局官方網站抽取疾病資料，整合成 CSV

來源：
  中文：https://bo.dsaj.gov.mo/bo/ii/2006/30/aviso29lista_cn.asp      (table#table7)
  英文：https://bo.dsaj.gov.mo/bo/ii/2006/30/aviso29lista_en.asp      (table#table7)
  葡文：https://bo.dsaj.gov.mo/bo/ii/2006/30/aviso29lista_pt.asp      (table#table10)

輸出：七欄 CSV
  icd10_code, category_zh, category_en, category_pt, name_zh, name_en, name_pt

代碼格式規則：
  - 字母 + 兩位數字（如 A00、Z99）→ 寫入
  - 字母 + 兩位數字 + *（如 H28*、D77*）→ 寫入
  - 範圍碼（如 A00-A09）→ 不寫入，但更新當前分類
  - 章節標題（如 第一章）→ 跳過
"""

import sys
import re
import csv
import requests
from bs4 import BeautifulSoup

# ── 配置 ────────────────────────────────────────────────────────────────────
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
URL_CN = "https://bo.dsaj.gov.mo/bo/ii/2006/30/aviso29lista_cn.asp"
URL_EN = "https://bo.dsaj.gov.mo/bo/ii/2006/30/aviso29lista_en.asp?printer=1"
URL_PT = "https://bo.dsaj.gov.mo/bo/ii/2006/30/aviso29lista_pt.asp?printer=1"

OUT_FILE = "/home/gem-openclaw/project/simple-medical-system/data/icd10_disease_full.csv"
OUT_ENCODING = "utf-8-sig"   # UTF-8 with BOM，Excel 相容

FIELDS = [
    "icd10_code",
    "category_zh",
    "category_en",
    "category_pt",
    "name_zh",
    "name_en",
    "name_pt",
]

# ── 工具函式 ─────────────────────────────────────────────────────────────────

def fetch_html(url: str) -> str:
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.encoding = r.apparent_encoding
    r.raise_for_status()
    return r.text


def find_main_table(soup: BeautifulSoup, is_pt: bool = False) -> BeautifulSoup:
    """
    根據語言找到對應的 main table。
    中英文：id='table7'
    葡文：id='table10'（table7 在葡文頁面是其他用途的表格）
    """
    if is_pt:
        t = soup.find("table", {"id": "table10"})
        if t:
            return t
        # Fallback: 找包含 A00 的最大 table
        tables = soup.find_all("table")
        for t in tables:
            rows = t.find_all("tr")
            if len(rows) > 100:
                first_texts = [tr.find("td").get_text(strip=True) if tr.find("td") else ""
                               for tr in rows[:5]]
                if any("A00" in tx or "Cólera" in tx for tx in first_texts):
                    return t
        return tables[0] if tables else None

    # CN / EN
    t = soup.find("table", {"id": "table7"})
    if t:
        return t
    # Fallback
    tables = soup.find_all("table")
    for t in tables:
        rows = t.find_all("tr")
        if len(rows) > 100:
            first_texts = [tr.find("td").get_text(strip=True) if tr.find("td") else ""
                           for tr in rows[:5]]
            if any("A00" in tx or "霍亂" in tx or "Cholera" in tx
                   for tx in first_texts):
                return t
    return tables[0] if tables else None


def parse_table(table: BeautifulSoup) -> list[tuple[str, str]]:
    """
    解析 table，回傳 [(col1, col2), ...]
    col1 = 代碼欄
    col2 = 名稱欄
    """
    rows = []
    for tr in table.find_all("tr"):
        cells = tr.find_all("td")
        if len(cells) >= 2:
            c1 = cells[0].get_text(strip=True)
            c2 = cells[1].get_text(strip=True)
            rows.append((c1, c2))
    return rows


def is_valid_code(s: str) -> bool:
    """字母+兩位數字 或 字母+兩位數字+* → True"""
    return bool(re.match(r"^[A-Z][0-9]{2}\*$", s)) or \
           bool(re.match(r"^[A-Z][0-9]{2}$", s))


def is_range_code(s: str) -> bool:
    """範圍碼（如 A00-A09）→ True"""
    return bool(re.match(r"^[A-Z][0-9]{2}-[A-Z][0-9]{2}$", s))


def is_chapter(s: str) -> bool:
    """章節標題（如 第一章、CHAPTER I）→ True"""
    return bool(re.match(r"^第.+章", s)) or s.lower().startswith("chapter")


def pad_rows(rows: list, n: int) -> list:
    """將 rows 填充至長度 n（不足者補空 tuple）"""
    if len(rows) < n:
        rows = rows + [("", "")] * (n - len(rows))
    return rows[:n]


def build_csv():
    # 1. 抓取
    print("抓取中文頁面...")
    cn_html = fetch_html(URL_CN)
    print("抓取英文頁面...")
    en_html = fetch_html(URL_EN)
    print("抓取葡文頁面...")
    pt_html = fetch_html(URL_PT)

    # 2. 解析
    print("解析表格...")
    cn_soup = BeautifulSoup(cn_html, "html.parser")
    en_soup = BeautifulSoup(en_html, "html.parser")
    pt_soup = BeautifulSoup(pt_html, "html.parser")

    cn_table = find_main_table(cn_soup, is_pt=False)
    en_table = find_main_table(en_soup, is_pt=False)
    pt_table = find_main_table(pt_soup, is_pt=True)

    cn_rows = parse_table(cn_table)
    en_rows = parse_table(en_table)
    pt_rows = parse_table(pt_table)

    print(f"  中文：{len(cn_rows)} 列")
    print(f"  英文：{len(en_rows)} 列")
    print(f"  葡文：{len(pt_rows)} 列")

    # 3. 對齊列數（以中文為準）
    n = len(cn_rows)
    en_padded = pad_rows(en_rows, n)
    pt_padded = pad_rows(pt_rows, n)

    # 4. 遍歷中文頁面，建立分類狀態，寫入有效代碼
    current_cat_zh = ""
    current_cat_en = ""
    current_cat_pt = ""
    records = []

    for i in range(n):
        cn_c1, cn_c2 = cn_rows[i]
        en_c2 = en_padded[i][1]
        pt_c2 = pt_padded[i][1]

        # 遇到範圍碼 → 更新當前分類（但本身不寫入）
        if is_range_code(cn_c1):
            current_cat_zh = cn_c2
            current_cat_en = en_c2
            current_cat_pt = pt_c2
            continue

        # 章節標題 → 跳過
        if is_chapter(cn_c1):
            continue

        # 有效代碼（字母+2位 或 字母+2位+*）→ 寫入
        if is_valid_code(cn_c1):
            records.append({
                "icd10_code":   cn_c1,
                "category_zh":  current_cat_zh,
                "category_en":  current_cat_en,
                "category_pt": current_cat_pt,
                "name_zh":      cn_c2,
                "name_en":      en_c2,
                "name_pt":      pt_c2,
            })

    # 5. 寫出 CSV
    print(f"\n寫出 {len(records)} 筆記錄至：\n  {OUT_FILE}")
    with open(OUT_FILE, "w", newline="", encoding=OUT_ENCODING) as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(records)

    # 6. 統計摘要
    star = [r for r in records if "*" in r["icd10_code"]]
    cats = set(r["category_zh"] for r in records if r["category_zh"])
    empty_en = [r for r in records if not r["name_en"].strip()]
    empty_pt = [r for r in records if not r["name_pt"].strip()]

    print(f"\n{'='*50}")
    print(f"  總記錄數：{len(records)}")
    print(f"  星號碼（*）：{len(star)}")
    print(f"  疾病分類數：{len(cats)}")
    print(f"  空英文名：{len(empty_en)}")
    print(f"  空葡文名：{len(empty_pt)}")

    print(f"\n{'='*50}")
    print("前 15 筆記錄：")
    for r in records[:15]:
        print(f"  {r['icd10_code']:6} | {r['category_zh'][:18]:18} | {r['name_zh'][:30]}")

    print("\n最後 5 筆記錄：")
    for r in records[-5:]:
        print(f"  {r['icd10_code']:6} | {r['category_zh'][:18]:18} | {r['name_zh'][:30]}")

    print(f"\n{'='*50}")
    print("完成！")


if __name__ == "__main__":
    build_csv()
