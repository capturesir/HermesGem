import { User, Patient, Appointment, Alert, VitalSign, Allergy, SOAPNote, Prescription, Document, SystemSettings } from '../types';

// Generate unique IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Initial Users
export const initialUsers: User[] = [
  {
    id: generateId(),
    username: 'admin',
    password: 'admin123',
    name: '系統管理員',
    role: 'admin',
    title: '系統管理員',
    bio: '負責系統維護與用戶管理',
    gender: 'male',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    username: 'doctor1',
    password: 'doctor123',
    name: '陳大明醫生',
    role: 'doctor',
    title: '內科主任',
    bio: '擁有20年臨床經驗的內科專科醫生',
    gender: 'male',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    username: 'nurse1',
    password: 'nurse123',
    name: '林美麗護士',
    role: 'nurse',
    title: '護理長',
    bio: '專責病人護理與生命體徵記錄',
    gender: 'female',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    username: 'staff1',
    password: 'staff123',
    name: '王小明',
    role: 'staff',
    title: '櫃台接待員',
    bio: '負責預約登記與行政事務',
    gender: 'male',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    username: 'patient1',
    password: 'patient123',
    name: '張小黃',
    role: 'patient',
    gender: 'male',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initial Patients
export const initialPatients: Patient[] = [
  {
    id: generateId(),
    patientNumber: 'P001',
    name: '張小黃',
    gender: 'male',
    birthDate: '1985-03-15',
    phone: '0912-345-678',
    email: 'zhang@example.com',
    address: '台北市信義區松壽路100號',
    emergencyContact: '張太太',
    emergencyPhone: '0912-345-679',
    insuranceType: '全民健保',
    insuranceNumber: 'N123456789',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    patientNumber: 'P002',
    name: '李小茹',
    gender: 'female',
    birthDate: '1992-07-22',
    phone: '0932-456-789',
    address: '新北市板橋區文化路200號',
    emergencyContact: '李先生',
    emergencyPhone: '0932-456-790',
    insuranceType: '全民健保',
    insuranceNumber: 'N987654321',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    patientNumber: 'P003',
    name: '王大強',
    gender: 'male',
    birthDate: '1978-11-08',
    phone: '0955-678-901',
    address: '桃園市桃園區中正路300號',
    emergencyContact: '王小美',
    emergencyPhone: '0955-678-902',
    insuranceType: '勞保',
    insuranceNumber: 'L456789012',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initial Appointments
export const initialAppointments: Appointment[] = [
  {
    id: generateId(),
    patientId: initialPatients[0].id,
    patientName: '張小黃',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'followup',
    status: 'checked-in',
    notes: '血壓追蹤檢查',
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    patientId: initialPatients[1].id,
    patientName: '李小茹',
    date: new Date().toISOString().split('T')[0],
    time: '10:30',
    type: 'first',
    status: 'checked-in',
    notes: '初診諮詢',
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    patientId: initialPatients[2].id,
    patientName: '王大強',
    date: new Date().toISOString().split('T')[0],
    time: '11:30',
    type: 'urgent',
    status: 'confirmed',
    notes: '胸痛緊急門診',
    createdAt: new Date().toISOString(),
  },
];

// Initial Alerts
export const initialAlerts: Alert[] = [
  {
    id: generateId(),
    patientId: initialPatients[0].id,
    level: 'high',
    type: 'allergy',
    content: '對青黴素過敏，服用後可能引起嚴重過敏反應',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    patientId: initialPatients[1].id,
    level: 'medium',
    type: 'disease',
    content: '糖尿病患者，需定期監測血糖',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Initial Vital Signs
export const initialVitalSigns: VitalSign[] = [
  {
    id: generateId(),
    patientId: initialPatients[0].id,
    temperature: 36.8,
    bloodPressureSystolic: 140,
    bloodPressureDiastolic: 90,
    heartRate: 78,
    respiratoryRate: 18,
    oxygenSaturation: 98,
    weight: 75,
    height: 172,
    notes: '血壓偏高，建議持續追蹤',
    recordedAt: new Date().toISOString(),
    recordedBy: '林美麗護士',
  },
  {
    id: generateId(),
    patientId: initialPatients[1].id,
    temperature: 37.2,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72,
    respiratoryRate: 16,
    oxygenSaturation: 99,
    weight: 55,
    height: 165,
    notes: '體溫略高，屬正常波動範圍',
    recordedAt: new Date().toISOString(),
    recordedBy: '林美麗護士',
  },
];

// Initial Allergies
export const initialAllergies: Allergy[] = [
  {
    id: generateId(),
    patientId: initialPatients[0].id,
    allergen: '青黴素 (Penicillin)',
    type: 'drug',
    severity: 'severe',
    reaction: '全身蕁麻疹、呼吸困難',
    recordedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    patientId: initialPatients[1].id,
    allergen: '蝦子',
    type: 'food',
    severity: 'moderate',
    reaction: '皮膚紅疹、輕微腫脹',
    recordedAt: new Date().toISOString(),
  },
];

// Initial SOAP Notes
export const initialSOAPNotes: SOAPNote[] = [
  {
    id: generateId(),
    patientId: initialPatients[0].id,
    visitDate: new Date().toISOString().split('T')[0],
    subjective: '頭痛、頭暈，持續約一週，近兩天症狀加重',
    objective: '血壓 140/90 mmHg，心率 78 bpm，無明顯神經系統異常',
    assessment: '原發性高血壓，需藥物控制',
    plan: '1. 持續血壓監測\n2. 每日服藥控制血壓\n3. 低鹽飲食建議\n4. 一週後回診',
    doctorId: initialUsers[1].id,
    doctorName: '陳大明醫生',
    notes: '患者依從性良好',
    createdAt: new Date().toISOString(),
  },
];

// Initial Prescriptions
export const initialPrescriptions: Prescription[] = [
  {
    id: generateId(),
    patientId: initialPatients[0].id,
    date: new Date().toISOString().split('T')[0],
    medications: [
      {
        name: '血壓藥',
        dosage: '50mg',
        frequency: '每日一次',
        route: 'oral',
        duration: 7,
      },
      {
        name: '利尿劑',
        dosage: '25mg',
        frequency: '每日一次',
        route: 'oral',
        duration: 7,
      },
    ],
    doctorId: initialUsers[1].id,
    doctorName: '陳大明醫生',
    status: 'active',
    notes: '飯後服用',
    createdAt: new Date().toISOString(),
  },
];

// Initial Documents
export const initialDocuments: Document[] = [
  {
    id: generateId(),
    patientId: initialPatients[0].id,
    category: 'lab',
    name: '血液常規檢驗報告',
    fileType: 'pdf',
    fileUrl: '',
    uploadedBy: '林美麗護士',
    uploadedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    patientId: initialPatients[0].id,
    category: 'imaging',
    name: '胸部X光檢查',
    fileType: 'jpg',
    fileUrl: '',
    uploadedBy: '陳大明醫生',
    uploadedAt: new Date().toISOString(),
  },
];

// Initial System Settings
export const initialSystemSettings: SystemSettings = {
  organizationName: '醫療機構電子病歷系統',
  slogan: '守護健康，記録每一刻',
  permissions: [
    { role: 'admin', module: 'users', view: true, edit: true, delete: true },
    { role: 'admin', module: 'patients', view: true, edit: true, delete: true },
    { role: 'admin', module: 'appointments', view: true, edit: true, delete: true },
    { role: 'admin', module: 'settings', view: true, edit: true, delete: true },
    { role: 'staff', module: 'users', view: false, edit: false, delete: false },
    { role: 'staff', module: 'patients', view: true, edit: false, delete: false },
    { role: 'staff', module: 'appointments', view: true, edit: true, delete: false },
    { role: 'doctor', module: 'users', view: false, edit: false, delete: false },
    { role: 'doctor', module: 'patients', view: true, edit: true, delete: false },
    { role: 'doctor', module: 'appointments', view: true, edit: true, delete: false },
    { role: 'doctor', module: 'soap', view: true, edit: true, delete: true },
    { role: 'doctor', module: 'prescriptions', view: true, edit: true, delete: true },
    { role: 'nurse', module: 'users', view: false, edit: false, delete: false },
    { role: 'nurse', module: 'patients', view: true, edit: false, delete: false },
    { role: 'nurse', module: 'appointments', view: true, edit: false, delete: false },
    { role: 'nurse', module: 'vitals', view: true, edit: true, delete: false },
    { role: 'patient', module: 'users', view: false, edit: false, delete: false },
    { role: 'patient', module: 'patients', view: true, edit: false, delete: false },
    { role: 'patient', module: 'appointments', view: true, edit: false, delete: false },
  ],
};

// Role Labels
export const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: '管理員', color: 'bg-purple-100 text-purple-800' },
  staff: { label: '職員', color: 'bg-cyan-100 text-cyan-800' },
  doctor: { label: '醫生', color: 'bg-blue-100 text-blue-800' },
  nurse: { label: '護士', color: 'bg-pink-100 text-pink-800' },
  patient: { label: '病人', color: 'bg-green-100 text-green-800' },
};

// Gender Labels
export const genderLabels: Record<string, string> = {
  male: '男',
  female: '女',
  other: '其他',
  unspecified: '未指定',
};

// Module Labels
export const moduleLabels: Record<string, string> = {
  users: '用戶管理',
  patients: '病人管理',
  appointments: '預約管理',
  settings: '系統設定',
  soap: 'SOAP 記錄',
  prescriptions: '處方管理',
  vitals: '生命體徵',
  allergies: '過敏記錄',
  alerts: '特別警示',
  documents: '文件管理',
};
