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

    // Upsert users (match by username, generate UUID only for new inserts)
    const hashedAdmin = await bcrypt.hash('admin123', 10);
    const hashedDoctor = await bcrypt.hash('doctor123', 10);
    const hashedNurse = await bcrypt.hash('nurse123', 10);
    const hashedStaff = await bcrypt.hash('staff123', 10);

    const [existingAdmin] = await connection.execute('SELECT id FROM users WHERE username = ?', ['admin']);
    const adminId = existingAdmin.length > 0 ? existingAdmin[0].id : uuidv4();
    await connection.execute(
      `INSERT INTO users (id, username, password, name, role, title, bio, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name)`,
      [adminId, 'admin', hashedAdmin, '系統管理員', 'admin', '系統管理員', '負責系統維護與用戶管理', 'male']
    );

    const [existingDoctor] = await connection.execute('SELECT id FROM users WHERE username = ?', ['doctor1']);
    const doctorId = existingDoctor.length > 0 ? existingDoctor[0].id : uuidv4();
    await connection.execute(
      `INSERT INTO users (id, username, password, name, role, title, bio, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name)`,
      [doctorId, 'doctor1', hashedDoctor, '陳大明醫生', 'doctor', '內科主任', '擁有20年臨床經驗的內科專科醫生', 'male']
    );

    const [existingNurse] = await connection.execute('SELECT id FROM users WHERE username = ?', ['nurse1']);
    const nurseId = existingNurse.length > 0 ? existingNurse[0].id : uuidv4();
    await connection.execute(
      `INSERT INTO users (id, username, password, name, role, title, bio, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name)`,
      [nurseId, 'nurse1', hashedNurse, '林美麗護士', 'nurse', '護理長', '專責病人護理與生命體徵記錄', 'female']
    );

    const [existingStaff] = await connection.execute('SELECT id FROM users WHERE username = ?', ['staff1']);
    const staffId = existingStaff.length > 0 ? existingStaff[0].id : uuidv4();
    await connection.execute(
      `INSERT INTO users (id, username, password, name, role, title, bio, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name)`,
      [staffId, 'staff1', hashedStaff, '王小明', 'staff', '櫃台接待員', '負責預約登記與行政事務', 'male']
    );

    console.log('Users created/updated successfully');

    // Upsert sample patients (match by patient_number, generate UUID for new inserts)
    const [existingP1] = await connection.execute('SELECT id FROM patients WHERE patient_number = ?', ['P001']);
    const patient1Id = existingP1.length > 0 ? existingP1[0].id : uuidv4();
    await connection.execute(
      `INSERT INTO patients (id, patient_number, name, gender, birth_date, phone, email, address, emergency_contact, emergency_phone, insurance_type, insurance_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [patient1Id, 'P001', '張小黃', 'male', '1985-03-15', '0912-345-678', 'zhang@example.com', '台北市信義區松壽路100號', '張太太', '0912-345-679', '全民健保', 'N123456789']
    );

    const [existingP2] = await connection.execute('SELECT id FROM patients WHERE patient_number = ?', ['P002']);
    const patient2Id = existingP2.length > 0 ? existingP2[0].id : uuidv4();
    await connection.execute(
      `INSERT INTO patients (id, patient_number, name, gender, birth_date, phone, address, emergency_contact, emergency_phone, insurance_type, insurance_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [patient2Id, 'P002', '李小茹', 'female', '1992-07-22', '0932-456-789', '新北市板橋區文化路200號', '李先生', '0932-456-790', '全民健保', 'N987654321']
    );

    const [existingP3] = await connection.execute('SELECT id FROM patients WHERE patient_number = ?', ['P003']);
    const patient3Id = existingP3.length > 0 ? existingP3[0].id : uuidv4();
    await connection.execute(
      `INSERT INTO patients (id, patient_number, name, gender, birth_date, phone, address, emergency_contact, emergency_phone, insurance_type, insurance_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [patient3Id, 'P003', '王大強', 'male', '1978-11-08', '0955-678-901', '桃園市桃園區中正路300號', '王小美', '0955-678-902', '勞保', 'L456789012']
    );

    console.log('Patients created/updated successfully');

    // Upsert alerts (match by patient_id + content)
    await connection.execute(
      `DELETE FROM alerts WHERE patient_id = ? AND content LIKE ?`,
      [patient1Id, '%對青黴素過敏%']
    );
    await connection.execute(
      `INSERT INTO alerts (id, patient_id, level, type, content, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), patient1Id, 'high', 'allergy', '對青黴素過敏，服用後可能引起嚴重過敏反應', true]
    );

    await connection.execute(
      `DELETE FROM alerts WHERE patient_id = ? AND content LIKE ?`,
      [patient2Id, '%糖尿病%']
    );
    await connection.execute(
      `INSERT INTO alerts (id, patient_id, level, type, content, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), patient2Id, 'medium', 'disease', '糖尿病患者，需定期監測血糖', true]
    );

    console.log('Alerts created successfully');

    // Upsert vital signs (delete old + insert new for simplicity)
    await connection.execute(`DELETE FROM vital_signs WHERE patient_id = ?`, [patient1Id]);
    await connection.execute(
      `INSERT INTO vital_signs (id, patient_id, temperature, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, respiratory_rate, oxygen_saturation, weight, height, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), patient1Id, 36.8, 140, 90, 78, 18, 98, 75, 172, '血壓偏高，建議持續追蹤', nurseId]
    );

    await connection.execute(`DELETE FROM vital_signs WHERE patient_id = ?`, [patient2Id]);
    await connection.execute(
      `INSERT INTO vital_signs (id, patient_id, temperature, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, respiratory_rate, oxygen_saturation, weight, height, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), patient2Id, 37.2, 120, 80, 72, 16, 99, 55, 165, '體溫略高，屬正常波動範圍', nurseId]
    );

    console.log('Vital signs created successfully');

    // Upsert allergies (delete old + insert new)
    await connection.execute(`DELETE FROM allergies WHERE patient_id = ? AND allergen LIKE ?`, [patient1Id, '%Penicillin%']);
    await connection.execute(
      `INSERT INTO allergies (id, patient_id, allergen, type, severity, reaction) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), patient1Id, '青黴素 (Penicillin)', 'drug', 'severe', '全身蕁麻疹、呼吸困難']
    );

    await connection.execute(`DELETE FROM allergies WHERE patient_id = ? AND allergen LIKE ?`, [patient2Id, '%蝦%']);
    await connection.execute(
      `INSERT INTO allergies (id, patient_id, allergen, type, severity, reaction) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), patient2Id, '蝦子', 'food', 'moderate', '皮膚紅疹、輕微腫脹']
    );

    console.log('Allergies created successfully');

    // Upsert appointments (delete old same-day + insert new)
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    await connection.execute(`DELETE FROM appointments WHERE patient_id = ? AND date = ? AND time = ?`, [patient1Id, today, '09:00:00']);
    await connection.execute(
      `INSERT INTO appointments (id, patient_id, doctor_id, date, time, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), patient1Id, doctorId, today, '09:00:00', 'followup', 'pending', '血壓追蹤檢查']
    );

    await connection.execute(`DELETE FROM appointments WHERE patient_id = ? AND date = ? AND time = ?`, [patient2Id, today, '10:30:00']);
    await connection.execute(
      `INSERT INTO appointments (id, patient_id, doctor_id, date, time, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), patient2Id, doctorId, today, '10:30:00', 'first', 'pending', '初診諮詢']
    );

    await connection.execute(`DELETE FROM appointments WHERE patient_id = ? AND date = ? AND time = ?`, [patient3Id, tomorrow, '14:00:00']);
    await connection.execute(
      `INSERT INTO appointments (id, patient_id, doctor_id, date, time, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
