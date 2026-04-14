#!/usr/bin/env python3
"""
CSV → JSON 轉換器（多層結構）
用法: python3 scripts/csv_to_json.py <input.csv> <output.json>
"""
import sys
import csv
import json
import os
from datetime import datetime

CSV_FILE = "/home/gem-openclaw/project/simple-medical-system/data/isaf_medicines.csv"
JSON_FILE = "/home/gem-openclaw/project/simple-medical-system/data/isaf_medicines.json"


def parse_multi(csv_field):
    """將 ||| 分隔的多值欄位解析為列表"""
    if not csv_field or not csv_field.strip():
        return []
    return [s.strip() for s in csv_field.split("|||") if s.strip()]


def row_to_structured(row):
    """將 CSV 一列轉為多層結構"""
    # 活性成份：zh|||zh2 ||| en|||en2 → [{zh, en}, ...]
    ai_zh = parse_multi(row.get("active_ingredients_zh", ""))
    ai_en = parse_multi(row.get("active_ingredients_en", ""))
    ai_pt = parse_multi(row.get("active_ingredients_pt", ""))

    active_ingredients = []
    for i in range(max(len(ai_zh), len(ai_en), len(ai_pt))):
        active_ingredients.append({
            "zh": ai_zh[i] if i < len(ai_zh) else "",
            "pt": ai_pt[i] if i < len(ai_pt) else "",
            "en": ai_en[i] if i < len(ai_en) else "",
        })

    # ATC 分類：zh|||zh2 ||| pt|||pt2 ||| en|||en2 → [{zh, pt, en}, ...]
    atc_zh = parse_multi(row.get("atc_classification_zh", ""))
    atc_pt = parse_multi(row.get("atc_classification_pt", ""))
    atc_en = parse_multi(row.get("atc_classification_en", ""))

    atc_classifications = []
    for i in range(max(len(atc_zh), len(atc_pt), len(atc_en))):
        atc_classifications.append({
            "zh": atc_zh[i] if i < len(atc_zh) else "",
            "pt": atc_pt[i] if i < len(atc_pt) else "",
            "en": atc_en[i] if i < len(atc_en) else "",
        })

    return {
        # 基本識別
        "mednbr": row.get("mednbr", ""),

        # 商品名稱
        "product_name": {
            "zh": row.get("product_name_zh", ""),
            "pt": row.get("product_name_pt", ""),
            "en": row.get("product_name_en", ""),
        },

        # 劑型
        "pharmaceutical_form": {
            "zh": row.get("pharmaceutical_form_zh", ""),
            "pt": row.get("pharmaceutical_form_pt", ""),
            "en": row.get("pharmaceutical_form_en", ""),
        },

        # 投藥途徑
        "route_of_administration": {
            "zh": row.get("route_of_administration_zh", ""),
            "pt": row.get("route_of_administration_pt", ""),
            "en": row.get("route_of_administration_en", ""),
        },

        # 活性成份
        "active_ingredients": active_ingredients,

        # 法定分類
        "legal_classification": {
            "zh": row.get("legal_classification_zh", ""),
            "pt": row.get("legal_classification_pt", ""),
            "en": row.get("legal_classification_en", ""),
        },

        # ATC 分類（多個）
        "atc_classifications": atc_classifications,

        # 製造商
        "manufacturer": {
            "zh": row.get("manufacturer_zh", ""),
            "pt": row.get("manufacturer_pt", ""),
            "en": row.get("manufacturer_en", ""),
        },

        # 供應商
        "distributor": {
            "code": row.get("distributor_code", ""),
            "zh": row.get("distributor_zh", ""),
            "pt": row.get("distributor_pt", ""),
            "en": row.get("distributor_en", ""),
        },
    }


def csv_to_json(csv_path, json_path):
    with open(csv_path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    data = [row_to_structured(row) for row in rows]

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"JSON 已寫入：{json_path}（{len(data)} 筆記錄）")
    return len(data)


def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else CSV_FILE
    json_path = sys.argv[2] if len(sys.argv) > 2 else JSON_FILE

    if not os.path.exists(csv_path):
        print(f"錯誤：找不到 {csv_path}")
        sys.exit(1)

    csv_to_json(csv_path, json_path)


if __name__ == "__main__":
    main()
