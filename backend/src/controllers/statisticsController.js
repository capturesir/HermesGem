const pool = require('../config/database');

// Get overview statistics
const getOverview = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Today's appointments count
    const [todayAppointments] = await pool.execute(
      'SELECT COUNT(*) as count FROM appointments WHERE date = ?',
      [today]
    );

    // Today's completed count
    const [todayCompleted] = await pool.execute(
      'SELECT COUNT(*) as count FROM appointments WHERE date = ? AND status = ?',
      [today, 'completed']
    );

    // Today's waiting count
    const [todayWaiting] = await pool.execute(
      'SELECT COUNT(*) as count FROM appointments WHERE date = ? AND status = ?',
      [today, 'checked-in']
    );

    // Total patients
    const [totalPatients] = await pool.execute(
      'SELECT COUNT(*) as count FROM patients'
    );

    // Total appointments this month
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const [monthAppointments] = await pool.execute(
      'SELECT COUNT(*) as count FROM appointments WHERE date >= ?',
      [monthStartStr]
    );

    res.json({
      todayAppointments: todayAppointments[0].count,
      todayCompleted: todayCompleted[0].count,
      todayWaiting: todayWaiting[0].count,
      totalPatients: totalPatients[0].count,
      monthAppointments: monthAppointments[0].count
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Get appointment statistics
const getAppointmentStats = async (req, res) => {
  try {
    const { startDate, endDate, patientId } = req.query;

    let query = `
      SELECT
        COUNT(*) as total_appointments,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'checked-in' THEN 1 ELSE 0 END) as checked_in,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM appointments
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }
    if (patientId) {
      query += ' AND patient_id = ?';
      params.push(patientId);
    }

    const [rows] = await pool.execute(query, params);

    // Get daily breakdown for the period
    let dailyQuery = `
      SELECT date, status, COUNT(*) as count
      FROM appointments
      WHERE 1=1
    `;
    const dailyParams = [];

    if (startDate) {
      dailyQuery += ' AND date >= ?';
      dailyParams.push(startDate);
    }
    if (endDate) {
      dailyQuery += ' AND date <= ?';
      dailyParams.push(endDate);
    }

    dailyQuery += ' GROUP BY date, status ORDER BY date DESC';

    const [dailyStats] = await pool.execute(dailyQuery, dailyParams);

    res.json({
      summary: rows[0],
      dailyStats
    });
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Get patient consultation count
const getPatientConsultations = async (req, res) => {
  try {
    const { patientId, startDate, endDate } = req.query;

    if (!patientId) {
      return res.status(400).json({ error: '請提供病人ID' });
    }

    let query = `
      SELECT COUNT(*) as consultation_count
      FROM appointments
      WHERE patient_id = ? AND status = 'completed'
    `;
    const params = [patientId];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    const [rows] = await pool.execute(query, params);

    // Get consultation details
    let detailsQuery = `
      SELECT a.*, u.name as doctor_name
      FROM appointments a
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE a.patient_id = ? AND a.status = 'completed'
    `;
    const detailsParams = [patientId];

    if (startDate) {
      detailsQuery += ' AND a.date >= ?';
      detailsParams.push(startDate);
    }
    if (endDate) {
      detailsQuery += ' AND a.date <= ?';
      detailsParams.push(endDate);
    }

    detailsQuery += ' ORDER BY a.date DESC';

    const [details] = await pool.execute(detailsQuery, detailsParams);

    res.json({
      count: rows[0].consultation_count,
      details
    });
  } catch (error) {
    console.error('Get patient consultations error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Get ICD-10 disease statistics
const getICD10Stats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT
        icd10.category,
        icd10.code,
        icd10.name_tc,
        COUNT(*) as count
      FROM soap_notes sn
      LEFT JOIN icd10_codes icd10 ON sn.assessment LIKE CONCAT('%', icd10.code, '%')
      WHERE sn.assessment IS NOT NULL AND sn.assessment != ''
    `;
    const params = [];

    if (startDate) {
      query += ' AND sn.visit_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND sn.visit_date <= ?';
      params.push(endDate);
    }

    query += `
      GROUP BY icd10.category, icd10.code, icd10.name_tc
      HAVING icd10.code IS NOT NULL
      ORDER BY count DESC
      LIMIT 50
    `;

    const [rows] = await pool.execute(query, params);

    // Group by category
    const byCategory = {};
    for (const row of rows) {
      const category = row.category || '未分類';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(row);
    }

    res.json({
      detailed: rows,
      byCategory
    });
  } catch (error) {
    console.error('Get ICD-10 stats error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

module.exports = {
  getOverview,
  getAppointmentStats,
  getPatientConsultations,
  getICD10Stats
};
