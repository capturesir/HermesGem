const pool = require('../config/database');
const { generateId, validatePatientNumber } = require('../utils/validators');
const { logAudit } = require('../middleware/audit');

// Get all patients
const getAllPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    let query = 'SELECT * FROM patients';
    let countQuery = 'SELECT COUNT(*) as total FROM patients';
    const params = [];
    const countParams = [];

    if (search) {
      const searchCondition = ' WHERE patient_number LIKE ? OR name LIKE ? OR phone LIKE ?';
      query += searchCondition;
      countQuery += searchCondition;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC';

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      patients: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all patients error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Get patient by ID
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM patients WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: '病人不存在' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get patient by ID error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Get patient by patient number
const getPatientByNumber = async (req, res) => {
  try {
    const { patientNumber } = req.params;
    const [rows] = await pool.execute('SELECT * FROM patients WHERE patient_number = ?', [patientNumber]);

    if (rows.length === 0) {
      return res.status(404).json({ error: '病人不存在' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get patient by number error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Create new patient
const createPatient = async (req, res) => {
  try {
    const {
      patient_number, name, gender, birth_date, id_card, phone, email,
      address, emergency_contact, emergency_phone, insurance_type, insurance_number
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ error: '姓名為必填項' });
    }

    if (!patient_number) {
      return res.status(400).json({ error: '病人編號為必填項' });
    }

    // Check if patient number already exists
    const [existing] = await pool.execute('SELECT id FROM patients WHERE patient_number = ?', [patient_number]);
    if (existing.length > 0) {
      return res.status(400).json({ error: '病人編號已存在' });
    }

    const id = generateId();

    await pool.execute(
      `INSERT INTO patients (id, patient_number, name, gender, birth_date, id_card, phone, email,
       address, emergency_contact, emergency_phone, insurance_type, insurance_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, patient_number, name, gender || null, birth_date || null, id_card || null,
       phone || null, email || null, address || null, emergency_contact || null,
       emergency_phone || null, insurance_type || null, insurance_number || null]
    );

    // Log audit
    await logAudit(req.user.id, 'CREATE', 'patients', { patientId: id, patient_number, name }, req.ip);

    const [rows] = await pool.execute('SELECT * FROM patients WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Update patient
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patient_number, name, gender, birth_date, id_card, phone, email,
      address, emergency_contact, emergency_phone, insurance_type, insurance_number
    } = req.body;

    // Check if patient exists
    const [existing] = await pool.execute('SELECT * FROM patients WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '病人不存在' });
    }

    // Check if patient number is being changed to an existing one
    if (patient_number && patient_number !== existing[0].patient_number) {
      const [numberCheck] = await pool.execute('SELECT id FROM patients WHERE patient_number = ? AND id != ?', [patient_number, id]);
      if (numberCheck.length > 0) {
        return res.status(400).json({ error: '病人編號已存在' });
      }
    }

    await pool.execute(
      `UPDATE patients SET
       patient_number = ?, name = ?, gender = ?, birth_date = ?, id_card = ?, phone = ?,
       email = ?, address = ?, emergency_contact = ?, emergency_phone = ?,
       insurance_type = ?, insurance_number = ?, updated_at = NOW()
       WHERE id = ?`,
      [patient_number, name, gender, birth_date, id_card, phone, email,
       address, emergency_contact, emergency_phone, insurance_type, insurance_number, id]
    );

    // Log audit
    await logAudit(req.user.id, 'UPDATE', 'patients', { patientId: id, name }, req.ip);

    const [rows] = await pool.execute('SELECT * FROM patients WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Delete patient
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT * FROM patients WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '病人不存在' });
    }

    await pool.execute('DELETE FROM patients WHERE id = ?', [id]);

    // Log audit
    await logAudit(req.user.id, 'DELETE', 'patients', { patientId: id, name: existing[0].name }, req.ip);

    res.json({ message: '病人已刪除' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  getPatientByNumber,
  createPatient,
  updatePatient,
  deletePatient
};
