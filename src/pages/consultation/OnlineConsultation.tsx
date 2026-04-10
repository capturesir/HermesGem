import React, { useState, useRef, useCallback } from 'react';
import {
  Users, Activity, Heart, AlertTriangle, Stethoscope, Pill,
  X, CheckCircle, Clock, ArrowLeft, Save, Plus, Trash2, User, Search
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Patient, Appointment, SOAPNote, Prescription, Medication, MedicationRoute } from '../../types';
import { getCSTDateString, toCSTDateString } from '../../lib/dateUtils';
import api from '../../services/api';

interface CurrentConsultation {
  patient: Patient;
  appointment: Appointment;
  alerts: Patient['id'] extends string ? any[] : never;
  latestVitals: Patient['id'] extends string ? any : undefined;
}

const OnlineConsultation: React.FC = () => {
  const { user } = useAuth();
  const {
    appointments,
    patients,
    updateAppointment,
    addSOAPNote,
    addPrescription,
    getPatientById,
    getAlertsByPatient,
    getVitalSignsByPatient,
    getAllergiesByPatient,
    getPrescriptionsByPatient
  } = useData();
  const { showToast } = useToast();

  // Get waiting list (checked-in appointments for today only)
  const today = getCSTDateString();
  const waitingPatients = appointments
    .filter(apt => apt.status === 'checked-in' && toCSTDateString(apt.date) === today)
    .map(apt => {
      const patient = getPatientById(apt.patientId);
      return { appointment: apt, patient };
    })
    .filter(item => item.patient !== undefined);

  const [currentConsultation, setCurrentConsultation] = useState<CurrentConsultation | null>(null);
  const [showConsultationView, setShowConsultationView] = useState(false);

  // ICD-10 typeahead state
  const [icd10Query, setIcd10Query] = useState('');
  const [icd10Results, setIcd10Results] = useState<any[]>([]);
  const [showIcd10Dropdown, setShowIcd10Dropdown] = useState(false);
  const icd10TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 捕捉正在搜尋的關鍵字（用於只取代該段）
  const icd10QueryRef = useRef('');

  // Medication typeahead state (per medication row index)
  const [medQuery, setMedQuery] = useState<Record<number, string>>({});
  const [medResults, setMedResults] = useState<Record<number, any[]>>({});
  const [showMedDropdown, setShowMedDropdown] = useState<Record<number, boolean>>({});
  const medTimerRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // SOAP Form State
  const [soapForm, setSoapForm] = useState({
    visitDate: getCSTDateString(),
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    notes: '',
  });

  // Prescription Form State
  const [prescriptionForm, setPrescriptionForm] = useState({
    date: getCSTDateString(),
    medications: [{ name: '', dosage: '', frequency: '', route: 'oral' as MedicationRoute, duration: 7 }] as Medication[],
    notes: '',
  });

  const handleStartConsultation = (item: { appointment: Appointment; patient: Patient }) => {
    const alerts = getAlertsByPatient(item.patient.id);
    const vitalSigns = getVitalSignsByPatient(item.patient.id);
    const latestVitals = vitalSigns.length > 0 ? vitalSigns[0] : undefined;

    setCurrentConsultation({
      patient: item.patient,
      appointment: item.appointment,
      alerts,
      latestVitals,
    });
    setShowConsultationView(true);

    // Reset forms
    setSoapForm({
      visitDate: getCSTDateString(),
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      notes: '',
    });
    setPrescriptionForm({
      date: getCSTDateString(),
      medications: [{ name: '', dosage: '', frequency: '', route: 'oral', duration: 7 }],
      notes: '',
    });
  };

  const handleExitConsultation = () => {
    if (window.confirm('確定要退出診症嗎？未儲存的資料將會遺失。')) {
      setCurrentConsultation(null);
      setShowConsultationView(false);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!currentConsultation) return;

    // Validate required fields
    if (!soapForm.subjective.trim() || !soapForm.assessment.trim()) {
      showToast('error', '請填寫主觀症狀和評估');
      return;
    }

    const validMeds = prescriptionForm.medications.filter(m => m.name.trim());

    try {
      // Create SOAP note
      await addSOAPNote({
        patientId: currentConsultation.patient.id,
        visitDate: soapForm.visitDate,
        subjective: soapForm.subjective,
        objective: soapForm.objective,
        assessment: soapForm.assessment,
        plan: soapForm.plan,
        notes: soapForm.notes,
        doctorId: user?.id || '',
        doctorName: user?.name || '',
        appointmentId: currentConsultation.appointment.id,
      });

      // Create prescription if medications are provided
      if (validMeds.length > 0) {
        await addPrescription({
          patientId: currentConsultation.patient.id,
          date: prescriptionForm.date,
          medications: validMeds,
          notes: prescriptionForm.notes,
          doctorId: user?.id || '',
          doctorName: user?.name || '',
          status: 'active',
          appointmentId: currentConsultation.appointment.id,
        });
      }

      // Update appointment status to completed
      await updateAppointment(currentConsultation.appointment.id, { status: 'completed' });

      showToast('success', '診症已完成');
      setCurrentConsultation(null);
      setShowConsultationView(false);
    } catch (err) {
      console.error('完成診症失敗:', err);
      showToast('error', '儲存失敗，請重試');
    }
  };

  // Medication helpers
  const addMedication = () => {
    setPrescriptionForm(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', route: 'oral', duration: 7 }],
    }));
  };

  const removeMedication = (index: number) => {
    if (prescriptionForm.medications.length > 1) {
      setPrescriptionForm(prev => ({
        ...prev,
        medications: prev.medications.filter((_, i) => i !== index),
      }));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string | number) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) =>
        i === index ? { ...med, [field]: value } : med
      ),
    }));
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return '-';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // ICD-10 search typeahead
  const searchICD10 = useCallback((query: string) => {
    if (icd10TimerRef.current) clearTimeout(icd10TimerRef.current);
    setIcd10Query(query);
    if (query.trim().length < 1) {
      setIcd10Results([]);
      setShowIcd10Dropdown(false);
      return;
    }
    icd10TimerRef.current = setTimeout(async () => {
      try {
        icd10QueryRef.current = query;  // 立即捕捉關鍵字
        const results = await api.searchICD10(query) as any[];
        setIcd10Results(results);
        setShowIcd10Dropdown(true);
      } catch (e) {
        setIcd10Results([]);
      }
    }, 300);
  }, []);

  const handleIcd10Select = (code: any) => {
    const current = soapForm.assessment;
    const query = icd10QueryRef.current;  // 只取代這段關鍵字
    const matchedText = `[${code.code}] ${code.name_en || ''} ${code.name_tc}，`.replace(/\s+/g, ' ').trim();

    if (!current || !query) {
      // 空欄位：直接插入
      setSoapForm(prev => ({ ...prev, assessment: matchedText }));
    } else {
      // 嘗試在文字中找到引發搜尋的關鍵字並替換
      const lastSepIdx = Math.max(
        current.lastIndexOf('\n'),
        current.lastIndexOf(','),
        current.lastIndexOf('，'),
        current.lastIndexOf(';'),
        current.lastIndexOf('；'),
      );
      const searchFrom = lastSepIdx + 1;
      const before = current.slice(0, searchFrom);
      const afterQuery = current.slice(searchFrom);

      // 去除首尾空白後比對，支援 "sure,  惡性" 這類有多餘空格的情況
      if (afterQuery.trim().startsWith(query.trim())) {
        // 去掉 leading whitespace，移除 query 關鍵字，保留後面的文字
        const trimmed = afterQuery.trim();
        const keywordRest = trimmed.slice(query.trim().length).trim();
        setSoapForm(prev => ({
          ...prev,
          assessment: before + matchedText + (keywordRest ? ' ' + keywordRest : ''),
        }));
      } else {
        setSoapForm(prev => ({
          ...prev,
          assessment: current ? `${current} ${matchedText}` : matchedText,
        }));
      }
    }

    setShowIcd10Dropdown(false);
    setIcd10Query('');
  };

  // Medication search typeahead for a specific row
  const searchMedication = useCallback((query: string, rowIndex: number) => {
    if (medTimerRef.current[rowIndex]) clearTimeout(medTimerRef.current[rowIndex]);
    if (query.trim().length < 1) {
      setMedResults(prev => ({ ...prev, [rowIndex]: [] }));
      setShowMedDropdown(prev => ({ ...prev, [rowIndex]: false }));
      return;
    }
    medTimerRef.current[rowIndex] = setTimeout(async () => {
      try {
        const results = await api.searchMedications(query) as any[];
        setMedResults(prev => ({ ...prev, [rowIndex]: results }));
        setShowMedDropdown(prev => ({ ...prev, [rowIndex]: true }));
      } catch (e) {
        setMedResults(prev => ({ ...prev, [rowIndex]: [] }));
      }
    }, 300);
  }, []);

  const handleMedSelect = (med: any, rowIndex: number) => {
    updateMedication(rowIndex, 'name', med.name);
    if (med.dosage) updateMedication(rowIndex, 'dosage', med.dosage);
    if (med.frequency) updateMedication(rowIndex, 'frequency', med.frequency);
    if (med.route) updateMedication(rowIndex, 'route', med.route);
    // Sync medQuery so the input stays consistent
    setMedQuery(prev => ({ ...prev, [rowIndex]: med.name }));
    setShowMedDropdown(prev => ({ ...prev, [rowIndex]: false }));
  };

  const getRouteText = (route: MedicationRoute) => {
    switch (route) {
      case 'oral': return '口服';
      case 'topical': return '外用';
      case 'injection': return '注射';
      case 'inhalation': return '吸入';
      case 'other': return '其他';
    }
  };

  // If viewing consultation
  if (showConsultationView && currentConsultation) {
    const { patient, appointment, alerts, latestVitals } = currentConsultation;
    const allergies = getAllergiesByPatient(patient.id);
    const previousPrescriptions = getPrescriptionsByPatient(patient.id);

    return (
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleExitConsultation}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">線上診症</h1>
                <p className="text-slate-500 mt-1">
                  正在為 {patient.name} 診症
                </p>
              </div>
            </div>
            <button
              onClick={handleCompleteConsultation}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <CheckCircle className="w-5 h-5" />
              完成診症
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Patient Basic Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-semibold ${
                  patient.gender === 'male' ? 'bg-blue-500' : patient.gender === 'female' ? 'bg-pink-500' : 'bg-slate-500'
                }`}>
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
                  <p className="text-slate-500">{patient.patientNumber}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">性別</span>
                  <span className="text-slate-900">
                    {patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">年齡</span>
                  <span className="text-slate-900">{calculateAge(patient.birthDate)} 歲</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">電話</span>
                  <span className="text-slate-900">{patient.phone || '-'}</span>
                </div>
                {patient.insuranceType && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">保險</span>
                    <span className="text-slate-900">{patient.insuranceType}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className={`rounded-xl border p-4 ${
                alerts.some(a => a.level === 'high')
                  ? 'bg-red-50 border-red-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className={`w-5 h-5 ${
                    alerts.some(a => a.level === 'high') ? 'text-red-600' : 'text-orange-600'
                  }`} />
                  <h3 className={`font-semibold ${
                    alerts.some(a => a.level === 'high') ? 'text-red-900' : 'text-orange-900'
                  }`}>
                    特別警示 ({alerts.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`p-3 rounded-lg ${
                      alerts.some(a => a.level === 'high') ? 'bg-red-100' : 'bg-orange-100'
                    }`}>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium mr-2 ${
                        alert.level === 'high' ? 'bg-red-200 text-red-900'
                          : alert.level === 'medium' ? 'bg-orange-200 text-orange-900'
                          : 'bg-yellow-200 text-yellow-900'
                      }`}>
                        {alert.level === 'high' ? '高' : alert.level === 'medium' ? '中' : '低'}
                      </span>
                      <span className="text-sm">{alert.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allergies */}
            {allergies.length > 0 && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">過敏記錄 ({allergies.length})</h3>
                </div>
                <div className="space-y-2">
                  {allergies.map(allergy => (
                    <div key={allergy.id} className="p-3 bg-red-100 rounded-lg">
                      <p className="font-medium text-red-900">{allergy.allergen}</p>
                      <p className="text-sm text-red-700">
                        {allergy.type === 'drug' ? '藥物' : allergy.type === 'food' ? '食物' : allergy.type === 'environmental' ? '環境' : '其他'} |
                        {allergy.severity === 'life-threatening' ? '危及生命' :
                         allergy.severity === 'severe' ? '重度' :
                         allergy.severity === 'moderate' ? '中度' : '輕度'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Vitals */}
            {latestVitals && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">最近生命體徵</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">血壓</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic}
                      <span className="text-xs font-normal text-slate-500 ml-1">mmHg</span>
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">心率</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {latestVitals.heartRate || '-'}
                      <span className="text-xs font-normal text-slate-500 ml-1">bpm</span>
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">體溫</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {latestVitals.temperature || '-'}
                      <span className="text-xs font-normal text-slate-500 ml-1">℃</span>
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">血氧</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {latestVitals.oxygenSaturation || '-'}
                      <span className="text-xs font-normal text-slate-500 ml-1">%</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - SOAP & Prescription */}
          <div className="lg:col-span-2 space-y-6">
            {/* SOAP Form */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">SOAP 就診記錄</h3>
              </div>

              {/* SOAP Explanation */}
              <div className="bg-blue-50 rounded-lg border border-blue-100 p-3 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-800">
                  <div><span className="font-semibold">S</span> - 主觀症狀</div>
                  <div><span className="font-semibold">O</span> - 客觀發現</div>
                  <div><span className="font-semibold">A</span> - 評估</div>
                  <div><span className="font-semibold">P</span> - 處置計劃</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    就診日期
                  </label>
                  <input
                    type="date"
                    value={soapForm.visitDate}
                    onChange={e => setSoapForm(prev => ({ ...prev, visitDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    S - 主觀症狀 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={soapForm.subjective}
                    onChange={e => setSoapForm(prev => ({ ...prev, subjective: e.target.value }))}
                    rows={3}
                    placeholder="病人描述的症狀、不適、感受..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    O - 客觀發現
                  </label>
                  <textarea
                    value={soapForm.objective}
                    onChange={e => setSoapForm(prev => ({ ...prev, objective: e.target.value }))}
                    rows={3}
                    placeholder="醫生檢查結果、測量數據..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    A - 評估 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={soapForm.assessment}
                      onChange={e => {
                        setSoapForm(prev => ({ ...prev, assessment: e.target.value }));
                        searchICD10(e.target.value.split(/[\s,]+/).pop() || '');
                      }}
                      onBlur={() => setTimeout(() => setShowIcd10Dropdown(false), 200)}
                      rows={3}
                      placeholder="診斷意見、病情評估（可輸入ICD-10關鍵字搜尋）..."
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
                    />
                    {showIcd10Dropdown && icd10Results.length > 0 && (
                      <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                        {icd10Results.map((code: any) => (
                          <button
                            key={code.id}
                            type="button"
                            onMouseDown={() => handleIcd10Select(code)}
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors"
                          >
                            <span className="font-mono text-blue-600 text-sm mr-2">{code.code}</span>
                            <span className="text-slate-800 text-sm mr-2">{code.name_en || ''} {code.name_tc}</span>
                            {code.category_tc && <span className="text-slate-400 text-xs">({code.category_tc})</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400">可直接輸入文字，或輸入關鍵字後從下拉選單選擇 ICD-10 疾病</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    P - 處置計劃
                  </label>
                  <textarea
                    value={soapForm.plan}
                    onChange={e => setSoapForm(prev => ({ ...prev, plan: e.target.value }))}
                    rows={3}
                    placeholder="治療方案、用藥建議..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    備註
                  </label>
                  <textarea
                    value={soapForm.notes}
                    onChange={e => setSoapForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    placeholder="額外說明..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Prescription Form */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Pill className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-slate-900">處方</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      處方日期
                    </label>
                    <input
                      type="date"
                      value={prescriptionForm.date}
                      onChange={e => setPrescriptionForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      藥物清單
                    </label>
                    <button
                      type="button"
                      onClick={addMedication}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      新增藥物
                    </button>
                  </div>

                  <div className="space-y-3">
                    {prescriptionForm.medications.map((med, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-medium text-slate-600">藥物 {index + 1}</span>
                          {prescriptionForm.medications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMedication(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <input
                              type="text"
                              value={med.name}
                              onChange={e => {
                                updateMedication(index, 'name', e.target.value);
                                searchMedication(e.target.value, index);
                              }}
                              onBlur={() => setTimeout(() => setShowMedDropdown(prev => ({ ...prev, [index]: false })), 200)}
                              placeholder="藥物名稱（可搜尋）"
                              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm w-full"
                            />
                            {showMedDropdown[index] && (medResults[index]?.length ?? 0) > 0 && (
                              <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                {(medResults[index] || []).map((m: any) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onMouseDown={() => handleMedSelect(m, index)}
                                    className="w-full text-left px-3 py-2 hover:bg-purple-50 border-b border-slate-100 last:border-0 transition-colors"
                                  >
                                    <p className="text-sm font-medium text-slate-900">{m.name}</p>
                                    <p className="text-xs text-slate-500">
                                      {m.dosage || ''} {m.frequency ? `| ${m.frequency}` : ''}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={e => updateMedication(index, 'dosage', e.target.value)}
                            placeholder="劑量 (如 500mg)"
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm"
                          />
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={e => updateMedication(index, 'frequency', e.target.value)}
                            placeholder="用藥頻率 (如 每日三次)"
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm"
                          />
                          <div className="flex gap-2">
                            <select
                              value={med.route}
                              onChange={e => updateMedication(index, 'route', e.target.value)}
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm"
                            >
                              <option value="oral">口服</option>
                              <option value="topical">外用</option>
                              <option value="injection">注射</option>
                              <option value="inhalation">吸入</option>
                              <option value="other">其他</option>
                            </select>
                            <input
                              type="number"
                              value={med.duration}
                              onChange={e => updateMedication(index, 'duration', parseInt(e.target.value) || 0)}
                              placeholder="天數"
                              className="w-16 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    用藥指示
                  </label>
                  <textarea
                    value={prescriptionForm.notes}
                    onChange={e => setPrescriptionForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    placeholder="用藥指示..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Waiting List View
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">線上診症</h1>
        <p className="text-slate-500 mt-1">選擇一位已報到的病人開始診症</p>
      </div>

      {/* Waiting List */}
      {waitingPatients.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">目前沒有候診病人</h3>
          <p className="text-slate-500">
            請等待病人報到後再開始診症
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                候診人數：{waitingPatients.length}
              </span>
            </div>
          </div>

          {waitingPatients.map(({ appointment, patient }) => {
            const alerts = getAlertsByPatient(patient.id);
            const vitalSigns = getVitalSignsByPatient(patient.id);
            const latestVitals = vitalSigns.length > 0 ? vitalSigns[0] : undefined;
            const hasHighAlert = alerts.some(a => a.isActive && a.level === 'high');

            return (
              <div
                key={appointment.id}
                className={`bg-white rounded-xl border p-5 transition-all cursor-pointer hover:shadow-md ${
                  hasHighAlert ? 'border-red-300 hover:border-red-400' : 'border-slate-200 hover:border-blue-300'
                }`}
                onClick={() => handleStartConsultation({ appointment, patient })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold ${
                      patient.gender === 'male' ? 'bg-blue-500' : patient.gender === 'female' ? 'bg-pink-500' : 'bg-slate-500'
                    }`}>
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{patient.name}</h3>
                        {hasHighAlert && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            高警示
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {patient.patientNumber} | {calculateAge(patient.birthDate)} 歲 |
                        {patient.gender === 'male' ? ' 男' : patient.gender === 'female' ? ' 女' : ''}
                      </p>
                      {patient.address && (
                        <p className="text-sm text-slate-500 mt-0.5">
                          <span className="inline-flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {patient.address}
                          </span>
                        </p>
                      )}
                      {appointment.notes && (
                        <p className="text-sm text-slate-600 mt-1">{appointment.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {latestVitals && (
                      <div className="hidden md:flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-slate-500">血壓</p>
                          <p className="font-medium text-slate-900">
                            {latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-500">心率</p>
                          <p className="font-medium text-slate-900">{latestVitals.heartRate || '-'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-500">體溫</p>
                          <p className="font-medium text-slate-900">{latestVitals.temperature || '-'}</p>
                        </div>
                      </div>
                    )}
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      開始診症
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OnlineConsultation;
