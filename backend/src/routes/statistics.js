const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/overview', statisticsController.getOverview);
router.get('/appointments', statisticsController.getAppointmentStats);
router.get('/consultations', statisticsController.getPatientConsultations);
router.get('/icd10', statisticsController.getICD10Stats);

module.exports = router;
