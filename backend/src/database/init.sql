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
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(20),
  birth_date DATE,
  id_card VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  insurance_type VARCHAR(50),
  insurance_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
  type ENUM('first', 'followup', 'urgent') DEFAULT 'first',
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
CREATE TABLE IF NOT EXISTS icd10_codes (
  id VARCHAR(10) PRIMARY KEY,
  code VARCHAR(10) NOT NULL,
  name_tc VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_icd10_code (code),
  INDEX idx_icd10_category (category)
);

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
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
INSERT INTO icd10_codes (id, code, name_tc, name_en, category) VALUES
('1', 'A00', '霍亂', 'Cholera', '傳染病'),
('2', 'A01', '傷寒和副傷寒', 'Typhoid and paratyphoid fevers', '傳染病'),
('3', 'A09', '胃腸炎', 'Gastroenteritis', '消化系統'),
('4', 'B00', '皰疹病毒感染', 'Herpesviral infections', '傳染病'),
('5', 'B01', '水痘', 'Varicella', '傳染病'),
('6', 'B02', '帶狀皰疹', 'Zoster', '傳染病'),
('7', 'B15', '急性肝炎A', 'Acute hepatitis A', '肝臟疾病'),
('8', 'B16', '急性肝炎B', 'Acute hepatitis B', '肝臟疾病'),
('9', 'C00', '唇部惡性腫瘤', 'Malignant neoplasm of lip', '腫瘤'),
('10', 'C18', '結腸惡性腫瘤', 'Malignant neoplasm of colon', '腫瘤'),
('11', 'D50', '缺鐵性貧血', 'Iron deficiency anemia', '血液疾病'),
('12', 'E10', '1型糖尿病', 'Type 1 diabetes mellitus', '內分泌'),
('13', 'E11', '2型糖尿病', 'Type 2 diabetes mellitus', '內分泌'),
('14', 'E78', '高膽固醇血症', 'Hypercholesterolemia', '代謝疾病'),
('15', 'F32', '抑鬱症', 'Depressive episode', '精神疾病'),
('16', 'F41', '焦慮症', 'Anxiety disorder', '精神疾病'),
('17', 'G40', '癲癇', 'Epilepsy', '神經系統'),
('18', 'G43', '偏頭痛', 'Migraine', '神經系統'),
('19', 'H10', '結膜炎', 'Conjunctivitis', '眼部疾病'),
('20', 'H25', '老年性白內障', 'Age-related cataract', '眼部疾病'),
('21', 'I10', '原發性高血壓', 'Essential hypertension', '循環系統'),
('22', 'I20', '心絞痛', 'Angina pectoris', '循環系統'),
('23', 'I21', '心肌梗塞', 'Myocardial infarction', '循環系統'),
('24', 'I50', '心力衰竭', 'Heart failure', '循環系統'),
('25', 'J00', '急性鼻咽炎', 'Acute nasopharyngitis', '呼吸系統'),
('26', 'J02', '急性咽炎', 'Acute pharyngitis', '呼吸系統'),
('27', 'J03', '急性扁桃腺炎', 'Acute tonsillitis', '呼吸系統'),
('28', 'J06', '上呼吸道感染', 'Acute upper respiratory infection', '呼吸系統'),
('29', 'J18', '肺炎', 'Pneumonia', '呼吸系統'),
('30', 'J45', '哮喘', 'Asthma', '呼吸系統'),
('31', 'K21', '胃食道逆流', 'Gastro-esophageal reflux disease', '消化系統'),
('32', 'K25', '胃潰瘍', 'Gastric ulcer', '消化系統'),
('33', 'K29', '胃炎', 'Gastritis', '消化系統'),
('34', 'K35', '急性闌尾炎', 'Acute appendicitis', '消化系統'),
('35', 'K40', '腹股溝疝氣', 'Inguinal hernia', '消化系統'),
('36', 'K80', '膽結石', 'Cholelithiasis', '消化系統'),
('37', 'L20', '異位性皮膚炎', 'Atopic dermatitis', '皮膚疾病'),
('38', 'L30', '濕疹', 'Eczema', '皮膚疾病'),
('39', 'L50', '蕁麻疹', 'Urticaria', '皮膚疾病'),
('40', 'M54', '腰痛', 'Back pain', '肌肉骨骼'),
('41', 'M79', '軟組織疾病', 'Soft tissue disorders', '肌肉骨骼'),
('42', 'N18', '慢性腎病', 'Chronic kidney disease', '泌尿系統'),
('43', 'N39', '泌尿道感染', 'Urinary tract infection', '泌尿系統'),
('44', 'O00', '異位妊娠', 'Ectopic pregnancy', '妊娠疾病'),
('45', 'O26', '妊娠相關照護', 'Pregnancy related conditions', '妊娠疾病'),
('46', 'R05', '咳嗽', 'Cough', '症狀'),
('47', 'R10', '腹痛', 'Abdominal pain', '症狀'),
('48', 'R50', '發燒', 'Fever', '症狀'),
('49', 'R51', '頭痛', 'Headache', '症狀'),
('50', 'S00', '頭部淺表損傷', 'Superficial injury of head', '損傷'),
('51', 'T78', '過敏反應', 'Adverse reactions', '損傷')
ON DUPLICATE KEY UPDATE name_tc = VALUES(name_tc);

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
