const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Log audit action
const logAudit = async (userId, action, module, details, ipAddress = null) => {
  try {
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO audit_logs (id, user_id, action, module, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [id, userId, action, module, details ? JSON.stringify(details) : null, ipAddress]
    );
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};

// Audit middleware factory
const auditMiddleware = (action, module) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const ipAddress = req.ip || req.connection.remoteAddress;
        logAudit(req.user.id, action, module, {
          method: req.method,
          path: req.path,
          body: req.body
        }, ipAddress);
      }
      return originalSend.call(this, data);
    };

    next();
  };
};

module.exports = { logAudit, auditMiddleware };
