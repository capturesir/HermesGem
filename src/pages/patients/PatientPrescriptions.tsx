import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Pill, X, User } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Prescription, PrescriptionStatus, Medication, MedicationRoute } from '../../types';
import { getCSTDateString } from '../../lib/dateUtils';

const PatientPrescriptions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getPatientById, getPrescriptionsByPatient, addPrescription, updatePrescription, deletePrescription } = useData();
  const { showToast } = useToast();

  const patient = getPatientById(id || '');
  const prescriptions = getPrescriptionsByPatient(id || '');

  const [showForm, setShowForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [formData, setFormData] = useState({
    date: getCSTDateString(),
    medications: [{ name: '', dosage: '', frequency: '', route: 'oral' as MedicationRoute, duration: 7 }] as Medication[],
    status: 'active' as PrescriptionStatus,
    notes: '',
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

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', route: 'oral', duration: 7 }],
    }));
  };

  const removeMedication = (index: number) => {
    if (formData.medications.length > 1) {
      setFormData(prev => ({
        ...prev,
        medications: prev.medications.filter((_, i) => i !== index),
      }));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) =>
        i === index ? { ...med, [field]: value } : med
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validMeds = formData.medications.filter(m => m.name.trim());
    if (validMeds.length === 0) {
      showToast('error', '請至少填寫一種藥物');
      return;
    }

    if (editingPrescription) {
      updatePrescription(editingPrescription.id, {
        ...formData,
        medications: validMeds,
      });
      showToast('success', '處方已更新');
    } else {
      addPrescription({
        ...formData,
        medications: validMeds,
        patientId: patient.id,
        doctorId: user?.id || '',
        doctorName: user?.name || '',
      });
      showToast('success', '處方已新增');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      date: getCSTDateString(),
      medications: [{ name: '', dosage: '', frequency: '', route: 'oral', duration: 7 }],
      status: 'active',
      notes: '',
    });
    setShowForm(false);
    setEditingPrescription(null);
  };

  const handleEdit = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setFormData({
      date: prescription.date,
      medications: prescription.medications.length > 0 ? prescription.medications : [{ name: '', dosage: '', frequency: '', route: 'oral', duration: 7 }],
      status: prescription.status,
      notes: prescription.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = (prescription: Prescription) => {
    if (window.confirm('確定要刪除此處方嗎？')) {
      deletePrescription(prescription.id);
      showToast('success', '處方已刪除');
    }
  };

  const handleStatusChange = (prescription: Prescription, newStatus: PrescriptionStatus) => {
    updatePrescription(prescription.id, { status: newStatus });
    showToast('success', '處方狀態已更新');
  };

  const getStatusColor = (status: PrescriptionStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'filled': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusText = (status: PrescriptionStatus) => {
    switch (status) {
      case 'active': return '有效';
      case 'filled': return '已取藥';
      case 'expired': return '已過期';
    }
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/patients/${patient.id}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回病人資料
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">處方紀錄</h1>
            <p className="text-slate-500 mt-1">{patient.name} - {patient.patientNumber}</p>
          </div>
          {user?.role !== 'patient' && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新增處方
            </button>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingPrescription ? '編輯處方' : '新增處方'}
              </h2>
              <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    處方日期
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    狀態
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as PrescriptionStatus }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  >
                    <option value="active">有效</option>
                    <option value="filled">已取藥</option>
                    <option value="expired">已過期</option>
                  </select>
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
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + 新增藥物
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.medications.map((med, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-slate-600">藥物 {index + 1}</span>
                        {formData.medications.length > 1 && (
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
                        <input
                          type="text"
                          value={med.name}
                          onChange={e => updateMedication(index, 'name', e.target.value)}
                          placeholder="藥物名稱"
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm"
                        />
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
                  備註
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="用藥指示..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPrescription ? '儲存變更' : '新增處方'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescriptions List */}
      <div className="space-y-4">
        {prescriptions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Pill className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">暫無處方</h3>
            <p className="text-slate-500">點擊上方按鈕新增處方</p>
          </div>
        ) : (
          prescriptions.map(prescription => (
            <div key={prescription.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold text-slate-900">{prescription.date}</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                      {getStatusText(prescription.status)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {prescription.doctorName}
                  </p>
                </div>
                {user?.role !== 'patient' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={prescription.status}
                      onChange={e => handleStatusChange(prescription, e.target.value as PrescriptionStatus)}
                      className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                    >
                      <option value="active">有效</option>
                      <option value="filled">已取藥</option>
                      <option value="expired">已過期</option>
                    </select>
                    <button
                      onClick={() => handleEdit(prescription)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prescription)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {prescription.medications.map((med, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{med.name}</p>
                      <p className="text-sm text-slate-500">{med.dosage} | {med.frequency} | {getRouteText(med.route)}</p>
                    </div>
                    <span className="text-sm text-slate-500">{med.duration} 天</span>
                  </div>
                ))}
              </div>

              {prescription.notes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">備註：</span>{prescription.notes}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientPrescriptions;
