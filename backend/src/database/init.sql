-- EMR System Database Schema
-- Run this script to initialize the database

CREATE DATABASE IF NOT EXISTS emr_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE emr_system;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'staff', 'doctor', 'nurse', 'patient') NOT NULL,
  title VARCHAR(50),
  bio TEXT,
  gender ENUM('male', 'female', 'other', 'unspecified') DEFAULT 'unspecified',
  avatar VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role)
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(36) PRIMARY KEY,
  patient_number VARCHAR(20) UNIQUE NOT NULL,
  medical_number VARCHAR(50) UNIQUE,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  gender VARCHAR(20),
  birth_date DATE,
  gold_card_number VARCHAR(50) UNIQUE,
  id_card VARCHAR(20),
  id_type VARCHAR(20),
  phone VARCHAR(20),
  phone2 VARCHAR(30),
  email VARCHAR(100),
  address TEXT,
  contact_address TEXT,
  insurance_type VARCHAR(50),
  insurance_number VARCHAR(50),
  emergency_contact VARCHAR(100),
  emergency_contact_address TEXT,
  emergency_contact_phone VARCHAR(20),
  emergency_contact_phone2 VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(36) NOT NULL,
  created_by_name VARCHAR(100) NOT NULL,
  INDEX idx_patient_number (patient_number),
  INDEX idx_name (name)
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  level ENUM('high', 'medium', 'low') NOT NULL,
  type ENUM('allergy', 'disease', 'drug', 'other') NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_patient_alerts (patient_id)
);

-- Vital Signs table
CREATE TABLE IF NOT EXISTS vital_signs (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  temperature DECIMAL(4,1),
  blood_pressure_systolic INT,
  blood_pressure_diastolic INT,
  heart_rate INT,
  respiratory_rate INT,
  oxygen_saturation DECIMAL(4,1),
  weight DECIMAL(5,1),
  height DECIMAL(5,1),
  notes TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_by VARCHAR(36) NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id),
  INDEX idx_patient_vitals (patient_id)
);

-- Allergies table
CREATE TABLE IF NOT EXISTS allergies (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  allergen VARCHAR(100) NOT NULL,
  type ENUM('drug', 'food', 'environmental', 'other') NOT NULL,
  severity ENUM('mild', 'moderate', 'severe', 'life-threatening') NOT NULL,
  reaction TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_patient_allergies (patient_id)
);

-- SOAP Notes table
CREATE TABLE IF NOT EXISTS soap_notes (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  visit_date DATE NOT NULL,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  doctor_id VARCHAR(36) NOT NULL,
  notes TEXT,
  appointment_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  INDEX idx_patient_soap (patient_id),
  INDEX idx_doctor_soap (doctor_id)
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  doctor_id VARCHAR(36) NOT NULL,
  appointment_id VARCHAR(36),
  date DATE NOT NULL,
  notes TEXT,
  status ENUM('active', 'filled', 'expired') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  INDEX idx_patient_prescriptions (patient_id),
  INDEX idx_doctor_prescriptions (doctor_id)
);

-- Prescription Medications table
CREATE TABLE IF NOT EXISTS prescription_medications (
  id VARCHAR(36) PRIMARY KEY,
  prescription_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  dosage VARCHAR(50) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  route ENUM('oral', 'topical', 'injection', 'inhalation', 'other') NOT NULL,
  duration INT NOT NULL,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
  INDEX idx_prescription_meds (prescription_id)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  doctor_id VARCHAR(36),
  date DATE NOT NULL,
  time TIME,
  type ENUM('first', 'followup', 'urgent') DEFAULT 'followup',
  status ENUM('pending', 'checked-in', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  cancel_reason TEXT,
  cancel_document_url VARCHAR(255),
  consultation_type ENUM('consultation', 'other') DEFAULT 'consultation',
  consultation_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_patient_appointments (patient_id),
  INDEX idx_doctor_appointments (doctor_id),
  INDEX idx_appointment_date (date),
  INDEX idx_appointment_status (status)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  category ENUM('lab', 'imaging', 'surgery', 'other') NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_url VARCHAR(500) NOT NULL,
  file_size INT,
  uploaded_by VARCHAR(36) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_patient_documents (patient_id),
  INDEX idx_document_category (category)
);

-- ICD-10 Codes table
-- id: ICD code with * removed (e.g. H28 for H28*)
-- code: full ICD code as-is (may include * suffix, e.g. H28*)
CREATE TABLE IF NOT EXISTS icd10_codes (
  id VARCHAR(10) PRIMARY KEY,
  code VARCHAR(10) NOT NULL,
  name_tc VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  name_pt VARCHAR(500),
  category_tc VARCHAR(200),
  category_en VARCHAR(200),
  category_pt VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX uk_code (code)
);

-- =============================================================================
-- ICD-10 疾病分類資料（由 scripts/import_icd10_to_db.py 匯入 CSV）
-- 來源：data/icd10_disease_full.csv（共 2049 筆，含中/英/葡三語名稱與分類）
-- 執行：cd backend && NODE_PATH=./node_modules python3 ../scripts/import_icd10_to_db.py
-- =============================================================================

-- Medications table
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  generic_name VARCHAR(100),
  dosage VARCHAR(50),
  route VARCHAR(50),
  frequency VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_medication_name (name)
);

-- System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_logs (user_id),
  INDEX idx_audit_date (created_at)
);

-- Add foreign key constraint for SOAP notes (appointments needs to be created first)
ALTER TABLE soap_notes
ADD CONSTRAINT fk_soap_appointment
FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('soap_edit_hours', '48', 'SOAP record edit time limit in hours (0 = no limit)'),
('organization_name', '醫療機構電子病歷系統', 'Organization name'),
('slogan', '守護健康，記録每一刻', 'Organization slogan')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Insert default ICD-10 codes (sample data)

-- Insert sample medications
INSERT INTO medications (id, name, generic_name, dosage, route, frequency) VALUES
('1', '阿司匹林', 'Aspirin', '100mg', 'oral', '每日一次'),
('2', '布洛芬', 'Ibuprofen', '200mg', 'oral', '每日三次'),
('3', '撲熱息痛', 'Acetaminophen', '500mg', 'oral', '需要時服用'),
('4', '氨氯地平', 'Amlodipine', '5mg', 'oral', '每日一次'),
('5', '美托洛爾', 'Metoprolol', '25mg', 'oral', '每日兩次'),
('6', '雷米普利', 'Ramipril', '5mg', 'oral', '每日一次'),
('7', '二甲雙胍', 'Metformin', '500mg', 'oral', '每日兩次'),
('8', '格列本脲', 'Glibenclamide', '5mg', 'oral', '每日一次'),
('9', '氫氯噻嗪', 'Hydrochlorothiazide', '25mg', 'oral', '每日一次'),
('10', '洛哌丁胺', 'Loperamide', '2mg', 'oral', '需要時服用'),
('11', '奧美拉唑', 'Omeprazole', '20mg', 'oral', '每日一次'),
('12', '法莫替丁', 'Famotidine', '20mg', 'oral', '每日兩次'),
('13', '西替利嗪', 'Cetirizine', '10mg', 'oral', '每日一次'),
('14', '氯苯那敏', 'Chlorpheniramine', '4mg', 'oral', '每日三次'),
('15', '氫化可的松乳膏', 'Hydrocortisone Cream', '1%', 'topical', '每日兩次'),
('16', '紅黴素軟膏', 'Erythromycin Ointment', '0.5%', 'topical', '每日兩次'),
('17', '利巴韋林', 'Ribavirin', '200mg', 'oral', '每日三次'),
('18', '氯化鈉滴眼液', 'Sodium Chloride Eye Drops', '0.9%', 'topical', '每日四次'),
('19', '鹽酸偽麻黃鹼', 'Pseudoephedrine', '30mg', 'oral', '每日三次'),
('20', '可待因', 'Codeine', '15mg', 'oral', '需要時服用'),
('21', '曲唑酮', 'Trazodone', '50mg', 'oral', '睡前服用'),
('22', '舍曲林', 'Sertraline', '50mg', 'oral', '每日一次'),
('23', '阿普唑侖', 'Alprazolam', '0.5mg', 'oral', '需要時服用'),
('24', '地西泮', 'Diazepam', '5mg', 'oral', '需要時服用'),
('25', '胰島素', 'Insulin', '可變', 'injection', '按血糖水平調整'),
('26', '干擾素', 'Interferon', '可變', 'injection', '每週三次'),
('27', '沙丁胺醇霧化液', 'Salbutamol Nebule', '2.5mg', 'inhalation', '需要時使用'),
('28', '氟替卡鬆吸入劑', 'Fluticasone Inhaler', '125mcg', 'inhalation', '每日兩次'),
('29', '蒙脫石散', 'Smecta', '3g', 'oral', '每日三次'),
('30', '蒙脫石散', 'Smecta', '3g', 'oral', '每日三次')
ON DUPLICATE KEY UPDATE name = VALUES(name);
