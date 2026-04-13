#!/usr/bin/env python3
"""修補 scrape_isaf_medicines.py"""

with open('/home/gem-openclaw/project/simple-medical-system/scripts/scrape_isaf_medicines.py', 'r') as f:
    content = f.read()

# ── 1. Update version comment ──
content = content.replace('澳門藥物監督管理局 (ISAF) 藥品資料爬蟲 v4', '澳門藥物監督管理局 (ISAF) 藥品資料爬蟲 v6', 1)

# ── 2. Add distributor_code to FIELDS ──
old_fields = '''    # 供應商
    "distributor_zh", "distributor_pt", "distributor_en",'''
new_fields = '''    # 供應商
    "distributor_code",
    "distributor_zh", "distributor_pt", "distributor_en",'''
content = content.replace(old_fields, new_fields, 1)

# ── 3. Fix parse_active_ingredients: only add non-empty pt ──
old_ai = '''        zh = parts[i].strip()
        en = parts[i + 1].strip() if i + 1 < len(parts) else ""
        i += 2
        if zh or en:
            zh_list.append(zh)
            en_list.append(en)'''
new_ai = '''        zh = parts[i].strip()
        en = parts[i + 1].strip() if i + 1 < len(parts) else ""
        i += 2
        if zh or en:
            zh_list.append(zh)
            en_list.append(en)
            pt_list.append("")'''
content = content.replace(old_ai, new_ai, 1)

# ── 4. Replace parse_product_name function ──
# Find by line number since heredoc is tricky
lines = content.split('\n')
fn_start = None
fn_end = None
for i, line in enumerate(lines):
    if 'def parse_product_name(text, searched_name):' in line and fn_start is None:
        fn_start = i
    if fn_start is not None and ('# ──' in line and i > fn_start):
        fn_end = i
        break

if fn_start is not None:
    new_fn_lines = [
        'def parse_product_name(text, searched_name):',
        '    """',
        '    解析商品名稱。',
        '    HTML 中無 <br>，文字全部串聯。',
        '    規則：永遠前半是中文，後半是英文。',
        '    用 find(searched_name) 找精確分界，往前找第一個空格。',
        '    """',
        '    if "||BRK||" in text:',
        '        zh, pt, en = split_trilingual(text)',
        '        return zh, pt, en',
        '',
        '    pos = text.find(searched_name)',
        '    if pos >= 0:',
        '        # 往前找第一個空格 = 中文結尾',
        '        sp = -1',
        '        for i in range(pos - 1, -1, -1):',
        '            if text[i] == " ":',
        '                sp = i',
        '                break',
        '        if sp < 0:',
        '            # searched_name 在開頭 → searched_name 是中文，之後全是英文',
        '            return searched_name.strip(), "", text[pos + len(searched_name):].lstrip()',
        '        before = text[:sp].strip()',
        '        after = text[pos:].strip()',
        '    else:',
        '        # Fallback：直接找最後一個空格',
        '        sp = text.rfind(" ")',
        '        if sp < 0:',
        '            return text.strip(), "", ""',
        '        before = text[:sp].strip()',
        '        after = text[sp + 1:].strip()',
        '',
        '    return before, "", after',
        '',
    ]
    lines = lines[:fn_start] + new_fn_lines + lines[fn_end:]
    print(f"Replaced parse_product_name (lines {fn_start}-{fn_end})")
else:
    print("WARNING: parse_product_name not found!")

content = '\n'.join(lines)

# ── 5. Add distributor_code extraction in parse_detail ──
# Find the distributor parsing block and add code extraction after it
old_dist = '''        # ── 供應商 ──
        elif any(k in label_text for k in ["供應商", "distribuidor", "distributer"]):
            zh, pt, en = parse_manufacturer_distributor(td_text(value_td))
            data["distributor_zh"] = zh
            data["distributor_pt"] = pt
            data["distributor_en"] = en'''

new_dist = '''        # ── 供應商 ──
        elif any(k in label_text for k in ["供應商", "distribuidor", "distributer"]):
            zh, pt, en = parse_manufacturer_distributor(td_text(value_td))
            data["distributor_zh"] = zh
            data["distributor_pt"] = pt
            data["distributor_en"] = en
            # 從供應商中文名稱開頭提取公司編號（如 FI0220）
            code_match = re.match(r"^([A-Z]{2}\\d{4})", zh)
            data["distributor_code"] = code_match.group(1) if code_match else ""'''

if old_dist in content:
    content = content.replace(old_dist, new_dist, 1)
    print("Added distributor_code extraction OK")
else:
    print("WARNING: distributor block not found, trying simpler search")
    # Try without leading #
    simple_old = '"distributor_en"] = en'
    if simple_old in content:
        idx = content.find(simple_old)
        print(f"Found at {idx}: {repr(content[idx:idx+100])}")

with open('/home/gem-openclaw/project/simple-medical-system/scripts/scrape_isaf_medicines.py', 'w') as f:
    f.write(content)

print("Done! Verifying...")

# Quick syntax check
import subprocess
result = subprocess.run(['python3', '-c', 'import sys; sys.path.insert(0, "/home/gem-openclaw/project/simple-medical-system/scripts"); import scrape_isaf_medicines'], capture_output=True, text=True)
if result.returncode == 0:
    print("Syntax OK!")
else:
    print("ERROR:", result.stderr[:300])
