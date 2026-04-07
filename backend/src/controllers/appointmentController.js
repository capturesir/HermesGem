const pool = require('../config/database');
const { generateId } = require('../utils/validators');
const { logAudit } = require('../middleware/audit');
const path = require('path');
const fs = require('fs');

// Get all appointments
const getAllAppointments = async (req, res) => {
  try {
    const { date, status, doctor_id, patient_id, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT a.*, p.name as patient_name, p.patient_number,
             u.name as doctor_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (doctor_id) {
      query += ' AND a.doctor_id = ?';
      params.push(doctor_id);
    }
    if (patient_id) {
      query += ' AND a.patient_id = ?';
      params.push(patient_id);
    }

    query += ' ORDER BY a.date DESC, a.time ASC';

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM appointments a
      WHERE 1=1
    `;
    const countParams = [...params.slice(0, params.length)];

    if (date) {
      countQuery = countQuery.replace('WHERE 1=1', 'WHERE 1=1 AND a.date = ?');
    }

    const [countResult] = await pool.execute(countQuery, countParams.length > 0 ? [date] : []);
    const total = countResult[0]?.total || rows.length;

    res.json({
      appointments: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Get appointment by ID
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT a.*, p.name as patient_name, p.patient_number, p.phone as patient_phone,
              u.name as doctor_name
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       LEFT JOIN users u ON a.doctor_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '預約不存在' });
    }

    // Get alerts for this patient
    const [alerts] = await pool.execute(
      'SELECT * FROM alerts WHERE patient_id = ? AND is_active = TRUE',
      [rows[0].patient_id]
    );

    rows[0].alerts = alerts;

    res.json(rows[0]);
  } catch (error) {
    console.error('Get appointment by ID error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Create appointment
const createAppointment = async (req, res) => {
  try {
    const { patient_id, doctor_id, date, time, type, notes } = req.body;

    if (!patient_id || !date) {
      return res.status(400).json({ error: '病人編號和診症日期為必填項' });
    }

    // Verify patient exists
    const [patient] = await pool.execute('SELECT * FROM patients WHERE id = ?', [patient_id]);
    if (patient.length === 0) {
      return res.status(400).json({ error: '病人不存在' });
    }

    const id = generateId();
    await pool.execute(
      `INSERT INTO appointments (id, patient_id, doctor_id, date, time, type, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [id, patient_id, doctor_id || null, date, time || null, type || 'first', notes || null]
    );

    await logAudit(req.user.id, 'CREATE', 'appointments', { appointmentId: id, patient_id, date }, req.ip);

    const [rows] = await pool.execute(
      `SELECT a.*, p.name as patient_name, p.patient_number, u.name as doctor_name
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       LEFT JOIN users u ON a.doctor_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Update appointment
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctor_id, date, time, type, notes, status } = req.body;

    const [existing] = await pool.execute('SELECT * FROM appointments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '預約不存在' });
    }

    // Dynamically build SET clause only for fields that are provided
    const fields = [];
    const values = [];
    if (doctor_id !== undefined) { fields.push('doctor_id = ?'); values.push(doctor_id); }
    if (date !== undefined) { fields.push('date = ?'); values.push(date); }
    if (time !== undefined) { fields.push('time = ?'); values.push(time); }
    if (type !== undefined) { fields.push('type = ?'); values.push(type); }
    if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }

    if (fields.length === 0) {
      return res.status(400).json({ error: '沒有提供任何要更新的欄位' });
    }

    values.push(id);
    await pool.execute(
      `UPDATE appointments SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    await logAudit(req.user.id, 'UPDATE', 'appointments', { appointmentId: id }, req.ip);

    const [rows] = await pool.execute(
      `SELECT a.*, p.name as patient_name, p.patient_number, u.name as doctor_name
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       LEFT JOIN users u ON a.doctor_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Check-in appointment
const checkInAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT * FROM appointments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '預約不存在' });
    }

    if (existing[0].status !== 'pending') {
      return res.status(400).json({ error: '該預約狀態無法報到' });
    }

    await pool.execute(
      'UPDATE appointments SET status = ?, updated_at = NOW() WHERE id = ?',
      ['checked-in', id]
    );

    await logAudit(req.user.id, 'CHECK_IN', 'appointments', { appointmentId: id }, req.ip);

    const [rows] = await pool.execute(
      `SELECT a.*, p.name as patient_name, p.patient_number, u.name as doctor_name
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       LEFT JOIN users u ON a.doctor_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Check-in appointment error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Complete appointment
const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { consultation_type, consultation_notes } = req.body;

    const [existing] = await pool.execute('SELECT * FROM appointments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '預約不存在' });
    }

    if (existing[0].status !== 'checked-in') {
      return res.status(400).json({ error: '該預約狀態無法完成' });
    }

    await pool.execute(
      `UPDATE appointments SET status = ?, consultation_type = ?, consultation_notes = ?, updated_at = NOW()
       WHERE id = ?`,
      ['completed', consultation_type || 'consultation', consultation_notes, id]
    );

    await logAudit(req.user.id, 'COMPLETE', 'appointments', { appointmentId: id }, req.ip);

    const [rows] = await pool.execute(
      `SELECT a.*, p.name as patient_name, p.patient_number, u.name as doctor_name
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       LEFT JOIN users u ON a.doctor_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, document_url } = req.body;

    if (!reason) {
      return res.status(400).json({ error: '請填寫取消原因' });
    }

    const [existing] = await pool.execute('SELECT * FROM appointments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '預約不存在' });
    }

    if (existing[0].status === 'completed') {
      return res.status(400).json({ error: '已完成的預約無法取消' });
    }

    // Update appointment
    await pool.execute(
      `UPDATE appointments SET status = ?, cancel_reason = ?, cancel_document_url = ?, updated_at = NOW()
       WHERE id = ?`,
      ['cancelled', reason, document_url, id]
    );

    // If document uploaded, add to patient's documents
    if (document_url) {
      const docId = generateId();
      await pool.execute(
        `INSERT INTO documents (id, patient_id, category, name, file_type, file_url, uploaded_by)
         VALUES (?, ?, 'other', ?, ?, ?, ?)`,
        [docId, existing[0].patient_id, `取消預約證明_${new Date().toISOString().split('T')[0]}`,
         path.extname(document_url).slice(1), document_url, req.user.id]
      );
    }

    await logAudit(req.user.id, 'CANCEL', 'appointments', { appointmentId: id, reason }, req.ip);

    const [rows] = await pool.execute(
      `SELECT a.*, p.name as patient_name, p.patient_number, u.name as doctor_name
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       LEFT JOIN users u ON a.doctor_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Get waiting list (checked-in appointments)
const getWaitingList = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.*, p.name as patient_name, p.patient_number, p.phone as patient_phone,
              u.name as doctor_name
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       LEFT JOIN users u ON a.doctor_id = u.id
       WHERE a.status = 'checked-in'
       ORDER BY a.date ASC, a.time ASC`
    );

    // Get alerts for each patient
    for (let row of rows) {
      const [alerts] = await pool.execute(
        'SELECT * FROM alerts WHERE patient_id = ? AND is_active = TRUE',
        [row.patient_id]
      );
      row.alerts = alerts;
    }

    res.json(rows);
  } catch (error) {
    console.error('Get waiting list error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  checkInAppointment,
  completeAppointment,
  cancelAppointment,
  getWaitingList
};
