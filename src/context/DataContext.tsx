import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Patient, Alert, VitalSign, Allergy, SOAPNote, Prescription, Document, Appointment, SystemSettings
} from '../types';
import api from '../services/api';
import { toSnakeCase, toCamelCase } from '../lib/apiUtils';
import { getCSTISOString } from '../lib/dateUtils';

interface DataContextType {
  // Patients
  patients: Patient[];
  patientsLoading: boolean;
  addPatient: (patient: Partial<Patient>) => Promise<Patient>;
  updatePatient: (id: string, patient: Partial<Patient>) => Promise<boolean>;
  deletePatient: (id: string) => Promise<boolean>;
  getPatientById: (id: string) => Patient | undefined;
  getPatientByNumber: (number: string) => Patient | undefined;
  refreshPatients: () => Promise<void>;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Partial<Alert>) => Promise<Alert>;
  updateAlert: (id: string, alert: Partial<Alert>) => Promise<boolean>;
  deleteAlert: (id: string) => Promise<boolean>;
  getAlertsByPatient: (patientId: string) => Alert[];

  // Vital Signs
  vitalSigns: VitalSign[];
  addVitalSign: (vitalSign: Partial<VitalSign>) => Promise<VitalSign>;
  updateVitalSign: (id: string, vitalSign: Partial<VitalSign>) => Promise<boolean>;
  deleteVitalSign: (id: string) => Promise<boolean>;
  getVitalSignsByPatient: (patientId: string) => VitalSign[];

  // Allergies
  allergies: Allergy[];
  addAllergy: (allergy: Partial<Allergy>) => Promise<Allergy>;
  updateAllergy: (id: string, allergy: Partial<Allergy>) => Promise<boolean>;
  deleteAllergy: (id: string) => Promise<boolean>;
  getAllergiesByPatient: (patientId: string) => Allergy[];

  // SOAP Notes
  soapNotes: SOAPNote[];
  addSOAPNote: (note: Partial<SOAPNote>) => Promise<SOAPNote>;
  updateSOAPNote: (id: string, note: Partial<SOAPNote>) => Promise<boolean>;
  deleteSOAPNote: (id: string) => Promise<boolean>;
  getSOAPNotesByPatient: (patientId: string) => SOAPNote[];

  // Prescriptions
  prescriptions: Prescription[];
  addPrescription: (prescription: Partial<Prescription>) => Promise<Prescription>;
  updatePrescription: (id: string, prescription: Partial<Prescription>) => Promise<boolean>;
  deletePrescription: (id: string) => Promise<boolean>;
  getPrescriptionsByPatient: (patientId: string) => Prescription[];

  // Documents
  documents: Document[];
  addDocument: (document: Partial<Document>) => Promise<Document>;
  updateDocument: (id: string, document: Partial<Document>) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;
  getDocumentsByPatient: (patientId: string) => Document[];
  getDocumentsByCategory: (patientId: string, category: string) => Document[];

  // Appointments
  appointments: Appointment[];
  appointmentsLoading: boolean;
  addAppointment: (appointment: Partial<Appointment>) => Promise<Appointment>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<boolean>;
  deleteAppointment: (id: string) => Promise<boolean>;
  getAppointmentsByPatient: (patientId: string) => Appointment[];
  refreshAppointments: () => Promise<void>;

  // Settings
  settings: SystemSettings;
  updateSettings: (settings: Partial<SystemSettings>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [soapNotes, setSOAPNotes] = useState<SOAPNote[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({} as SystemSettings);

  // Initialize: load all data from API
  const loadAll = useCallback(async () => {
    const token = localStorage.getItem('emr_token');
    if (!token) return;

    setPatientsLoading(true);
    try {
      const results = await Promise.allSettled([
        api.getPatients(),
        api.getAppointments(),
        api.getSettings(),
      ]);

      const [patientsResult, appointmentsResult, settingsResult] = results;

      if (patientsResult.status === 'fulfilled') {
        const raw = (patientsResult.value as { patients: unknown[] }).patients || [];
        setPatients(toCamelCase<Patient[]>(raw));
      }

      if (appointmentsResult.status === 'fulfilled') {
        const raw = (appointmentsResult.value as { appointments: unknown[] }).appointments || [];
        setAppointments(toCamelCase<Appointment[]>(raw));
      }

      if (settingsResult.status === 'fulfilled') {
        setSettings(settingsResult.value as SystemSettings);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    // Listen for login events to reload data after authentication
    const handleLoginSuccess = () => loadAll();
    window.addEventListener('auth:loginSuccess', handleLoginSuccess);
    return () => window.removeEventListener('auth:loginSuccess', handleLoginSuccess);
  }, [loadAll]);

  // Refresh patients from API
  const refreshPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const response = await api.getPatients();
      const raw = (response as { patients: unknown[] }).patients || [];
      setPatients(toCamelCase<Patient[]>(raw));
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  // Refresh appointments from API
  const refreshAppointments = useCallback(async () => {
    setAppointmentsLoading(true);
    try {
      const response = await api.getAppointments();
      const raw = (response as { appointments: unknown[] }).appointments || [];
      setAppointments(toCamelCase<Appointment[]>(raw));
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  }, []);

  // Patient functions
  const addPatient = async (patient: Partial<Patient>): Promise<Patient> => {
    const snakeCasePatient = toSnakeCase(patient as Record<string, unknown>);
    const created = await api.createPatient(snakeCasePatient);
    const apiPatient = toCamelCase<Patient>(created);
    setPatients(prev => [...prev, apiPatient]);
    return apiPatient;
  };

  const updatePatient = async (id: string, patient: Partial<Patient>): Promise<boolean> => {
    const snakeCasePatient = toSnakeCase(patient as Record<string, unknown>);
    await api.updatePatient(id, snakeCasePatient);
    // Reload fresh data from API to ensure state matches database
    const response = await api.getPatients();
    const raw = (response as { patients: unknown[] }).patients || [];
    setPatients(toCamelCase<Patient[]>(raw));
    return true;
  };

  const deletePatient = async (id: string): Promise<boolean> => {
    await api.deletePatient(id);
    // Reload fresh data from API to ensure state matches database
    const response = await api.getPatients();
    const raw = (response as { patients: unknown[] }).patients || [];
    setPatients(toCamelCase<Patient[]>(raw));
    // Cascade delete related records from local state
    setAlerts(prev => prev.filter(a => a.patientId !== id));
    setVitalSigns(prev => prev.filter(v => v.patientId !== id));
    setAllergies(prev => prev.filter(a => a.patientId !== id));
    setSOAPNotes(prev => prev.filter(s => s.patientId !== id));
    setPrescriptions(prev => prev.filter(p => p.patientId !== id));
    setDocuments(prev => prev.filter(d => d.patientId !== id));
    return true;
  };

  const getPatientById = (id: string): Patient | undefined => {
    return patients.find(p => p.id === id);
  };

  const getPatientByNumber = (number: string): Patient | undefined => {
    return patients.find(p => p.patientNumber === number);
  };

  // Alert functions
  const addAlert = async (alert: Partial<Alert>): Promise<Alert> => {
    const created = await api.createAlert(alert.patientId!, alert);
    const apiAlert = created as Alert;
    setAlerts(prev => [...prev, apiAlert]);
    return apiAlert;
  };

  const updateAlert = async (id: string, alert: Partial<Alert>): Promise<boolean> => {
    await api.updateAlert(id, alert);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, ...alert } : a));
    return true;
  };

  const deleteAlert = async (id: string): Promise<boolean> => {
    await api.deleteAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
    return true;
  };

  const getAlertsByPatient = (patientId: string): Alert[] => {
    return alerts.filter(a => a.patientId === patientId);
  };

  // Vital Sign functions
  const addVitalSign = async (vitalSign: Partial<VitalSign>): Promise<VitalSign> => {
    const created = await api.createVitalSign(vitalSign.patientId!, vitalSign);
    const apiVital = created as VitalSign;
    setVitalSigns(prev => [...prev, apiVital]);
    return apiVital;
  };

  const updateVitalSign = async (id: string, vitalSign: Partial<VitalSign>): Promise<boolean> => {
    await api.updateVitalSign(id, vitalSign);
    setVitalSigns(prev => prev.map(v => v.id === id ? { ...v, ...vitalSign } : v));
    return true;
  };

  const deleteVitalSign = async (id: string): Promise<boolean> => {
    await api.deleteVitalSign(id);
    setVitalSigns(prev => prev.filter(v => v.id !== id));
    return true;
  };

  const getVitalSignsByPatient = (patientId: string): VitalSign[] => {
    return vitalSigns.filter(v => v.patientId === patientId).sort((a, b) =>
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
  };

  // Allergy functions
  const addAllergy = async (allergy: Partial<Allergy>): Promise<Allergy> => {
    const created = await api.createAllergy(allergy.patientId!, allergy);
    const apiAllergy = created as Allergy;
    setAllergies(prev => [...prev, apiAllergy]);
    return apiAllergy;
  };

  const updateAllergy = async (id: string, allergy: Partial<Allergy>): Promise<boolean> => {
    await api.updateAllergy(id, allergy);
    setAllergies(prev => prev.map(a => a.id === id ? { ...a, ...allergy } : a));
    return true;
  };

  const deleteAllergy = async (id: string): Promise<boolean> => {
    await api.deleteAllergy(id);
    setAllergies(prev => prev.filter(a => a.id !== id));
    return true;
  };

  const getAllergiesByPatient = (patientId: string): Allergy[] => {
    return allergies.filter(a => a.patientId === patientId);
  };

  // SOAP Note functions
  const addSOAPNote = async (note: Partial<SOAPNote>): Promise<SOAPNote> => {
    const created = await api.createSOAPNote(note.patientId!, note);
    const apiNote = created as SOAPNote;
    setSOAPNotes(prev => [...prev, apiNote]);
    return apiNote;
  };

  const updateSOAPNote = async (id: string, note: Partial<SOAPNote>): Promise<boolean> => {
    await api.updateSOAPNote(id, note);
    setSOAPNotes(prev => prev.map(s => s.id === id ? { ...s, ...note } : s));
    return true;
  };

  const deleteSOAPNote = async (id: string): Promise<boolean> => {
    await api.deleteSOAPNote(id);
    setSOAPNotes(prev => prev.filter(s => s.id !== id));
    return true;
  };

  const getSOAPNotesByPatient = (patientId: string): SOAPNote[] => {
    return soapNotes.filter(s => s.patientId === patientId).sort((a, b) =>
      new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    );
  };

  // Prescription functions
  const addPrescription = async (prescription: Partial<Prescription>): Promise<Prescription> => {
    const created = await api.createPrescription(prescription.patientId!, prescription);
    const apiPrescription = created as Prescription;
    setPrescriptions(prev => [...prev, apiPrescription]);
    return apiPrescription;
  };

  const updatePrescription = async (id: string, prescription: Partial<Prescription>): Promise<boolean> => {
    await api.updatePrescription(id, prescription);
    setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, ...prescription } : p));
    return true;
  };

  const deletePrescription = async (id: string): Promise<boolean> => {
    await api.deletePrescription(id);
    setPrescriptions(prev => prev.filter(p => p.id !== id));
    return true;
  };

  const getPrescriptionsByPatient = (patientId: string): Prescription[] => {
    return prescriptions.filter(p => p.patientId === patientId).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  // Document functions
  const addDocument = async (document: Partial<Document>, file?: File): Promise<Document> => {
    if (file && document.patientId) {
      // Real file upload via API
      const formData = new FormData();
      formData.append('category', document.category || 'other');
      formData.append('name', document.name || file.name);
      formData.append('date', getCSTISOString());
      formData.append('file', file);
      const created = await api.uploadDocument(document.patientId, formData);
      const apiDocument = toCamelCase<Document>(created as Record<string, unknown>);
      setDocuments(prev => [...prev, apiDocument]);
      return apiDocument;
    }

    // Fallback: metadata-only document (for non-file cases)
    const newDocument: Document = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      patientId: document.patientId || '',
      category: document.category || 'other',
      name: document.name || '',
      fileType: document.fileType || '',
      fileUrl: document.fileUrl || '',
      uploadedBy: document.uploadedBy || '',
      uploadedAt: getCSTISOString(),
    };
    setDocuments(prev => [...prev, newDocument]);
    return newDocument;
  };

  const updateDocument = async (id: string, document: Partial<Document>): Promise<boolean> => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...document } : d));
    return true;
  };

  const deleteDocument = async (id: string): Promise<boolean> => {
    await api.deleteDocument(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    return true;
  };

  const getDocumentsByPatient = (patientId: string): Document[] => {
    return documents.filter(d => d.patientId === patientId).sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  };

  const getDocumentsByCategory = (patientId: string, category: string): Document[] => {
    return documents.filter(d => d.patientId === patientId && d.category === category);
  };

  // Appointment functions
  const addAppointment = async (appointment: Partial<Appointment>): Promise<Appointment> => {
    const snakeCaseAppointment = toSnakeCase(appointment as Record<string, unknown>);
    const created = await api.createAppointment(snakeCaseAppointment);
    const apiAppointment = created as Appointment;
    setAppointments(prev => [...prev, apiAppointment]);
    return apiAppointment;
  };

  const updateAppointment = async (id: string, appointment: Partial<Appointment>): Promise<boolean> => {
    const snakeCaseAppointment = toSnakeCase(appointment as Record<string, unknown>);
    await api.updateAppointment(id, snakeCaseAppointment);
    // Reload fresh data from API to ensure state matches database
    const response = await api.getAppointments();
    const raw = (response as { appointments: unknown[] }).appointments || [];
    setAppointments(toCamelCase<Appointment[]>(raw));
    return true;
  };

  const deleteAppointment = async (id: string): Promise<boolean> => {
    await api.deleteAppointment(id);
    setAppointments(prev => prev.filter(a => a.id !== id));
    return true;
  };

  const getAppointmentsByPatient = (patientId: string): Appointment[] => {
    return appointments.filter(a => a.patientId === patientId);
  };

  // Settings functions
  const updateSettings = async (newSettings: Partial<SystemSettings>): Promise<void> => {
    await api.updateSettings(newSettings);
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <DataContext.Provider
      value={{
        patients,
        patientsLoading,
        addPatient,
        updatePatient,
        deletePatient,
        getPatientById,
        getPatientByNumber,
        refreshPatients,
        alerts,
        addAlert,
        updateAlert,
        deleteAlert,
        getAlertsByPatient,
        vitalSigns,
        addVitalSign,
        updateVitalSign,
        deleteVitalSign,
        getVitalSignsByPatient,
        allergies,
        addAllergy,
        updateAllergy,
        deleteAllergy,
        getAllergiesByPatient,
        soapNotes,
        addSOAPNote,
        updateSOAPNote,
        deleteSOAPNote,
        getSOAPNotesByPatient,
        prescriptions,
        addPrescription,
        updatePrescription,
        deletePrescription,
        getPrescriptionsByPatient,
        documents,
        addDocument,
        updateDocument,
        deleteDocument,
        getDocumentsByPatient,
        getDocumentsByCategory,
        appointments,
        appointmentsLoading,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        getAppointmentsByPatient,
        refreshAppointments,
        settings,
        updateSettings,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
