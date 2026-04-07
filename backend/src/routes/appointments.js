const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/', appointmentController.getAllAppointments);
router.get('/waiting', appointmentController.getWaitingList);
router.get('/:id', appointmentController.getAppointmentById);
router.post('/', requirePermission('appointments', 'create'), appointmentController.createAppointment);
router.put('/:id', requirePermission('appointments', 'edit'), appointmentController.updateAppointment);
router.put('/:id/check-in', appointmentController.checkInAppointment);
router.put('/:id/complete', appointmentController.completeAppointment);
router.put('/:id/cancel', appointmentController.cancelAppointment);
router.delete('/:id', requirePermission('appointments', 'delete'), appointmentController.deleteAppointment);

module.exports = router;
