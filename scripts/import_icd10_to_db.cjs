/**
 * 將 icd10_disease_full.csv 匯入資料庫 icd10_codes 表
 *
 * 用法：
 *   cd simple-medical-system/backend
 *   NODE_PATH=./node_modules node ../scripts/import_icd10_to_db.cjs
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const CSV_PATH = path.join(__dirname, "..", "data", "icd10_disease_full.csv");

const DB = {
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || "3306"),
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASS     || "clinic123",
  database: process.env.DB_NAME     || "simple_medical_db",
  charset:  "utf8mb4",
};

/** 嚴格 CSV 解析（處理引號、包圍的逗號、換行） */
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/** 讀取 CSV，回傳 [{header: value}] */
function readCsv(filePath) {
  const buf = fs.readFileSync(filePath);
  const raw = buf.toString("utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter(l => l.trim());

  const headers = lines[0].split(",").map((h, i) => {
    // 去除 BOM / 引號
    return h.trim().replace(/^"|"$/g, "").trim();
  });

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0] === "")) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = (values[idx] || "").replace(/^"|"$/g, "").trim();
    });
    rows.push(obj);
  }
  return rows;
}

async function main() {
  console.log(`\n連線至資料庫：${DB.host}:${DB.port}/${DB.database}`);
  const conn = await mysql.createConnection(DB);
  console.log("已連線\n");

  // 讀取 CSV
  const rows = readCsv(CSV_PATH);
  console.log(`讀取 CSV：${rows.length} 筆記錄`);

  // 清空現有資料
  console.log("正在清空現有資料...");
  await conn.query("TRUNCATE TABLE icd10_codes");
  console.log("已清空\n");

  // 準備 INSERT 語句
  const sql = `
    INSERT INTO icd10_codes
      (id, code, name_tc, name_en, name_pt,
       category_tc, category_en, category_pt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      code        = VALUES(code),
      name_tc     = VALUES(name_tc),
      name_en     = VALUES(name_en),
      name_pt     = VALUES(name_pt),
      category_tc = VALUES(category_tc),
      category_en = VALUES(category_en),
      category_pt = VALUES(category_pt)
  `;

  const [insertStmt] = await conn.prepare(sql);

  let inserted = 0;
  let errors = 0;
  const batchSize = 100;
  const batches = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const codeRaw = (row.icd10_code || "").trim();
    const idVal   = codeRaw.replace(/\*/g, "");          // 移除 * 號
    const codeVal = codeRaw;                              // 保留原始（含 *）
    const nameZh  = (row.name_zh       || "").trim();
    const nameEn  = (row.name_en       || "").trim();
    const namePt  = (row.name_pt       || "").trim();
    const catZh   = (row.category_zh   || "").trim();
    const catEn   = (row.category_en   || "").trim();
    const catPt   = (row.category_pt   || "").trim();

    batches.push([idVal, codeVal, nameZh, nameEn, namePt, catZh, catEn, catPt]);

    if (batches.length === batchSize || i === rows.length - 1) {
      try {
        for (const batch of batches) {
          await conn.query(sql, batch);
          inserted++;
        }
        console.log(`  已匯入 ${inserted}/${rows.length} ...`);
      } catch (err) {
        console.error(`  [!] 批次錯誤: ${err.message}`);
        errors += batches.length;
      }
      batches.length = 0;
    }
  }

  await conn.query(sql, []).catch(() => {}); // close prepare

  // 統計
  const [rs] = await conn.query("SELECT COUNT(*) as c FROM icd10_codes");
  console.log(`\n完成！`);
  console.log(`  匯入：${inserted} 筆記錄`);
  console.log(`  錯誤：${errors}`);
  console.log(`  資料表共：${rs[0].c} 筆記錄`);

  // 顯示範例
  const [samples] = await conn.query(
    "SELECT id, code, name_tc, name_en, name_pt, category_tc, category_en, category_pt FROM icd10_codes LIMIT 5"
  );
  console.log("\n範例（前 5 筆）：");
  samples.forEach(r => {
    console.log(
      `  ${r.id} | ${r.category_tc} | ${r.name_tc} | ${r.name_en} | ${r.name_pt}`
    );
  });

  await conn.end();
  process.exit(0);
}

main().catch(err => {
  console.error("執行失敗：", err);
  process.exit(1);
});
