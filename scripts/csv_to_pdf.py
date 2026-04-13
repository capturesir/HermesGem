#!/usr/bin/env python3
"""
CSV → PDF 轉換器（使用 wkhtmltopdf）
用法: python3 csv_to_pdf.py <input.csv> <output.pdf>
"""
import sys
import csv
import re
import os
from datetime import datetime

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<title>{title}</title>
<style>
  body {{ font-family: "Noto Sans CJK TC", "DejaVu Sans", Arial, sans-serif; font-size: 9pt; color: #222; }}
  h1 {{ color: #1a4a6e; border-bottom: 2px solid #1a4a6e; padding-bottom: 6px; font-size: 16pt; }}
  .meta {{ color: #666; font-size: 8pt; margin-bottom: 20px; }}
  table {{ border-collapse: collapse; width: 100%; page-break-inside: auto; }}
  thead {{ background: #1a4a6e; color: white; }}
  thead th {{ padding: 6px 4px; font-size: 8pt; text-align: left; font-weight: bold; }}
  tbody tr {{ border-bottom: 1px solid #ddd; }}
  tbody tr:nth-child(even) {{ background: #f5f9fc; }}
  tbody td {{ padding: 4px 5px; font-size: 8pt; vertical-align: top; }}
  td.no {{ color: #888; font-size: 7pt; text-align: right; padding-right: 8px; }}
  .footer {{ margin-top: 20px; font-size: 7pt; color: #aaa; text-align: center; }}
  @page {{ size: A4 landscape; margin: 15mm 12mm; }}
</style>
</head>
<body>
<h1>{title}</h1>
<div class="meta">共 {total} 筆記錄　|　來源：澳門藥物監督管理局 (ISAF)　|　匯出時間：{dt}</div>
<table>
<thead>
<tr>{headers}</tr>
</thead>
<tbody>
{rows}
</tbody>
</table>
<div class="footer">澳門藥物監督管理局藥品資料庫　此為機器匯出文件，僅供參考</div>
</body>
</html>"""

COLUMNS = [
    ("record_id", "ID"),
    ("searched_name", "搜尋名"),
    ("product_name_zh", "商品名（中文）"),
    ("product_name_en", "商品名（英文）"),
    ("pharmaceutical_form_zh", "劑型（中文）"),
    ("pharmaceutical_form_en", "劑型（英文）"),
    ("route_of_administration_zh", "投藥途徑（中文）"),
    ("active_ingredients_zh", "活性成份（中文）"),
    ("active_ingredients_en", "活性成份（英文）"),
    ("legal_classification_zh", "法定分類（中文）"),
    ("atc_code", "ATC 編碼"),
    ("atc_classification_zh", "ATC 分類（中文）"),
    ("manufacturer_code", "製造商代碼"),
    ("manufacturer_zh", "製造商（中文）"),
    ("distributor_zh", "供應商（中文）"),
]

MAX_ROWS = 500  # PDF 太多筆會太大，先限制前 500 筆


def escape(s):
    if not s:
        return ""
    s = str(s)
    s = s.replace("&", "&amp;")
    s = s.replace("<", "&lt;")
    s = s.replace(">", "&gt;")
    s = s.replace("\n", "<br>")
    return s


def csv_to_html(csv_path, max_rows=None):
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    total = len(rows)
    if max_rows:
        rows = rows[:max_rows]

    col_keys = [k for k, _ in COLUMNS]
    headers_html = "".join(f"<th>{escape(label)}</th>" for _, label in COLUMNS)

    rows_html = ""
    for i, row in enumerate(rows, 1):
        cells = []
        cells.append(f'<td class="no">{i}</td>')
        for key, _ in COLUMNS[1:]:  # skip record_id (already shown as no)
            cells.append(f"<td>{escape(row.get(key, ''))}</td>")
        rows_html += f"<tr>{''.join(cells)}</tr>\n"

    title = "澳門藥物資料列表"
    dt = datetime.now().strftime("%Y-%m-%d %H:%M")

    return HTML_TEMPLATE.format(
        title=title,
        total=f"{total:,}",
        dt=dt,
        headers=headers_html,
        rows=rows_html,
    )


def main():
    if len(sys.argv) < 3:
        print("用法: python3 csv_to_pdf.py <input.csv> <output.pdf>")
        sys.exit(1)

    csv_path = sys.argv[1]
    pdf_path = sys.argv[2]

    if not os.path.exists(csv_path):
        print(f"錯誤：找不到 {csv_path}")
        sys.exit(1)

    html_path = pdf_path + ".html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(csv_to_html(csv_path, max_rows=MAX_ROWS))
    print(f"HTML 已生成：{html_path}")

    import subprocess
    result = subprocess.run(
        ["wkhtmltopdf", "--enable-local-file-access",
         "--page-size", "A4", "--orientation", "Landscape",
         "--margin-top", "12", "--margin-bottom", "12",
         "--margin-left", "8", "--margin-right", "8",
         "--dpi", "120",
         html_path, pdf_path],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print("wkhtmltopdf 錯誤：", result.stderr[:500])

    os.remove(html_path)
    print(f"PDF 已生成：{pdf_path}")


if __name__ == "__main__":
    main()
