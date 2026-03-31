const pool = require('../config/database');
const { generateId } = require('../utils/validators');
const { logAudit } = require('../middleware/audit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('不支援的文件格式'));
  }
});

// Get documents by patient
const getDocumentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { category } = req.query;

    let query = 'SELECT * FROM documents WHERE patient_id = ?';
    const params = [patientId];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY uploaded_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Upload document
const uploadDocument = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { category, name, date } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: '請上傳文件' });
    }

    if (!category || !name) {
      return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    const id = generateId();
    const fileUrl = `/uploads/${req.file.filename}`;

    await pool.execute(
      `INSERT INTO documents (id, patient_id, category, name, file_type, file_url, file_size, uploaded_by, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, patientId, category, name, req.file.mimetype, fileUrl, req.file.size, req.user.id, date || new Date()]
    );

    await logAudit(req.user.id, 'CREATE', 'documents', { documentId: id, patientId, name }, req.ip);

    const [rows] = await pool.execute('SELECT * FROM documents WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Get document download URL
const getDocumentDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM documents WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const filePath = path.join(__dirname, '../..', rows[0].file_url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    res.download(filePath, rows[0].name);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM documents WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // Delete physical file
    const filePath = path.join(__dirname, '../..', rows[0].file_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.execute('DELETE FROM documents WHERE id = ?', [id]);

    await logAudit(req.user.id, 'DELETE', 'documents', { documentId: id }, req.ip);
    res.json({ message: '文件已刪除' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};

module.exports = {
  getDocumentsByPatient,
  uploadDocument,
  getDocumentDownload,
  deleteDocument,
  upload
};
