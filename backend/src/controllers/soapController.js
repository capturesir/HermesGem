const pool = require('../config/database');
const { generateId } = require('../utils/validators');
const { logAudit } = require('../middleware/audit');

// ========== SOAP NOTES ==========
const getSOAPByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const [rows] = await pool.execute(
      `SELECT sn.*, u.name as doctor_name
       FROM soap_notes sn
       LEFT JOIN users u ON sn.doctor_id = u.id
       WHERE patient_id = ?
       ORDER BY visit_date DESC, created_at DESC`,
      [patientId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get SOAP notes error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const createSOAPNote = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { visit_date, subjective, objective, assessment, plan, notes, appointment_id } = req.body;

    if (!visit_date) {
      return res.status(400).json({ error: '就診日期為必填項' });
    }

    const id = generateId();
    await pool.execute(
      `INSERT INTO soap_notes (id, patient_id, visit_date, subjective, objective, assessment, plan, doctor_id, notes, appointment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, patientId, visit_date, subjective || '', objective || '', assessment || '', plan || '', req.user.id, notes, appointment_id]
    );

    await logAudit(req.user.id, 'CREATE', 'soap', { soapId: id, patientId, visit_date }, req.ip);

    const [rows] = await pool.execute(
      `SELECT sn.*, u.name as doctor_name
       FROM soap_notes sn
       LEFT JOIN users u ON sn.doctor_id = u.id
       WHERE sn.id = ?`,
      [id]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create SOAP note error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const updateSOAPNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { visit_date, subjective, objective, assessment, plan, notes } = req.body;

    // Get existing note
    const [existing] = await pool.execute('SELECT * FROM soap_notes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'SOAP 記錄不存在' });
    }

    // Check if user is the same doctor who created the note
    if (existing[0].doctor_id !== req.user.id) {
      return res.status(403).json({ error: '您只能修改自己的就診記錄' });
    }

    // Get edit time limit from settings
    const [settings] = await pool.execute(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'soap_edit_hours'"
    );
    const editHours = settings.length > 0 ? parseInt(settings[0].setting_value) || 48 : 48;

    if (editHours > 0) {
      const createdAt = new Date(existing[0].created_at);
      const now = new Date();
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

      if (hoursDiff > editHours) {
        return res.status(403).json({
          error: `此就診記錄已超過可修改時間範圍 (${editHours}小時)`
        });
      }
    }

    await pool.execute(
      `UPDATE soap_notes SET visit_date = ?, subjective = ?, objective = ?, assessment = ?, plan = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [visit_date, subjective, objective, assessment, plan, notes, id]
    );

    await logAudit(req.user.id, 'UPDATE', 'soap', { soapId: id }, req.ip);

    const [rows] = await pool.execute(
      `SELECT sn.*, u.name as doctor_name
       FROM soap_notes sn
       LEFT JOIN users u ON sn.doctor_id = u.id
       WHERE sn.id = ?`,
      [id]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error('Update SOAP note error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const deleteSOAPNote = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permission
    const [existing] = await pool.execute('SELECT * FROM soap_notes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'SOAP 記錄不存在' });
    }

    if (existing[0].doctor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '您只能刪除自己的就診記錄' });
    }

    await pool.execute('DELETE FROM soap_notes WHERE id = ?', [id]);
    await logAudit(req.user.id, 'DELETE', 'soap', { soapId: id }, req.ip);
    res.json({ message: 'SOAP 記錄已刪除' });
  } catch (error) {
    console.error('Delete SOAP note error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// ========== PRESCRIPTIONS ==========
const getPrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const [rows] = await pool.execute(
      `SELECT p.*, u.name as doctor_name
       FROM prescriptions p
       LEFT JOIN users u ON p.doctor_id = u.id
       WHERE patient_id = ?
       ORDER BY date DESC, created_at DESC`,
      [patientId]
    );

    // Get medications for each prescription
    for (let row of rows) {
      const [meds] = await pool.execute(
        'SELECT * FROM prescription_medications WHERE prescription_id = ?',
        [row.id]
      );
      row.medications = meds;
    }

    res.json(rows);
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const createPrescription = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { date, medications, status, notes, appointment_id } = req.body;

    if (!date) {
      return res.status(400).json({ error: '日期為必填項' });
    }

    if (!medications || medications.length === 0) {
      return res.status(400).json({ error: '請至少添加一種藥物' });
    }

    const prescriptionId = generateId();
    await pool.execute(
      `INSERT INTO prescriptions (id, patient_id, doctor_id, appointment_id, notes, status, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [prescriptionId, patientId, req.user.id, appointment_id, notes, status || 'active', date]
    );

    // Insert medications
    for (const med of medications) {
      const medId = generateId();
      await pool.execute(
        `INSERT INTO prescription_medications (id, prescription_id, name, dosage, frequency, route, duration)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [medId, prescriptionId, med.name, med.dosage, med.frequency, med.route, med.duration]
      );
    }

    await logAudit(req.user.id, 'CREATE', 'prescriptions', { prescriptionId, patientId }, req.ip);

    // Return the complete prescription
    const [prescription] = await pool.execute(
      `SELECT p.*, u.name as doctor_name
       FROM prescriptions p
       LEFT JOIN users u ON p.doctor_id = u.id
       WHERE p.id = ?`,
      [prescriptionId]
    );
    const [meds] = await pool.execute(
      'SELECT * FROM prescription_medications WHERE prescription_id = ?',
      [prescriptionId]
    );
    prescription[0].medications = meds;

    res.status(201).json(prescription[0]);
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, medications, status, notes } = req.body;

    // Check existing
    const [existing] = await pool.execute('SELECT * FROM prescriptions WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '處方不存在' });
    }

    // Check permission
    if (existing[0].doctor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '您只能修改自己的處方' });
    }

    await pool.execute(
      'UPDATE prescriptions SET date = ?, status = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [date, status, notes, id]
    );

    // Update medications if provided
    if (medications) {
      // Delete existing medications
      await pool.execute('DELETE FROM prescription_medications WHERE prescription_id = ?', [id]);

      // Insert new medications
      for (const med of medications) {
        const medId = generateId();
        await pool.execute(
          `INSERT INTO prescription_medications (id, prescription_id, name, dosage, frequency, route, duration)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [medId, id, med.name, med.dosage, med.frequency, med.route, med.duration]
        );
      }
    }

    await logAudit(req.user.id, 'UPDATE', 'prescriptions', { prescriptionId: id }, req.ip);

    // Return updated prescription
    const [prescription] = await pool.execute(
      `SELECT p.*, u.name as doctor_name
       FROM prescriptions p
       LEFT JOIN users u ON p.doctor_id = u.id
       WHERE p.id = ?`,
      [id]
    );
    const [meds] = await pool.execute(
      'SELECT * FROM prescription_medications WHERE prescription_id = ?',
      [id]
    );
    prescription[0].medications = meds;

    res.json(prescription[0]);
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT * FROM prescriptions WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '處方不存在' });
    }

    if (existing[0].doctor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '您只能刪除自己的處方' });
    }

    // Delete medications first (cascade should handle this, but explicit for safety)
    await pool.execute('DELETE FROM prescription_medications WHERE prescription_id = ?', [id]);
    await pool.execute('DELETE FROM prescriptions WHERE id = ?', [id]);

    await logAudit(req.user.id, 'DELETE', 'prescriptions', { prescriptionId: id }, req.ip);
    res.json({ message: '處方已刪除' });
  } catch (error) {
    console.error('Delete prescription error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

module.exports = {
  getSOAPByPatient,
  createSOAPNote,
  updateSOAPNote,
  deleteSOAPNote,
  getPrescriptionsByPatient,
  createPrescription,
  updatePrescription,
  deletePrescription
};
