#!/usr/bin/env python3
"""
澳門藥物監督管理局 (ISAF) 藥品資料爬蟲
目標: 抓取所有藥品詳細資料，輸出為 CSV
"""

import requests
import re
import csv
import time
import random
import sys
import os

# Fix stdout for UTF-8
sys.stdout.reconfigure(encoding='utf-8')

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("請安裝 bs4: pip install beautifulsoup4")
    sys.exit(1)

BASE_URL = "https://app.isaf.gov.mo/pubisafweb/Daf"
SEARCH_URL = f"{BASE_URL}/frmDafWebNamequery.aspx"
DETAIL_URL = f"{BASE_URL}/frmDafWebDetail.aspx"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/x-www-form-urlencoded",
    "Referer": f"{BASE_URL}/frmDafWeb.aspx",
}
CSV_FILE = "/home/gem-openclaw/project/simple-medical-system/data/isaf_medicines.csv"

FIELDS = [
    "record_id",
    "commercial_name_tc",
    "commercial_name_en",
    "pharmaceutical_form",
    "route_of_administration",
    "active_ingredients",
    "legal_classification",
    "atc_classification",
    "manufacturer",
    "distributor",
]

session = requests.Session()
session.headers.update(HEADERS)


def parse_commercial_name(value_text):
    """解析商品名稱，返回 (tc_name, en_name)"""
    # Find all quoted sections
    quoted = re.findall(r'"([^"]+)"', value_text)
    # Split by quotes, keep non-empty unquoted parts
    unquoted = [s.strip() for s in re.split(r'"[^"]*"', value_text) if s.strip()]

    tc_name = ""
    en_name = ""

    if len(quoted) >= 2:
        # "TC品牌" ... "EN品牌" ...
        tc_name = quoted[0]
        en_name = quoted[1]
        if len(unquoted) >= 1:
            tc_name = tc_name + " " + unquoted[0]
        if len(unquoted) >= 2:
            en_name = en_name + " " + unquoted[1]
    elif len(quoted) == 1:
        q = quoted[0]
        if re.match(r'^[A-Za-z0-9&\-\.\s]+$', q):
            # Pure ASCII quoted → EN brand
            en_name = q
            tc_name = " ".join(unquoted) if unquoted else ""
        else:
            # Chinese brand
            tc_name = q
            if unquoted:
                # If first unquoted is ASCII → EN product name
                if re.match(r'^[A-Za-z0-9&\-\.\s]+', unquoted[0]):
                    en_name = " ".join(unquoted)
                else:
                    tc_name = tc_name + " " + " ".join(unquoted)
            else:
                en_name = ""
    else:
        # No quotes at all
        parts = value_text.split()
        mid = len(parts) // 2
        tc_name = " ".join(parts[:mid])
        en_name = " ".join(parts[mid:])

    return tc_name.strip(), en_name.strip()


def parse_detail(html):
    """解析詳細頁 HTML"""
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if not table:
        return None

    data = {f: "" for f in FIELDS}

    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 2:
            continue

        label_raw = cells[0].get_text(separator=" ", strip=True)
        value_raw = cells[1].get_text(separator=" | ", strip=True)
        label_lower = label_raw.lower()
        value_text = re.sub(r'\s+', ' ', value_raw).strip()

        # 商品名稱
        if ("商品名稱" in label_lower or "commercial name" in label_lower
                or "nome comercial" in label_lower):
            tc, en = parse_commercial_name(value_raw)
            data["commercial_name_tc"] = tc
            data["commercial_name_en"] = en

        # 劑型
        elif ("劑型" in label_lower or "pharmaceutical form" in label_lower
              or "forma farmac" in label_lower):
            data["pharmaceutical_form"] = value_text.split("|")[0].strip()

        # 投藥途徑
        elif ("投藥途徑" in label_lower or "route of administration" in label_lower
              or "via de adminin" in label_lower):
            data["route_of_administration"] = value_text.split("|")[0].strip()

        # 活性成分
        elif ("活性成分" in label_lower or "active ingredient" in label_lower
              or "princ" in label_lower):
            data["active_ingredients"] = value_text

        # ATC分類（必須在法定分類之前判斷，因關鍵字有重疊）
        elif ("atc" in label_lower or "anatomical therapeutic" in label_lower
              or "classificação fármaco" in label_lower):
            if "atc" in label_lower or "who" in label_lower:
                data["atc_classification"] = value_text

        # 法定分類
        elif ("法定分類" in label_lower or "forensic classification" in label_lower
              or "classifica" in label_lower):
            if "atc" not in label_lower and "anatomical" not in label_lower:
                data["legal_classification"] = value_text.split("|")[0].strip()

        # 製造商
        elif ("製造商" in label_lower or "manufacturer" in label_lower
              or "fabricante" in label_lower):
            parts = [p.strip() for p in value_text.split("|") if p.strip()]
            data["manufacturer"] = " | ".join(parts[:2])

        # 供應商
        elif ("供應商" in label_lower or "distribuidor" in label_lower):
            parts = [p.strip() for p in value_text.split("|") if p.strip()]
            data["distributor"] = " | ".join(parts[:2])

    return data


def search_all_ids():
    """取得所有藥品記錄 ID"""
    print("正在取得全部藥品 ID...")
    resp = session.post(SEARCH_URL, data={
        "inputQuery": "%%",
        "sTypeStr": "searchByComName",
    }, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    select = soup.find("select")
    ids = []
    if select:
        for opt in select.find_all("option"):
            vid = opt.get("value", "").strip()
            if vid.isdigit():
                ids.append(vid)

    # 去重（有些記錄有多個語言版本，ID 重複）
    seen = set()
    unique = []
    for i in ids:
        if i not in seen:
            seen.add(i)
            unique.append(i)

    print(f"  原始: {len(ids)} 筆 → 去重後: {len(unique)} 筆")
    return unique


def fetch_detail(rid):
    """取得單筆記錄詳細資料"""
    try:
        resp = session.post(DETAIL_URL, data={"mednbr": rid}, timeout=30)
        resp.raise_for_status()
        return parse_detail(resp.text)
    except Exception as e:
        print(f"  [!] ID {rid} 失敗: {e}")
        return None


def clean(t):
    if not t:
        return ""
    return re.sub(r'[\r\n\t]+', ' ', t).strip()


def run():
    record_ids = search_all_ids()
    if not record_ids:
        print("找不到任何記錄，結束")
        return

    total = len(record_ids)
    results = []
    errors = 0
    start_time = time.time()

    print(f"\n開始抓取 {total} 筆記錄...")
    print("-" * 55)

    for i, rid in enumerate(record_ids):
        if i > 0 and i % 50 == 0:
            elapsed = time.time() - start_time
            rate = i / elapsed if elapsed > 0 else 1
            eta = (total - i) / rate / 60
            print(f"  進度: {i}/{total} ({i*100/total:.1f}%) | "
                  f"速率: {rate:.1f}/s | 剩餘: {eta:.0f}分 | 錯誤: {errors}")

        row = fetch_detail(rid)
        if row:
            row["record_id"] = rid
            for f in FIELDS:
                row[f] = clean(row.get(f, ""))
            results.append(row)
        else:
            errors += 1
            results.append({f: "" for f in FIELDS})
            results[-1]["record_id"] = rid

        # 每 20 筆短暫暫停，禮貌爬蟲
        if i % 20 == 0 and i > 0:
            time.sleep(random.uniform(0.2, 0.6))

    elapsed = time.time() - start_time
    print("-" * 55)
    print(f"完成！成功: {len(results)-errors}, 失敗: {errors}")
    print(f"耗時: {elapsed/60:.1f} 分鐘")

    print(f"\n寫入 CSV: {CSV_FILE}")
    with open(CSV_FILE, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)

    print(f"完成！共 {len(results)} 筆記錄已寫入 {CSV_FILE}")


if __name__ == "__main__":
    run()
