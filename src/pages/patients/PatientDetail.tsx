import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, AlertTriangle, Activity, Heart,
  Stethoscope, Pill, FolderOpen, FileText, Calendar, Save, ClipboardList
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { toCamelCase } from '../../lib/apiUtils';
import { Alert, VitalSign, Allergy, SOAPNote, Prescription, Document } from '../../types';

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPatientById, updatePatient, deletePatient } = useData();
  const { showToast } = useToast();

  // Per-patient records — loaded from API directly (not from DataContext empty arrays)
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [soapNotes, setSoapNotes] = useState<SOAPNote[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const patient = getPatientById(id || '');

  // Load all per-patient records when patient id changes
  const loadPatientRecords = useCallback(async (patientId: string) => {
    setRecordsLoading(true);
    try {
      const [alertsRes, vitalsRes, allergiesRes, soapRes, rxRes, docsRes] = await Promise.allSettled([
        api.getAlerts(patientId),
        api.getVitals(patientId),
        api.getAllergies(patientId),
        api.getSOAPNotes(patientId),
        api.getPrescriptions(patientId),
        api.getDocuments(patientId),
      ]);

      if (alertsRes.status === 'fulfilled') setAlerts(toCamelCase<Alert[]>(alertsRes.value as Alert[]));
      if (vitalsRes.status === 'fulfilled') setVitalSigns(toCamelCase<VitalSign[]>(vitalsRes.value as VitalSign[]));
      if (allergiesRes.status === 'fulfilled') setAllergies(toCamelCase<Allergy[]>(allergiesRes.value as Allergy[]));
      if (soapRes.status === 'fulfilled') setSoapNotes(toCamelCase<SOAPNote[]>(soapRes.value as SOAPNote[]));
      if (rxRes.status === 'fulfilled') setPrescriptions(toCamelCase<Prescription[]>(rxRes.value as Prescription[]));
      if (docsRes.status === 'fulfilled') setDocuments(toCamelCase<Document[]>(docsRes.value as Document[]));
    } catch (e) {
      console.error('Failed to load patient records:', e);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) loadPatientRecords(id);
  }, [id, loadPatientRecords]);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: patient?.name || '',
    gender: patient?.gender || '',
    birthDate: patient?.birthDate || '',
    phone: patient?.phone || '',
    email: patient?.email || '',
    address: patient?.address || '',
    idCard: patient?.idCard || '',
  });

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900">找不到此病人</h2>
        <Link to="/patients" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          返回病人列表
        </Link>
      </div>
    );
  }

  const handleEditToggle = () => {
    if (isEditing) {
      setFormData({
        name: patient.name,
        gender: patient.gender || '',
        birthDate: patient.birthDate || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        idCard: patient.idCard || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('error', '姓名為必填項');
      return;
    }
    try {
      await updatePatient(patient.id, formData);
      showToast('success', '病人資料已更新');
      setIsEditing(false);
    } catch {
      showToast('error', '更新失敗，請稍後再試');
    }
  };

  const handleDelete = () => {
    if (window.confirm(`確定要刪除病人「${patient.name}」嗎？所有相關資料將被刪除，此操作無法撤銷。`)) {
      deletePatient(patient.id);
      showToast('success', '病人已刪除');
      navigate('/patients');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const menuItems = [
    { name: '基本資料', icon: FileText, path: `/patients/${patient.id}`, active: true },
    { name: '特別警示', icon: AlertTriangle, path: `/patients/${patient.id}/alerts`, alertCount: alerts.filter(a => a.isActive).length, highAlert: alerts.some(a => a.isActive && a.level === 'high') },
    { name: '生命體徵', icon: Activity, path: `/patients/${patient.id}/vitals`, count: vitalSigns.length },
    { name: '過敏記錄', icon: Heart, path: `/patients/${patient.id}/allergies`, count: allergies.length },
    { name: '醫療記錄總覽', icon: ClipboardList, path: `/patients/${patient.id}/records`, count: soapNotes.length + prescriptions.length, highlight: true },
    { name: 'SOAP 記錄', icon: Stethoscope, path: `/patients/${patient.id}/soap`, count: soapNotes.length },
    { name: '處方紀錄', icon: Pill, path: `/patients/${patient.id}/prescriptions`, count: prescriptions.length },
    { name: '文件庫', icon: FolderOpen, path: `/patients/${patient.id}/documents`, count: documents.length },
  ];

  const activeAlerts = alerts.filter(a => a.isActive);
  const latestVitals = vitalSigns[0];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回病人列表
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold ${
              patient.gender === 'male' ? 'bg-blue-500' : patient.gender === 'female' ? 'bg-pink-500' : 'bg-slate-500'
            }`}>
              {patient.name.charAt(0)}
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="text-2xl font-bold text-slate-900 px-2 py-1 border-b-2 border-blue-500 focus:outline-none"
                />
              ) : (
                <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
              )}
              <p className="text-slate-500">{patient.patientNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleEditToggle}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  儲存
                </button>
              </>
            ) : (
              <>
                {user?.role !== 'patient' && (
                  <>
                    <button
                      onClick={handleEditToggle}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      編輯
                    </button>
                    {user?.role === 'admin' && (
                      <button
                        onClick={handleDelete}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        刪除
                    </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Banner */}
      {activeAlerts.length > 0 && (
        <div className={`mb-6 p-4 rounded-xl border ${
          activeAlerts.some(a => a.level === 'high')
            ? 'bg-red-50 border-red-200'
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 mt-0.5 ${
              activeAlerts.some(a => a.level === 'high') ? 'text-red-600' : 'text-orange-600'
            }`} />
            <div className="flex-1">
              <h3 className={`font-semibold ${
                activeAlerts.some(a => a.level === 'high') ? 'text-red-900' : 'text-orange-900'
              }`}>
                特別警示 ({activeAlerts.length})
              </h3>
              <div className="mt-2 space-y-1">
                {activeAlerts.slice(0, 3).map(alert => (
                  <p key={alert.id} className={`text-sm ${
                    activeAlerts.some(a => a.level === 'high') ? 'text-red-800' : 'text-orange-800'
                  }`}>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium mr-2 ${
                      alert.level === 'high' ? 'bg-red-200 text-red-900'
                        : alert.level === 'medium' ? 'bg-orange-200 text-orange-900'
                        : 'bg-yellow-200 text-yellow-900'
                    }`}>
                      {alert.level === 'high' ? '高' : alert.level === 'medium' ? '中' : '低'}
                    </span>
                    {alert.content}
                  </p>
                ))}
              </div>
              <Link
                to={`/patients/${patient.id}/alerts`}
                className={`text-sm font-medium mt-2 inline-block ${
                  activeAlerts.some(a => a.level === 'high') ? 'text-red-700' : 'text-orange-700'
                }`}
              >
                查看全部 →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {latestVitals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">血壓</p>
            <p className="text-xl font-semibold text-slate-900 mt-1">
              {latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic}
              <span className="text-sm font-normal text-slate-500 ml-1">mmHg</span>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">心率</p>
            <p className="text-xl font-semibold text-slate-900 mt-1">
              {latestVitals.heartRate || '-'}
              <span className="text-sm font-normal text-slate-500 ml-1">bpm</span>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">體溫</p>
            <p className="text-xl font-semibold text-slate-900 mt-1">
              {latestVitals.temperature || '-'}
              <span className="text-sm font-normal text-slate-500 ml-1">℃</span>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">血氧</p>
            <p className="text-xl font-semibold text-slate-900 mt-1">
              {latestVitals.oxygenSaturation || '-'}
              <span className="text-sm font-normal text-slate-500 ml-1">%</span>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">基本資訊</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">性別</span>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="text-sm border border-slate-300 rounded px-2 py-1"
                  >
                    <option value="">-</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                  </select>
                ) : (
                  <span className="text-slate-900">
                    {patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : patient.gender === 'other' ? '其他' : '-'}
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">年齡</span>
                <span className="text-slate-900">{calculateAge(patient.birthDate)} 歲</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">出生日期</span>
                {isEditing ? (
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="text-sm border border-slate-300 rounded px-2 py-1"
                  />
                ) : (
                  <span className="text-slate-900">{patient.birthDate || '-'}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">電話</span>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="text-sm border border-slate-300 rounded px-2 py-1"
                  />
                ) : (
                  <span className="text-slate-900">{patient.phone || '-'}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">電子郵件</span>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="text-sm border border-slate-300 rounded px-2 py-1"
                  />
                ) : (
                  <span className="text-slate-900">{patient.email || '-'}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">身份證號</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="idCard"
                    value={formData.idCard}
                    onChange={handleChange}
                    className="text-sm border border-slate-300 rounded px-2 py-1"
                  />
                ) : (
                  <span className="text-slate-900">{patient.idCard || '-'}</span>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100">
                <span className="text-slate-500">地址</span>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full mt-1 text-sm border border-slate-300 rounded px-2 py-1"
                  />
                ) : (
                  <p className="text-slate-900 mt-1">{patient.address || '-'}</p>
                )}
              </div>
            </div>

            {patient.emergencyContact && (
              <>
                <h3 className="font-semibold text-slate-900 mt-6 mb-3">緊急聯絡人</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">姓名</span>
                    <span className="text-slate-900">{patient.emergencyContact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">電話</span>
                    <span className="text-slate-900">{patient.emergencyPhone || '-'}</span>
                  </div>
                </div>
              </>
            )}

            {patient.insuranceType && (
              <>
                <h3 className="font-semibold text-slate-900 mt-6 mb-3">保險資訊</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">類型</span>
                    <span className="text-slate-900">{patient.insuranceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">號碼</span>
                    <span className="text-slate-900">{patient.insuranceNumber || '-'}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">病歷管理</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = item.active;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-blue-50 border-blue-200'
                        : item.highlight
                        ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200 hover:border-green-300'
                        : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        item.highAlert
                          ? 'bg-red-100 text-red-600'
                          : isActive
                          ? 'bg-blue-100 text-blue-600'
                          : item.highlight
                          ? 'bg-gradient-to-br from-green-100 to-blue-100 text-blue-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`font-medium ${item.highlight ? 'text-green-700' : 'text-slate-900'}`}>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.alertCount !== undefined && item.alertCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.highAlert ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {item.alertCount}
                        </span>
                      )}
                      {item.count !== undefined && item.count > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.highlight ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.count}
                        </span>
                      )}
                      <span className="text-slate-400">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
