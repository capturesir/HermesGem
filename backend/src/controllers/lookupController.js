const pool = require('../config/database');

// Search ICD-10 codes
const searchICD10 = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 1) {
      return res.json([]);
    }

    const searchPattern = `%${q}%`;
    const [rows] = await pool.execute(
      `SELECT id, code, name_tc, name_en, category
       FROM icd10_codes
       WHERE code LIKE ? OR name_tc LIKE ? OR name_en LIKE ?
       LIMIT 50`,
      [searchPattern, searchPattern, searchPattern]
    );

    res.json(rows);
  } catch (error) {
    console.error('Search ICD-10 error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Get all ICD-10 codes (by category)
const getAllICD10 = async (req, res) => {
  try {
    const { category } = req.query;

    let query = 'SELECT id, code, name_tc, name_en, category FROM icd10_codes';
    const params = [];

    if (category) {
      query += ' WHERE category = ?';
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
