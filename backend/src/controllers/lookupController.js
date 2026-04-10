const pool = require('../config/database');

// Search ICD-10 codes (searches code, name_zh, name_en, name_pt)
const searchICD10 = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 1) {
      return res.json([]);
    }

    const searchPattern = `%${q}%`;
    const [rows] = await pool.execute(
      `SELECT id, code, name_tc, name_en, name_pt,
              category_tc, category_en, category_pt
       FROM icd10_codes
       WHERE code    LIKE ? collate utf8mb4_general_ci
          OR name_tc LIKE ? collate utf8mb4_general_ci
          OR name_en LIKE ? collate utf8mb4_general_ci
          OR name_pt LIKE ? collate utf8mb4_general_ci
       ORDER BY code ASC
       LIMIT 50`,
      [searchPattern, searchPattern, searchPattern, searchPattern]
    );

    res.json(rows);
  } catch (error) {
    console.error('Search ICD-10 error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Get all ICD-10 codes
const getAllICD10 = async (req, res) => {
  try {
    const { category } = req.query;

    let query = `SELECT id, code, name_tc, name_en, name_pt,
                        category_tc, category_en, category_pt
                 FROM icd10_codes`;
    const params = [];

    if (category) {
      query += ' WHERE category_tc = ?';
      params.push(category);
    }

    query += ' ORDER BY code ASC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get ICD-10 error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Search medications
const searchMedications = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 1) {
      return res.json([]);
    }

    const searchPattern = `%${q}%`;
    const [rows] = await pool.execute(
      `SELECT id, name, generic_name, dosage, route, frequency
       FROM medications
       WHERE name LIKE ? OR generic_name LIKE ?
       LIMIT 50`,
      [searchPattern, searchPattern]
    );

    res.json(rows);
  } catch (error) {
    console.error('Search medications error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Get all medications
const getAllMedications = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, generic_name, dosage, route, frequency FROM medications ORDER BY name ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

module.exports = {
  searchICD10,
  getAllICD10,
  searchMedications,
  getAllMedications
};
