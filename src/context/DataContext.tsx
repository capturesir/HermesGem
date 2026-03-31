import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Patient, Alert, VitalSign, Allergy, SOAPNote, Prescription, Document, Appointment, SystemSettings
} from '../types';
import {
  initialPatients, initialAlerts, initialVitalSigns, initialAllergies,
  initialSOAPNotes, initialPrescriptions, initialDocuments, initialAppointments,
  initialSystemSettings, generateId
} from '../data/initialData';
import api from '../services/api';

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
  const [settings, setSettings] = useState<SystemSettings>(initialSystemSettings);

  // Load initial data from localStorage (fallback)
  useEffect(() => {
    const storedPatients = localStorage.getItem('emr_patients');
    const storedAlerts = localStorage.getItem('emr_alerts');
    const storedVitalSigns = localStorage.getItem('emr_vitalSigns');
    const storedAllergies = localStorage.getItem('emr_allergies');
    const storedSOAPNotes = localStorage.getItem('emr_soapNotes');
    const storedPrescriptions = localStorage.getItem('emr_prescriptions');
    const storedDocuments = localStorage.getItem('emr_documents');
    const storedAppointments = localStorage.getItem('emr_appointments');
    const storedSettings = localStorage.getItem('emr_settings');

    setPatients(storedPatients ? JSON.parse(storedPatients) : initialPatients);
    setAlerts(storedAlerts ? JSON.parse(storedAlerts) : initialAlerts);
    setVitalSigns(storedVitalSigns ? JSON.parse(storedVitalSigns) : initialVitalSigns);
    setAllergies(storedAllergies ? JSON.parse(storedAllergies) : initialAllergies);
    setSOAPNotes(storedSOAPNotes ? JSON.parse(storedSOAPNotes) : initialSOAPNotes);
    setPrescriptions(storedPrescriptions ? JSON.parse(storedPrescriptions) : initialPrescriptions);
    setDocuments(storedDocuments ? JSON.parse(storedDocuments) : initialDocuments);
    setAppointments(storedAppointments ? JSON.parse(storedAppointments) : initialAppointments);
    setSettings(storedSettings ? JSON.parse(storedSettings) : initialSystemSettings);
  }, []);

  // Helper to save data to localStorage
  const saveData = (key: string, data: unknown) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Refresh patients from API
  const refreshPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        const response = await api.getPatients();
        setPatients(response.patients as Patient[]);
        saveData('emr_patients', response.patients);
      }
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
      const token = localStorage.getItem('emr_token');
      if (token) {
        const response = await api.getAppointments();
        setAppointments(response.appointments as Appointment[]);
        saveData('emr_appointments', response.appointments);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  }, []);

  // Patient functions
  const addPatient = async (patient: Partial<Patient>): Promise<Patient> => {
    const newPatient: Patient = {
      id: generateId(),
      patientNumber: patient.patientNumber || `P${Date.now().toString().slice(-6)}`,
      name: patient.name || '',
      gender: patient.gender,
      birthDate: patient.birthDate,
      idCard: patient.idCard,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      emergencyPhone: patient.emergencyPhone,
      insuranceType: patient.insuranceType,
      insuranceNumber: patient.insuranceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        const created = await api.createPatient(patient);
        const apiPatient = created as Patient;
        const updated = [...patients, apiPatient];
        setPatients(updated);
        saveData('emr_patients', updated);
        return apiPatient;
      }
    } catch (error) {
      console.error('API error, using local fallback:', error);
    }

    const updated = [...patients, newPatient];
    setPatients(updated);
    saveData('emr_patients', updated);
    return newPatient;
  };

  const updatePatient = async (id: string, patient: Partial<Patient>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.updatePatient(id, patient);
        await refreshPatients();
        return true;
      }
    } catch (error) {
      console.error('API error:', error);
    }

    const index = patients.findIndex(p => p.id === id);
    if (index === -1) return false;
    const updated = [...patients];
    updated[index] = { ...updated[index], ...patient, updatedAt: new Date().toISOString() };
    setPatients(updated);
    saveData('emr_patients', updated);
    return true;
  };

  const deletePatient = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.deletePatient(id);
        await refreshPatients();
      }
    } catch (error) {
      console.error('API error, using local fallback:', error);
    }

    const updated = patients.filter(p => p.id !== id);
    setPatients(updated);
    saveData('emr_patients', updated);
    // Also delete related data
    setAlerts(prev => {
      const filtered = prev.filter(a => a.patientId !== id);
      saveData('emr_alerts', filtered);
      return filtered;
    });
    setVitalSigns(prev => {
      const filtered = prev.filter(v => v.patientId !== id);
      saveData('emr_vitalSigns', filtered);
      return filtered;
    });
    setAllergies(prev => {
      const filtered = prev.filter(a => a.patientId !== id);
      saveData('emr_allergies', filtered);
      return filtered;
    });
    setSOAPNotes(prev => {
      const filtered = prev.filter(s => s.patientId !== id);
      saveData('emr_soapNotes', filtered);
      return filtered;
    });
    setPrescriptions(prev => {
      const filtered = prev.filter(p => p.patientId !== id);
      saveData('emr_prescriptions', filtered);
      return filtered;
    });
    setDocuments(prev => {
      const filtered = prev.filter(d => d.patientId !== id);
      saveData('emr_documents', filtered);
      return filtered;
    });
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
    const newAlert: Alert = {
      id: generateId(),
      patientId: alert.patientId || '',
      level: alert.level || 'low',
      type: alert.type || 'other',
      content: alert.content || '',
      isActive: alert.isActive ?? true,
      createdAt: new Date().toISOString(),
    };
    try {
      const token = localStorage.getItem('emr_token');
      if (token && alert.patientId) {
        const created = await api.createAlert(alert.patientId, alert);
        const apiAlert = created as Alert;
        const updated = [...alerts, apiAlert];
        setAlerts(updated);
        saveData('emr_alerts', updated);
        return apiAlert;
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    saveData('emr_alerts', updated);
    return newAlert;
  };

  const updateAlert = async (id: string, alert: Partial<Alert>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.updateAlert(id, alert);
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const index = alerts.findIndex(a => a.id === id);
    if (index === -1) return false;
    const updated = [...alerts];
    updated[index] = { ...updated[index], ...alert };
    setAlerts(updated);
    saveData('emr_alerts', updated);
    return true;
  };

  const deleteAlert = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.deleteAlert(id);
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    saveData('emr_alerts', updated);
    return true;
  };

  const getAlertsByPatient = (patientId: string): Alert[] => {
    return alerts.filter(a => a.patientId === patientId);
  };

  // Vital Sign functions
  const addVitalSign = async (vitalSign: Partial<VitalSign>): Promise<VitalSign> => {
    const newVitalSign: VitalSign = {
      id: generateId(),
      patientId: vitalSign.patientId || '',
      temperature: vitalSign.temperature,
      bloodPressureSystolic: vitalSign.bloodPressureSystolic,
      bloodPressureDiastolic: vitalSign.bloodPressureDiastolic,
      heartRate: vitalSign.heartRate,
      respiratoryRate: vitalSign.respiratoryRate,
      oxygenSaturation: vitalSign.oxygenSaturation,
      weight: vitalSign.weight,
      height: vitalSign.height,
      notes: vitalSign.notes,
      recordedAt: vitalSign.recordedAt || new Date().toISOString(),
      recordedBy: vitalSign.recordedBy || '',
    };
    try {
      const token = localStorage.getItem('emr_token');
      if (token && vitalSign.patientId) {
        const created = await api.createVitalSign(vitalSign.patientId, vitalSign);
        const apiVital = created as VitalSign;
        const updated = [...vitalSigns, apiVital];
        setVitalSigns(updated);
        saveData('emr_vitalSigns', updated);
        return apiVital;
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const updated = [...vitalSigns, newVitalSign];
    setVitalSigns(updated);
    saveData('emr_vitalSigns', updated);
    return newVitalSign;
  };

  const updateVitalSign = async (id: string, vitalSign: Partial<VitalSign>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.updateVitalSign(id, vitalSign);
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const index = vitalSigns.findIndex(v => v.id === id);
    if (index === -1) return false;
    const updated = [...vitalSigns];
    updated[index] = { ...updated[index], ...vitalSign };
    setVitalSigns(updated);
    saveData('emr_vitalSigns', updated);
    return true;
  };

  const deleteVitalSign = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.deleteVitalSign(id);
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const updated = vitalSigns.filter(v => v.id !== id);
    setVitalSigns(updated);
    saveData('emr_vitalSigns', updated);
    return true;
  };

  const getVitalSignsByPatient = (patientId: string): VitalSign[] => {
    return vitalSigns.filter(v => v.patientId === patientId).sort((a, b) =>
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
  };

  // Allergy functions
  const addAllergy = async (allergy: Partial<Allergy>): Promise<Allergy> => {
    const newAllergy: Allergy = {
      id: generateId(),
      patientId: allergy.patientId || '',
      allergen: allergy.allergen || '',
      type: allergy.type || 'other',
      severity: allergy.severity || 'mild',
      reaction: allergy.reaction || '',
      recordedAt: new Date().toISOString(),
    };
    try {
      const token = localStorage.getItem('emr_token');
      if (token && allergy.patientId) {
        const created = await api.createAllergy(allergy.patientId, allergy);
        const apiAllergy = created as Allergy;
        const updated = [...allergies, apiAllergy];
        setAllergies(updated);
        saveData('emr_allergies', updated);
        return apiAllergy;
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const updated = [...allergies, newAllergy];
    setAllergies(updated);
    saveData('emr_allergies', updated);
    return newAllergy;
  };

  const updateAllergy = async (id: string, allergy: Partial<Allergy>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.updateAllergy(id, allergy);
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const index = allergies.findIndex(a => a.id === id);
    if (index === -1) return false;
    const updated = [...allergies];
    updated[index] = { ...updated[index], ...allergy };
    setAllergies(updated);
    saveData('emr_allergies', updated);
    return true;
  };

  const deleteAllergy = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.deleteAllergy(id);
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const updated = allergies.filter(a => a.id !== id);
    setAllergies(updated);
    saveData('emr_allergies', updated);
    return true;
  };

  const getAllergiesByPatient = (patientId: string): Allergy[] => {
    return allergies.filter(a => a.patientId === patientId);
  };

  // SOAP Note functions
  const addSOAPNote = async (note: Partial<SOAPNote>): Promise<SOAPNote> => {
    const newNote: SOAPNote = {
      id: generateId(),
      patientId: note.patientId || '',
      visitDate: note.visitDate || new Date().toISOString().split('T')[0],
      subjective: note.subjective || '',
      objective: note.objective || '',
      assessment: note.assessment || '',
      plan: note.plan || '',
      doctorId: note.doctorId || '',
      doctorName: note.doctorName,
      notes: note.notes,
      createdAt: new Date().toISOString(),
    };
    try {
      const token = localStorage.getItem('emr_token');
      if (token && note.patientId) {
        const created = await api.createSOAPNote(note.patientId, note);
        const apiNote = created as SOAPNote;
        const updated = [...soapNotes, apiNote];
        setSOAPNotes(updated);
        saveData('emr_soapNotes', updated);
        return apiNote;
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const updated = [...soapNotes, newNote];
    setSOAPNotes(updated);
    saveData('emr_soapNotes', updated);
    return newNote;
  };

  const updateSOAPNote = async (id: string, note: Partial<SOAPNote>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.updateSOAPNote(id, note);
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const index = soapNotes.findIndex(s => s.id === id);
    if (index === -1) return false;
    const updated = [...soapNotes];
    updated[index] = { ...updated[index], ...note };
    setSOAPNotes(updated);
    saveData('emr_soapNotes', updated);
    return true;
  };

  const deleteSOAPNote = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.deleteSOAPNote(id);
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const updated = soapNotes.filter(s => s.id !== id);
    setSOAPNotes(updated);
    saveData('emr_soapNotes', updated);
    return true;
  };

  const getSOAPNotesByPatient = (patientId: string): SOAPNote[] => {
    return soapNotes.filter(s => s.patientId === patientId).sort((a, b) =>
      new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    );
  };

  // Prescription functions
  const addPrescription = async (prescription: Partial<Prescription>): Promise<Prescription> => {
    const newPrescription: Prescription = {
      id: generateId(),
      patientId: prescription.patientId || '',
      date: prescription.date || new Date().toISOString().split('T')[0],
      medications: prescription.medications || [],
      doctorId: prescription.doctorId || '',
      doctorName: prescription.doctorName,
      status: prescription.status || 'active',
      notes: prescription.notes,
      createdAt: new Date().toISOString(),
    };
    try {
      const token = localStorage.getItem('emr_token');
      if (token && prescription.patientId) {
        const created = await api.createPrescription(prescription.patientId, prescription);
        const apiPrescription = created as Prescription;
        const updated = [...prescriptions, apiPrescription];
        setPrescriptions(updated);
        saveData('emr_prescriptions', updated);
        return apiPrescription;
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const updated = [...prescriptions, newPrescription];
    setPrescriptions(updated);
    saveData('emr_prescriptions', updated);
    return newPrescription;
  };

  const updatePrescription = async (id: string, prescription: Partial<Prescription>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.updatePrescription(id, prescription);
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const index = prescriptions.findIndex(p => p.id === id);
    if (index === -1) return false;
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], ...prescription };
    setPrescriptions(updated);
    saveData('emr_prescriptions', updated);
    return true;
  };

  const deletePrescription = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.deletePrescription(id);
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const updated = prescriptions.filter(p => p.id !== id);
    setPrescriptions(updated);
    saveData('emr_prescriptions', updated);
    return true;
  };

  const getPrescriptionsByPatient = (patientId: string): Prescription[] => {
    return prescriptions.filter(p => p.patientId === patientId).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  // Document functions
  const addDocument = async (document: Partial<Document>): Promise<Document> => {
    const newDocument: Document = {
      id: generateId(),
      patientId: document.patientId || '',
      category: document.category || 'other',
      name: document.name || '',
      fileType: document.fileType || '',
      fileUrl: document.fileUrl || '',
      uploadedBy: document.uploadedBy || '',
      uploadedAt: new Date().toISOString(),
    };
    const updated = [...documents, newDocument];
    setDocuments(updated);
    saveData('emr_documents', updated);
    return newDocument;
  };

  const updateDocument = async (id: string, document: Partial<Document>): Promise<boolean> => {
    const index = documents.findIndex(d => d.id === id);
    if (index === -1) return false;
    const updated = [...documents];
    updated[index] = { ...updated[index], ...document };
    setDocuments(updated);
    saveData('emr_documents', updated);
    return true;
  };

  const deleteDocument = async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.deleteDocument(id);
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    saveData('emr_documents', updated);
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
    const newAppointment: Appointment = {
      id: generateId(),
      patientId: appointment.patientId || '',
      patientName: appointment.patientName,
      date: appointment.date || '',
      time: appointment.time || '',
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      type: appointment.type || 'first',
      status: appointment.status || 'pending',
      notes: appointment.notes,
      createdAt: new Date().toISOString(),
    };
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        const created = await api.createAppointment(appointment);
        const apiAppointment = created as Appointment;
        const updated = [...appointments, apiAppointment];
        setAppointments(updated);
        saveData('emr_appointments', updated);
        return apiAppointment;
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const updated = [...appointments, newAppointment];
    setAppointments(updated);
    saveData('emr_appointments', updated);
    return newAppointment;
  };

  const updateAppointment = async (id: string, appointment: Partial<Appointment>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.updateAppointment(id, appointment);
        await refreshAppointments();
        return true;
      }
    } catch (error) {
      console.error('API error:', error);
    }
    const index = appointments.findIndex(a => a.id === id);
    if (index === -1) return false;
    const updated = [...appointments];
    updated[index] = { ...updated[index], ...appointment };
    setAppointments(updated);
    saveData('emr_appointments', updated);
    return true;
  };

  const deleteAppointment = async (id: string): Promise<boolean> => {
    const updated = appointments.filter(a => a.id !== id);
    setAppointments(updated);
    saveData('emr_appointments', updated);
    return true;
  };

  const getAppointmentsByPatient = (patientId: string): Appointment[] => {
    return appointments.filter(a => a.patientId === patientId);
  };

  // Settings functions
  const updateSettings = async (newSettings: Partial<SystemSettings>): Promise<void> => {
    const updated = { ...settings, ...newSettings };
    try {
      const token = localStorage.getItem('emr_token');
      if (token) {
        await api.updateSettings(newSettings);
      }
    } catch (error) {
      console.error('API error:', error);
    }
    setSettings(updated);
    saveData('emr_settings', updated);
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
