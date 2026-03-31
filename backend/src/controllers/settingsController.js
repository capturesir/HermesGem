const pool = require('../config/database');
const { logAudit } = require('../middleware/audit');

// Get all settings
const getSettings = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM system_settings');
    const settings = {};
    for (const row of rows) {
      settings[row.setting_key] = row.setting_value;
    }
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Update settings
const updateSettings = async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      const [existing] = await pool.execute(
        'SELECT * FROM system_settings WHERE setting_key = ?',
        [key]
      );

      if (existing.length > 0) {
        await pool.execute(
          'UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
          [value, key]
        );
      } else {
        await pool.execute(
          'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)',
          [key, value]
        );
      }
    }

    await logAudit(req.user.id, 'UPDATE', 'settings', { settings: Object.keys(settings) }, req.ip);

    // Return updated settings
    const [rows] = await pool.execute('SELECT * FROM system_settings');
    const result = {};
    for (const row of rows) {
      result[row.setting_key] = row.setting_value;
    }
    res.json(result);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Get audit logs
const getAuditLogs = async (req, res) => {
  try {
    const { user_id, action, module, start_date, end_date, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT al.*, u.name as user_name, u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (user_id) {
      query += ' AND al.user_id = ?';
      params.push(user_id);
    }
    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }
    if (module) {
      query += ' AND al.module = ?';
      params.push(module);
    }
    if (start_date) {
      query += ' AND al.created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND al.created_at <= ?';
      params.push(end_date + ' 23:59:59');
    }

    query += ' ORDER BY al.created_at DESC';

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
    const countParams = [];

    if (user_id) {
      countQuery += ' AND user_id = ?';
      countParams.push(user_id);
    }
    if (action) {
      countQuery += ' AND action = ?';
      countParams.push(action);
    }
    if (module) {
      countQuery += ' AND module = ?';
      countParams.push(module);
    }
    if (start_date) {
      countQuery += ' AND created_at >= ?';
      countParams.push(start_date);
    }
    if (end_date) {
      countQuery += ' AND created_at <= ?';
      countParams.push(end_date + ' 23:59:59');
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      logs: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getAuditLogs
};
