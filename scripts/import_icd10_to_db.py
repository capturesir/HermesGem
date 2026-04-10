#!/usr/bin/env python3
"""
將 icd10_disease_full.csv 匯入資料庫 icd10_codes 表
使用方式：直接執行（依賴系統 mysql CLI）
  python3 scripts/import_icd10_to_db.py
"""
import csv
import re
import subprocess
import os
import sys

CSV_PATH = "/home/gem-openclaw/project/simple-medical-system/data/icd10_disease_full.csv"
DB_ARGS  = ["mysql", "-u", "root", "-pclinic123", "simple_medical_db"]

def clean(s):
    """MySQL 字串跳脫"""
    return (s or "").replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "")

def main():
    # 讀 CSV
    rows = []
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    print(f"讀取 CSV：{len(rows)} 筆記錄")

    # TRUNCATE
    subprocess.run(
        ["mysql", "-u", "root", "-pclinic123", "simple_medical_db", "-e", "TRUNCATE TABLE icd10_codes;"],
        check=True
    )
    print("已清空資料表\n")

    # 生成 INSERT 語句
    values = []
    for row in rows:
        code_raw = (row.get("icd10_code") or "").strip()
        id_val   = code_raw.replace("*", "")
        code_val = code_raw

        values.append(
            f"('{id_val}', '{code_val}', "
            f"'{clean(row.get('name_zh',''))}', "
            f"'{clean(row.get('name_en',''))}', "
            f"'{clean(row.get('name_pt',''))}', "
            f"'{clean(row.get('category_zh',''))}', "
            f"'{clean(row.get('category_en',''))}', "
            f"'{clean(row.get('category_pt',''))}')"
        )

    # 分批執行（每 200 筆一批）
    batch_size = 200
    total = len(values)
    done = 0

    for i in range(0, total, batch_size):
        batch = values[i:i+batch_size]
        sql = (
            "INSERT INTO icd10_codes\n"
            "  (id, code, name_tc, name_en, name_pt,\n"
            "   category_tc, category_en, category_pt)\n"
            "VALUES\n  " + ",\n  ".join(batch) + "\n"
            "ON DUPLICATE KEY UPDATE\n"
            "  code        = VALUES(code),\n"
            "  name_tc     = VALUES(name_tc),\n"
            "  name_en     = VALUES(name_en),\n"
            "  name_pt     = VALUES(name_pt),\n"
            "  category_tc = VALUES(category_tc),\n"
            "  category_en = VALUES(category_en),\n"
            "  category_pt = VALUES(category_pt);\n"
        )
        proc = subprocess.run(
            ["mysql", "-u", "root", "-pclinic123", "simple_medical_db"],
            input=sql.encode("utf8"),
            check=False
        )
        if proc.returncode != 0:
            print(f"  [!] 批次 {i//batch_size + 1} 錯誤: {proc.stderr.decode('utf8', errors='replace')[:200]}")
        else:
            done += len(batch)
            print(f"  匯入 {done}/{total} ...")

    # 驗證
    result = subprocess.run(
        ["mysql", "-u", "root", "-pclinic123", "simple_medical_db", "-e",
         "SELECT COUNT(*) as total FROM icd10_codes;"],
        capture_output=True, text=True
    )
    print(f"\n完成！資料表共 {result.stdout.splitlines()[-1]} 筆記錄")

    # 範例
    result2 = subprocess.run(
        ["mysql", "-u", "root", "-pclinic123", "simple_medical_db", "-e",
         "SELECT id, code, category_tc, name_tc, name_en, name_pt FROM icd10_codes LIMIT 5;"],
        capture_output=True, text=True
    )
    print("\n範例（前 5 筆）：")
    print(result2.stdout)

if __name__ == "__main__":
    main()
