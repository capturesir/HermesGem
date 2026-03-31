const { v4: uuidv4 } = require('uuid');

// Generate UUID
const generateId = () => {
  return uuidv4();
};

// Validate required fields
const validateRequired = (obj, fields) => {
  const missing = [];
  for (const field of fields) {
    if (!obj[field]) {
      missing.push(field);
    }
  }
  return missing;
};

// Validate patient number uniqueness (for creating new patients)
const validatePatientNumber = (patientNumber) => {
  if (!patientNumber || patientNumber.trim() === '') {
    return '病人編號不能為空';
  }
  if (patientNumber.length > 20) {
    return '病人編號長度不能超過20個字符';
  }
  return null;
};

// Validate date format
const validateDate = (dateStr) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return '日期格式不正確，請使用 YYYY-MM-DD 格式';
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return '日期無效';
  }
  return null;
};

// Validate email format
const validateEmail = (email) => {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '電子郵件格式不正確';
  }
  return null;
};

// Validate phone format
const validatePhone = (phone) => {
  if (!phone) return null;
  const phoneRegex = /^[\d\-\+\(\)\s]{8,20}$/;
  if (!phoneRegex.test(phone)) {
    return '電話號碼格式不正確';
  }
  return null;
};

module.exports = {
  generateId,
  validateRequired,
  validatePatientNumber,
  validateDate,
  validateEmail,
  validatePhone
};
