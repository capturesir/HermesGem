const express = require('express');
const router = express.Router();
const lookupController = require('../controllers/lookupController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// ICD-10
router.get('/icd10', lookupController.getAllICD10);
router.get('/icd10/search', lookupController.searchICD10);

// Medications
router.get('/medications', lookupController.getAllMedications);
router.get('/medications/search', lookupController.searchMedications);

module.exports = router;
