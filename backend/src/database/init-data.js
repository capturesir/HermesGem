// Database initialization script
// Run with: node src/database/init-data.js

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

async function initDatabase() {
  const connection = await pool.getConnection();

  try {
    console.log('Starting database initialization...');

    // Create users
    const adminId = uuidv4();
    const doctorId = uuidv4();
    const nurseId = uuidv4();
    const staffId = uuidv4();

    const hashedAdmin = await bcrypt.hash('admin123', 10);
    const hashedDoctor = await bcrypt.hash('doctor123', 10);
    const hashedNurse = await bcrypt.hash('nurse123', 10);
    const hashedStaff = await bcrypt.hash('staff123', 10);

    await connection.execute(
      `INSERT INTO users (id, username, password, name, role, title, bio, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name)`,
      [adminId, 'admin', hashedAdmin, '系統管理員', 'admin', '系統管理員', '負責系統維護與用戶管理', 'male']
    );

    await connection.execute(
      `INSERT INTO users (id, username, password, name, role, title, bio, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name)`,
      [doctorId, 'doctor1', hashedDoctor, '陳大明醫生', 'doctor', '內科主任', '擁有20年臨床經驗的內科專科醫生', 'male']
    );

    await connection.execute(
      `INSERT INTO users (id, username, password, name, role, title, bio, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name)`,
      [nurseId, 'nurse1', hashedNurse, '林美麗護士', 'nurse', '護理長', '專責病人護理與生命體徵記錄', 'female']
    );

    await connection.execute(
      `INSERT INTO users (id, username, password, name, role, title, bio, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name)`,
      [staffId, 'staff1', hashedStaff, '王小明', 'staff', '櫃台接待員', '負責預約登記與行政事務', 'male']
    );

    console.log('Users created successfully');

    // Create sample patients
    const patient1Id = uuidv4();
    const patient2Id = uuidv4();
    const patient3Id = uuidv4();

    await connection.execute(
      `INSERT INTO patients (id, patient_number, name, gender, birth_date, phone, email, address, emergency_contact, emergency_phone, insurance_type, insurance_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [patient1Id, 'P001', '張小黃', 'male', '1985-03-15', '0912-345-678', 'zhang@example.com', '台北市信義區松壽路100號', '張太太', '0912-345-679', '全民健保', 'N123456789']
    );

    await connection.execute(
      `INSERT INTO patients (id, patient_number, name, gender, birth_date, phone, address, emergency_contact, emergency_phone, insurance_type, insurance_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [patient2Id, 'P002', '李小茹', 'female', '1992-07-22', '0932-456-789', '新北市板橋區文化路200號', '李先生', '0932-456-790', '全民健保', 'N987654321']
    );

    await connection.execute(
      `INSERT INTO patients (id, patient_number, name, gender, birth_date, phone, address, emergency_contact, emergency_phone, insurance_type, insurance_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [patient3Id, 'P003', '王大強', 'male', '1978-11-08', '0955-678-901', '桃園市桃園區中正路300號', '王小美', '0955-678-902', '勞保', 'L456789012']
    );

    console.log('Patients created successfully');

    // Create sample alerts
    await connection.execute(
      `INSERT INTO alerts (id, patient_id, level, type, content, is_active) VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE content = VALUES(content)`,
      [uuidv4(), patient1Id, 'high', 'allergy', '對青黴素過敏，服用後可能引起嚴重過敏反應', true]
    );

    await connection.execute(
      `INSERT INTO alerts (id, patient_id, level, type, content, is_active) VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE content = VALUES(content)`,
      [uuidv4(), patient2Id, 'medium', 'disease', '糖尿病患者，需定期監測血糖', true]
    );

    console.log('Alerts created successfully');

    // Create sample vital signs
    await connection.execute(
      `INSERT INTO vital_signs (id, patient_id, temperature, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, respiratory_rate, oxygen_saturation, weight, height, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE temperature = VALUES(temperature)`,
      [uuidv4(), patient1Id, 36.8, 140, 90, 78, 18, 98, 75, 172, '血壓偏高，建議持續追蹤', nurseId]
    );

    await connection.execute(
      `INSERT INTO vital_signs (id, patient_id, temperature, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, respiratory_rate, oxygen_saturation, weight, height, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE temperature = VALUES(temperature)`,
      [uuidv4(), patient2Id, 37.2, 120, 80, 72, 16, 99, 55, 165, '體溫略高，屬正常波動範圍', nurseId]
    );

    console.log('Vital signs created successfully');

    // Create sample allergies
    await connection.execute(
      `INSERT INTO allergies (id, patient_id, allergen, type, severity, reaction) VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE allergen = VALUES(allergen)`,
      [uuidv4(), patient1Id, '青黴素 (Penicillin)', 'drug', 'severe', '全身蕁麻疹、呼吸困難']
    );

    await connection.execute(
      `INSERT INTO allergies (id, patient_id, allergen, type, severity, reaction) VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE allergen = VALUES(allergen)`,
      [uuidv4(), patient2Id, '蝦子', 'food', 'moderate', '皮膚紅疹、輕微腫脹']
    );

    console.log('Allergies created successfully');

    // Create sample appointments (CST = UTC+8)
    const nowCST = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const tomorrowCST = new Date(Date.now() + 8 * 60 * 60 * 1000 + 86400000);
    const today = nowCST.toISOString().split('T')[0];
    const tomorrow = tomorrowCST.toISOString().split('T')[0];

    await connection.execute(
      `INSERT INTO appointments (id, patient_id, doctor_id, date, time, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [uuidv4(), patient1Id, doctorId, today, '09:00:00', 'followup', 'pending', '血壓追蹤檢查']
    );

    await connection.execute(
      `INSERT INTO appointments (id, patient_id, doctor_id, date, time, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [uuidv4(), patient2Id, doctorId, today, '10:30:00', 'first', 'pending', '初診諮詢']
    );

    await connection.execute(
      `INSERT INTO appointments (id, patient_id, doctor_id, date, time, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [uuidv4(), patient3Id, doctorId, tomorrow, '14:00:00', 'urgent', 'pending', '胸痛緊急門診']
    );

    console.log('Appointments created successfully');

    // Seed ICD-10 codes (common conditions)
    const icd10Codes = [
      ['A00', 'A00', '霍亂', 'Cholera', '傳染病'],
      ['A09', 'A09', '感染性胃腸炎', 'Infectious gastroenteritis', '傳染病'],
      ['B02', 'B02', '帶狀皰疹', 'Herpes zoster', '傳染病'],
      ['E11', 'E11', '第二型糖尿病', 'Type 2 diabetes mellitus', '內分泌'],
      ['E14', 'E14', '未特定糖尿病', 'Unspecified diabetes mellitus', '內分泌'],
      ['H10', 'H10', '結膜炎', 'Conjunctivitis', '眼耳疾病'],
      ['H66', 'H66', '化膿性中耳炎', 'Suppurative otitis media', '眼耳疾病'],
      ['I10', 'I10', '原發性高血壓', 'Essential (primary) hypertension', '循環系統'],
      ['I25', 'I25', '慢性缺血性心臟病', 'Chronic ischemic heart disease', '循環系統'],
      ['J00', 'J00', '急性鼻咽炎（感冒）', 'Acute nasopharyngitis (common cold)', '呼吸系統'],
      ['J02', 'J02', '急性咽炎', 'Acute pharyngitis', '呼吸系統'],
      ['J03', 'J03', '急性扁桃腺炎', 'Acute tonsillitis', '呼吸系統'],
      ['J06', 'J06', '急性上呼吸道感染', 'Acute upper respiratory infection', '呼吸系統'],
      ['J18', 'J18', '肺炎', 'Pneumonia', '呼吸系統'],
      ['J44', 'J44', '慢性阻塞性肺疾病', 'Chronic obstructive pulmonary disease', '呼吸系統'],
      ['K29', 'K29', '胃炎及十二指腸炎', 'Gastritis and duodenitis', '消化系統'],
      ['K30', 'K30', '功能性消化不良', 'Functional dyspepsia', '消化系統'],
      ['K59', 'K59', '便秘', 'Constipation', '消化系統'],
      ['K76', 'K76', '肝臟疾病', 'Liver disease', '消化系統'],
      ['M54', 'M54', '背痛', 'Dorsalgia (back pain)', '肌肉骨骼'],
      ['M79', 'M79', '軟組織疾病', 'Soft tissue disorders', '肌肉骨骼'],
      ['N39', 'N39', '泌尿道感染', 'Urinary tract infection', '泌尿系統'],
      ['R05', 'R05', '咳嗽', 'Cough', '症狀與徵象'],
      ['R10', 'R10', '腹痛', 'Abdominal and pelvic pain', '症狀與徵象'],
      ['R50', 'R50', '發燒', 'Fever', '症狀與徵象'],
      ['R51', 'R51', '頭痛', 'Headache', '症狀與徵象'],
      ['Z00', 'Z00', '一般檢查', 'General examination', '健康狀態'],
    ];

    for (const [id, code, nameTc, nameEn, category] of icd10Codes) {
      await connection.execute(
        `INSERT INTO icd10_codes (id, code, name_tc, name_en, category) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name_tc = VALUES(name_tc)`,
        [id, code, nameTc, nameEn, category]
      );
    }
    console.log('ICD-10 codes seeded successfully');

    // Seed medications (common drugs)
    const medications = [
      ['med-001', '阿莫西林膠囊', 'Amoxicillin', '250mg', 'oral', '每日三次'],
      ['med-002', '布洛芬膠囊', 'Ibuprofen', '200mg', 'oral', '每日三次'],
      ['med-003', '布洛芬膠囊', 'Ibuprofen', '400mg', 'oral', '每日三次'],
      ['med-004', '撲熱息痛片', 'Paracetamol', '500mg', 'oral', '每日三次'],
      ['med-005', '氫氯噻嗪片', 'Hydrochlorothiazide', '25mg', 'oral', '每日一次'],
      ['med-006', '甲狀腺素片', 'Levothyroxine', '50mcg', 'oral', '每日一次'],
      ['med-007', '阿司匹靈腸溶片', 'Aspirin', '100mg', 'oral', '每日一次'],
      ['med-008', '洛爾卡膠囊', 'Loperamide', '2mg', 'oral', '每日三次'],
      ['med-009', '蒙脫石散', 'Smectite', '3g', 'oral', '每日三次'],
      ['med-010', '奧美拉唑膠囊', 'Omeprazole', '20mg', 'oral', '每日一次'],
      ['med-011', '西替利嗪片', 'Cetirizine', '10mg', 'oral', '每日一次'],
      ['med-012', '氯苯那敏片', 'Chlorpheniramine', '4mg', 'oral', '每日三次'],
      ['med-013', '地氯雷他定片', 'Desloratadine', '5mg', 'oral', '每日一次'],
      ['med-014', '鹽酸氨溴索片', 'Ambroxol', '30mg', 'oral', '每日三次'],
      ['med-015', '右美沙芬糖漿', 'Dextromethorphan', '15mg/5ml', 'oral', '每日三次'],
      ['med-016', '氯苯達諾膠囊', 'Cloperastine', '10mg', 'oral', '每日三次'],
      ['med-017', '孟魯司特鈉片', 'Montelukast', '10mg', 'oral', '每日一次'],
      ['med-018', '沙丁胺醇吸入劑', 'Salbutamol', '100mcg/dose', 'inhalation', '需要時使用'],
      ['med-019', '氟替卡松吸入劑', 'Fluticasone', '125mcg/dose', 'inhalation', '每日兩次'],
      ['med-020', '二甲雙胍片', 'Metformin', '500mg', 'oral', '每日兩次'],
      ['med-021', '格列齊特片', 'Gliclazide', '80mg', 'oral', '每日一次'],
      ['med-022', '坎地沙坦片', 'Candesartan', '8mg', 'oral', '每日一次'],
      ['med-023', '氨氯地平片', 'Amlodipine', '5mg', 'oral', '每日一次'],
      ['med-024', '美托洛爾片', 'Metoprolol', '50mg', 'oral', '每日兩次'],
      ['med-025', '氫氯噻嗪片', 'Hydrochlorothiazide', '12.5mg', 'oral', '每日一次'],
      ['med-026', '氯化鉀緩釋片', 'Potassium Chloride', '600mg', 'oral', '每日兩次'],
      ['med-027', '瑞舒伐他汀片', 'Rosuvastatin', '10mg', 'oral', '每日一次'],
      ['med-028', '阿托伐他汀片', 'Atorvastatin', '20mg', 'oral', '每日一次'],
      ['med-029', '法莫替丁片', 'Famotidine', '20mg', 'oral', '每日兩次'],
      ['med-030', '多潘立酮片', 'Domperidone', '10mg', 'oral', '每日三次'],
      ['med-031', '乳果糖口服液', 'Lactulose', '10g/15ml', 'oral', '每日一至兩次'],
      ['med-032', '開瑞坦片', 'Loratadine', '10mg', 'oral', '每日一次'],
      ['med-033', '氫氧化鋁鎂口服液', 'Aluminum Magnesium Hydroxide', '10ml', 'oral', '每日三次'],
      ['med-034', '莫匹羅星軟膏', 'Mupirocin Ointment', '2%', 'topical', '每日兩次'],
      ['med-035', '氫化可的松軟膏', 'Hydrocortisone Cream', '1%', 'topical', '每日兩次'],
      ['med-036', '爐甘石洗劑', 'Calamine Lotion', '100ml', 'topical', '每日兩次'],
      ['med-037', '曲安奈德注射液', 'Triamcinolone Acetonide', '40mg/ml', 'injection', '按需要'],
      ['med-038', '頭孢克洛膠囊', 'Cefaclor', '250mg', 'oral', '每日三次'],
      ['med-039', '左氧氟沙星片', 'Levofloxacin', '500mg', 'oral', '每日一次'],
      ['med-040', '阿奇霉素片', 'Azithromycin', '250mg', 'oral', '每日一次'],
    ];

    for (const [id, name, genericName, dosage, route, frequency] of medications) {
      await connection.execute(
        `INSERT INTO medications (id, name, generic_name, dosage, route, frequency) VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [id, name, genericName, dosage, route, frequency]
      );
    }
    console.log('Medications seeded successfully');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    connection.release();
  }
}

initDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
