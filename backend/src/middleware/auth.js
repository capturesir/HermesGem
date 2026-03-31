const jwt = require('jsonwebtoken');
const { PERMISSIONS } = require('../config/constants');

const JWT_SECRET = process.env.JWT_SECRET || 'emr_system_secret_key_2024';
const JWT_EXPIRES_IN = '24h';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供認證令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '認證令牌無效或已過期' });
    }
    req.user = user;
    next();
  });
};

// Check role middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '您沒有權限執行此操作' });
    }
    next();
  };
};

// Check permission middleware
const requirePermission = (module, action) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const permissions = PERMISSIONS[userRole];

    if (!permissions || !permissions[module]) {
      return res.status(403).json({ error: '您沒有權限訪問此模組' });
    }

    const permission = permissions[module];
    const actionMap = {
      view: 'view',
      create: 'create',
      edit: 'edit',
      delete: 'delete'
    };

    if (!permission[actionMap[action]]) {
      return res.status(403).json({ error: `您沒有${action}權限` });
    }

    next();
  };
};

// Get user permissions
const getUserPermissions = (role) => {
  return PERMISSIONS[role] || {};
};

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticateToken,
  requireRole,
  requirePermission,
  getUserPermissions
};
