const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Settings (admin only)
router.get('/', requireRole('admin'), settingsController.getSettings);
router.put('/', requireRole('admin'), settingsController.updateSettings);

// Audit logs (admin only)
router.get('/audit-logs', requireRole('admin'), settingsController.getAuditLogs);

module.exports = router;
