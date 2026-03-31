// User Types
export type UserRole = 'admin' | 'staff' | 'doctor' | 'nurse' | 'patient';
export type Gender = 'male' | 'female' | 'other' | 'unspecified';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  title?: string;
  bio?: string;
  gender: Gender;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Patient Types
export interface Patient {
  id: string;
  patientNumber: string;
  name: string;
  gender?: string;
  birthDate?: string;
  idCard?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  insuranceType?: string;
  insuranceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// Alert Types
export type AlertLevel = 'high' | 'medium' | 'low';
export type AlertType = 'allergy' | 'disease' | 'drug' | 'other';

export interface Alert {
  id: string;
  patientId: string;
  level: AlertLevel;
  type: AlertType;
  content: string;
  isActive: boolean;
  createdAt: string;
}

// Vital Signs Types
export interface VitalSign {
  id: string;
  patientId: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  notes?: string;
  recordedAt: string;
  recordedBy: string;
}

// Allergy Types
export type AllergyType = 'drug' | 'food' | 'environmental' | 'other';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life-threatening';

export interface Allergy {
  id: string;
  patientId: string;
  allergen: string;
  type: AllergyType;
  severity: AllergySeverity;
  reaction: string;
  recordedAt: string;
}

// SOAP Note Types
export interface SOAPNote {
  id: string;
  patientId: string;
  visitDate: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  doctorId: string;
  doctorName?: string;
  notes?: string;
  createdAt: string;
}

// Prescription Types
export type PrescriptionStatus = 'active' | 'filled' | 'expired';
export type MedicationRoute = 'oral' | 'topical' | 'injection' | 'inhalation' | 'other';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  route: MedicationRoute;
  duration: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  date: string;
  medications: Medication[];
  doctorId: string;
  doctorName?: string;
  status: PrescriptionStatus;
  notes?: string;
  createdAt: string;
}

// Appointment Types
export type AppointmentType = 'first' | 'followup' | 'urgent';
export type AppointmentStatus = 'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  date: string;
  time: string;
  doctorId?: string;
  doctorName?: string;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

// Document Types
export type DocumentCategory = 'lab' | 'imaging' | 'surgery' | 'other';

export interface Document {
  id: string;
  patientId: string;
  category: DocumentCategory;
  name: string;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

// Permission Types
export interface Permission {
  role: UserRole;
  module: string;
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export interface ModulePermission {
  module: string;
  label: string;
  view: boolean;
  edit: boolean;
  delete: boolean;
}

// System Settings
export interface SystemSettings {
  organizationName: string;
  slogan: string;
  permissions: Permission[];
}

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
