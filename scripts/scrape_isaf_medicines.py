#!/usr/bin/env python3
"""
澳門藥物監督管理局 (ISAF) 藥品資料爬蟲 v3
目標: 抓取所有藥品詳細資料（11,256 筆），輸出為 CSV

解析邏輯（重要）：
- 搜尋 %% 返回所有記錄（約 11,256 筆）
- 點擊任一藥品名稱 → 該文字即為藥品名稱（單一語言），先記住
- 按「詳情」進入詳細頁，表格第一列「商品名稱」= 記住之名稱 + 另一語言之名稱
- 每個項目的第一個 <td>：中文<br>葡文<br>英文
- 每個項目的第二個 <td>：資料，順序固定 中文 + <br> + 葡文 + <br> + 英文
  - 若只有 2 個 <br>：中文 + 英文（跳過葡文）
  - 活性成份：多個成份以兩個接連 <br> 分隔
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

# CSV 欄位
FIELDS = [
    "record_id",
    "searched_name",   # 搜尋列表頁顯示的原始名稱
    # 商品名稱
    "product_name_zh", "product_name_pt", "product_name_en",
    # 劑型
    "pharmaceutical_form_zh", "pharmaceutical_form_pt", "pharmaceutical_form_en",
    # 投藥途徑
    "route_of_administration_zh", "route_of_administration_pt", "route_of_administration_en",
    # 活性成份（多個以 ||| 分隔）
    "active_ingredients_zh", "active_ingredients_pt", "active_ingredients_en",
    # 法定分類
    "legal_classification_zh", "legal_classification_pt", "legal_classification_en",
    # ATC 分類
    "atc_code", "atc_classification_zh", "atc_classification_pt", "atc_classification_en",
    # 製造商
    "manufacturer_code", "manufacturer_zh", "manufacturer_en",
    # 供應商
    "distributor_code", "distributor_zh", "distributor_en",
]


def is_chinese(s):
    return bool(re.search(r'[\u4e00-\u9fff]', s or ''))


# ─────────────────────────────────────────
# 解析工具
# ─────────────────────────────────────────

def td_text(td_element):
    """從 BeautifulSoup <td> 元素提取文字，<br> 置換為 ||BRK||"""
    return td_element.get_text(separator='||BRK||', strip=True)


def parse_trilingual(text):
    """
    解析標準三語欄位：中文 ||BRK|| 葡文 ||BRK|| 英文
    若只有 2 段（中 + 英），跳過葡文位置
    """
    parts = [p.strip() for p in text.split('||BRK||') if p.strip()]
    if len(parts) >= 3:
        return parts[0], parts[1], parts[2]
    elif len(parts) == 2:
        return parts[0], '', parts[1]
    elif len(parts) == 1:
        return parts[0], '', ''
    return '', '', ''


def parse_product_name(value_td, searched_name):
    """
    解析詳情頁「商品名稱」欄位。
    - 若有 ||BRK||：以 <br> 分隔，name_a = 第一語言，name_b = 第二語言
    - 若無 ||BRK||：將 searched_name 從 value 文本中去除，剩餘為另一語言
      （剥離所有 " 後再定位，適用於 "中文名"EN 或 EN"中文名" 結構）
    """
    text = td_text(value_td).strip()

    if '||BRK||' in text:
        parts = [p.strip() for p in text.split('||BRK||') if p.strip()]
        name_a = parts[0]
        name_b = parts[1] if len(parts) > 1 else ''
    else:
        # 剥離所有 "，再定位 searched
        text_nq = text.replace('"', '')
        searched_nq = searched_name.replace('"', '')
        idx = text_nq.find(searched_nq)
        if idx >= 0:
            before = text_nq[:idx].strip()
            after = text_nq[idx + len(searched_nq):].strip()
        else:
            before, after = '', text_nq

        if is_chinese(searched_name):
            zh = searched_nq
            en = after
        else:
            zh = before
            en = searched_nq
        return zh, '', en

    # 有 ||BRK|| 的情况：直接二分
    if is_chinese(searched_name):
        zh = name_b if is_chinese(name_b) else name_a
        en = name_a if not is_chinese(name_a) else name_b
    else:
        en = name_a if not is_chinese(name_a) else name_b
        zh = name_b if is_chinese(name_b) else ''
    return zh.strip(), '', en.strip()


def parse_active_ingredients(td_element):
    """
    解析活性成份欄位。
    結構（lxml 直接子節點）：文字 → zh，<br> → 分隔，雙 <br> = 新成份
    遍歷 <td> 的直接子節點：文字節點交替為 [zh1, en1, zh2, en2, ...]
    返回 (zh_list, pt_list, en_list)
    """
    zh_list, en_list = [], []
    text_nodes = []
    for child in td_element.children:
        if isinstance(child, str) and child.strip():
            text_nodes.append(child.strip())

    # 交替：位置 0,2,4... 為中文（成份名稱），位置 1,3,5... 為英文（含劑量）
    for i, txt in enumerate(text_nodes):
        if i % 2 == 0:
            zh_list.append(txt)
        else:
            en_list.append(txt)

    # 補足（如果只有奇數個文字節點，最後一個補空字串）
    if len(zh_list) > len(en_list):
        en_list.append('')

    return zh_list, [''] * len(zh_list), en_list


def parse_mfg_dist(td_element):
    """解析製造商 / 供應商欄位，返回 (code, zh, en)"""
    text = td_text(td_element)
    parts = [p.strip() for p in text.split('||BRK||') if p.strip()]

    code, zh, en = '', '', ''
    if not parts:
        return code, zh, en

    # 提取 code（格式：XX0000）
    code_match = re.match(r'^([A-Z]{2}\d{4})\s*(.*)', parts[0])
    if code_match:
        code = code_match.group(1)
        zh = code_match.group(2).strip() or parts[0]
    else:
        zh = parts[0]

    en = parts[1] if len(parts) > 1 else ''
    return code, zh, en


# ─────────────────────────────────────────
# 詳情頁解析
# ─────────────────────────────────────────

def parse_detail(html, searched_name):
    """解析詳細頁 HTML"""
    soup = BeautifulSoup(html, PARSER)
    table = soup.find("table")
    if not table:
        return None

    data = {f: '' for f in FIELDS}
    data['searched_name'] = searched_name

    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 2:
            continue

        label_td = cells[0]
        value_td = cells[1]

        # 從 label 提取識別關鍵字
        label_text = re.sub(r'<[^>]+>', ' ', str(label_td))
        label_text = re.sub(r'\s+', ' ', label_text).strip().lower()

        # ── 商品名稱 ──
        if any(k in label_text for k in ['商品名稱', 'nome comercial', 'commercial name']):
            zh, pt, en = parse_product_name(value_td, searched_name)
            data['product_name_zh'] = zh
            data['product_name_pt'] = pt
            data['product_name_en'] = en

        # ── 劑型 ──
        elif any(k in label_text for k in ['劑型', 'forma farmac', 'pharmaceutical form']):
            zh, pt, en = parse_trilingual(td_text(value_td))
            data['pharmaceutical_form_zh'] = zh
            data['pharmaceutical_form_pt'] = pt
            data['pharmaceutical_form_en'] = en

        # ── 投藥途徑 ──
        elif any(k in label_text for k in ['投藥途徑', 'via de adminin', 'route of administration']):
            zh, pt, en = parse_trilingual(td_text(value_td))
            data['route_of_administration_zh'] = zh
            data['route_of_administration_pt'] = pt
            data['route_of_administration_en'] = en

        # ── 活性成分 ──
        elif any(k in label_text for k in ['活性成分', 'princ', 'active ingredient']):
            zh_list, pt_list, en_list = parse_active_ingredients(value_td)
            data['active_ingredients_zh'] = '|||'.join(zh_list)
            data['active_ingredients_pt'] = '|||'.join(pt_list)
            data['active_ingredients_en'] = '|||'.join(en_list)

        # ── 法定分類（需在 ATC 之前判斷，關鍵字有重疊）──
        elif any(k in label_text for k in ['法定分類', 'classifica', 'forensic classification']):
            if not any(k in label_text for k in ['atc', 'who', 'oms', 'terap']):
                zh, pt, en = parse_trilingual(td_text(value_td))
                data['legal_classification_zh'] = zh
                data['legal_classification_pt'] = pt
                data['legal_classification_en'] = en

        # ── ATC 分類 ──
        elif any(k in label_text for k in ['atc', 'anatomical therapeutic', 'classificação fármaco']):
            zh, pt, en = parse_trilingual(td_text(value_td))
            code_match = re.match(r'^([A-Z]\d{2}[A-Z]?\s*\d*)', zh)
            data['atc_code'] = code_match.group(1).strip() if code_match else ''
            data['atc_classification_zh'] = zh
            data['atc_classification_pt'] = pt
            data['atc_classification_en'] = en

        # ── 製造商 ──
        elif any(k in label_text for k in ['製造商', 'fabricante', 'manufacturer']):
            code, zh, en = parse_mfg_dist(value_td)
            data['manufacturer_code'] = code
            data['manufacturer_zh'] = zh
            data['manufacturer_en'] = en

        # ── 供應商 ──
        elif any(k in label_text for k in ['供應商', 'distribuidor', 'distributer']):
            code, zh, en = parse_mfg_dist(value_td)
            data['distributor_code'] = code
            data['distributor_zh'] = zh
            data['distributor_en'] = en

    return data


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
    """取得所有藥品記錄 ID 及搜尋列表頁顯示的原始名稱"""
    print("正在取得全部藥品 ID 及名稱...")
    s = get_session()
    resp = s.post(SEARCH_URL, data={
        "inputQuery": "%%",
        "sTypeStr": "searchByComName",
    }, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, 'html.parser')
    select = soup.find("select")
    records = []

    if select:
        for opt in select.find_all("option"):
            vid = opt.get("value", "").strip()
            name = opt.get_text(strip=True)
            if vid.isdigit():
                records.append((vid, name))

    seen = set()
    unique = []
    for vid, name in records:
        if vid not in seen:
            seen.add(vid)
            unique.append((vid, name))

    print(f"  原始: {len(records)} 筆 → 去重後: {len(unique)} 筆")
    return unique


def fetch_detail(rid, searched_name):
    """每次使用新的乾净 session，避免狀態污染"""
    s = requests.Session()
    s.headers.update(HEADERS)
    try:
        resp = s.post(DETAIL_URL, data={"mednbr": rid}, timeout=30)
        resp.raise_for_status()
        return parse_detail(resp.text, searched_name)
    except Exception as e:
        print(f"  [!] ID {rid} 失敗: {e}")
        return None


# ─────────────────────────────────────────
# 清理
# ─────────────────────────────────────────

def clean(t):
    if not t:
        return ""
    return re.sub(r'[\r\n\t]+', ' ', str(t)).strip()


# ─────────────────────────────────────────
# 主程式
# ─────────────────────────────────────────

def run():
    records = search_all()
    if not records:
        print("找不到任何記錄，結束")
        return

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

        row = fetch_detail(rid, searched_name)
        if row:
            row["record_id"] = rid
            for f in FIELDS:
                if f not in ('record_id', 'searched_name'):
                    row[f] = clean(row.get(f, ""))
            results.append(row)
        else:
            errors += 1
            r = {f: "" for f in FIELDS}
            r["record_id"] = rid
            r["searched_name"] = searched_name
            results.append(r)

        if i % 30 == 0 and i > 0:
            time.sleep(random.uniform(0.3, 0.8))

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
    run()
