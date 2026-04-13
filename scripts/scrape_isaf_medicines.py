#!/usr/bin/env python3
"""
澳門藥物監督管理局 (ISAF) 藥品資料爬蟲 v5
目標: 抓取全部藥品詳細資料（9,118 筆），輸出為 CSV + PDF

25 欄位設計：
  mednbr（藥物編號）
  + 8 類別 × 3 語言（中、葡、英）= 25 欄

HTML 結構說明：
  - 各 td 以 <br> 分隔三語
  - 雙 <br> = 不同成份之間的分隔
  - 無 <br> 的 td（如商品名稱）為 CSS ::before 換行，文字全部串聯
  - 所有資料完整保留，不做任何去除或格式化

active_ingredients：多個成份以 ||| 分隔，同一成份內中/葡/英以 ^^^ 分隔
"""

import requests
import re
import csv
import time
import random
import sys
import os

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
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8,pt;q=0.7",
}
CSV_FILE = "/home/gem-openclaw/project/simple-medical-system/data/isaf_medicines.csv"
PARSER = "lxml"

# 25 欄位（中、葡、英各自獨立欄）
FIELDS = [
    "mednbr",
    # 商品名稱
    "product_name_zh", "product_name_pt", "product_name_en",
    # 劑型
    "pharmaceutical_form_zh", "pharmaceutical_form_pt", "pharmaceutical_form_en",
    # 投藥途徑
    "route_of_administration_zh", "route_of_administration_pt", "route_of_administration_en",
    # 活性成份（多個以 ||| 分隔，同成份中/葡/英以 ^^^ 分隔）
    "active_ingredients_zh", "active_ingredients_pt", "active_ingredients_en",
    # 法定分類
    "legal_classification_zh", "legal_classification_pt", "legal_classification_en",
    # ATC 分類
    "atc_code", "atc_classification_zh", "atc_classification_pt", "atc_classification_en",
    # 製造商
    "manufacturer_zh", "manufacturer_pt", "manufacturer_en",
    # 供應商
    "distributor_code",
    "distributor_zh", "distributor_pt", "distributor_en",
]


def td_text(td_element):
    """從 td 元素提取文字，<br> 置換為 ||BRK||"""
    return td_element.get_text(separator="||BRK||", strip=False)


def split_trilingual(text):
    """
    解析標準三語欄位：段0 ||BRK|| 段1 ||BRK|| 段2
    直接以 ||BRK|| 分隔，保留所有原文，不做任何格式化。
    """
    parts = text.split("||BRK||")
    zh = parts[0].strip() if len(parts) > 0 else ""
    pt = parts[1].strip() if len(parts) > 1 else ""
    en = parts[2].strip() if len(parts) > 2 else ""
    return zh, pt, en


def parse_active_ingredients(text):
    """
    解析活性成份。
    結構（get_text 結果）：name_zh ||BRK|| name_en ||BRK|| name_zh ||BRK|| name_en ...
    - 每兩個相鄰段 = 一個成份（奇數位置=zh，偶數位置=en）
    - 總段數為奇數時，最後一個 zh 無對應 en
    """
    zh_list, pt_list, en_list = [], [], []

    # 以雙 ||BRK|| 分割不同成份（每一個成份以 ||BRK|| 分隔中/英）
    # "||BRK||".split("||BRK||") → ["", ""]，中間空字串代表一個成份的空英/en
    parts = text.split("||BRK||")
    i = 0
    while i < len(parts):
        zh = parts[i].strip()
        en = parts[i + 1].strip() if i + 1 < len(parts) else ""
        i += 2
        if zh or en:
            zh_list.append(zh)
            en_list.append(en)
            # PT 永為空（無葡文），不追加 entry
            # PT 欄：全為空則留空白，否則以 ||| 連接
            pt_all = "|||".join([p for p in pt_list if p]) if pt_list else ""
            return zh_list, pt_all, en_list


def has_diacritics(s):
    """檢查是否包含葡文特有的變音字母"""
    return bool(re.search(r'[ãáàâçõéèêíìóòôúùü]', s, re.IGNORECASE))


def parse_manufacturer_distributor(text):
    """
    解析製造商 / 供應商。
    根據 parts 數量與內容自動判斷：
    - 4+ parts: 3語言齊全，取前三非空段
    - 3 parts: 自動識別 b 為葡文（FIRMA/COMPANHIA/LDA）還是英文
    """
    parts = text.split("||BRK||")
    parts = [p.strip() for p in parts if p.strip() or len(parts) <= 3]

    if len(parts) >= 4:
        non_empty = [p for p in parts if p]
        if len(non_empty) >= 3:
            return non_empty[0], non_empty[1], non_empty[2]

    if len(parts) >= 2:
        a, b = parts[0], parts[1]
        if has_diacritics(b) or ("FIRMA" in b and ("COMPANHIA" in b or "LDA" in b or "LIMITADA" in b)):
            return a, b, ""
        else:
            return a, "", b
    if len(parts) == 1:
        return parts[0], "", ""
    return "", "", ""


# ─────────────────────────────────────────
# 列表頁快取（避免每筆記錄重複抓取 9118 個 option）
# ─────────────────────────────────────────
_OPTION_TEXTS_CACHE = {}  # {rid: [text1, text2, ...]}

def _fetch_all_option_texts_cached():
    """一次性抓取整個列表頁所有 option 文字至模組快取"""
    if _OPTION_TEXTS_CACHE:
        return  # 已有快取，直接使用
    r = requests.post(SEARCH_URL, data={
        "inputQuery": "%%",
        "sTypeStr": "searchByComName",
    }, timeout=60, headers=HEADERS)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    for opt in soup.find("select").find_all("option"):
        vid = opt.get("value", "").strip()
        if vid.isdigit():
            if vid not in _OPTION_TEXTS_CACHE:
                _OPTION_TEXTS_CACHE[vid] = []
            _OPTION_TEXTS_CACHE[vid].append("".join(opt.strings))

def get_option_texts(rid):
    """從列表頁取得指定藥物的所有 option 文字（使用模組快取）"""
    _fetch_all_option_texts_cached()
    return _OPTION_TEXTS_CACHE.get(rid, [])

def parse_detail(html, option_texts):
    """解析詳細頁 HTML"""
    soup = BeautifulSoup(html, PARSER)
    table = soup.find("table")
    if not table:
        return None

    data = {f: "" for f in FIELDS}

    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 2:
            continue

        label_td = cells[0]
        value_td = cells[1]

        # 從 label 提取識別關鍵字
        label_text = re.sub(r"<[^>]+>", " ", str(label_td))
        label_text = re.sub(r"\s+", " ", label_text).strip().lower()

        # ── 商品名稱 ──
        if any(k in label_text for k in ["商品名稱", "nome comercial", "commercial name"]):
            zh, pt, en = parse_product_name(option_texts, td_text(value_td))
            data["product_name_zh"] = zh
            data["product_name_pt"] = pt
            data["product_name_en"] = en

        # ── 劑型 ──
        elif any(k in label_text for k in ["劑型", "forma farmac", "pharmaceutical form"]):
            zh, pt, en = split_trilingual(td_text(value_td))
            data["pharmaceutical_form_zh"] = zh
            data["pharmaceutical_form_pt"] = pt
            data["pharmaceutical_form_en"] = en

        # ── 投藥途徑 ──
        elif any(k in label_text for k in ["投藥途徑", "via de adminin", "route of administration"]):
            zh, pt, en = split_trilingual(td_text(value_td))
            data["route_of_administration_zh"] = zh
            data["route_of_administration_pt"] = pt
            data["route_of_administration_en"] = en

        # ── 活性成份 ──
        elif any(k in label_text for k in ["活性成分", "princ", "active ingredient"]):
            zh_list, pt_list, en_list = parse_active_ingredients(td_text(value_td))
            data["active_ingredients_zh"] = "|||".join(zh_list)
            data["active_ingredients_pt"] = "|||".join(pt_list)
            data["active_ingredients_en"] = "|||".join(en_list)

        # ── ATC 分類（需在法定分類之前判斷）──
        elif any(k in label_text for k in ["atc", "anatomical therapeutic", "classificação fármaco"]):
            text_val = td_text(value_td)
            # ATC code 是第一段開頭的字母+數字
            parts = text_val.split("||BRK||")
            first = parts[0].strip() if parts else ""
            code_match = re.match(r"^([A-Z]\d{2}[A-Z]?\s*\d*)", first)
            atc_code = code_match.group(1).strip() if code_match else ""
            zh, pt, en = split_trilingual(text_val)
            data["atc_code"] = atc_code
            data["atc_classification_zh"] = zh
            data["atc_classification_pt"] = pt
            data["atc_classification_en"] = en

        # ── 法定分類 ──
        elif any(k in label_text for k in ["法定分類", "classifica", "forensic classification"]):
            if not any(k in label_text for k in ["atc", "who", "oms", "terap"]):
                zh, pt, en = split_trilingual(td_text(value_td))
                data["legal_classification_zh"] = zh
                data["legal_classification_pt"] = pt
                data["legal_classification_en"] = en

        # ── 製造商 ──
        elif any(k in label_text for k in ["製造商", "fabricante", "manufacturer"]):
            zh, pt, en = parse_manufacturer_distributor(td_text(value_td))
            data["manufacturer_zh"] = zh
            data["manufacturer_pt"] = pt
            data["manufacturer_en"] = en

        # ── 供應商 ──
        elif any(k in label_text for k in ["供應商", "distribuidor", "distributer"]):
            zh, pt, en = parse_manufacturer_distributor(td_text(value_td))
            data["distributor_zh"] = zh
            data["distributor_pt"] = pt
            data["distributor_en"] = en
            # 從中文名稱開頭提取公司編號（如 "FI0220"）
            code_match = re.match(r"^([A-Z]{2}\d+)\s+", zh)
            if code_match:
                data["distributor_code"] = code_match.group(1)
            # 從供應商中文名稱開頭提取公司編號（如 FI0220）
            code_match = re.match(r"^([A-Z]{2}\d{4})", zh)
            data["distributor_code"] = code_match.group(1) if code_match else ""

    return data


def parse_product_name(text, searched_name):
    """
    解析商品名稱。
    HTML 中無 <br>，文字全部串聯。
    規則：永遠前半是中文，後半是英文。
    找 searched_name 在文字中的位置，從該位置往前找第一個空格作為分界。
    若無空格，fallback 到 rfind(' ')。
    """
    if "||BRK||" in text:
        zh, pt, en = split_trilingual(text)
        return zh, pt, en

    pos = text.find(searched_name)
    if pos >= 0:
        sp = -1
        for i in range(pos - 1, -1, -1):
            if text[i] == ' ':
                sp = i
                break
        if sp < 0:
            # searched_name 前無空格 → fallback 到 rfind
            sp = text.rfind(' ')
        if sp < 0:
            return text.strip(), '', ''
        before = text[:sp].strip()
        after = text[sp + 1:].strip()
    else:
        sp = text.rfind(' ')
        if sp < 0:
            return text.strip(), '', ''
        before = text[:sp].strip()
        after = text[sp + 1:].strip()

    return before, '', after

# ─────────────────────────────────────────
# 搜尋
# ─────────────────────────────────────────

_session = None


def get_session():
    global _session
    if _session is None:
        _session = requests.Session()
        _session.headers.update(HEADERS)
    return _session


def search_all():
    """取得所有藥品記錄 ID（同時填充 _OPTION_TEXTS_CACHE）"""
    print("正在取得全部藥品 ID 及名稱...")
    s = get_session()
    resp = s.post(SEARCH_URL, data={
        "inputQuery": "%%",
        "sTypeStr": "searchByComName",
    }, timeout=60)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "lxml")
    select = soup.find("select")
    records = []

    if select:
        for opt in select.find_all("option"):
            vid = opt.get("value", "").strip()
            name = opt.get_text(strip=True)
            if vid.isdigit():
                records.append((vid, name))
                # 同步填充快取
                if vid not in _OPTION_TEXTS_CACHE:
                    _OPTION_TEXTS_CACHE[vid] = []
                _OPTION_TEXTS_CACHE[vid].append("".join(opt.strings))

    seen = set()
    unique = []
    for vid, name in records:
        if vid not in seen:
            seen.add(vid)
            unique.append((vid, name))

    print(f"  原始: {len(records)} 筆 → 去重後: {len(unique)} 筆")
    return unique


def fetch_detail(rid, option_texts):
    """每次使用新的乾净 session"""
    s = requests.Session()
    s.headers.update(HEADERS)
    try:
        resp = s.post(DETAIL_URL, data={"mednbr": rid}, timeout=30)
        resp.raise_for_status()
        return parse_detail(resp.text, option_texts)
    except Exception as e:
        print(f"  [!] ID {rid} 失敗: {e}")
        return None


# ─────────────────────────────────────────
# 主程式
# ─────────────────────────────────────────

def run(limit=None):
    records = search_all()
    if not records:
        print("找不到任何記錄，結束")
        return

    if limit:
        records = records[:limit]
        print(f"  ⚠️ 測試模式：只抓取前 {limit} 筆記錄")

    total = len(records)
    results = []
    errors = 0
    start_time = time.time()

    print(f"\n開始抓取 {total} 筆記錄...")
    print("-" * 60)

    for i, (rid, searched_name) in enumerate(records):
        if i > 0 and i % 100 == 0:
            elapsed = time.time() - start_time
            rate = i / elapsed if elapsed > 0 else 1
            eta = (total - i) / rate / 60
            print(f"  進度: {i}/{total} ({i*100/total:.1f}%) | "
                  f"速率: {rate:.1f}/s | 剩餘: {eta:.0f}分 | 錯誤: {errors}")

        option_texts = get_option_texts(rid)
        row = fetch_detail(rid, option_texts)
        if row:
            row["mednbr"] = rid
            results.append(row)
        else:
            errors += 1
            r = {f: "" for f in FIELDS}
            r["mednbr"] = rid
            results.append(r)

        if i % 20 == 0 and i > 0:
            time.sleep(random.uniform(0.5, 1.5))

    elapsed = time.time() - start_time
    print("-" * 60)
    print(f"完成！成功: {len(results)-errors}, 失敗: {errors}")
    print(f"耗時: {elapsed/60:.1f} 分鐘")

    print(f"\n寫入 CSV: {CSV_FILE}")
    os.makedirs(os.path.dirname(CSV_FILE), exist_ok=True)
    with open(CSV_FILE, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)

    print(f"完成！共 {len(results)} 筆記錄已寫入 {CSV_FILE}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="ISAF 澳門藥物資料爬蟲")
    parser.add_argument("--limit", type=int, default=None, help="測試模式：只抓取前 N 筆記錄")
    args = parser.parse_args()
    run(limit=args.limit)
