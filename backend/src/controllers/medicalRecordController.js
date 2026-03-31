const pool = require('../config/database');
const { generateId } = require('../utils/validators');
const { logAudit } = require('../middleware/audit');

// ========== ALERTS ==========
const getAlertsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM alerts WHERE patient_id = ? ORDER BY created_at DESC',
      [patientId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const createAlert = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { level, type, content, is_active } = req.body;

    if (!level || !type || !content) {
      return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    const id = generateId();
    await pool.execute(
      'INSERT INTO alerts (id, patient_id, level, type, content, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [id, patientId, level, type, content, is_active ?? true]
    );

    await logAudit(req.user.id, 'CREATE', 'alerts', { alertId: id, patientId }, req.ip);

    const [rows] = await pool.execute('SELECT * FROM alerts WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { level, type, content, is_active } = req.body;

    await pool.execute(
      'UPDATE alerts SET level = ?, type = ?, content = ?, is_active = ? WHERE id = ?',
      [level, type, content, is_active, id]
    );

    await logAudit(req.user.id, 'UPDATE', 'alerts', { alertId: id }, req.ip);

    const [rows] = await pool.execute('SELECT * FROM alerts WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM alerts WHERE id = ?', [id]);
    await logAudit(req.user.id, 'DELETE', 'alerts', { alertId: id }, req.ip);
    res.json({ message: '警示已刪除' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// ========== VITAL SIGNS ==========
const getVitalsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const [rows] = await pool.execute(
      'SELECT vs.*, u.name as recorded_by_name FROM vital_signs vs LEFT JOIN users u ON vs.recorded_by = u.id WHERE patient_id = ? ORDER BY recorded_at DESC',
      [patientId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get vitals error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const createVitalSign = async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      temperature, blood_pressure_systolic, blood_pressure_diastolic, heart_rate,
      respiratory_rate, oxygen_saturation, weight, height, notes
    } = req.body;

    const id = generateId();
    await pool.execute(
      `INSERT INTO vital_signs (id, patient_id, temperature, blood_pressure_systolic, blood_pressure_diastolic,
       heart_rate, respiratory_rate, oxygen_saturation, weight, height, notes, recorded_by, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, patientId, temperature, blood_pressure_systolic, blood_pressure_diastolic,
       heart_rate, respiratory_rate, oxygen_saturation, weight, height, notes, req.user.id]
    );

    await logAudit(req.user.id, 'CREATE', 'vitals', { vitalId: id, patientId }, req.ip);

    const [rows] = await pool.execute(
      'SELECT vs.*, u.name as recorded_by_name FROM vital_signs vs LEFT JOIN users u ON vs.recorded_by = u.id WHERE vs.id = ?',
      [id]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create vital sign error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const updateVitalSign = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      temperature, blood_pressure_systolic, blood_pressure_diastolic, heart_rate,
      respiratory_rate, oxygen_saturation, weight, height, notes
    } = req.body;

    await pool.execute(
      `UPDATE vital_signs SET temperature = ?, blood_pressure_systolic = ?, blood_pressure_diastolic = ?,
       heart_rate = ?, respiratory_rate = ?, oxygen_saturation = ?, weight = ?, height = ?, notes = ?
       WHERE id = ?`,
      [temperature, blood_pressure_systolic, blood_pressure_diastolic, heart_rate,
       respiratory_rate, oxygen_saturation, weight, height, notes, id]
    );

    await logAudit(req.user.id, 'UPDATE', 'vitals', { vitalId: id }, req.ip);

    const [rows] = await pool.execute(
      'SELECT vs.*, u.name as recorded_by_name FROM vital_signs vs LEFT JOIN users u ON vs.recorded_by = u.id WHERE vs.id = ?',
      [id]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error('Update vital sign error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const deleteVitalSign = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM vital_signs WHERE id = ?', [id]);
    await logAudit(req.user.id, 'DELETE', 'vitals', { vitalId: id }, req.ip);
    res.json({ message: '生命體徵記錄已刪除' });
  } catch (error) {
    console.error('Delete vital sign error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// ========== ALLERGIES ==========
const getAllergiesByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM allergies WHERE patient_id = ? ORDER BY recorded_at DESC',
      [patientId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get allergies error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const createAllergy = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { allergen, type, severity, reaction } = req.body;

    if (!allergen || !type || !severity) {
      return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    const id = generateId();
    await pool.execute(
      'INSERT INTO allergies (id, patient_id, allergen, type, severity, reaction) VALUES (?, ?, ?, ?, ?, ?)',
      [id, patientId, allergen, type, severity, reaction]
    );

    await logAudit(req.user.id, 'CREATE', 'allergies', { allergyId: id, patientId }, req.ip);

    const [rows] = await pool.execute('SELECT * FROM allergies WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create allergy error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const updateAllergy = async (req, res) => {
  try {
    const { id } = req.params;
    const { allergen, type, severity, reaction } = req.body;

    await pool.execute(
      'UPDATE allergies SET allergen = ?, type = ?, severity = ?, reaction = ? WHERE id = ?',
      [allergen, type, severity, reaction, id]
    );

    await logAudit(req.user.id, 'UPDATE', 'allergies', { allergyId: id }, req.ip);

    const [rows] = await pool.execute('SELECT * FROM allergies WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update allergy error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const deleteAllergy = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM allergies WHERE id = ?', [id]);
    await logAudit(req.user.id, 'DELETE', 'allergies', { allergyId: id }, req.ip);
    res.json({ message: '過敏記錄已刪除' });
  } catch (error) {
    console.error('Delete allergy error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

module.exports = {
  getAlertsByPatient,
  createAlert,
  updateAlert,
  deleteAlert,
  getVitalsByPatient,
  createVitalSign,
  updateVitalSign,
  deleteVitalSign,
  getAllergiesByPatient,
  createAllergy,
  updateAllergy,
  deleteAllergy
};
