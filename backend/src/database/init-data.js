// Database initialization script
// Run with: node src/database/init-data.js

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'emr_system',
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
       ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name)`,
      [patient1Id, 'P001', '張小黃', 'male', '1985-03-15', '0912-345-678', 'zhang@example.com', '台北市信義區松壽路100號', '張太太', '0912-345-679', '全民健保', 'N123456789']
    );

    await connection.execute(
      `INSERT INTO patients (id, patient_number, name, gender, birth_date, phone, address, emergency_contact, emergency_phone, insurance_type, insurance_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name)`,
      [patient2Id, 'P002', '李小茹', 'female', '1992-07-22', '0932-456-789', '新北市板橋區文化路200號', '李先生', '0932-456-790', '全民健保', 'N987654321']
    );

    await connection.execute(
      `INSERT INTO patients (id, patient_number, name, gender, birth_date, phone, address, emergency_contact, emergency_phone, insurance_type, insurance_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name)`,
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

    // Create sample appointments
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

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
