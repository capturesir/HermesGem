const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const medicalRecordController = require('../controllers/medicalRecordController');
const soapController = require('../controllers/soapController');
const documentController = require('../controllers/documentController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Patient CRUD
router.get('/', patientController.getAllPatients);
router.get('/:id', patientController.getPatientById);
router.get('/number/:patientNumber', patientController.getPatientByNumber);
router.post('/', requirePermission('patients', 'create'), patientController.createPatient);
router.put('/:id', requirePermission('patients', 'edit'), patientController.updatePatient);
router.delete('/:id', requirePermission('patients', 'delete'), patientController.deletePatient);

// Alerts
router.get('/:patientId/alerts', medicalRecordController.getAlertsByPatient);
router.post('/:patientId/alerts', requirePermission('alerts', 'create'), medicalRecordController.createAlert);
router.put('/alerts/:id', requirePermission('alerts', 'edit'), medicalRecordController.updateAlert);
router.delete('/alerts/:id', requirePermission('alerts', 'delete'), medicalRecordController.deleteAlert);

// Vital Signs
router.get('/:patientId/vitals', medicalRecordController.getVitalsByPatient);
router.post('/:patientId/vitals', requirePermission('vitals', 'create'), medicalRecordController.createVitalSign);
router.put('/vitals/:id', requirePermission('vitals', 'edit'), medicalRecordController.updateVitalSign);
router.delete('/vitals/:id', requirePermission('vitals', 'delete'), medicalRecordController.deleteVitalSign);

// Allergies
router.get('/:patientId/allergies', medicalRecordController.getAllergiesByPatient);
router.post('/:patientId/allergies', requirePermission('allergies', 'create'), medicalRecordController.createAllergy);
router.put('/allergies/:id', requirePermission('allergies', 'edit'), medicalRecordController.updateAllergy);
router.delete('/allergies/:id', requirePermission('allergies', 'delete'), medicalRecordController.deleteAllergy);

// SOAP Notes
router.get('/:patientId/soap', soapController.getSOAPByPatient);
router.post('/:patientId/soap', requirePermission('soap', 'create'), soapController.createSOAPNote);
router.put('/soap/:id', requirePermission('soap', 'edit'), soapController.updateSOAPNote);
router.delete('/soap/:id', requirePermission('soap', 'delete'), soapController.deleteSOAPNote);

// Prescriptions
router.get('/:patientId/prescriptions', soapController.getPrescriptionsByPatient);
router.post('/:patientId/prescriptions', requirePermission('prescriptions', 'create'), soapController.createPrescription);
router.put('/prescriptions/:id', requirePermission('prescriptions', 'edit'), soapController.updatePrescription);
router.delete('/prescriptions/:id', requirePermission('prescriptions', 'delete'), soapController.deletePrescription);

// Documents
router.get('/:patientId/documents', documentController.getDocumentsByPatient);
router.post('/:patientId/documents', requirePermission('documents', 'create'), documentController.upload.single('file'), documentController.uploadDocument);
router.delete('/documents/:id', requirePermission('documents', 'delete'), documentController.deleteDocument);

module.exports = router;
